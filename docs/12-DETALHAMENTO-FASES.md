# 12 — Detalhamento das Fases (conteúdo das fichas do ClickUp)

Conteúdo exato de cada uma das 24 fichas e de suas subtarefas. Este documento é a
fonte da verdade para a criação no ClickUp — cada bloco `### FASE n` vira uma
ficha, cada linha da lista de subtarefas vira uma subtarefa.

**Convenção de nomes.** Toda subtarefa começa com uma etiqueta em colchetes que
indica o STEP do método de execução (documento 09 §1): `[ANALYZE]`, `[DATABASE]`,
`[BACKEND]`, `[AUTOMATION]`, `[FRONTEND]`, `[INTEGRATION]`, `[TEST]`,
`[VALIDATE]`, `[DOC]`. Etiquetas adicionais: `[SETUP]`, `[SEGURANÇA]`,
`[EXTERNO]`, `[DECISÃO]`, `[INFRA]`, `[DATA]`, `[PERF]`.

**Volume.** 24 fichas · 208 subtarefas · 139 critérios de aceite · 7 listas ·
1 pasta = **240 objetos** a criar no ClickUp.

> **Nota sobre o rate limit.** A API do ClickUp já bloqueou com zero chamadas
> feitas nesta conta hoje. 240 criações é volume alto e pode esbarrar no limite
> de novo. A criação será feita em ordem de prioridade — pasta, listas, e as
> fichas do EIXO A primeiro — de modo que uma interrupção deixe o projeto
> utilizável a partir do que importa: as FASES 1 e 2. O progresso fica
> registrado na tabela de estado do documento 11.

---

# EIXO A — Fundação

## FASE 1 — Fundação técnica

**Prazo** 24/08/2026 · **Estimativa** 2 semanas · **Prioridade** urgente
**Dependência** nenhuma · **Referência** `01-ARQUITETURA.md`, `05-AGENTES-DE-IA.md`

### Objetivo
Preparar o terreno técnico antes de qualquer funcionalidade de produto: estrutura
de módulos, design system, CI, a camada compartilhada das Edge Functions e o
gateway de IA. Nada de negócio é construído aqui.

### Por que esta fase existe
Três coisas ficam impossíveis de acertar depois. **O gateway de IA**: se cada
módulo chamar o provedor direto, viram dez implementações divergentes e o
histórico de custo dos primeiros meses se perde. **A estrutura de módulos**:
retrofit de fronteiras em código já escrito é refatoração cara. **O CI**: sem
ele, "a fase está testada" é declaração de boa intenção.

Além disso, os três pedidos de acesso externo têm semanas de espera. Abertos
agora, a espera corre em paralelo ao desenvolvimento; abertos nas FASES 6, 7 e 15,
travam o roadmap.

### Subtarefas

1. **[ANALYZE] Revalidar o banco remoto com credencial adequada**
   O MCP do Supabase negou permissão na FASE 0. Listar tabelas reais, Edge
   Functions, buckets de Storage e todas as políticas de RLS existentes. Comparar
   com a migração local e registrar qualquer divergência antes de escrever
   migração nova.
2. **[SETUP] Reestruturar `src/` em módulos**
   Criar `src/modules/` com um diretório por módulo de negócio, cada um com
   `pages/`, `components/`, `hooks/`, `api/` e `types.ts`.
3. **[SETUP] Regra de lint que proíbe import entre módulos**
   Um módulo pode importar de `components/ui`, `lib` e `shared`; não pode importar
   de outro módulo. Configurar `eslint-plugin-boundaries` ou equivalente e fazer
   a violação quebrar o build.
4. **[SETUP] Padronizar o gerenciador de pacotes**
   Um único lockfile no repositório. Dois gerenciadores convivendo resolvem
   versões diferentes em máquinas diferentes, e o bug só aparece em produção.
   Documentar a escolha no README.
5. **[SETUP] Proteger o `.env`**
   Adicionar ao `.gitignore`, criar `.env.example` sem valores e verificar o
   histórico do repositório antes de remover do índice. Registrar a regra: segredo
   de servidor nunca usa prefixo `VITE_`, porque o Vite injeta tudo com esse
   prefixo no bundle público.
6. **[FRONTEND] Aplicar o design system premium**
   Substituir o tema padrão do Lovable em `src/index.css`: paleta dark-first, um
   único acento, semântica restrita a três estados, tipografia tabular em toda
   métrica. Remover o emoji `💰` da navegação.
7. **[FRONTEND] Sidebar orientada a dados**
   Trocar a lista hard-coded do `AppSidebar` por configuração, já preparada para
   filtrar item por papel do usuário.
8. **[BACKEND] Criar `supabase/functions/_shared/`**
   Módulos compartilhados: validação de JWT e resolução de organização; geração e
   propagação de correlation ID (ULID); logging com redação automática de segredo;
   helper de idempotência; tipos de erro com código e `retryable`.
9. **[BACKEND] Implementar a Edge Function `ai-gateway`**
   Ponto único de invocação de LLM. Carrega o prompt versionado, monta o contexto,
   resolve o provedor por prioridade, valida a saída contra `output_schema`, faz
   fallback em erro de rede/5xx/rate limit e grava a invocação. Retorno como
   resultado tipado, não exceção.
10. **[DATABASE] Migração das tabelas de IA e observabilidade**
    `ai_providers`, `ai_prompts`, `ai_invocations`, a view `ai_usage_daily`,
    `automation_definitions`, `automation_runs`, `automation_logs`,
    `integration_logs`, `error_logs`, `idempotency_keys`.
11. **[CI] GitHub Actions**
    Pipeline de pull request com lint, typecheck, testes unitários e build.
    Bloquear merge em qualquer falha.
12. **[EXTERNO] Protocolar o pedido do LinkedIn Community Management API**
    Exige empresa legalmente registrada, Página do LinkedIn verificada com dados
    coincidentes e verificação por um super admin da Página. Separar e-mail
    corporativo, razão social, endereço registrado, site e política de privacidade.
    Pedir o Development Tier primeiro.
13. **[EXTERNO] Protocolar o App Review da Meta**
    Conta Instagram Professional vinculada a uma Página do Facebook, app de
    desenvolvedor criado e permissão de publicação submetida. Prever 4 a 6 semanas.
14. **[EXTERNO] Iniciar a verificação de negócio do WhatsApp Business**
    Sem verificação o limite é de 250 mensagens por 24 h; com ela sobe para 1.000.
    Levantar também as categorias de template que serão necessárias.

### Critérios de aceite
- [ ] `src/modules/` criado e nenhum módulo importa de outro — verificado por lint
- [ ] Design system aplicado; emoji removido da navegação
- [ ] CI roda lint, typecheck, unit e build e bloqueia merge em falha
- [ ] `_shared/` com auth, log, idempotência, erro e redação de segredo
- [ ] `ai-gateway` invoca ao menos 2 provedores, com fallback comprovado por teste
- [ ] Tabelas de IA e observabilidade criadas
- [ ] Custo e tokens gravados em toda invocação
- [ ] Um gerenciador de pacotes apenas; lockfiles concorrentes removidos
- [ ] `.env` fora do versionamento, `.env.example` presente
- [ ] Pedidos LinkedIn, Meta e WhatsApp protocolados, com comprovante anexado

---

## FASE 2 — Banco, autenticação e RLS

**Prazo** 07/09/2026 · **Estimativa** 2 semanas · **Prioridade** urgente
**Dependência** FASE 1 · **Referência** `02-MODELO-DE-DADOS.md`, `07-SEGURANCA-LGPD-MULTITENANT.md`

