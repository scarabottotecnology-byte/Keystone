# 04 — Workflows n8n

Cobre o item 11 da seção 66.

---

## §1. Papel do n8n na arquitetura

n8n é **orquestrador**, não motor de regra de negócio (invariante I-3).

| n8n faz | n8n não faz |
|---|---|
| Agendar por cron | Decidir o que publicar |
| Chamar Edge Function | Chamar API externa diretamente |
| Retry com backoff | Calcular score |
| Fan-out sobre lote | Montar prompt de IA |
| Propagar correlation ID | Escrever regra em nó de código |
| Alertar em falha | Guardar segredo de provedor |

**Por quê.** Regra de negócio dentro de workflow em JSON não tem teste unitário,
não passa por code review legível, não tem tipo e não sobrevive a uma eventual
troca de orquestrador. A mesma regra em TypeScript numa Edge Function tem as
quatro coisas. O custo dessa separação é um salto de rede por passo; o benefício
é que a lógica do produto permanece testável e portável.

**Padrão universal de todo workflow:**

```
CRON dispara
   → gera correlation_id (ULID)
   → POST /automation-dispatch  { definition_key, correlation_id, trigger:'schedule' }
        ↳ cria automation_runs (status=running)
   → POST <edge function do domínio>  (header X-Correlation-Id)
        ↳ a função faz o trabalho, escreve automation_logs e integration_logs
   → POST /automation-dispatch  { correlation_id, finish: {...} }
        ↳ fecha o run com status, contadores e resumo de erro
```

O n8n nunca escreve em tabela de negócio. Ele só conhece
`/automation-dispatch` e o endpoint do domínio.

### Credenciais

n8n autentica nas Edge Functions com um **token de serviço dedicado**, não com a
`service_role` key do Supabase. O token é escopado por função e revogável
isoladamente. n8n não tem acesso direto ao Postgres. Se o n8n for comprometido, o
raio de alcance é o conjunto de endpoints que ele pode chamar — não o banco
inteiro.

---

## §2. Catálogo de workflows

Horários no fuso `America/Sao_Paulo`, configuráveis por
`automation_definitions.schedule_cron` (seção 36).

| ID | Nome | Cron | Chama | Fase |
|---|---|---|---|---|
| WF-001 | Daily Content Generation | `0 7 * * 1-5` | `ai-gateway` via `content-generate` | 5 |
| WF-002 | Daily Publishing | `*/15 * * * *` | `social-publish` | 6 |
| WF-003 | Social Metrics Sync | `0 */6 * * *` | `social-metrics-sync` | 8 |
| WF-004 | AI Performance Analysis | `0 22 * * *` | `content-analyze` | 9 |
| WF-005 | Company Discovery | `0 9 * * 1-5` | `company-discovery` | 12 |
| WF-006 | Prospect Scoring | `0 10 * * 1-5` | `scoring-recompute` | 11 |
| WF-007 | Lead Capture (webhook) | — | `lead-capture` | 10 |
| WF-008 | Email Outreach | `0 11 * * 1-5` | `email-send` | 14 |
| WF-009 | WhatsApp Outreach | `0 11 * * 1-5` | `whatsapp-send` | 15 |
| WF-010 | Follow-up Sequences | `0 * * * *` | `outreach-advance` | 14 |
| WF-011 | Lead Qualification | evento | `lead-qualify` | 16 |
| WF-012 | CRM Synchronization | `*/30 * * * *` | `crm-sync` | 17 |
| WF-013 | Daily Growth Intelligence | `0 23 * * *` | `growth-strategist` | 19 |
| WF-014 | Error Monitoring | `*/10 * * * *` | `health-check` | 21 |
| WF-015 | Market Intelligence | `0 6 * * 1-5` | `market-intelligence` | 4 |

WF-015 não está na lista da seção 37 mas é exigido pela seção 36 (06:00 — Market
Intelligence). Acrescentado para que o Daily Growth Cycle fique completo.

### Notas de desenho por workflow

**WF-002 — Daily Publishing.** Roda a cada 15 minutos, não uma vez por dia. O
agendamento fino vive em `content_calendar.scheduled_for`; o workflow apenas
pergunta "há job vencido e não travado?". Isso permite horário arbitrário por
peça sem multiplicar crons, e faz a recuperação de falha ser automática — um job
que falhou às 08:00 é retentado às 08:15 sem intervenção.

**WF-003 — Social Metrics Sync.** A cada 6 h, com upsert em
`social_post_metrics` por `(post, dia)`. Métrica de rede social amadurece ao
longo de dias; coletar uma vez e parar subestima sistematicamente o alcance. A
janela de coleta é de 30 dias por post, depois cai para semanal.

**WF-005 — Company Discovery.** Roda antes do scoring (WF-006) e depois do
outreach do dia anterior, para que uma empresa descoberta hoje só seja abordada
amanhã — o que dá tempo de a pesquisa da IA e a revisão humana acontecerem.

**WF-010 — Follow-up.** De hora em hora, avalia `campaign_contacts` com
`state='active'` e `next_send_at <= now()`. Antes de qualquer envio, verifica na
ordem: resposta recebida → `suppression_list` → consentimento → `daily_cap` →
janela de horário comercial. Qualquer uma que falhe interrompe a sequência e
grava o motivo em `stopped_reason`.

