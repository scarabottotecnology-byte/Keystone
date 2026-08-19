# 03 — APIs e Integrações

Cobre os itens 9 e 10 da seção 66.

> **Regra que governa este documento (seção 64):** nenhum endpoint externo é
> inventado aqui. Onde há caminho de API concreto, ele foi verificado em fonte
> oficial e está citado. Onde não foi possível verificar, o documento diz
> "consultar documentação oficial na implementação" em vez de escrever um path
> plausível. Um endpoint inventado é pior que uma lacuna: a lacuna é resolvida em
> cinco minutos de leitura, o endpoint inventado vira um bug que só aparece em
> produção.

---

## §1. Superfície de API interna

Três formas de acesso, com fronteiras rígidas.

### 1.1 PostgREST (leitura e CRUD simples)

O cliente usa `supabase-js` diretamente para leitura filtrada por RLS e para
escrita em entidades sem efeito colateral externo (ideias, pilares, rascunhos,
notas, configuração).

**Nunca via PostgREST:** publicar, enviar mensagem, chamar LLM, conectar conta,
mudar papel de usuário, executar recomendação. Tudo isso tem efeito fora do banco
ou consequência de segurança, e portanto passa por Edge Function.

### 1.2 RPC (agregação no servidor)

Corrige o achado **H-02**: agregação sai do navegador e vai para o Postgres.

| Função | Retorno | Consumidor |
|---|---|---|
| `rpc_command_center(p_from, p_to)` | KPIs, Growth Score, deltas | `/` |
| `rpc_content_performance(p_from, p_to)` | performance por peça e pilar | `/analytics` |
| `rpc_pipeline_board(p_pipeline_id)` | oportunidades agrupadas por estágio | `/pipeline` |
| `rpc_next_best_actions(p_limit)` | lista priorizada do dia | `/`, `/ai-insights` |
| `rpc_prospect_search(p_filters, p_page)` | prospects paginados com score | `/prospects` |
| `app.match_knowledge(p_organization_id, p_query_embedding, p_limit, p_min_similarity)` | chunks similares | RAG |

Todas `SECURITY INVOKER` e `STABLE`. `SECURITY INVOKER` é obrigatório: uma função
de agregação `SECURITY DEFINER` executaria com privilégio do dono e ignoraria a
RLS, vazando dados entre organizações. Este é o erro mais comum em RLS no
Supabase e está registrado como item de checklist de revisão em `08 §4`.

### 1.3 Edge Functions (fronteira de confiança)

Contrato comum a todas:

- Entrada validada por `zod`; corpo inválido → `400` com detalhe de campo.
- `Authorization: Bearer <JWT>` obrigatório, exceto webhooks (que usam assinatura).
- Resolve `organization_id` a partir de `memberships`; **nunca** confia em
  `organization_id` vindo do corpo da requisição.
- Aceita e propaga `X-Correlation-Id` (gera um ULID se ausente).
- Toda chamada externa é registrada em `integration_logs`.
- Erro devolve envelope `{ error: { code, message, correlation_id } }` — mensagem
  segura para o usuário, detalhe em `error_logs`.

| Função | Método | Auth | Responsabilidade | Fase |
|---|---|---|---|---|
| `ai-gateway` | POST | JWT | Invocação de LLM com fallback, custo, log | 1 |
| `oauth-start` | GET | JWT | Inicia OAuth (state assinado, PKCE) | 6 |
| `oauth-callback` | GET | state | Troca code por token, grava no Vault | 6 |
| `social-publish` | POST | JWT/service | Executa um `publishing_job` | 6 |
| `social-metrics-sync` | POST | service | Coleta métricas do dia | 8 |
| `lead-capture` | POST | token da org | Ingestão pública de lead (form/LP) | 10 |
| `company-discovery` | POST | service | Busca empresas por critério de ICP | 12 |
| `scoring-recompute` | POST | service | Recalcula ICP e lead score | 11 |
| `email-send` | POST | service | Envia e-mail de outreach | 14 |
| `email-webhook` | POST | assinatura | Entrega, abertura, bounce, reclamação | 14 |
| `whatsapp-send` | POST | JWT/service | Envia mensagem ou template | 15 |
| `whatsapp-webhook` | GET/POST | assinatura Meta | Recebe mensagem e status | 15 |
| `recommendation-execute` | POST | JWT | Executa `ai_recommendations.action` | 19 |
| `automation-dispatch` | POST | service | Envelopa ciclo de vida de run do n8n | 20 |
| `dsr-export` / `dsr-erase` | POST | JWT (admin) | Direitos do titular (LGPD) | 21 |