### Objetivo
Criar a base de identidade e acesso do sistema: organização, usuários, papéis e
RLS forçada em toda tabela.

### Por que esta fase não pode ser pulada
Nada que guarde segredo pode existir antes dela. Um token de OAuth do LinkedIn
precisa pertencer a alguém; um template de arte precisa ter dono. Sem
autenticação, qualquer tabela criada fica atrás de uma chave publicável que vai
no bundle — o que não é proteção nenhuma.

Foi exatamente essa confusão que produziu o achado **C-01** na auditoria da FASE
0, em outro produto da casa: políticas concedendo `SELECT`, `INSERT` e `DELETE`
ao papel `anon` com `USING (true)`. RLS habilitada, aparência de proteção, e a
condição anulando tudo.

O sistema vai guardar token de rede social, dado de prospect e conversa de
WhatsApp. Construir qualquer um desses módulos antes desta fase é empilhar
produto sobre um vazamento.

### Ordem obrigatória
O banco nasce vazio, então não há backfill nem convivência com política antiga.
Sobra a regra que não se negocia: **nenhuma tabela é criada antes da política
dela.** Tabela que existe sem RLS, mesmo por uma migração, é uma janela aberta.

### Subtarefas

1. **[DATABASE] Migração de tenancy**
   `organizations`, `profiles`, `memberships`, mais os enums `org_role` e
   `membership_status`. Índice em `memberships (user_id) where status = 'active'`.
2. **[DATABASE] Criar `app.current_org_ids()`**
   `SECURITY DEFINER` para evitar recursão na política de `memberships`, `STABLE`
   para o planejador avaliar uma vez por statement em vez de por linha, e
   `set search_path` fixo contra sequestro de path. Revogar de `public`, conceder
   a `authenticated`.
3. **[DATABASE] Provisionar a organização Keystone**
   Criar a organização e vincular os usuários existentes como `owner`/`admin`.
4. **[SEGURANÇA] Padrão de tenancy aplicado na criação de cada tabela**
   `ENABLE` **e** `FORCE ROW LEVEL SECURITY`, mais as quatro políticas por
   operação. A de `UPDATE` precisa de `USING` **e** `WITH CHECK` — só com
   `USING`, um usuário move a própria linha para outra organização. Nenhuma
   tabela é criada antes da política dela.
5. **[DATABASE] Colunas de auditoria em toda tabela de negócio**
   `created_at`, `updated_at` com trigger, `created_by` e `deleted_at` para
   soft delete. Sem soft delete, um `DELETE` acidental não tem volta.
6. **[BACKEND] RPCs de agregação**
   Toda soma e contagem roda no servidor, paginação inclusive. Todas
   `SECURITY INVOKER` e `STABLE` — uma função de agregação `SECURITY DEFINER`
   ignoraria a RLS e vazaria dados entre organizações.
7. **[BACKEND] Endurecer toda entrada de dado**
    Schema `zod` em cada payload, limite de tamanho, e parsing de data
    explícito: tratar `DD/MM/YYYY` como tal e parar de aceitar
    qualquer número entre 1 e 200.000 como serial de Excel.
8. **[FRONTEND] Autenticação**
    Login, logout, recuperação de senha e fluxo de convite, com `<ProtectedRoute>`
    envolvendo as rotas.
9. **[FRONTEND] Onboarding e seletor de organização**
    Criar organização, convidar time, configurar marca inicial.
10. **[FRONTEND] Proibir fallback que mascara dado ausente**
    Padrões como `a || b` escondem a diferença entre "o valor é zero" e "o campo
    não veio". A tela precisa exibir o estado real, incluindo o desconhecido.
11. **[TEST] Suíte pgTAP de isolamento de tenant**
    Para cada tabela: organização A não lê, não altera, não apaga e não insere
    linha da organização B, e não consegue mover a própria linha para B.
12. **[TEST] Teste de regressão de acesso anônimo**
    `anon` não lê, não escreve e não apaga em nenhuma tabela de negócio. Roda em
    todo CI, para sempre. Existe porque este exato buraco já apareceu uma vez em
    outro produto da casa — o achado C-01 da auditoria — e um teste é mais
    barato que a memória de quem escreveu a migração.
13. **[VALIDATE] Advisors de segurança do Supabase**
    Rodar e zerar todos os alertas abertos.

### Critérios de aceite
- [ ] Login, logout, recuperação e convite funcionando
- [ ] `organizations`, `profiles`, `memberships` criadas; Keystone provisionada
- [ ] **Nenhuma política concede acesso a `anon`** — verificado por consulta ao catálogo
- [ ] Todas as tabelas com RLS habilitada **e** forçada
- [ ] Política de `UPDATE` com `USING` e `WITH CHECK`
- [ ] Suíte pgTAP passando para todas as tabelas
- [ ] Teste de regressão de acesso anônimo rodando no CI
- [ ] Toda tabela com `organization_id NOT NULL` desde a criação
- [ ] Nenhuma agregação feita no cliente
- [ ] Datas `DD/MM/YYYY` corretas; número que não é data não vira data
- [ ] Advisors de segurança sem alerta aberto

---

## FASE 3 — Command Center

**Prazo** 24/09/2026 · **Estimativa** 1,5 semana · **Prioridade** alta
**Dependência** FASE 2 · **Referência** `01-ARQUITETURA.md §5`, `06-FLUXO-DE-DADOS.md §5`

### Objetivo
A primeira tela deve responder em menos de dez segundos: "o que está acontecendo
com meu crescimento?".

### Nota de projeto
Nesta fase quase todos os números virão vazios — ainda não há conteúdo, leads nem
pipeline. Isso é esperado. O estado vazio deve explicar o que o sistema fará
quando houver dado, não pedir desculpas nem mostrar zero como se fosse resultado.

### Subtarefas

1. **[DATABASE] `growth_score_config` e `growth_score_snapshots`**
   Pesos e metas configuráveis por organização; snapshot diário, porque um score
   isolado não informa nada — o que informa é a tendência.
2. **[BACKEND] `rpc_command_center`**
   Uma única chamada devolvendo KPIs, deltas contra o período anterior e os
   componentes do Growth Score. Toda agregação no Postgres.
3. **[BACKEND] Cálculo do Growth Score**
   Seis componentes ponderados, normalizados contra meta e média móvel própria —
   nunca contra benchmark externo inventado. Cada componente expõe o valor bruto
   ao lado do normalizado.
4. **[BACKEND] `rpc_next_best_actions`**
   Consulta determinística e priorizada sobre estado real. A matemática vem do
   banco; a IA só escreve a justificativa depois (FASE 19).
5. **[FRONTEND] Layout do Command Center**
   KPIs com comparação obrigatória, densidade de informação acima de espaço em
   branco, tipografia tabular.
6. **[FRONTEND] Blocos AI Growth Insight e Next Best Action**
   Ainda sem o agente A9 — nesta fase são alimentados pela consulta determinística.
7. **[FRONTEND] Estados de carregamento, vazio e erro**
8. **[TEST] Unitário do Growth Score**
   Cálculo, normalização e comportamento com componente sem dado.
9. **[VALIDATE] Orçamento de performance**
   Carregar em menos de 2 s com dado de produção, com uma única chamada de rede.

### Critérios de aceite
- [ ] Carrega em menos de 2 s com dado de produção
- [ ] Uma única chamada RPC; nenhuma agregação no cliente
- [ ] Growth Score exibido com componentes e tendência
- [ ] Todo KPI mostra comparação com período anterior
- [ ] Next Best Action populado por consulta determinística
- [ ] Estado vazio explica o que o sistema fará

