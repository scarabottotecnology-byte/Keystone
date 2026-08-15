# 10 — Decisões Arquiteturais (ADR)

Registro das decisões estruturais da FASE 0. A seção 5 do Master Prompt exige
explicar decisão de arquitetura importante e sinalizar decisão irreversível —
este documento cumpre as duas coisas.

**Legenda de reversibilidade:**
🔴 irreversível ou muito cara de reverter · 🟡 reversível com esforço ·
🟢 reversível a baixo custo

---

## ADR-001 — Construir o Growth OS dentro deste repositório 🔴 ~~SUPERADO~~

> **Superado pelo [ADR-013](./15-REVERSAO-ADR-001-INFRAESTRUTURA.md) em
> 08/08/2026, e reforçado em 09/08.** A premissa era falsa: o Supabase do Centro
> de Custos não pertence à organização da Keystone, e os dois produtos não têm
> fluxo de dado entre si. O Growth OS tem repositório e banco próprios; o Centro
> de Custos permanece separado. O texto original fica abaixo como registro.

**Contexto.** O repositório é um dashboard de centro de custos. O Growth OS é
outro produto. Opções: repositório novo, ou expandir este.

**Decisão.** Expandir este repositório. O Centro de Custos vira o módulo
**Cost Intelligence** dentro do Growth OS.

**Razão.** Mesma organização, mesmo Supabase, mesmos usuários. Dois repositórios
significariam duas autenticações, dois modelos de tenancy e dois design systems
para manter — e o Master Prompt (seção 5) proíbe destruir a funcionalidade
existente, o que na prática exige conviver com ela de qualquer forma. Conviver no
mesmo lugar é mais barato.

**Consequência.** O repositório muda de identidade: o nome
`centro-de-custos-inteligente` passa a descrever um módulo, não o produto.
Recomenda-se renomear em algum momento, mas não é urgente.

**Alternativa rejeitada.** Repositório novo com o dashboard mantido em paralelo.
Rejeitada pelo custo de duplicar plataforma e pela fragmentação de contexto
comercial: os dados de controladoria são fonte legítima de conteúdo para o
próprio motor de growth.

---

## ADR-002 — `organization_id` em toda tabela, e RLS forçada 🔴

**Revisto em 15/08/2026.** A justificativa original era preparo para SaaS. O
sistema é de **uso interno da Keystone** e não será vendido — a decisão continua,
com outra razão.

**Contexto.** Uma organização, poucos usuários. Escopo por organização poderia
ser dispensado.

**Decisão.** `organization_id NOT NULL` em toda tabela de negócio, RLS `ENABLE`
**e** `FORCE`, desde a primeira migração.

**Razão.** Não é escala — é **auditabilidade**. Com a coluna, existe uma única
forma de escrever a política, aplicada igual em sessenta tabelas: ou a linha
pertence à organização do usuário autenticado, ou não é visível. Sem ela, cada
tabela ganha a sua própria regra, e revisar sessenta regras distintas é como o
buraco de segurança nasce.

A segunda razão é que **autenticação é obrigatória de qualquer forma**. O sistema
guarda token de OAuth, dado de prospect e conversa de WhatsApp. Isso não pode
ficar atrás de uma chave publicável que vai no bundle — foi exatamente essa
confusão que produziu o achado C-01 no outro produto da casa.

**Consequência.** Toda tabela carrega uma coluna que hoje tem sempre o mesmo
valor. O custo é uma coluna e um índice; o benefício é que a superfície de
revisão de segurança cabe numa página.

**O que sai junto com o SaaS.** Seletor de organização, convite de time externo,
cobrança e a matriz de teste de isolamento entre organizações. Nada disso se
constrói.

---

## ADR-003 — RLS baseada em `memberships`, não em claims de JWT 🟡

**Contexto.** Duas formas de resolver a organização do usuário: consultar
`memberships` numa função, ou embutir as organizações como custom claim no JWT.

**Decisão.** Função `app.current_org_ids()` sobre `memberships`, `STABLE` e
`SECURITY DEFINER` com `search_path` fixo.

