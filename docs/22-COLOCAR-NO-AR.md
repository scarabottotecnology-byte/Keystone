# 22 — Colocar no ar

O que já está rodando, o que só você pode fazer, e uma decisão que precisa
ser sua antes de ligar a chave.

---

## ⚠️ Leia isto antes de configurar os segredos

Existem **três publicações reais na fila**, prontas para sair no LinkedIn
**pessoal do Jefferson Scarabotto** (não na página da empresa) dentro de até
15 minutos após você cadastrar os segredos:

| Peça | Estava agendada para |
|---|---|
| "Você vende bem e não sabe se lucra" | 24/08 |
| "Empresa lucrativa que quebra por falta de caixa" | 26/08 |
| "Rateio de custo indireto malfeito distorce tudo" | 28/08 |

As três são peças suas, com status `approved`, agendadas no calendário com
data já vencida. O robô faz exatamente o que foi construído para fazer:
publica o que está aprovado e venceu. Como as três venceram, saem **na mesma
leva** — três posts seguidos.

Se não for isso que você quer, cancele antes de configurar:

```sql
-- Cancela as três, mantendo o registro do que foi cancelado.
update publishing_jobs
   set status = 'cancelled',
       last_error = 'Cancelado manualmente antes da primeira execução'
 where status = 'pending';
```

E, se quiser reagendá-las para datas futuras em vez de cancelar, mexa em
`content_calendar.scheduled_for` e zere `enqueued_at` para o robô reavaliar.

---

## O que já está no ar, sem depender de você

| Peça | Estado | Verificado como |
|---|---|---|
| Banco, RLS, 50+ tabelas | rodando | advisors sem lint novo |
| 8 Edge Functions | `ACTIVE` | listadas no projeto |
| Agendador (pg_cron + pg_net) | **disparando** | chamadas às 22:30, 22:45, 23:00, 23:15 registradas em `net._http_response` |
| Ponte calendário → fila | funcionando | 11 asserções contra o banco real |
| Cliente do Buffer | pronto | queries validadas contra a API real |

O agendador roda `social-publish` a cada 15 minutos e `market-intelligence`
às 9h de São Paulo, de segunda a sexta. **Não existe n8n** — foi substituído
por `pg_cron` dentro do próprio Postgres, sem servidor a manter.

Hoje cada disparo recebe `500 misconfigured — Variável de ambiente ausente:
AUTOMATION_WEBHOOK_SECRET`. Isso é o comportamento correto: a função se
recusa a agir sem credencial, em vez de falhar em silêncio.

---

## O que só você pode fazer

### 1. Gerar a chave do Buffer

Em <https://publish.buffer.com/settings/api>, gere uma chave pessoal.

### 2. Ler o segredo de automação

Ele foi **gerado dentro do banco** e nunca passou por conversa, arquivo ou
log. Leia em: Supabase → Project Settings → Vault → `automation_webhook_secret`.

### 3. Cadastrar os segredos das Edge Functions

Supabase → Edge Functions → Secrets:

| Segredo | Onde conseguir | Sem ele |
|---|---|---|
| `AUTOMATION_WEBHOOK_SECRET` | Vault (passo 2) | o cron é recusado — **é o que trava tudo hoje** |
| `BUFFER_ACCESS_TOKEN` | passo 1 | nenhuma publicação sai |
| `ANTHROPIC_API_KEY` | console da Anthropic | A1/A2/A3/A4 não geram nada |
| `OPENAI_API_KEY` | console da OpenAI | a base de conhecimento não indexa (embeddings) |

Opcionais: `BUFFER_ORGANIZATION_ID` (só se sua conta do Buffer tiver mais de
uma organização — com uma só, é descoberto sozinho) e `APP_URL`.

Os quatro do LinkedIn direto (`LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`,
`LINKEDIN_REDIRECT_URI`, `LINKEDIN_API_VERSION`) **deixaram de ser
necessários**: o Buffer cobre a publicação. Eles só voltam a importar se um
dia você quiser publicar na página da empresa sem intermediário, o que exige
a aprovação do Community Management API.

### 4. Publicar a interface

O backend já roda sem interface. Para a tela ir ao ar:

1. Settings → Pages → Source: **GitHub Actions**
2. Settings → Secrets and variables → Actions → **Variables** → New:
   - `VITE_SUPABASE_URL` = `https://rplnjrqpzqznbxfascqs.supabase.co`
   - `VITE_SUPABASE_PUBLISHABLE_KEY` = a chave `sb_publishable_...`
3. Actions → "Publicar interface (GitHub Pages)" → Run workflow

As duas variáveis são públicas por natureza — vão no bundle e qualquer
visitante lê. Quem protege o dado é a RLS, não o sigilo delas. A
`service_role` nunca entra aí.

---

## Como conferir que funcionou

```sql
-- O cron está disparando e o que a função respondeu.
select id, status_code, left(content, 200) as resposta, created
  from net._http_response order by id desc limit 5;

-- O que está na fila e o que já saiu.
select status, count(*) from publishing_jobs group by status;
select headline, permalink, published_at from social_posts
  join content_assets on content_assets.id = social_posts.asset_id;
```

Uma publicação bem-sucedida grava `permalink`. Se vier nulo logo depois de
publicar, não é erro: o Buffer aceita e publica de forma assíncrona, e a URL
só existe quando a plataforma confirma. Nulo aqui significa "ainda não sei",
e é gravado como nulo — nunca como uma URL montada por dedução.

---

## O que ainda não existe

- **Prospecção automática** (FASES 10–14): não começou. É o Prospect Center
  do protótipo em `docs/prototipos/`.
- **Geração diária automática de peças**: o robô publica o que está aprovado,
  mas ninguém gera peça sozinho todo dia — falta a política de seleção, que
  nunca foi especificada.
- **Instagram**: o canal está cadastrado e o Buffer o cobre pelo mesmo
  contrato, mas post de imagem não está implementado (só texto). Publicar só
  texto no Instagram não funciona na prática.
- **Métricas** (FASE 8): `social_post_metrics` existe e está vazia. O Buffer
  expõe `aggregatedPostMetrics`, então a coleta ficou mais perto.
- **Renovação de token**: irrelevante no caminho do Buffer, que gerencia as
  autorizações. Continua pendente no caminho direto.