**Sobre `lead-capture`:** é o único endpoint público de escrita. Protegido por
token por organização, rate limit por IP, validação `zod`, honeypot e verificação
de `suppression_list`. Nunca aceita `organization_id` no corpo — a organização é
derivada do token.

---

## §2. Padrões transversais

### Idempotência

Toda função com efeito externo recebe (ou deriva) uma `idempotency_key`
determinística e a registra em `idempotency_keys` **antes** da chamada externa.
Se a chave já existir, devolve o resultado gravado sem repetir o efeito. Detalhe
em `04 §3`.

### Rate limiting

Duas camadas:

1. **Entrada:** contador por `(organization_id, function, janela)` em Postgres,
   aplicado na Edge Function.
2. **Saída:** respeito ao limite do provedor. `integration_logs` grava
   `rate_limit_remaining` e `retry_after_s`; quando o provedor sinaliza limite, o
   job é reagendado em vez de reprocessado imediatamente.

### Failsafe (seção 54)

Falha de integração externa **nunca** derruba o sistema. O contrato é:

```
chamada falha
   → job marcado FAILED com erro estruturado
   → retry com backoff exponencial + jitter (respeitando max_attempts)
   → esgotadas as tentativas: error_logs (severity=high) + alerta
   → demais módulos seguem operando normalmente
```

Sem exceção não tratada atravessando a fronteira da Edge Function; sem
`Promise` rejeitada silenciosamente; sem `catch` vazio. Ver `08 §5`.

---

## §3. Integrações externas

### 3.1 LinkedIn — **maior risco externo do roadmap**

**Produto necessário:** Community Management API, para publicar em Página de
empresa e ler métricas orgânicas da organização.

**Requisitos de acesso verificados:**

- Acesso restrito a **organização legalmente registrada** com caso de uso
  comercial. Desenvolvedor autônomo ou projeto pessoal não é elegível.
- Exige **Página do LinkedIn verificada**, cujos dados devem coincidir com a
  razão social informada no formulário.
- Um **super admin da Página** precisa verificar a aplicação.
- Fluxo de aprovação em **duas etapas**: Development Tier e, depois, Standard
  Tier — este último exigindo gravação de tela demonstrando a aplicação.
- Escopo `w_organization_social` para publicar em Página de empresa.
- É necessário informar e-mail corporativo, razão social, endereço registrado,
  site e política de privacidade.

**Consequência para o roadmap.** O caminho crítico não é código, é aprovação. Se
o pedido só for aberto quando a FASE 6 começar, a fase fica parada esperando
terceiro. **Ação: abrir o pedido durante a FASE 1.** É a razão de este item
constar nas sinalizações do `README.md`.

**Plano de contingência.** Se o Standard Tier não sair a tempo, a FASE 6 entrega
o módulo em modo `APPROVAL REQUIRED` com publicação manual assistida: o sistema
gera, revisa, agenda e prepara a peça, o operador publica e cola a URL do post,
e o sistema registra `external_post_id`. A cadeia de atribuição permanece
íntegra; apenas o último passo é humano. Isto é degradação explícita e visível na
UI, **não** um mock disfarçado (seção 64).

**Endpoints:** a serem lidos em `learn.microsoft.com/linkedin/marketing/` no
momento da implementação. O versionamento da API é por data
(ex.: `li-lms-2026-05`) e muda com frequência; fixar paths neste documento os
tornaria obsoletos antes da FASE 6.

### 3.2 Meta / Instagram

**Requisitos verificados:**

- Conta Instagram **Professional** (Business ou Creator) vinculada a uma Página
  do Facebook, mais app de desenvolvedor Meta.
- Permissão `instagram_business_content_publish` aprovada em App Review.
- Publicação é um fluxo de **dois passos**: cria-se um container de mídia em
  `POST /{ig-user-id}/media` e publica-se com `POST /{ig-user-id}/media_publish`.
