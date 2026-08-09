# 08 — Observabilidade e Testes

Cobre os itens 17 e 18 da seção 66.

---

## §1. Princípios de observabilidade

**O1 — Nenhuma automação falha silenciosamente** (seção 15). Toda execução tem
início, fim, status e destino em caso de falha. Um workflow que "simplesmente não
rodou" precisa ser detectável sem alguém perceber que faltou um post.

**O2 — Todo evento carrega `correlation_id`.** Um identificador reconstrói a
cadeia inteira entre n8n, Edge Function, provedor externo, LLM e banco.

**O3 — Logs não contêm segredo nem PII desnecessária.** Redação por função
compartilhada, coberta por teste.

**O4 — Log é para diagnóstico, não para contabilidade.** Métrica de negócio vive
em tabela de negócio. `automation_logs` é purgado em 90 dias; `social_posts` não.

**O5 — Erro agregado, não enfileirado.** `error_logs` agrupa por `stack_hash` com
contador. Mil ocorrências do mesmo erro são uma linha com `occurrences = 1000`.

---

## §2. As quatro tabelas de log

| Tabela | Pergunta que responde | Retenção |
|---|---|---|
| `automation_runs` | A automação rodou? Quando? Deu certo? | 12 meses |
| `automation_logs` | O que aconteceu passo a passo dentro dela? | 90 dias |
| `integration_logs` | O que o provedor externo respondeu? | 180 dias |
| `error_logs` | O que está quebrado agora e há quanto tempo? | 12 meses após resolvido |

`ai_invocations` complementa como log de custo e comportamento de IA (24 meses).

### Níveis

`debug` (só em dev) · `info` (marco de passo) · `warn` (degradação, seguiu
adiante) · `error` (operação falhou) · `critical` (dado em risco ou sistema
parado).

`warn` é o nível que mais importa e o mais negligenciado: é onde aparece "token
expira em 3 dias", "quality rating caiu", "custo de IA em 80% do orçamento" —
sinais que evitam o incidente em vez de descrevê-lo depois.

---

## §3. Métricas e alertas

### Saúde operacional

| Métrica | Fonte | Alerta |
|---|---|---|
| Taxa de sucesso por automação | `automation_runs` | < 95% em 24 h |
| Run travado | `status='running'` além do esperado | > 30 min |
| Jobs de publicação falhados | `publishing_jobs` | qualquer `failed` após esgotar tentativas |
| Tokens expirando | `social_accounts.token_expires_at` | < 7 dias |
| Erro de integração | `integration_logs` | > 10% de erro em 1 h |
| Custo de IA | `ai_usage_daily` | > 80% do orçamento diário |
| Quality rating WhatsApp | `whatsapp_accounts` | queda de nível |
| Entregabilidade de e-mail | `email_messages` | bounce > 3% ou reclamação > 0,1% |
| Erro novo | `error_logs` | primeiro `stack_hash` inédito com severity high |
| Fila de aprovação parada | `content_assets` em `review` | > 48 h |

Bounce acima de 3% e reclamação acima de 0,1% são os limiares em que provedores
de e-mail começam a agir contra o remetente. Alertar depois disso é tarde: a
reputação do domínio já caiu e leva semanas para se recuperar.

### Canais

WF-014 avalia as condições a cada 10 minutos. `critical` e `high` vão para
notificação imediata (e-mail e, futuramente, WhatsApp interno); `medium` entra no
digest diário; tudo aparece em `/automations`.

### Saúde de produto

Acompanhadas no Command Center, não como alerta: Growth Score e componentes,
leads por canal, taxa de resposta de outreach, conversão por estágio, pipeline
criado, receita atribuída, Content ROI, custo de IA por lead e por oportunidade.

---

## §4. Estratégia de testes

Distribuição alvo — deliberadamente pesada na base e na camada de banco, porque é
onde vivem os riscos deste sistema (dinheiro, isolamento de dados, duplicação de
efeito externo).

```
        ╱ E2E (Playwright) ╲          ~10 fluxos críticos
      ╱─────────────────────╲
    ╱  Integração (Vitest)   ╲        Edge Functions com provedor mockado
  ╱───────────────────────────╲
 ╱   Banco (pgTAP)             ╲      RLS, constraints, RPCs
╱───────────────────────────────╲
       Unitário (Vitest)          Lógica pura: scoring, atribuição, datas
```

### 4.1 Unitário

Alvo: funções puras, sem I/O. Onde está o risco real:

- `excelSerialToDate` e o parsing de data brasileira — **três commits de
  correção no histórico** e nenhum teste. Casos: serial de Excel, `DD/MM/YYYY`,
  `YYYY-MM-DD`, número que não é data (achado H-05), vazio, nulo, texto.
- Parsing de valor monetário: `1.234,56` × `1,234.56`, negativo entre
  parênteses, símbolo de moeda, vazio.
- Cálculo de ICP Score, incluindo o caso de critério ausente e a normalização
  por cobertura (`03 §3.5`).