---

# EIXO B — Conteúdo

## FASE 4 — Content Strategy + Market Intelligence

**Prazo** 12/10/2026 · **Estimativa** 2,5 semanas · **Prioridade** normal
**Dependência** FASE 3 · **Referência** `05-AGENTES-DE-IA.md §4`, `02-MODELO-DE-DADOS.md §4.3`

### Objetivo
Descobrir oportunidade de mercado antes de produzir conteúdo, e transformar isso
em pauta distribuída num calendário.

### Subtarefas

1. **[DATABASE] Tabelas de estratégia editorial**
   `content_pillars`, `content_topics`, `content_ideas`, `content_formats`,
   `content_calendar`, `content_calendar_rules`, `content_campaigns`, mais os
   enums `content_status` e `social_channel`.
2. **[DATABASE] `ai_insights`**
   Com `source` e `source_url` obrigatórios.
3. **[DATA] Cadastrar os 13 pilares da Keystone**
   Controladoria, FP&A, Budget, Forecast, Custos, Pricing, Fluxo de Caixa, EBITDA,
   Indicadores, Gestão Financeira, M&A, Crescimento empresarial, Estratégia.
4. **[DATA] Configurar as regras de distribuição semanal**
   Segunda educação, terça dor empresarial, quarta case, quinta insight executivo,
   sexta comercial — tudo editável em `content_calendar_rules`.
5. **[BACKEND] Agente A1 — Market Intelligence**
   Analisa fontes configuradas e autorizadas, não "a internet". Insight sem fonte
   rastreável é rejeitado na validação de schema, antes de chegar ao banco.
6. **[BACKEND] Agente A2 — Content Strategist**
   Transforma insight em ideia e distribui pelas regras semanais, preenchendo
   `source_insight_id` para preservar a origem de mercado.
7. **[AUTOMATION] WF-015 — Market Intelligence**
   Cron às 06:00, envelopado por `automation-dispatch`, com correlation ID.
8. **[FRONTEND] Tela de estratégia editorial**
   Pilares, temas e o editor das regras de distribuição.
9. **[FRONTEND] Feed de Market Intelligence**
   Insights com relevância, categoria e potencial comercial.
10. **[FRONTEND] Ação "gerar ideia a partir deste insight"**
11. **[FRONTEND] Calendário editorial**
    Visualizações de mês, semana, dia e lista, com canal, formato, tema, status e
    horário em cada item.
12. **[TEST] Rejeição de insight sem fonte**

### Critérios de aceite
- [ ] 13 pilares cadastrados
- [ ] Regras de distribuição configuráveis e efetivamente aplicadas
- [ ] Calendário nas quatro visualizações
- [ ] A1 gera insights com `source` e `source_url` preenchidos
- [ ] Insight sem fonte rastreável é rejeitado
- [ ] "Gerar ideia a partir do insight" preenche `source_insight_id`

---

## FASE 5 — AI Content Factory + Review

**Prazo** 29/10/2026 · **Estimativa** 2,5 semanas · **Prioridade** normal
**Dependência** FASE 4 · **Referência** `05-AGENTES-DE-IA.md §3–§4`

### Objetivo
Produzir peças de conteúdo com qualidade auditável, fundamentadas na base de
conhecimento da consultoria, e reprovar automaticamente o que estiver abaixo do
padrão.

### Nota sobre o RAG
Para perguntas sobre serviços, metodologia, cases e posicionamento, o agente
responde **apenas** a partir dos trechos recuperados. Recuperação vazia significa
"não há informação na base" — nunca uma resposta plausível inventada. Um sistema
que inventa um case de cliente causa dano irreversível à credibilidade de uma
consultoria.

### Subtarefas

1. **[DATABASE] `content_assets` e `content_reviews`**
2. **[DATABASE] Base de conhecimento com pgvector**
   `knowledge_documents`, `knowledge_chunks` com `vector(1536)` e índice HNSW.
3. **[BACKEND] Pipeline de ingestão**
   Upload para Storage, extração de texto, chunking semântico de ~800 tokens com
   ~120 de sobreposição, embedding, indexação.
4. **[BACKEND] `app.match_knowledge`**
   Busca vetorial por cosseno, filtrada por organização. **`SECURITY INVOKER`** —
   como `SECURITY DEFINER` vazaria conhecimento entre organizações.
5. **[DATA] Cadastrar marca, serviços e metodologia**
   `brand_profiles` com tom, público, diferenciais, palavras proibidas e
   preferidas. `brand_services` com os métodos **ORBITA** (budget e
   acompanhamento) e **RICE** (custos) como propriedade intelectual estruturada.
6. **[BACKEND] Agente A3 — Content Factory**
   Pipeline em etapas separadas e versionadas: ângulo, hook, estrutura, copy, CTA,
   briefing visual. Custa mais tokens; entrega qualidade depurável por etapa.
7. **[BACKEND] Geração de variações**
   Ligadas por `variant_of`, para comparação de performance na FASE 9.
8. **[BACKEND] Agente A4 — Content Reviewer**
   Score de 0 a 100 nas dez dimensões. **Modelo diferente do gerador** — um modelo
   avaliando o próprio texto tende a se aprovar.
9. **[FRONTEND] Editor de peça**
   Copy, variações, CTA, mídia, Content Score por dimensão e histórico de versões.
10. **[FRONTEND] Biblioteca de conteúdo e fila de aprovação**
11. **[AUTOMATION] WF-001 — Daily Content Generation**
    Cron às 07:00.
12. **[TEST] Respeito à marca e ao limiar**
    Peça gerada não usa palavra proibida; score abaixo do limiar bloqueia a
    aprovação e apresenta sugestões acionáveis.

### Critérios de aceite
- [ ] Pipeline em etapas separadas e versionadas
- [ ] Peça respeita tom, palavras proibidas e preferidas
- [ ] RAG consultado; afirmação sobre serviço tem `grounded_on` preenchido
- [ ] Content Score nas 10 dimensões
- [ ] Score abaixo do limiar bloqueia aprovação
- [ ] Revisor usa modelo distinto do gerador
- [ ] Variações ligadas por `variant_of`

---

# EIXO C — Publicação e Análise

## FASE 6 — LinkedIn

**Prazo** 16/11/2026 · **Estimativa** 2,5 semanas · **Prioridade** alta
**Dependência** FASE 5 + aprovação do LinkedIn · **Referência** `03-APIS-E-INTEGRACOES.md §3.1`

### Objetivo
Publicar em Página de empresa com credencial protegida, agendamento confiável e
zero possibilidade de publicação duplicada.

### Risco
Depende de aprovação de terceiro. Se o Standard Tier não tiver saído, a fase
entrega o modo assistido: o sistema gera, revisa, agenda e prepara a peça; o
operador publica e cola a URL; o sistema registra o `external_post_id`. A cadeia
de atribuição permanece íntegra. Isso é degradação explícita e visível na
interface — não um mock disfarçado de recurso.

### Subtarefas

1. **[DATABASE] Tabelas de publicação**
   `social_accounts`, `social_posts`, `publishing_jobs`, mais os enums
   `publish_status` e `account_status`.
2. **[DATABASE] Schema `private` para tokens**
   `private.oauth_tokens`, não exposto pelo PostgREST. `social_accounts` guarda
   apenas `token_ref` — a tabela é legível pelo frontend e por isso não pode
   conter o segredo.
3. **[BACKEND] `oauth-start` e `oauth-callback`**
   State assinado e PKCE. Token gravado no schema privado, nunca devolvido ao
   cliente.