**Razão.** Claim em JWT é mais rápida (zero I/O), mas fica obsoleta: revogar um
acesso exige esperar o refresh do token, o que significa uma janela em que um
usuário removido ainda lê dados. Para um sistema com dados financeiros de
clientes, essa janela é inaceitável. `STABLE` mitiga o custo — o planejador
avalia a função uma vez por statement, não por linha.

**Consequência.** Um lookup por statement. Se virar gargalo medido (não
suposto), a migração para claims permanece aberta.

**Armadilhas registradas.** `SECURITY DEFINER` é necessário para evitar recursão
na política de `memberships`; `set search_path` é obrigatório contra sequestro de
path; funções de agregação, ao contrário desta, precisam ser `SECURITY INVOKER`
sob pena de ignorar a RLS.

---

## ADR-004 — Tokens fora do schema `public` 🔴

**Contexto.** `social_accounts` precisa ser legível pelo frontend para exibir
saúde da conexão, mas contém a credencial de publicação.

**Decisão.** Separar. `social_accounts` guarda `token_ref`; o token vive em
`private.oauth_tokens`, num schema não exposto pelo PostgREST, acessível apenas
por Edge Function com `service_role`.

**Razão.** Defesa que não depende de a política de RLS estar correta. Mesmo com
uma política mal escrita, não existe rota HTTP até o schema `private`. Colocar o
token numa coluna do `public` protegida por RLS transformaria todo erro de
política num vazamento de credencial de publicação — e o achado C-01 mostra que
erro de política acontece neste projeto.

**Consequência.** Todo acesso a token passa por Edge Function. Nenhuma exceção,
nem para operação administrativa.

---

## ADR-005 — Gateway próprio de IA em vez de SDK direto 🟡

**Contexto.** Chamar o SDK do provedor em cada função seria mais simples.

**Decisão.** Uma Edge Function `ai-gateway` como único ponto de invocação.

**Razão.** Quatro exigências do Master Prompt (seção 3) — troca de fornecedor,
camada própria de prompts, controle de custo, fallback — só são implementáveis
de forma consistente num ponto único. Espalhadas por dez consumidores, viram dez
implementações divergentes e nenhuma métrica confiável de custo.

**Consequência.** Um salto de rede extra e um ponto único de falha, mitigado por
fallback interno e por o gateway ser stateless.

**Corolário.** Prompts são dados versionados em `ai_prompts`, não literais em
código — permite ajuste sem deploy e comparação histórica de versão contra
performance real.

---

## ADR-006 — n8n orquestra, Edge Functions decidem 🟡

**Contexto.** n8n permite escrever lógica em nós de código, o que seria mais
rápido de montar.

**Decisão.** n8n só agenda, chama, repete e alerta. Toda regra de negócio em
TypeScript em Edge Function.

**Razão.** Lógica em JSON de workflow não tem teste unitário, não tem tipo, não é
revisável em diff de forma legível e não sobrevive a uma troca de orquestrador.
As mesmas regras em Edge Function têm as quatro coisas. Considerando que o
sistema envia mensagens reais para pessoas reais, testabilidade não é luxo.

**Consequência.** Mais chamadas de rede e mais endpoints. Aceito.

---

## ADR-007 — pgvector no mesmo Postgres, não banco vetorial dedicado 🟢

**Decisão.** RAG sobre pgvector com índice HNSW em `knowledge_chunks`.

**Razão.** O volume esperado (documentos institucionais de uma consultoria) é de
milhares de chunks, não milhões. Um banco vetorial dedicado adicionaria um
serviço, uma credencial, um ponto de falha e — o mais grave — um segundo modelo
de autorização a manter em sincronia com a RLS. Com pgvector, o isolamento entre
organizações é a mesma política que protege o resto do banco.

**Consequência.** Se o volume crescer em ordens de grandeza, migrar é possível e
localizado (`app.match_knowledge`).

