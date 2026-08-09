# Keystone Growth OS

Sistema operacional de crescimento comercial da Keystone Controladoria.

Não é uma ferramenta de redes sociais. É um ciclo fechado: inteligência de
mercado → conteúdo → publicação → analytics → leads → ICP e prospecção →
abordagem → qualificação → CRM → receita → aprendizado por IA. A arquitetura é
multi-tenant desde a primeira tabela, para que o produto possa virar SaaS sem
reescrita.

## Estado

**FASE 1 — Fundação técnica.** O que existe hoje é o esqueleto: design system,
estrutura de módulos, shell de navegação, seletor de tema, identidade visual e o
módulo Cost Intelligence portado do produto anterior. Nada do ciclo comercial
está ligado ainda.

O roadmap completo — 24 fases, 52 semanas — está em
[`docs/09-ROADMAP-E-ACEITE.md`](docs/09-ROADMAP-E-ACEITE.md).

## Começar

```bash
npm install
cp .env.example .env    # preencha a chave publishable
npm run dev             # http://localhost:8080
```

| Comando | O que faz |
|---|---|
| `npm run dev` | servidor de desenvolvimento |
| `npm run build` | build de produção |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript sem emitir |
| `npm test` | Vitest |

## Stack

Vite 5 · React 18 · TypeScript 5.8 · Tailwind 3.4 · shadcn/ui · TanStack Query ·
Recharts · Supabase (Postgres, Auth, Storage, Edge Functions) · n8n para
orquestração · Cloudflare para hospedagem e mídia.

### Supabase

| | |
|---|---|
| Projeto | `keystone-growth-os` |
| Ref | `rplnjrqpzqznbxfascqs` |
| Região | `sa-east-1` (São Paulo) |

São Paulo por dois motivos: latência para usuários brasileiros e dado pessoal de
titular brasileiro hospedado no país, o que dispensa o capítulo de transferência
internacional no ROPA da LGPD.

## Estrutura

```
docs/       arquitetura (FASE 0) — 16 documentos, o contrato do que se constrói
public/     estáticos; public/brand/ tem a identidade para uso fora do produto
src/app/    registro de navegação, tema, rotas
src/components/  shell, componentes compartilhados, shadcn/ui
src/modules/     um diretório por módulo de negócio, sem import cruzado
src/integrations/supabase/  cliente e tipos gerados
supabase/   config e migrações; supabase/legacy/ é referência, não migração
```

## Invariantes

Quatro regras que o código não pode violar. Estão detalhadas em
[`docs/01-ARQUITETURA.md`](docs/01-ARQUITETURA.md).

- **I-1** — nenhum segredo no frontend. Só a chave publishable; o que protege o
  dado é a RLS.
- **I-2** — toda linha pertence a uma organização. RLS `ENABLE` e `FORCE`.
- **I-3** — o n8n orquestra, não decide. Regra de negócio mora em Edge Function.
- **I-4** — nenhum efeito externo sem chave de idempotência gravada antes da
  chamada.

## Documentação

O índice está em [`docs/README.md`](docs/README.md). Os pontos de entrada:

| | |
|---|---|
| [`01-ARQUITETURA.md`](docs/01-ARQUITETURA.md) | visão, invariantes, módulos, telas |
| [`02-MODELO-DE-DADOS.md`](docs/02-MODELO-DE-DADOS.md) | ~62 tabelas de DDL |
| [`09-ROADMAP-E-ACEITE.md`](docs/09-ROADMAP-E-ACEITE.md) | as 24 fases |
| [`10-DECISOES-ARQUITETURAIS-ADR.md`](docs/10-DECISOES-ARQUITETURAIS-ADR.md) | ADRs |
| [`14-GERACAO-DE-ARTE-E-AUTOMACAO.md`](docs/14-GERACAO-DE-ARTE-E-AUTOMACAO.md) | por que a arte é composta por template, não gerada por modelo |
| [`15-REVERSAO-ADR-001-INFRAESTRUTURA.md`](docs/15-REVERSAO-ADR-001-INFRAESTRUTURA.md) | por que este repositório existe |

## Relação com o Centro de Custos Inteligente

Produtos distintos. O Centro de Custos vive em outro repositório, sobre um
Supabase gerenciado pela Lovable que não pertence à organização da Keystone. O
Growth OS não herda nada dele: o módulo Cost Intelligence é portado, e os dados
migram para cá na FASE 2.

Portal Crimson e a Controladoria da Oficial Farma são produtos de outra empresa
e não têm relação com este repositório.