4. **[INTEGRATION] Ler a documentação oficial atual e implementar os endpoints**
   A API é versionada por data e muda com frequência. Nenhum caminho foi fixado
   na arquitetura de propósito — consultar `learn.microsoft.com/linkedin/marketing`
   no momento da implementação.
5. **[BACKEND] `social-publish` com lock pessimista**
   `update … set status='locked' where id=… and status='pending' returning *`.
   Zero linhas de retorno significa que outro worker pegou o job.
6. **[BACKEND] Chave de idempotência antes da chamada externa**
   `sha256(asset_id : social_account_id : scheduled_for)`, gravada **antes** de
   chamar a plataforma.
7. **[BACKEND] Tratamento do timeout**
   Não republicar cegamente. O retry consulta a plataforma para verificar se o
   post já existe; se não for possível verificar, o job vai para revisão humana.
   Publicar duas vezes na página de uma consultoria premium é dano de marca.
8. **[BACKEND] Renovação e expiração de token**
   Renovar antecipadamente quando o provedor permitir; marcar `expiring` a 7 dias
   e `expired` no vencimento, pausando os jobs da conta em vez de acumular falhas.
9. **[AUTOMATION] WF-002 — Daily Publishing**
   A cada 15 minutos, não uma vez por dia. O horário fino vive em
   `content_calendar`; o workflow só pergunta se há job vencido e não travado.
   Isso faz a recuperação de falha ser automática.
10. **[FRONTEND] Tela Social**
    Contas conectadas, saúde e validade de token, fila de publicação, histórico e
    falhas com o erro legível.
11. **[TEST] Concorrência e idempotência**
    Dois workers disputando o mesmo job: um vence. Execução dupla do WF-002 produz
    uma publicação.
12. **[TEST] Token expirado e indisponibilidade**
    Conta marcada, jobs pausados, alerta emitido, demais módulos operando normalmente.
13. **[CONTINGÊNCIA] Modo de publicação assistida**
    Só se o Standard Tier não tiver saído. Explicitamente sinalizado na interface.

### Critérios de aceite
- [ ] OAuth com state assinado e PKCE
- [ ] Token em `private.oauth_tokens`; ausente do bundle, verificado por teste
- [ ] Publicação real com `external_post_id` e permalink gravados
- [ ] Execução dupla do WF-002 produz uma publicação
- [ ] Token expirado pausa jobs e alerta
- [ ] Falha do LinkedIn não afeta outros módulos
- [ ] Se sem Standard Tier: modo assistido explícito na interface e documentado

---

## FASE 7 — Meta / Instagram

**Prazo** 30/11/2026 · **Estimativa** 2 semanas · **Prioridade** alta
**Dependência** FASE 6 + App Review · **Referência** `03-APIS-E-INTEGRACOES.md §3.2`

### Objetivo
Publicar no Instagram respeitando o fluxo de dois passos e os limites de chamada
da plataforma.

### Subtarefas

1. **[BACKEND] OAuth Meta e vínculo com a Página do Facebook**
   Conta Instagram Professional obrigatoriamente vinculada a uma Página.
2. **[BACKEND] Publicação em dois passos**
   Criar o container de mídia e depois publicá-lo, conforme a documentação oficial.
3. **[BACKEND] Mídia por URL assinada de vida curta**
   A Meta precisa acessar a mídia publicamente no momento da criação do container.
   Gerar URL assinada no Storage e revogá-la após a publicação — a mídia não fica
   exposta permanentemente.
4. **[BACKEND] Tratamento de container expirado**
   Container vencido exige **recriar**, não repetir o publish.
5. **[BACKEND] Respeitar o limite de 200 chamadas por usuário por hora**
   Registrar `rate_limit_remaining` em `integration_logs` e reagendar em vez de
   reprocessar quando a plataforma sinalizar limite.
6. **[FRONTEND] Conexão da conta Instagram na tela Social**
7. **[TEST] Container expirado e rate limit**

### Critérios de aceite
- [ ] Fluxo de dois passos conforme documentação oficial
- [ ] Mídia por URL assinada de vida curta, revogada após publicar
- [ ] Limite de 200 chamadas/usuário/hora respeitado
- [ ] Container expirado é recriado, não republicado

---

## FASE 8 — Social Analytics

**Prazo** 14/12/2026 · **Estimativa** 2 semanas · **Prioridade** normal
**Dependência** FASE 7 · **Referência** `02-MODELO-DE-DADOS.md §4.4`

### Objetivo
Coletar métricas sem destruir a curva de evolução e derivar os indicadores que
importam.

### Nota de modelagem
Snapshot diário, não coluna mutável. Métrica de rede social cresce ao longo de
dias, e um `UPDATE` apaga a curva. A unicidade por `(post, dia)` também torna a
sincronização naturalmente idempotente.

### Subtarefas

1. **[DATABASE] `social_post_metrics`**
   Com `unique (social_post_id, collected_for)`.
2. **[BACKEND] `social-metrics-sync` com upsert**
3. **[AUTOMATION] WF-003**
   A cada 6 horas, com janela de coleta de 30 dias por post, caindo para semanal
   depois.
4. **[BACKEND] Métricas derivadas**
   Engagement Rate, CTR, Lead Conversion Rate, Cost per Lead, Content ROI.
5. **[FRONTEND] Tela Analytics**
   Alcance, engajamento, leads por canal e ROI por conteúdo.
6. **[TEST] Idempotência e honestidade do dado**
   Reexecutar no mesmo dia faz upsert. Métrica que a plataforma não fornece
   aparece como indisponível, nunca como zero.

### Critérios de aceite
- [ ] Snapshot diário; nenhuma sobrescrita
- [ ] Reexecução no mesmo dia não duplica
- [ ] Métricas derivadas calculadas
- [ ] Métrica indisponível não é exibida como zero

---

## FASE 9 — AI Performance Analyst

**Prazo** 24/12/2026 · **Estimativa** 1,5 semana · **Prioridade** normal
**Dependência** FASE 8 · **Referência** `05-AGENTES-DE-IA.md §4`

### Objetivo
Fechar o primeiro loop de aprendizado — o marco em que o sistema deixa de ser
ferramenta e começa a ser sistema.

### Subtarefas

1. **[DATABASE] `ai_learnings`**
   Com `evidence`, `confidence`, `sample_size` e `superseded_by`.
2. **[BACKEND] Agente A5 — Performance Analyst**
   Produz o formato: performance, por quê, o que aprendemos, próxima ação.
3. **[BACKEND] Guarda-corpo estatístico**
   Aprendizado com amostra abaixo do mínimo configurável não é promovido a ativo.
   Sem isso, um post que foi bem por acaso vira "aprendizado" e enviesa toda a
   geração seguinte — o sistema aprenderia ruído com confiança crescente.
4. **[BACKEND] Injetar aprendizados no contexto de A2 e A3**
   É o que fecha o loop. Sem isso, `ai_learnings` é uma tabela bonita que ninguém
   lê.
5. **[AUTOMATION] WF-004**
   Cron às 22:00.
6. **[FRONTEND] Tela de análise por peça**
7. **[TEST] Amostra mínima e realimentação**
   Verificar no prompt logado que os aprendizados ativos chegaram ao gerador.

### Critérios de aceite
- [ ] Formato de saída conforme especificado
- [ ] `ai_learnings` com evidência, confiança e tamanho de amostra
- [ ] Aprendizado abaixo da amostra mínima não é ativado
- [ ] Aprendizados ativos entram no contexto de A2 e A3, verificável no log

---

# EIXO D — Demanda

