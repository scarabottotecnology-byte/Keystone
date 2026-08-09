# 14 — Geração de Arte e Automação de Publicação

**Correção de arquitetura.** Este documento existe porque a FASE 0 tinha uma
lacuna: a geração de imagem não foi especificada.

---

## A lacuna

O escopo original pede, no fluxo macro, um passo explícito:
`GERAÇÃO DE CONTEÚDO → GERAÇÃO DE IMAGENS → APROVAÇÃO → PUBLICAÇÃO`.

No documento 05, o agente A3 produz **`visual_brief`** — um briefing de arte. E
`content_assets.media` é um `jsonb` que aguarda arquivos. Ou seja: a arquitetura
descrevia *o pedido* da imagem e *o lugar de guardá-la*, mas **nada produzia a
imagem**. Na prática isso pressupunha um designer no meio do caminho.

Isso contraria o requisito central do produto. Sem geração de arte, não há
publicação automática — há uma fila de rascunhos esperando alguém.

---

## A decisão: composição por template, não modelo generativo

Existem dois caminhos para produzir a arte automaticamente. A escolha entre eles
é a decisão mais importante deste documento.

| | Composição por template | Modelo generativo de imagem |
|---|---|---|
| Texto na peça | Texto real, renderizado | Frequentemente borrado ou inventado |
| Consistência de marca | Idêntica sempre | Diferente a cada execução |
| Número correto na arte | Garantido | Não confiável |
| Custo por peça | Praticamente zero | Por imagem, recorrente |
| Reprodutibilidade | Determinística | Não determinística |
| Supervisão necessária | Nenhuma | Alta |

**Decisão: composição por template como mecanismo principal.**

A razão é específica deste negócio. As peças da Keystone exibem afirmação
técnica, percentual e valor — "43% do overhead", "9 p.p. de margem". Modelo
generativo de imagem erra texto de forma sistemática: inventa letra, deforma
número. Uma peça que mostra um percentual errado, com o logo da consultoria ao
lado, é dano de credibilidade direto para quem vende rigor numérico.

Há também a razão econômica: publicação diária em dois canais, com variações,
são centenas de imagens por mês. Composição custa zero por peça.

**Modelo generativo fica reservado** para fundo abstrato e textura, onde não há
texto nem número — e sempre atrás de aprovação, nunca no caminho automático.

Esta é uma decisão que **torna o objetivo de automação total mais viável**, não
menos. É o caminho determinístico que dispensa supervisão.

---

## O motor de arte

Uma Edge Function, `render-asset`, que compõe a peça a partir de um template e
dos dados da peça, e devolve o arquivo final.

```
content_assets (copy pronta, visual_brief)
   ↓  A10 Visual Director escolhe o template e distribui o texto
render_jobs
   ↓  render-asset: HTML/SVG → PNG, headless
   ↓  Supabase Storage
content_assets.media = [{storage_path, template, width, height, alt}]
```

**Renderização:** o template é HTML+CSS com as fontes da marca embutidas,
convertido em PNG por navegador headless — a mesma técnica usada para gerar os
arquivos de marca em `public/brand/`. Texto sai como texto: nítido, correto,
sempre na tipografia certa.

**Alt text é obrigatório.** Gerado junto com a arte e gravado em `media[].alt`.
Peça sem alt não avança na fila.

### Templates iniciais

| Template | Uso | Formato |
|---|---|---|
| `afirmacao` | Tese em serifada sobre fundo escuro | 1080×1080 |
| `dado` | Número grande com contexto | 1080×1080 |
| `grafico` | Barra ou rosca com título | 1080×1080 |
| `carrossel_capa` | Capa numerada de carrossel | 1080×1350 |
| `carrossel_slide` | Slide interno, título e corpo | 1080×1350 |
| `case` | Resultado com métrica destacada | 1080×1080 |
| `comercial` | CTA com botão | 1080×1080 |

Templates são **dados**, não código: vivem em `content_templates`, com o spec em
`jsonb`. Adicionar um formato não exige deploy.

---

## Novas entidades

```sql
create table content_templates (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  key             text not null,
  name            text not null,
  channel         social_channel,
  width           int not null,
  height          int not null,
  spec            jsonb not null,   -- zonas de texto, limites, cores, variantes
  is_active       boolean not null default true,
  unique (organization_id, key)
);

create type render_status as enum ('pending','running','succeeded','failed');

create table render_jobs (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  asset_id        uuid not null references content_assets(id) on delete cascade,
  template_id     uuid not null references content_templates(id),
  variant         int not null default 1,
  payload         jsonb not null,   -- o texto já distribuído nas zonas
  status          render_status not null default 'pending',
  storage_path    text,
  attempt         int not null default 0,
  last_error      text,
  idempotency_key text not null,
  created_at      timestamptz not null default now(),
  unique (organization_id, idempotency_key)
);
```

