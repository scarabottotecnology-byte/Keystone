# 16 — Fatia vertical: um post no LinkedIn, do zero, sem ninguém subir imagem

**Decisão do cliente, 09/08/2026.** O roadmap deixa de ser executado fase a
fase. No lugar, uma fatia fina atravessa a corrente inteira, e as fases viram
camadas que a engrossam depois.

---

## Por que mudar a ordem

O roadmap original entrega as FASES 2 → 4 → 5 → 6 completas, em sequência. Cada
uma é sólida, e a primeira publicação real só acontece na sexta — meses depois
do começo. Nesse desenho, o valor central do produto é a última coisa a aparecer.

A fatia vertical inverte: constrói **o mínimo de cada fase** necessário para o
ciclo fechar uma vez, de ponta a ponta. Um pilar de conteúdo, um template de
arte, um canal.

O que se ganha não é velocidade — é **evidência**. Um ciclo que fecha uma vez
prova que a arquitetura funciona; quatro fases completas sem ciclo provam apenas
que o código compila. E os erros de integração, que são os caros, aparecem em
semanas em vez de meses.

O que se perde é honesto: a fatia toca todas as camadas de raspão, e cada fase
depois volta para engrossar o que ficou fino. Há retrabalho previsto. Ele é
menor que o custo de descobrir na FASE 6 que a cadeia não fecha.

---

## O que a fatia entrega

> Às 07:00 o sistema escolhe uma pauta, escreve a copy, compõe a arte,
> verifica os dois, agenda, e às 08:00 publica no LinkedIn. Você não abriu o
> aplicativo. Se quiser mudar algo, abre a fila, escreve o que quer diferente,
> e o sistema regera.

Uma pauta. Um template. Um canal. Tudo o mais fica para as camadas seguintes.

### Corrente mínima

| Elo | O mínimo | De qual fase vem |
|---|---|---|
| Identidade | `organizations`, `profiles`, `memberships`, `app.current_org_ids()`, login | 2 |
| Marca | `brand_profiles` — tom, público, palavras proibidas | 5 |
| Copy | `ai-gateway` + agente A3 numa etapa só | 1 e 5 |
| Arte | `content_templates`, `render_jobs`, `render-asset` | 5 |
| Direção visual | A10 escolhendo template e distribuindo o texto | 5 |
| Fila | `content_calendar`, tela de fila, pedido de alteração em texto livre | 4 e 5 |
| Publicação | `social_accounts`, `private.oauth_tokens`, `publishing_jobs` | 6 |

### O que fica de fora, deliberadamente

Market Intelligence (a pauta entra à mão na fatia), RAG e base de conhecimento,
Content Score nas dez dimensões, variações, Instagram, analytics, leads, CRM.
Nada disso é descartado — cada um é a camada seguinte.

---

## Ordem de construção

### Etapa 0 — protocolar os pedidos externos ⚠️ AÇÃO DO CLIENTE, HOJE

Não é código, e é o caminho crítico de verdade.

| | Espera | Exige |
|---|---|---|
| LinkedIn Community Management API | aprovação em duas etapas | empresa registrada, Página verificada com dados coincidentes, super admin verificando, gravação de tela para o Standard Tier |
| Meta App Review | **4 a 6 semanas** | Instagram Professional vinculado a Página do Facebook, app de desenvolvedor, `instagram_business_content_publish` submetida |

Aberto hoje, a espera corre em paralelo a tudo. Aberto quando o código estiver
pronto, o projeto para por mais de um mês esperando terceiro. Nenhuma linha de
código encurta isso.

### Etapa 1 — motor de arte ✅ **miolo pronto**

A única parte do sistema com **zero dependência externa**. Não espera LinkedIn,
não espera Meta, não precisa de banco para o miolo funcionar.

Entregue: composição verificada, dois templates, validação de zonas, guardrail
numérico, 18 testes. Ver
[`supabase/functions/render-asset/README.md`](../supabase/functions/render-asset/README.md).