## FASE 10 — Lead Engine

**Prazo** 08/10/2026 · **Estimativa** 2 semanas · **Prioridade** normal
**Dependência** FASE 3 · **Referência** `02-MODELO-DE-DADOS.md §4.8`

### Objetivo
Capturar leads sem duplicar e, principalmente, **gravar a origem no momento do
evento**.

### Por que a origem não pode esperar
Quando a venda fechar, ninguém vai lembrar qual post o cliente viu três meses
antes, e o dado não estará em lugar nenhum. `origin_asset_id` é barato agora e
impossível depois — por isso entra já nesta fase, mesmo sem existir ainda a tela
de atribuição que vai usá-lo.

### Subtarefas

1. **[DATABASE] `leads`, `lead_events`, `lead_scores`, `lead_sources`**
   Com `unique (organization_id, dedupe_key)`.
2. **[BACKEND] `lead-capture` — o único endpoint público de escrita**
   Token por organização, validação `zod`, rate limit por IP, honeypot e
   verificação de `suppression_list`. Nunca aceita `organization_id` no corpo — a
   organização vem do token.
3. **[BACKEND] Deduplicação**
   `dedupe_key = lower(coalesce(email, phone, linkedin_url))`. Sem isso, a mesma
   pessoa que preenche dois formulários vira dois leads e o funil mente.
4. **[BACKEND] Cálculo de lead score**
5. **[BACKEND] Registro de touchpoint na captura**
6. **[AUTOMATION] WF-007 — Lead Capture por webhook**
7. **[FRONTEND] Lead Center**
   Novos, qualificados, quentes, sem resposta, em follow-up, convertidos.
8. **[FRONTEND] Tela de lead com timeline**
9. **[TEST] Dedupe e origem**

### Critérios de aceite
- [ ] `lead-capture` com token, `zod`, rate limit e honeypot
- [ ] `dedupe_key` impede lead duplicado
- [ ] `origin_asset_id` e `origin_channel` preenchidos na origem
- [ ] Timeline completa em `lead_events`

---

## FASE 11 — ICP Engine

**Prazo** 19/10/2026 · **Estimativa** 1,5 semana · **Prioridade** normal
**Dependência** FASE 10 · **Referência** `03-APIS-E-INTEGRACOES.md §3.5`, ADR-011

### Objetivo
Um construtor visual de ICP com pesos, que produza score honesto sobre o dado que
realmente existe.

### A decisão que define esta fase
O cadastro público de CNPJ **não traz faturamento nem número de funcionários** —
dois dos cinco critérios de ICP. A saída não é estimar e apresentar como fato: o
score pondera apenas critérios com dado presente e **normaliza pelo peso
disponível**, expondo a cobertura. Um score de 91 que avaliou 40% dos critérios é
informação diferente de um que avaliou 95%, e a interface mostra essa diferença.

### Subtarefas

1. **[DATABASE] `icp_profiles`**
   `criteria` e `weights` em `jsonb`, com versionamento.
2. **[BACKEND] Motor de cálculo com normalização por cobertura**
   `breakdown` registra, por critério: valor, peso, contribuição, motivo e se
   havia dado.
3. **[BACKEND] `scoring-recompute`**
4. **[AUTOMATION] WF-006 — Prospect Scoring**
   Cron às 10:00.
5. **[FRONTEND] Construtor visual de ICP**
   Critérios com pesos somando 100.
6. **[FRONTEND] Simulação de score sobre base real antes de salvar**
7. **[TEST] Cobertura e versionamento**
   Critério ausente é declarado; alterar o ICP não reescreve scores históricos.

### Critérios de aceite
- [ ] Construtor visual com pesos somando 100
- [ ] Simulação sobre base real antes de salvar
- [ ] `breakdown` mostra contribuição e motivo por critério
- [ ] Critério sem dado é declarado; score normaliza pela cobertura
- [ ] Versionamento não reescreve scores históricos

---

## FASE 12 — Company Discovery

**Prazo** 05/11/2026 · **Estimativa** 2,5 semanas · **Prioridade** normal
**Dependência** FASE 11 + ADR-009 · **Referência** `03-APIS-E-INTEGRACOES.md §3.5`

### Objetivo
Encontrar empresas compatíveis com o ICP usando exclusivamente fonte oficial ou
licenciada.

### Restrição inegociável
Zero scraping de plataforma que ofereça API oficial. Isso é proibição explícita
do escopo e também o comportamento que faz uma ferramenta ser bloqueada.

### Subtarefas

1. **[DECISÃO] Fechar o ADR-009**
   Dados abertos da Receita Federal (gratuito, oficial, mensal, exige pipeline
   para arquivos grandes e ~50 GB) versus API licenciada (custo recorrente,
   integração trivial). Recomendação: começar licenciado para validar o funil.
2. **[DATABASE] `companies` e `company_signals`**
   Com `source` e `source_updated_at` obrigatórios — sem isso é impossível
   responder a um titular de onde veio a informação, nem saber quando ela envelheceu.
3. **[BACKEND] Adaptador da fonte escolhida**
   Atrás de uma interface, para que a troca de fonte depois não invalide dado já
   coletado.
4. **[BACKEND] `company-discovery` por critério de ICP**
5. **[BACKEND] Deduplicação por CNPJ**
6. **[AUTOMATION] WF-005**
   Cron às 09:00, antes do scoring e depois do outreach do dia anterior — assim
   uma empresa descoberta hoje só é abordada amanhã, dando tempo para pesquisa e
   revisão humana.
7. **[FRONTEND] Prospect Center**
   Filtros por ICP Score, segmento, localização, status, origem e campanha.
8. **[TEST] Honestidade do dado**
   Campo sem informação fica nulo; nenhuma estimativa é apresentada como fato.

### Critérios de aceite
- [ ] Fonte oficial ou licenciada, com `source` e `source_updated_at` obrigatórios
- [ ] **Zero scraping** de plataforma com API oficial
- [ ] Deduplicação por CNPJ
- [ ] Campo sem dado fica nulo

---

## FASE 13 — Prospect Intelligence

**Prazo** 19/11/2026 · **Estimativa** 2 semanas · **Prioridade** normal
**Dependência** FASE 12 · **Referência** `05-AGENTES-DE-IA.md §7`

### Objetivo
Produzir um perfil comercial por empresa em que **toda afirmação tenha lastro
verificável**.

### Subtarefas

1. **[DATABASE] `prospects`, `prospect_scores`, `company_research`, `contacts`**
2. **[BACKEND] Agente A6 — Prospect Researcher**
   Resumo, dor provável, serviço sugerido, abordagem e prioridade. `grounded_on`
   obrigatório: a interface mostra apenas afirmações cujos fatos de origem estão
   listados, com link. É o que separa "a IA acha" de "o dado diz".
3. **[SEGURANÇA] Revogar escrita da IA nas colunas de contato**
   O papel usado pelo `ai-gateway` não tem `UPDATE` em `contacts.email`,
   `contacts.phone` e `contacts.linkedin_url`. Aplicado por permissão de coluna no
   Postgres, não por convenção. Inferir `nome.sobrenome@empresa.com.br` é fabricar
   dado pessoal e produz bounce que destrói reputação de domínio.
4. **[BACKEND] Priorização explicável**
5. **[FRONTEND] Perfil do prospect**
   Sinais com evidência, motivos do score, contatos e pesquisa da IA.
6. **[TEST] Contato sem fonte permanece `unknown`**