**WF-013 — Daily Growth Intelligence.** Refresh das views materializadas,
recomputo do Growth Score, execução do AI Growth Strategist e geração das
recomendações do dia seguinte. É o workflow que faz o sistema "ficar melhor no
dia seguinte" (seção 72).

**WF-014 — Error Monitoring.** Não é opcional. Verifica a cada 10 minutos: runs
travados em `running` há mais tempo que o esperado, jobs em `failed` acima do
limiar, tokens expirando em menos de 7 dias, quality rating de WhatsApp em queda,
custo de IA acima do orçamento diário. Cada condição tem destino de alerta
definido. Isto implementa a seção 15: *"Nenhuma automação pode falhar
silenciosamente."*

---

## §3. Idempotência (seção 38)

Três mecanismos, aplicados em camadas.

### Camada 1 — Lock pessimista na reivindicação do job

```sql
update publishing_jobs
   set status = 'locked', locked_at = now(), locked_by = $worker, attempt = attempt + 1
 where id = $job_id
   and status in ('pending','failed')
   and (locked_at is null or locked_at < now() - interval '10 minutes')
returning *;
```

Zero linhas de retorno = outro worker pegou o job. Duas execuções concorrentes do
n8n não conseguem processar o mesmo job. O `locked_at` antigo libera jobs órfãos
de um worker que morreu.

### Camada 2 — Chave de idempotência antes da chamada externa

Chave determinística, derivada do conteúdo e não do relógio:

| Operação | Chave |
|---|---|
| Publicar | `sha256(asset_id : social_account_id : scheduled_for)` |
| Enviar e-mail | `sha256(campaign_contact_id : step_index)` |
| Enviar WhatsApp | `sha256(campaign_contact_id : step_index)` |
| Criar lead | `sha256(org : lower(email ?? phone))` |
| Criar oportunidade | `sha256(lead_id : pipeline_id)` |

O `insert … on conflict do nothing returning *` em `idempotency_keys` acontece
**antes** da chamada externa. Zero linhas = já foi feito; devolve o resultado
gravado e encerra.

### Camada 3 — Constraint natural como rede final

`social_posts (organization_id, idempotency_key)`,
`outreach_messages (organization_id, idempotency_key)`,
`leads (organization_id, dedupe_key)`,
`social_post_metrics (social_post_id, collected_for)`.

Mesmo que as camadas 1 e 2 falhem por bug, o banco recusa a duplicata. Defesa em
profundidade: a última camada é a que não depende de o código estar correto.

### A janela que nenhum mecanismo fecha

Se a API externa recebe a requisição e a resposta se perde no caminho, o sistema
não sabe se publicou. Tratamento explícito:

1. A chave de idempotência é gravada **antes** da chamada, com `result = null`.
2. Em timeout, o job vai para `status='running'` com `attempt` incrementado, **e
   não é retentado cegamente**.
3. O retry seguinte primeiro **consulta** a plataforma para verificar se o post
   existe (por conteúdo e janela de tempo). Só publica se não encontrar.
4. Se a verificação não for possível na plataforma, o job vai para revisão
   humana em vez de arriscar publicação dupla.

Publicar duas vezes na página de uma consultoria premium é um dano de marca que
não vale a conveniência de um retry automático.

---

## §4. Retry e backoff

| Classe de erro | Ação |
|---|---|
| `4xx` de validação (400, 422) | **Sem retry.** É bug nosso. `error_logs` + alerta. |
| `401` / `403` | Sem retry. Marca conta como `expired`/`revoked`, alerta o operador. |
| `429` | Reagenda respeitando `Retry-After`; não conta como tentativa. |
| `5xx` / timeout / rede | Backoff exponencial com jitter: 1, 2, 4, 8, 16 min. Máx. 5. |
| Esgotado | `status='failed'`, `error_logs` severity=high, alerta. |

Jitter é obrigatório: sem ele, N jobs que falharam juntos retornam juntos e
reproduzem a sobrecarga que causou a falha.

---

## §5. Correlation ID

Um ULID gerado no início de cada execução, propagado por toda a cadeia:

```
n8n (ULID)
  → X-Correlation-Id → Edge Function
      → automation_runs.correlation_id
      → automation_logs (via run_id)
      → integration_logs.correlation_id
      → ai_invocations.correlation_id
      → error_logs.correlation_id
      → lead_events.correlation_id
      → audit_log.correlation_id
```

Resultado prático: dada uma publicação que saiu errada, uma única consulta por
`correlation_id` reconstrói tudo — qual run, qual prompt, qual modelo, quanto
custou, qual resposta a plataforma devolveu, que erro ocorreu. Sem isso, depurar
automação distribuída é arqueologia.

ULID e não UUID v4 porque ULID é ordenável por tempo, o que torna a leitura de
log cronológica sem `JOIN` com timestamp.

---

## §6. Versionamento e ambientes

- Workflows exportados como JSON em `n8n/workflows/`, versionados no Git.
  Alteração feita na UI do n8n **precisa** ser exportada e commitada; um workflow
  que só existe na instância é um single point of failure sem backup.
- Ambientes separados (`dev`/`prod`) com credenciais distintas.
- Nenhum segredo no JSON exportado — apenas referências a credenciais do n8n.
  Revisão de diff no PR verifica isso.
- Todo workflow começa **desabilitado** (`automation_definitions.is_enabled =
  false`) e é ligado deliberadamente após validação em dev. Automação de outreach
  ligada por engano em produção envia mensagem real para pessoa real.