**Cuidado registrado.** A função de busca precisa ser `SECURITY INVOKER`; como
`SECURITY DEFINER` ela vazaria conhecimento entre organizações.

---

## ADR-008 — Quatro modelos de atribuição, nenhum eleito 🟢

**Decisão.** Calcular `first_touch`, `last_touch`, `linear` e `position_based`
para toda oportunidade. `position_based` é o padrão de exibição.

**Razão.** Todo modelo de atribuição está errado de um jeito específico e
conhecido. A divergência entre eles é informação: canal alto em first e baixo em
last é canal de descoberta, e um modelo único apagaria essa distinção — levando à
decisão de cortar justamente o canal que alimenta o funil.

**Consequência.** Mais linhas em `attribution_results` e a necessidade de a UI
explicar a diferença sem confundir. Vale o custo.

---

## ADR-009 — Fonte de dados de CNPJ: decisão adiada, com padrão 🟡

**Contexto.** Duas opções legítimas: carga dos dados abertos da Receita Federal
(gratuita, oficial, mensal, exige pipeline para arquivos grandes) ou API
licenciada (custo recorrente, integração trivial).

**Decisão.** Adiada para a FASE 12. Padrão recomendado: **começar com API
licenciada** e reavaliar quando o volume justificar a carga própria.

**Razão.** Validar o funil de discovery importa mais do que economizar
mensalidade num estágio em que ainda não se sabe se o funil funciona. Construir
pipeline de ingestão de dezenas de GB antes de saber se o ICP produz prospects
úteis é otimização prematura.

**Por que é reversível.** `companies.source` registra a procedência desde a
primeira linha, e a interface de discovery é abstrata. Trocar a fonte depois não
invalida dado já coletado.

**Restrição inegociável.** Qualquer que seja a fonte, **nada de scraping** de
plataforma que ofereça API oficial (seções 3 e 64).

---

## ADR-010 — Estágios de pipeline como dados, não como enum 🟢

**Contexto.** A seção 31 define dez estágios fixos. Enum daria validação no
banco.

**Decisão.** `pipeline_stages` como tabela.

**Razão.** Funil comercial muda quando o processo comercial muda — e ele muda,
com muito mais frequência que o esquema do banco. Com enum, renomear um estágio
ou inserir um passo intermediário vira migração; com tabela, é edição de linha.

**Consequência.** Perde-se validação no banco; ganha-se poder ajustar o processo
sem deploy. Os dez estágios são criados como seed na FASE 17. Demais máquinas de
estado — status de conteúdo, de publicação, de job — **continuam sendo enum**,
porque são internas ao sistema e mudam só com o código.

---

## ADR-011 — Estimativa nunca é apresentada como fato 🔴

**Contexto.** O ICP exige faturamento, headcount e crescimento. O cadastro
público de CNPJ não traz nenhum dos três. A tentação é estimar por porte e CNAE.

**Decisão.** Campo sem dado permanece nulo. Estimativa, quando existir, é
gravada em coluna separada, marcada como estimativa e exibida como tal. O ICP
Score pondera apenas critérios com dado presente e **normaliza pelo peso
disponível**, expondo a cobertura em `prospect_scores.breakdown`.

**Razão.** Um score de 91 que na verdade avaliou 40% dos critérios é
indistinguível, para quem lê, de um score de 91 que avaliou 95% — e leva a
priorizar a empresa errada. Pior: aparenta precisão que não existe, o que é
exatamente o tipo de dano que a seção 64 procura evitar.

**Por que é irreversível.** É uma decisão de honestidade do produto. Uma vez que
o sistema comece a exibir números inventados como fatos, a confiança do operador
nos números verdadeiros também se perde.

---

## ADR-012 — Human-in-the-loop codificado, não documentado 🔴

**Contexto.** A seção 51 estabelece que a decisão comercial final é humana.
Isso poderia viver apenas em prompt e em documentação.

**Decisão.** Codificar. `automation_definitions.approval_mode`,
`whatsapp_conversations.ai_mode`, gatilhos de handoff como regra determinística,
e verificação pós-processamento que barra saída de IA contendo valor monetário ou
compromisso comercial em conversa.