Falta: os outros cinco templates, alt text, e o `index.ts` — que depende da
Etapa 2.

### Etapa 2 — identidade

`organizations`, `profiles`, `memberships`, `app.current_org_ids()`, RLS
`ENABLE` e `FORCE`, login. Não dá para pular: token de OAuth precisa pertencer a
alguém, e template precisa de dono.

É a FASE 2 sem os enfeites — sem RBAC fino, sem convite, sem seletor de
organização. Uma organização, os usuários da Keystone.

### Etapa 3 — copy

`ai-gateway` (FASE 1, subtarefa 9) e o A3 numa etapa só, em vez das seis do
pipeline completo. `brand_profiles` com tom e palavras proibidas, preenchido à
mão.

### Etapa 4 — a peça inteira

A10 escolhe o template, distribui o texto nas zonas, o `render-asset` compõe.
`content_assets` guarda copy e mídia. Aqui a corrente já produz uma peça
publicável sem intervenção.

### Etapa 5 — fila

`content_calendar` e a tela onde as peças agendadas aparecem. O pedido de
alteração em linguagem natural (`content_revisions`) gera **nova versão**, nunca
sobrescreve — é o que permite medir depois se a intervenção humana melhorou algo.

### Etapa 6 — publicação

`private.oauth_tokens`, `social-publish` com lock pessimista e chave de
idempotência gravada **antes** da chamada externa, WF-002 a cada 15 minutos.

**Se o LinkedIn não tiver aprovado até aqui**, a etapa entrega o modo assistido:
o sistema gera, revisa, agenda e prepara; o operador publica e cola a URL; o
sistema registra o `external_post_id`. A cadeia de atribuição fica íntegra e
apenas o último passo é humano. É degradação explícita e visível na interface,
não mock disfarçado.

---

## Correção de arquitetura que o spike produziu

O documento 14 especificava o motor de arte como "HTML/SVG → PNG, headless",
dizendo ser "a mesma técnica usada para gerar os arquivos de marca em
`public/brand/`".

**Estava errado.** Aqueles arquivos foram gerados com Playwright na minha
máquina. Edge Function do Supabase roda em Deno Deploy, que não permite subir um
navegador. A especificação descrevia um mecanismo que não existe no destino.

O mecanismo real, verificado antes de planejar em cima dele:

| | |
|---|---|
| **satori** | layout (subset de flexbox, tipografia real) → SVG |
| **resvg-wasm** | SVG → PNG, em WebAssembly |

Nenhum abre processo. **1080×1080 em ~270 ms.**

Duas restrições saíram do spike, e as duas são permanentes:

1. **Fonte precisa ser estática.** O parser do satori quebra na tabela `fvar` de
   fonte variável, e ele não lê woff2 — que é o que o frontend usa. As
   instâncias em TTF foram geradas com `fontTools`.
2. **Layout é subset de flexbox.** Sem grid, sem posicionamento absoluto
   arbitrário. Suficiente para peça editorial.

Uma terceira ressalva, esta contra o próprio documento 14: ele afirma que
"adicionar um formato não exige deploy", porque os templates viveriam como dado
em `content_templates.spec`. Hoje **o spec é dado, mas o layout é código**.
Tornar o layout declarativo é um projeto próprio, e fica para a FASE 5. Até lá,
adicionar template exige deploy.

---

## Impacto no ClickUp

As 24 fichas continuam válidas como **escopo**. O que muda é a ordem de
execução: cada etapa desta fatia consome subtarefas de várias fichas ao mesmo
tempo.

Sugestão para não perder o rastro: criar uma lista **EIXO 0 — Fatia vertical**
com as seis etapas como fichas, cada uma linkando as subtarefas que consome nas
fichas de fase. As fichas de fase fecham quando a camada estiver grossa, não
quando a fatia passar por elas.