`content_assets.media` passa a ser preenchido pelo motor, não por upload.

### Pedido de alteração em linguagem natural

A tela de fila permite pedir mudança escrevendo — *"deixe o hook mais direto e
troque a arte por uma versão com gráfico"*. Isso precisa de rastro:

```sql
create table content_revisions (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  asset_id        uuid not null references content_assets(id) on delete cascade,
  requested_by    uuid references auth.users(id),
  instruction     text not null,      -- o pedido, como foi escrito
  scope           text[] not null,    -- copy | arte | ambos
  from_version    int not null,
  to_version      int,
  ai_invocation_id uuid references ai_invocations(id),
  created_at      timestamptz not null default now()
);
```

Cada pedido gera uma **nova versão** da peça, nunca sobrescreve. É o que permite
comparar, voltar atrás e — mais importante — medir se a intervenção humana
melhorou o resultado. Se as peças revisadas performam igual às automáticas, a
revisão está custando tempo sem retorno.

---

## Agente A10 — Visual Director

Novo agente, entre A3 (copy) e A4 (revisão).

**Entrada:** peça com copy pronta, pilar, canal, formato, marca.
**Saída:** template escolhido, texto distribuído nas zonas, variante de cor,
alt text, e duas variações alternativas.

**Restrições codificadas:**

- Só usa templates ativos da organização.
- Respeita o limite de caracteres de cada zona — texto que estoura é rejeitado
  e redistribuído, nunca cortado com reticências.
- Número que aparece na arte **precisa existir na copy**. Verificação
  determinística: um valor na peça que não consta no texto barra a renderização.
  É a mesma regra de não fabricar dado, aplicada à imagem.
- Nunca escolhe cor fora da paleta da marca.

---

## O ciclo diário completo

Onde a arte entra no que já estava desenhado:

| Hora | Passo | Modo |
|---|---|---|
| 06:00 | Market Intelligence encontra as pautas | auto |
| 07:00 | A3 escreve copy, hook e CTA | auto |
| 07:05 | **A10 escolhe template e distribui o texto** | auto |
| 07:06 | **`render-asset` compõe a arte e as variações** | auto |
| 07:10 | A4 revisa copy **e arte**: score 0–100 | auto |
| 07:12 | Score ≥ limiar → agendada; abaixo → volta para ajuste | auto |
| 08:00 | Publicação com a arte anexada | auto |

**Nenhum passo espera humano.** A intervenção é opcional e acontece pela tela de
fila: você abre a peça, escreve o que quer diferente, e o sistema regera.

O modo `approval_required` continua disponível por automação — recomendo começar
por ele nas duas primeiras semanas, para calibrar o limiar de score, e migrar
para `auto` quando a taxa de intervenção cair. A tela mostra esse número:
*intervenção humana, 9% das peças*. Quando ele estabilizar baixo, a supervisão
deixou de ser necessária.

---

## Impacto no roadmap

| Fase | Mudança |
|---|---|
| **5** | Passa a incluir `content_templates`, `render_jobs`, `content_revisions`, o agente A10 e a Edge Function `render-asset`. **+1 semana** (de 2,5 para 3,5) |
| **6** | Publicação já envia a arte gerada. Sem mudança de escopo. |
| **7** | Instagram exige a mídia em URL pública no momento da criação do container — a arte renderizada já está no Storage, servida por URL assinada de vida curta. Sem mudança. |
| **8** | Métrica por template: qual composição converte melhor. Pequeno acréscimo. |

O total do roadmap passa de 51 para 52 semanas.

---

## Riscos assumidos

**Repetição visual.** Sete templates publicando todo dia gera padrão
reconhecível — o que é bom para marca e ruim para novidade. Mitigação: variantes
de cor e composição dentro de cada template, e a métrica por template na FASE 8
indicando quando um está saturado.

**Templates são trabalho de design.** Os sete precisam ser desenhados uma vez,
com cuidado. É o único ponto de esforço humano concentrado — e ele se paga na
primeira semana de operação.

**Teto de sofisticação.** Composição não produz imagem fotográfica nem
ilustração autoral. Para consultoria de controladoria, isso não é limitação: o
repertório visual do setor é tipografia, número e gráfico. Se um dia a marca
quiser peça fotográfica, ela entra pelo caminho de aprovação, não pelo automático.