**Razão.** Prompt é instrução, não garantia. Um modelo pode ignorar instrução sob
pressão de contexto, e "a IA foi instruída a não citar preço" não é defesa
aceitável depois que ela citou preço para um prospect. Regra que não pode falhar
precisa de verificação determinística.

**Consequência.** Mais código e algum falso positivo (uma resposta legítima
ocasionalmente barrada para revisão). Preferível ao inverso.

---

## ADR-013 — Infraestrutura própria, sem herança 🔴

**Substitui o ADR-001.** O texto completo, com o achado que motivou a reversão,
está em [`15-REVERSAO-ADR-001-INFRAESTRUTURA.md`](./15-REVERSAO-ADR-001-INFRAESTRUTURA.md).

**Decisão.** O Growth OS tem repositório próprio, projeto Supabase próprio na
organização da Keystone e ciclo de deploy próprio. Não herda nada de outro
produto. O Centro de Custos permanece separado, e não vira módulo daqui.

**Razão.** O ADR-001 assumia que o repositório e o banco pertenciam à Keystone e
podiam ser compartilhados — nenhuma das duas coisas se confirmou. E, mais
fundamental que isso: são produtos com objetivos diferentes. Este é comercial —
CRM, conteúdo, publicação automática, prospecção. Compartilhar infraestrutura os
acoplaria sem que houvesse fluxo de dado real entre eles.

**Consequência.** Banco vazio, o que torna a FASE 2 materialmente mais simples:
sem backfill, sem convivência com tabela legada, sem trocar política de segurança
embaixo de dado em produção. Em troca, a correção do achado C-01 sai deste
roadmap e precisa de dono no outro produto.

---

## ADR-014 — Ferramenta interna, não produto 🔴

**Decisão do cliente, 15/08/2026.**

> "A ferramenta é de uso interno, para maximizar meu próprio marketing."

**Contexto.** O master prompt pedia arquitetura "genérica o suficiente para
virar SaaS multi-tenant". Vários documentos foram escritos sob essa premissa.

**Decisão.** O Growth OS é **ferramenta interna da Keystone**. Não será vendido,
licenciado nem oferecido a cliente. Nenhuma decisão de arquitetura se justifica
por preparo para venda.

**Razão.** Requisito hipotético é o pior tipo de requisito: custa hoje, em
complexidade real, para atender um cenário que talvez nunca exista — e quando o
cenário aparece, quase sempre é diferente do que foi antecipado. Ter um único
usuário conhecido é vantagem: cada escolha pode ser tomada para uma consultoria
de controladoria brasileira, e só.

**O que sai.**

| | Motivo |
|---|---|
| Seletor de organização | uma organização |
| Convite de time externo | só a equipe da Keystone |
| Tela de cobrança | não há o que cobrar |
| Matriz pgTAP de isolamento **entre** organizações | não há segunda organização |
| Justificativa "preparo para SaaS" em qualquer ADR | premissa morta |

**O que fica, com outra razão.** `organization_id` e RLS forçada permanecem —
**não** por escala, mas por auditabilidade e porque autenticação é obrigatória de
qualquer forma. Ver o ADR-002 revisto.

**Consequência no roadmap.** A FASE 2 perde o onboarding multi-organização e a
matriz de isolamento cruzado. As demais fases não mudam: o ciclo comercial que o
sistema executa é o mesmo, sendo interno ou não.

---

## Decisões deliberadamente adiadas

| Tema | Quando | Por quê agora não |
|---|---|---|
| Provedor de e-mail (Resend × SES × Postmark) | FASE 14 | Abstração `EmailProvider` isola a escolha |
| Provedor primário de LLM | FASE 1, revisável | O gateway torna a troca barata |
| Hospedagem do n8n (cloud × self-hosted) | FASE 20 | Não afeta o desenho |
| Workers × Pages, e R2 × Supabase Storage | FASE 24 | Não afeta o desenho até o deploy |