- Distribuição de atribuição nos quatro modelos — a soma das parcelas precisa
  fechar exatamente o valor da oportunidade.
- Growth Score e normalização.
- Geração de chave de idempotência: determinística para a mesma entrada,
  diferente para entradas distintas.
- `autoMapFields` do import.

Meta: ≥ 80% de cobertura em `src/lib/` e nos utilitários compartilhados de Edge
Function. Cobertura global não é meta — cobrir JSX de layout não previne nada.

### 4.2 Banco (pgTAP)

A camada que a maioria dos projetos pula e que aqui é obrigatória, porque o
achado C-01 é exatamente uma falha desta natureza.

**Isolamento de tenant** — para cada tabela de negócio:

```
usuário da org A não faz SELECT em linha da org B
usuário da org A não faz UPDATE em linha da org B
usuário da org A não faz DELETE em linha da org B
usuário da org A não INSERE linha com organization_id da org B
usuário da org A não muda organization_id da própria linha para a org B
anon não lê, não escreve, não apaga em nenhuma tabela de negócio
```

O último caso é regressão direta do C-01 e roda em toda execução de CI, para
sempre.

**Outros invariantes de banco:** unicidade que sustenta idempotência; FK da
cadeia de atribuição; enum recusando valor inválido; RPCs devolvendo apenas dados
da organização do chamador; `app.match_knowledge` não retornando chunk de outra
organização.

Um teste que gera essa matriz automaticamente a partir do catálogo
(`information_schema`) é preferível a uma lista escrita à mão — assim uma tabela
nova sem política **falha o CI por omissão**, em vez de passar despercebida. Este
é o mecanismo que impede o C-01 de acontecer de novo.

### 4.3 Integração

Edge Functions com provedor externo mockado por fixture gravada de resposta real.
**Nenhuma chamada a API externa em CI** — flaky, custa dinheiro e, no caso de
outreach, enviaria mensagem de verdade.

Cenários obrigatórios por função com efeito externo:

- Caminho feliz.
- **Idempotência:** executar duas vezes produz um efeito e um registro.
- **Concorrência:** dois workers disputando o mesmo job → um vence.
- Erro `429` → reagenda respeitando `Retry-After`, não conta tentativa.
- Erro `5xx` → retry com backoff; esgotado → `failed` + `error_logs`.
- Timeout → **não** republica cegamente; verifica antes (`04 §3`).
- Token expirado → conta marcada, jobs pausados, alerta.
- Supressão: contato em `suppression_list` nunca recebe mensagem.
- Fora da janela de 24 h do WhatsApp → só template aprovado.
- Saída de LLM inválida contra schema → retentativa e depois erro; nada gravado.
- Redação de log: payload com credencial sai redigido.

### 4.4 E2E (Playwright)

Já configurado no repositório, sem specs. Fluxos que justificam o custo:

1. Login → seleção de organização → Command Center carrega
2. Import de planilha: upload → mapeamento → preview → confirmação
3. **Reimport do mesmo arquivo → nenhuma duplicata** (H-03)
4. Criar ideia → gerar peça → revisar → aprovar → agendar
5. Calendário: mover peça entre datas
6. Criar ICP → simular score → listar prospects
7. Criar campanha → sequência → aprovar → verificar fila
8. Inbox: assumir conversa → IA muda para `assist`
9. Pipeline: arrastar card → histórico registrado
10. Executar recomendação da IA → efeito verificável

### 4.5 CI (a criar na FASE 1)

```
pull request:
  lint · typecheck · unit · build
  db: migrações em banco efêmero → pgTAP
  integração (provedores mockados)
  bloqueio de merge se qualquer etapa falhar

main:
  tudo acima + E2E em ambiente de preview
  advisors de segurança do Supabase
```

O gate de PR é o que dá sentido à `Definição de COMPLETE` em `09 §3`. Sem CI, "a
fase está testada" é declaração de boa intenção.

---

## §5. Tratamento de erro

**Nunca:** `catch` vazio, `catch` que só faz `console.log`, `Promise` sem
tratamento, erro genérico que perde a causa, mensagem de erro técnica exposta ao
usuário final.

**Sempre:** erro tipado com código, `correlation_id` na resposta, mensagem
acionável na UI, detalhe técnico em `error_logs`.

```ts
type AppError = {
  code: string;            // 'LINKEDIN_TOKEN_EXPIRED'
  message: string;         // seguro para o usuário
  retryable: boolean;
  correlationId: string;
  cause?: unknown;         // só em log
};
```

Falha de integração degrada o módulo afetado e nada mais (seção 54). LinkedIn
fora do ar significa jobs de LinkedIn em `failed` com retry — o Instagram
publica, o outreach envia, o CRM funciona, o Command Center carrega. Isso é
verificado por teste de integração que simula indisponibilidade total de um
provedor e afirma que os demais fluxos seguem verdes.