### Critérios de aceite
- [ ] A6 grava `grounded_on`; interface mostra apenas afirmação com lastro
- [ ] Sinais com `evidence_url` e `confidence`
- [ ] Priorização explicável no perfil
- [ ] Nenhum e-mail inferido; sem fonte, permanece `unknown`

---

# EIXO E — Relacionamento

## FASE 14 — E-mail Outreach

**Prazo** 14/01/2027 · **Estimativa** 3 semanas · **Prioridade** alta
**Dependência** FASE 13 · **Referência** `07-SEGURANCA-LGPD-MULTITENANT.md §5–§6`

### Objetivo
Abordar prospects de forma personalizada e conforme, sem construir uma máquina de
spam.

### Por que esta é a fase de maior risco do projeto
É a primeira em que o sistema fala com pessoas reais. Os controles antispam não
são melhoria posterior — são critério de aceite. E há um limiar técnico
implacável: bounce acima de 3% ou reclamação acima de 0,1% fazem os provedores
agir contra o remetente, e a reputação leva semanas para se recuperar.

### Subtarefas

1. **[INFRA] Subdomínio dedicado com SPF, DKIM e DMARC verificados**
   Separado do domínio transacional — reputação de cold outreach não pode
   contaminar o e-mail corporativo da consultoria.
2. **[INFRA] Plano de aquecimento gradual**
   `daily_cap` começa baixo e cresce conforme a entregabilidade.
3. **[DATABASE] Tabelas de outreach**
   `campaigns`, `campaign_steps`, `campaign_contacts`, `message_templates`,
   `outreach_messages`, `suppression_list`, `consents`, `email_accounts`,
   `email_messages`.
4. **[DATABASE] `suppression_list` guarda hash, não valor**
   Quando um titular pede eliminação, os dados pessoais são apagados mas o
   registro de opt-out permanece. Sem isso, o próximo ciclo de discovery
   redescobriria a pessoa e a contataria de novo — transformando um pedido de
   eliminação em causa de novo contato indesejado.
5. **[BACKEND] Escolher provedor e implementar a abstração `EmailProvider`**
   Resend, SES ou Postmark. A escolha não deve vazar para o domínio.
6. **[BACKEND] `email-send` com as verificações pré-envio**
   Na ordem: resposta já recebida → `suppression_list` → consentimento →
   `daily_cap` → horário comercial no fuso da organização. Todas na Edge Function,
   ponto único e testável — um workflow mal configurado não consegue contorná-las.
7. **[BACKEND] `email-webhook`**
   Entrega, abertura, bounce e reclamação. Hard bounce entra em
   `suppression_list` imediatamente, sem exceção.
8. **[BACKEND] Agente A7 — Outreach Personalizer**
   `personalization` registra exatamente quais fatos foram usados e de onde. É
   auditável: dá para pegar uma mensagem enviada e conferir se cada afirmação
   tinha lastro. Sem contexto suficiente, usa a mensagem base em vez de inventar.
9. **[BACKEND] `outreach-advance` — motor de sequência D0–D30**
   Resposta recebida interrompe a sequência. Pedido de não contato bloqueia
   futuras abordagens.
10. **[DATABASE] `consents` com base legal registrada**
    Legítimo interesse para contato profissional B2B, consentimento para o resto.
11. **[AUTOMATION] WF-008 e WF-010**
    Envio às 11:00 processando a fila aprovada do dia anterior; avanço de
    sequência de hora em hora.
12. **[FRONTEND] Editor de campanha e de sequência**
    D0, D3, D7, D14, D30 com condição, canal, template e critério de encerramento.
13. **[FRONTEND] Fila de aprovação da primeira abordagem**
14. **[TEST] Bateria de conformidade**
    Contato suprimido nunca recebe; reexecução do WF-008 não reenvia; resposta
    interrompe; `daily_cap` respeitado; envio só em horário comercial.

### Critérios de aceite
- [ ] SPF, DKIM e DMARC verificados antes do primeiro envio
- [ ] Subdomínio dedicado
- [ ] Supressão verificada em todo envio, com teste provando
- [ ] Opt-out em toda mensagem, processado automaticamente
- [ ] Resposta interrompe a sequência
- [ ] `daily_cap` respeitado; envio só em horário comercial
- [ ] Primeira abordagem em `approval_required`
- [ ] `personalization` registra os fatos usados
- [ ] Sem contexto suficiente, usa mensagem base
- [ ] Reexecução do WF-008 não reenvia

---

## FASE 15 — WhatsApp

**Prazo** 01/02/2027 · **Estimativa** 2,5 semanas · **Prioridade** alta
**Dependência** FASE 14 + verificação Meta · **Referência** `03-APIS-E-INTEGRACOES.md §3.3`

### Objetivo
Conversar por WhatsApp respeitando as regras da plataforma como constraint de
dados, não como comentário em código.

### Subtarefas

1. **[EXTERNO] Concluir a verificação e submeter os templates**
   Categoria correta por template: MARKETING, UTILITY ou AUTHENTICATION.
2. **[DATABASE] Tabelas de WhatsApp**
   `whatsapp_accounts`, `whatsapp_contacts`, `whatsapp_conversations`,
   `whatsapp_messages`, `whatsapp_templates`.
3. **[BACKEND] `whatsapp-webhook` com assinatura verificada**
   Atualiza `service_window_expires_at` a cada mensagem recebida.
4. **[BACKEND] `whatsapp-send` com verificação da janela de 24 h**
   Dentro da janela, mensagem livre; fora dela, apenas template aprovado. A função
   consulta a coluna antes de montar o payload.
5. **[BACKEND] Monitoramento de tier e quality rating**
   Queda de qualidade dispara alerta e **reduz a cadência automaticamente**.
6. **[BACKEND] Respeitar o limite de marketing por usuário**
   A Meta limita ~2 mensagens de marketing por usuário por dia somando todos os
   negócios, e isso não é contornável com outro número ou outro BSP. Não tentamos
   contornar — decisão de produto.
7. **[AUTOMATION] WF-009**
8. **[FRONTEND] Inbox de conversas**
9. **[TEST] Janela e opt-out**
   Fora da janela só template, com teste provando o bloqueio; opt-out grava em
   `suppression_list`.

### Critérios de aceite
- [ ] Templates aprovados na categoria correta
- [ ] Fora da janela de 24 h, só template — teste prova o bloqueio
- [ ] `service_window_expires_at` atualizado em toda mensagem recebida
- [ ] Tier e quality rating respeitados; queda reduz cadência
- [ ] Webhook com assinatura verificada

---

## FASE 16 — AI Qualification

**Prazo** 15/02/2027 · **Estimativa** 2 semanas · **Prioridade** normal
**Dependência** FASE 15 · **Referência** `05-AGENTES-DE-IA.md §6`

### Objetivo
Pré-qualificar sem vender, e saber a hora de parar.

### O ponto crítico
"A IA foi instruída a não citar preço" não é defesa aceitável depois que ela
citou preço para um prospect. Prompt é instrução, não garantia — regra que não
pode falhar precisa de verificação determinística.

### Subtarefas

1. **[BACKEND] Agente A8 — Conversational Qualifier**
   Conduz o diagnóstico: momento da empresa, número de unidades, como funciona o
   planejamento financeiro hoje, se existe orçamento, se há acompanhamento de
   realizado versus orçado, qual o principal desafio.
2. **[BACKEND] Verificação determinística de saída**
   Barra resposta contendo padrão de valor monetário ou compromisso comercial,
   antes de enviar. Prompt **e** pós-processamento.