- A Basic Display API foi descontinuada em dezembro de 2024; todo acesso passa
  pela Instagram Graph API.
- **Rate limit:** 200 chamadas por usuário por hora (Business Use Case), com
  capacidade de app escalando com a base de usuários.
- **App Review:** 2–4 semanas por submissão, 4–6 semanas no total.

**Implicação de arquitetura.** O fluxo de dois passos exige que a mídia esteja em
URL pública acessível pela Meta no momento da criação do container. Solução:
Supabase Storage com URL assinada de vida curta, gerada pela Edge Function e
descartada após a publicação. A mídia não fica publicamente exposta de forma
permanente.

**Implicação de agendamento.** Como há limite de publicações por período e o
container tem validade, `publishing_jobs` precisa de janela de retry curta para
Instagram — um container expirado exige recriar, não apenas repetir o publish.

### 3.3 WhatsApp Business Platform (Cloud API)

**Regras verificadas que viram lógica de sistema:**

| Regra da plataforma | Implementação |
|---|---|
| Categorias de template: MARKETING, UTILITY, AUTHENTICATION | `whatsapp_templates.category` |
| Janela de atendimento de 24 h aberta por mensagem do usuário; dentro dela, mensagem livre | `whatsapp_conversations.service_window_expires_at` |
| Fora da janela, apenas template aprovado | Verificação obrigatória em `whatsapp-send` |
| Marketing exige opt-in | `whatsapp_contacts.opt_in_status` + `consents` |
| Meta limita ~2 templates de marketing por usuário/dia **somados todos os negócios** — não contornável com outro número ou outro BSP | Não tentamos contornar. Cadência conservadora em `campaigns.daily_cap` |
| Limite por número: 250/24 h sem verificação; 1.000 (Tier 1) após verificação de negócio; escala até 100.000 conforme qualidade | `whatsapp_accounts.messaging_tier` respeitado pelo agendador |
| Quality rating vermelho impede avanço de tier (com janela de correção nas regras de 2026) | `whatsapp_accounts.quality_rating` monitorado; queda dispara alerta e reduz cadência automaticamente |

O ponto sobre o limite de 2 mensagens de marketing por usuário/dia merece
destaque: é exatamente o tipo de regra que ferramentas de spam tentam burlar com
múltiplos números. **A arquitetura não oferece esse mecanismo.** Isso é decisão
de produto (seção 65), não limitação técnica.

### 3.4 E-mail

**Provedor:** a decidir na FASE 14 entre Resend, AWS SES e Postmark. Camada de
abstração `EmailProvider` com uma implementação por provedor — a escolha não deve
vazar para o domínio.

**Requisitos não negociáveis antes do primeiro envio:**

- SPF, DKIM e DMARC configurados e verificados (`email_accounts.domain_auth`).
- **Subdomínio dedicado** para outreach (ex.: `contato.keystone…`), separado do
  domínio transacional. Reputação de cold outreach não pode contaminar o e-mail
  corporativo.
- Aquecimento gradual: `daily_cap` começa baixo e cresce conforme entregabilidade.
- Link de opt-out em toda mensagem, com registro em `suppression_list`.
- Webhook de bounce e reclamação alimentando `suppression_list` automaticamente.
  Hard bounce = supressão imediata, sem exceção.

### 3.5 Dados cadastrais de empresas (Company Discovery)

**Fontes legítimas identificadas:**

1. **Dados Abertos CNPJ da Receita Federal** — arquivos CSV compactados,
   atualização mensal, publicados em `dados.gov.br` e no repositório de arquivos
   da Receita Federal. Gratuito e oficial.
2. **API oficial Consulta CNPJ** do catálogo gov.br/conecta — três serviços que
   variam pelo número de campos retornados.
3. **APIs licenciadas de terceiros**, que empacotam os mesmos dados abertos com
   conveniência de consulta.

**O que não faremos:** scraping do LinkedIn, de portais de terceiros ou de
qualquer plataforma que ofereça API oficial. Isso é proibição explícita das
seções 3 e 64, e também é o comportamento que faz uma ferramenta ser bloqueada.

