# Keystone Growth OS

O motor de marketing e prospecção da própria Keystone Controladoria.

**Ferramenta interna.** Não é produto, não será vendida nem licenciada. Existe
para uma coisa: maximizar o marketing e a geração de demanda da consultoria, com
o mínimo de tempo humano gasto nisso.

O objetivo central é este: **o sistema produz a peça inteira — copy, arte,
legenda, hashtags, alt text — agenda e publica, sem que ninguém suba imagem.**
A intervenção é opcional e acontece pela fila de publicação, escrevendo o que se
quer diferente; o sistema regera. Em volta disso está o resto do ciclo:
inteligência de mercado alimenta a pauta, o conteúdo publicado gera lead, o lead
vira prospect qualificado, o prospect entra no pipeline, e a receita fechada
volta como sinal de aprendizado para o que se publica amanhã.

Não é agendador de posts, e não é CRM com social pendurado. É um ciclo fechado
onde cada etapa alimenta a seguinte.

Ter um único usuário conhecido é vantagem de projeto: não há requisito
hipotético de mercado a acomodar. Cada decisão é tomada para uma consultoria de
controladoria brasileira, e só.

## Estado

**FASE 1 — Fundação técnica.** O que existe hoje é o esqueleto: design system,
registro de navegação, shell, seletor de tema e identidade visual. **Nenhum
módulo de negócio foi construído** — cada rota abre uma tela que declara em que
fase ela chega, em vez de simular funcionalidade com dado de exemplo.

O banco está vazio. O esquema nasce na FASE 2.

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
docs/            arquitetura (FASE 0) — o contrato do que se constrói
public/brand/    identidade para uso fora do produto: proposta, contrato, onboarding
src/app/         registro de navegação, tema, rotas
src/components/  shell, componentes compartilhados, shadcn/ui
src/modules/     um diretório por módulo de negócio, sem import cruzado
src/integrations/supabase/   cliente e tipos gerados
supabase/        config e migrações
```

## Invariantes

Quatro regras que o código não pode violar. Detalhadas em
[`docs/01-ARQUITETURA.md`](docs/01-ARQUITETURA.md).

- **I-1** — nenhum segredo no frontend. Só a chave publishable; o que protege o
  dado é a RLS.
- **I-2** — toda linha pertence a uma organização, e o acesso passa por RLS
  `ENABLE` **e** `FORCE`. Não é preparo para escala: é o que torna a política de
  segurança uniforme e revisável numa página.
- **I-3** — o n8n orquestra, não decide. Regra de negócio mora em Edge Function.
- **I-4** — nenhum efeito externo sem chave de idempotência gravada antes da
  chamada.

Há uma quinta regra, de produto, que atravessa tudo: **o sistema não inventa
dado.** Contato sem fonte verificável é marcado como desconhecido; métrica que a
plataforma não fornece aparece como indisponível, nunca como zero; número que
aparece numa arte precisa existir na copy.

## Documentação

Índice em [`docs/README.md`](docs/README.md). Pontos de entrada:

| | |
|---|---|
| [`01-ARQUITETURA.md`](docs/01-ARQUITETURA.md) | visão, invariantes, módulos, telas |
| [`02-MODELO-DE-DADOS.md`](docs/02-MODELO-DE-DADOS.md) | o esquema completo |
| [`05-AGENTES-DE-IA.md`](docs/05-AGENTES-DE-IA.md) | os agentes e seus guardrails |
| [`09-ROADMAP-E-ACEITE.md`](docs/09-ROADMAP-E-ACEITE.md) | as 24 fases |
| [`14-GERACAO-DE-ARTE-E-AUTOMACAO.md`](docs/14-GERACAO-DE-ARTE-E-AUTOMACAO.md) | como a arte é produzida sem designer no caminho |

## Escopo — o que este repositório não é

A Keystone tem outros produtos, e nenhum deles entra aqui:

- **Centro de Custos Inteligente** — ferramenta de controladoria, repositório e
  banco próprios. Não é módulo deste sistema.
- **Portal Crimson** e a **Controladoria da Oficial Farma** — produtos de outra
  empresa, sem relação alguma com este.

Este repositório é só o Growth OS.