3. **[BACKEND] Gatilhos de handoff como regra de banco**
   Pedido explícito de humano, pedido de proposta ou preço, pedido de reunião,
   sinal de negociação, reclamação, dúvida fora da base de conhecimento,
   confiança baixa, N trocas sem progresso, pedido de não contato.
4. **[BACKEND] Registro de sinais captados na conversa**
5. **[FRONTEND] Inbox unificada com o botão ASSUMIR CONVERSA**
   Muda `ai_mode` para `assist`, preenche `handoff_reason` e notifica o responsável.
6. **[FRONTEND] Modo assistente interno**
   Após o handoff a IA **sugere ao operador e não envia**. Retomar o modo autônomo
   exige ação deliberada — uma IA que reassume uma negociação sozinha depois da
   intervenção humana é risco comercial inaceitável.
7. **[AUTOMATION] WF-011**
8. **[TEST] Gatilhos e barreiras**
   Todos os gatilhos disparam; a IA nunca cita preço nem promete prazo.

### Critérios de aceite
- [ ] A8 conduz o diagnóstico completo
- [ ] Nunca cita preço, faz proposta ou promete prazo — verificação determinística
- [ ] Todos os gatilhos de handoff disparam
- [ ] ASSUMIR CONVERSA muda `ai_mode` e notifica
- [ ] Após handoff, IA sugere e não envia
- [ ] Retomar modo autônomo exige ação deliberada

---

## FASE 17 — CRM + Pipeline

**Prazo** 01/03/2027 · **Estimativa** 2 semanas · **Prioridade** normal
**Dependência** FASE 16 · **Referência** `02-MODELO-DE-DADOS.md §4.8`, ADR-010

### Objetivo
Registrar oportunidades preservando a origem, para que a atribuição da FASE 18
seja possível.

### Subtarefas

1. **[DATABASE] `pipelines`, `pipeline_stages`, `opportunities`, `opportunity_stage_history`, `activities`**
   Estágios como **linhas**, não enum — funil comercial muda quando o processo
   configurável por cliente.
2. **[DATA] Seed dos 10 estágios**
   NEW, QUALIFIED, CONTACTED, ENGAGED, MEETING, DIAGNOSIS, PROPOSAL, NEGOTIATION,
   WON, LOST.
3. **[BACKEND] Criação idempotente de oportunidade**
   Chave `sha256(lead_id : pipeline_id)`.
4. **[BACKEND] Propagação da origem**
   `origin_asset_id`, `origin_campaign_id` e `origin_channel` herdados do lead no
   momento da criação.
5. **[BACKEND] Registro automático de mudança de estágio**
6. **[AUTOMATION] WF-012**
7. **[FRONTEND] Kanban**
   Cards com empresa, contato, valor, score, origem, última atividade e próxima ação.
8. **[FRONTEND] Tela de oportunidade com histórico**
9. **[TEST] Idempotência e propagação**

### Critérios de aceite
- [ ] 10 estágios configurados
- [ ] Kanban com todos os campos exigidos
- [ ] Toda mudança de estágio em `opportunity_stage_history`
- [ ] `origin_asset_id` e `origin_campaign_id` propagados do lead
- [ ] Criação de oportunidade é idempotente

---

# EIXO F — Inteligência

## FASE 18 — Attribution

**Prazo** 15/03/2027 · **Estimativa** 2 semanas · **Prioridade** normal
**Dependência** FASE 17 · **Referência** `06-FLUXO-DE-DADOS.md §3`, ADR-008

### Objetivo
Responder, com número em reais, quais ações de marketing e prospecção geraram
receita.

### Por que quatro modelos e não um
Todo modelo de atribuição está errado de um jeito específico. A divergência entre
eles é a informação útil: um canal alto em primeiro toque e baixo em último é
canal de descoberta — cortá-lo por parecer improdutivo no relatório de fechamento
é um erro caro que um modelo único esconde.

### Subtarefas

1. **[DATABASE] `touchpoints` e `attribution_results`**
2. **[BACKEND] Os quatro modelos**
   `first_touch`, `last_touch`, `linear` e `position_based` (40/20/40). A soma das
   parcelas precisa fechar exatamente o valor da oportunidade.
3. **[BACKEND] Registro de touchpoint em todos os pontos da jornada**
4. **[DATABASE] Views materializadas**
   `mv_content_performance`, `mv_channel_performance`, `mv_campaign_performance`,
   `mv_pipeline_snapshot`. Índice único obrigatório em cada uma para permitir
   `REFRESH … CONCURRENTLY`.
5. **[FRONTEND] Revenue Intelligence**
   Receita gerada, pipeline, leads, qualificados, reuniões, propostas, win rate,
   ticket médio, receita por canal, por conteúdo e por campanha.
6. **[FRONTEND] Comparação entre modelos**
   Mostrar a divergência sem confundir o leitor.
7. **[TEST] Fechamento aritmético**
   Soma das parcelas igual ao valor da oportunidade, nos quatro modelos.

### Critérios de aceite
- [ ] Quatro modelos calculados; soma das parcelas fecha o valor
- [ ] As cinco perguntas de atribuição respondidas na interface
- [ ] Views materializadas com refresh `CONCURRENTLY`
- [ ] Revenue Intelligence com todas as métricas

---

## FASE 19 — AI Growth Strategist

**Prazo** 29/03/2027 · **Estimativa** 2 semanas · **Prioridade** normal
**Dependência** FASE 18 · **Referência** `05-AGENTES-DE-IA.md §4–§5`

### Objetivo
Transformar o sistema em assistente comercial: recomendações executáveis, não
relatório.

### Subtarefas

1. **[DATABASE] `ai_recommendations` com `action` tipado**
   Não é texto: é um comando, por exemplo
   `{"type":"create_content_ideas","params":{"pillar_id":"…","count":5}}`.
2. **[BACKEND] Agente A9 — Growth Strategist**
   Lê views agregadas, nunca linhas cruas. Responde o que está funcionando, o que
   não está, onde há oportunidade e qual a próxima ação.
3. **[BACKEND] `recommendation-execute`**
   Valida o `action` com `zod` contra um **registro fechado** de ações permitidas
   antes de despachar. Registra em `audit_log` com o resultado.
4. **[BACKEND] Next Best Action com justificativa da IA**
   A ordenação continua vindo da consulta determinística — LLM não é o instrumento
   certo para contar linhas. A IA escreve o porquê.
5. **[AUTOMATION] WF-013**
   Cron às 23:00: refresh das views, recomputo do Growth Score, execução do A9 e
   geração das recomendações do dia seguinte.
6. **[FRONTEND] Feed de AI Insights**
   Problema, evidência, recomendação, impacto esperado e botão EXECUTAR. O botão
   só aparece quando há `action` válido; recomendação sem ação é informativa.
7. **[TEST] Validação e auditoria da execução**

### Critérios de aceite
- [ ] A9 responde as quatro perguntas estratégicas
- [ ] Recomendação com problema, evidência, recomendação, impacto e ação
- [ ] Botão EXECUTAR só aparece com `action` válido
- [ ] `action` validado contra registro fechado antes de despachar
- [ ] Execução registrada em `audit_log` com resultado
- [ ] Next Best Action ordenada por consulta determinística

---

## FASE 20 — Daily Growth Cycle

**Prazo** 08/04/2027 · **Estimativa** 1,5 semana · **Prioridade** normal
**Dependência** FASE 19 · **Referência** `04-WORKFLOWS-N8N.md`, `06-FLUXO-DE-DADOS.md §4`

### Objetivo
Ligar o ciclo completo, com horários configuráveis e modos de aprovação
respeitados.

### Subtarefas