**Decisão pendente (ADR-009):** carga própria dos dados abertos (gratuita, mas
exige pipeline de ingestão de arquivos grandes e ~50 GB de armazenamento) versus
API licenciada (custo recorrente, integração trivial). Recomendação: começar com
API licenciada na FASE 12 para validar o funil rápido, e avaliar a carga própria
quando o volume justificar. `companies.source` já registra a procedência, então
a troca depois não quebra nada.

**Limites do dado.** O cadastro da Receita traz CNPJ, razão social, nome
fantasia, CNAE, situação, endereço, porte e data de abertura. **Não traz
faturamento, número de funcionários nem sinais de crescimento** — e estes são
critérios de ICP exigidos pela seção 20. Portanto:

- Faturamento e headcount entram como **estimativa declarada como estimativa**,
  ou ficam `null`. Nunca como número inventado.
- O ICP Score pondera apenas critérios com dado presente e **normaliza pelo peso
  disponível**, expondo em `prospect_scores.breakdown` quais critérios não
  puderam ser avaliados. Um score de 91 baseado em 40% dos critérios é
  informação diferente de um score de 91 baseado em 95%, e a UI mostra isso.

### 3.6 Contact Intelligence

Dado de contato profissional só entra no sistema por fonte declarável:
informado pelo próprio titular (formulário, conversa), publicado publicamente
pela empresa (site institucional, canal oficial), ou fornecido por provedor
licenciado com base legal própria.

Sem fonte → `contacts.email_status = 'unknown'` e o campo fica vazio. **Nenhum
agente de IA tem permissão de escrita nos campos de contato** (ver `05 §7`);
inferir `nome.sobrenome@empresa.com.br` é fabricação de dado pessoal, viola a
seção 23 e produz bounce que destrói reputação de domínio.

### 3.7 Provedores de IA

Ver `05`. Nenhum código de produto chama provedor diretamente — tudo passa pelo
`ai-gateway`.

### 3.8 Preparação para o futuro (seção 60)

Facebook, YouTube, TikTok, X, Google Business, blog, SEO e anúncios **não são
implementados agora**. A preparação consiste exatamente em três coisas, e nada
além:

1. `social_channel` já é enum com os valores futuros.
2. `content_formats` é por canal, com `spec` em `jsonb` — formato novo não exige
   migração.
3. A interface `SocialProvider` (`connect`, `publish`, `fetchMetrics`,
   `refreshToken`) é implementada por canal; adicionar um canal é adicionar uma
   implementação, não alterar o núcleo.

Nenhuma tabela, tela ou stub é criada para canal não implementado. Preparação é
manter a porta aberta, não construir cômodos vazios.

---

## Fontes

- [LinkedIn Community Management API — Microsoft Learn](https://learn.microsoft.com/en-us/linkedin/marketing/community-management/community-management-overview?view=li-lms-2026-05)
- [LinkedIn Community Management API — Product Catalog](https://developer.linkedin.com/product-catalog/marketing/community-management-api)
- [LinkedIn Community Management API Access Approval (2026)](https://singhamandeep.com/linkedin-community-management-api-access/)
- [Instagram Graph API — guia 2026](https://www.netrows.com/blog/instagram-graph-api-guide-2026)
- [Instagram API rate limits 2026 — Phyllo](https://www.getphyllo.com/post/instagram-api-rate-limits-explained----and-how-to-scale-beyond-them-2026)
- [Post to Instagram via API — Postproxy](https://postproxy.dev/blog/post-to-instagram-via-api/)
- [WhatsApp template fundamentals — Meta for Developers](https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/overview)
- [WhatsApp messaging limits 2026 — Chatarmin](https://chatarmin.com/en/blog/whats-app-messaging-limits)
- [Cadastro Nacional da Pessoa Jurídica — Portal de Dados Abertos](https://dados.gov.br/dados/conjuntos-dados/cadastro-nacional-da-pessoa-juridica---cnpj)
- [API Consulta CNPJ — Catálogo gov.br/conecta](https://www.gov.br/conecta/catalogo/apis/consulta-cnpj)
- [Dados Abertos — Receita Federal](https://www.gov.br/receitafederal/pt-br/acesso-a-informacao/dados-abertos)