1. **[DATABASE] `automation_definitions`**
   Com `schedule_cron`, `timezone` e `approval_mode` por automação.
2. **[BACKEND] `automation-dispatch`**
   Envelopa o ciclo de vida do run: cria, acompanha e fecha com contadores.
3. **[AUTOMATION] Exportar e versionar todos os workflows**
   JSON em `n8n/workflows/`, no Git. Workflow que só existe na instância é um
   ponto único de falha sem backup. Nenhum segredo no export.
4. **[SETUP] Todo workflow nasce desabilitado**
   Ligado deliberadamente após validação em dev. Automação de outreach ligada por
   engano em produção envia mensagem real para pessoa real.
5. **[FRONTEND] Painel de automações**
   Catálogo, cron, modo de aprovação, últimas execuções e taxa de erro.
6. **[FRONTEND] Tela de execução**
   Timeline por passo, payload, erro e correlation ID.
7. **[VALIDATE] Ciclo completo ponta a ponta em ambiente de teste**

### Critérios de aceite
- [ ] Todos os workflows exportados e versionados
- [ ] Horários configuráveis por `automation_definitions`
- [ ] Modos de aprovação respeitados por automação
- [ ] Painel com histórico e taxa de erro
- [ ] Ciclo completo executado ponta a ponta em teste

---

# EIXO G — Produção

## FASE 21 — Observabilidade e segurança

**Prazo** 22/04/2027 · **Estimativa** 2 semanas · **Prioridade** alta
**Dependência** FASE 20 · **Referência** `08-OBSERVABILIDADE-E-TESTES.md`, `07-SEGURANCA-LGPD-MULTITENANT.md §6`

### Objetivo
Garantir que nada falhe em silêncio e que a operação esteja conforme a LGPD.

### Subtarefas

1. **[AUTOMATION] WF-014 — Error Monitoring**
   A cada 10 minutos: runs travados, jobs falhados acima do limiar, tokens
   expirando em menos de 7 dias, quality rating em queda, custo de IA acima do
   orçamento, bounce acima de 3%, reclamação acima de 0,1%, fila de aprovação
   parada há mais de 48 h.
2. **[BACKEND] Roteamento de alertas**
   `critical` e `high` imediatos; `medium` no digest diário.
3. **[DATABASE] `dsr_requests` e job mensal de retenção**
4. **[BACKEND] `dsr-export` e `dsr-erase`**
   A eliminação apaga os dados pessoais mas **preserva o hash em
   `suppression_list`** — senão o próximo discovery redescobre a pessoa.
5. **[DOC] ROPA — registro das operações de tratamento**
6. **[DOC] Teste de balanceamento do legítimo interesse**
   Base legal para prospecção B2B exige finalidade legítima, necessidade,
   expectativa razoável e o teste documentado. É o item que costuma ser ignorado.
7. **[DOC] Aviso de privacidade com os operadores listados**
   Supabase, provedor de LLM, provedor de e-mail, Meta, provedor de dados
   empresariais e hospedagem do n8n.
8. **[SEGURANÇA] Revisão completa de RLS**
   Checklist do documento 07 §7, tabela por tabela.
9. **[TEST] Redação de log e preservação do opt-out**

### Critérios de aceite
- [ ] WF-014 ativo com todos os alertas
- [ ] Nenhum log com credencial, verificado por teste
- [ ] `dsr-export` e `dsr-erase` funcionando
- [ ] Eliminação preserva `suppression_list`
- [ ] ROPA e teste de balanceamento documentados
- [ ] Aviso de privacidade publicado
- [ ] Revisão de RLS sem exceção pendente

---

## FASE 22 — Testes completos

**Prazo** 06/05/2027 · **Estimativa** 2 semanas · **Prioridade** normal
**Dependência** FASE 21 · **Referência** `08-OBSERVABILIDADE-E-TESTES.md §4`

### Objetivo
Fechar a cobertura onde o risco real mora: dinheiro, isolamento de dados e
duplicação de efeito externo.

### Subtarefas

1. **[TEST] Os 10 fluxos E2E em Playwright**
   Login; import; reimport sem duplicata; ideia → peça → revisão → aprovação →
   agendamento; mover peça no calendário; ICP → simulação → prospects; campanha →
   sequência → aprovação → fila; assumir conversa; arrastar card no pipeline;
   executar recomendação da IA.
2. **[TEST] Cobertura ≥ 80% em `src/lib/` e nos utilitários compartilhados**
   Cobertura global não é meta — cobrir JSX de layout não previne nada.
3. **[TEST] Matriz de RLS gerada a partir do catálogo**
   Gerar do `information_schema` em vez de lista escrita à mão, para que uma
   tabela nova sem política **falhe o CI por omissão**. É o mecanismo que impede
   o C-01 de voltar.
4. **[TEST] Carga com volume realista**
5. **[TEST] Caos — provedor externo indisponível**
   Simular queda total de um provedor e afirmar que os demais fluxos seguem verdes.

### Critérios de aceite
- [ ] 10 fluxos E2E verdes
- [ ] Cobertura atingida nos alvos definidos
- [ ] Matriz de RLS gerada do catálogo; tabela sem política falha o CI
- [ ] Teste de carga executado
- [ ] Teste de caos: provedor fora não derruba os demais módulos

---

## FASE 23 — Hardening

**Prazo** 17/05/2027 · **Estimativa** 1,5 semana · **Prioridade** normal
**Dependência** FASE 22 · **Referência** `09-ROADMAP-E-ACEITE.md §3`

### Objetivo
Eliminar gargalo, custo desnecessário e dívida antes de produção.

### Subtarefas

1. **[PERF] Orçamento de latência por query e revisão de índices**
   Contra as queries reais que apareceram em uso, não contra suposição.
2. **[CUSTO] Medir e otimizar o custo de IA por operação**
   Cache de prompt no bloco de contexto, que é grande, estável e repetido em toda
   chamada. Avaliar modelo por tarefa.
3. **[REFACTOR] Eliminar componentes duplicados**
4. **[PERF] Revisar chamadas duplicadas de API e workflows redundantes**
5. **[DOC] Registrar e priorizar a dívida técnica remanescente**

### Critérios de aceite
- [ ] Nenhuma query acima do orçamento de latência
- [ ] Índices revisados contra queries reais
- [ ] Custo de IA por operação medido e otimizado
- [ ] Componentes duplicados eliminados
- [ ] Dívida técnica registrada e priorizada

---

## FASE 24 — Deploy

**Prazo** 24/05/2027 · **Estimativa** 1 semana · **Prioridade** normal
**Dependência** FASE 23 · **Referência** `09-ROADMAP-E-ACEITE.md §3`

### Objetivo
Colocar em produção com capacidade real de recuperação.

### Subtarefas

1. **[INFRA] Separar ambientes dev e prod com segredos distintos**
2. **[INFRA] Backup automático com restauração testada**
   Backup não testado não é backup. Executar uma restauração completa e cronometrar.
3. **[DOC] Runbooks**
   Token expirado, workflow travado, falha de provedor, restauração de backup,
   número de WhatsApp bloqueado, reputação de e-mail em queda.
4. **[INFRA] Monitoramento e alertas em produção**
5. **[VALIDATE] Checklist de produção**
   Security review, environment review, secrets review, database review, RLS
   review, API review, backup, monitoring, error handling, rate limiting,
   performance.

### Critérios de aceite
- [ ] Ambientes isolados com segredos distintos
- [ ] Backup automático **com restauração testada**
- [ ] Runbooks escritos
- [ ] Monitoramento e alertas ativos em produção
- [ ] Checklist de produção integralmente cumprido
