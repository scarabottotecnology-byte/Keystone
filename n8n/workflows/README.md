# Workflows n8n — exportados e versionados

Cada workflow que roda em produção existe aqui como JSON, exportado do n8n.
Um workflow que só existe na instância é um ponto único de falha sem
backup — a mesma razão do documento 20, subtarefa 3, aplicada desde já ao
primeiro workflow que a FASE 4 precisa.

**Nenhum segredo neste diretório.** Toda credencial (o `x-automation-secret`
que autentica contra as Edge Functions disparadas por automação) vive no
cofre de credenciais do n8n, referenciada por nome — nunca por valor.

## WF-015 — Market Intelligence

`WF-015-market-intelligence.json`. Cron `0 6 * * 1-5` (dias úteis, fuso
`America/Sao_Paulo`), chama a Edge Function `market-intelligence` (Agente
A1) via `POST`, com `x-automation-secret` da credencial `httpHeaderAuth` e
um `x-correlation-id` gerado no próprio workflow.

**Não segue ainda o padrão universal do documento 04 §1** (`CRON →
automation-dispatch (abre run) → endpoint do domínio → automation-dispatch
(fecha run)`) — `automation-dispatch` é entrega da FASE 20, que ainda não
chegou. Em vez de bloquear a FASE 4 esperando por infraestrutura de uma
fase muito mais à frente, `market-intelligence` abre e fecha a própria
linha em `automation_runs` diretamente. O resultado observável é o mesmo —
toda execução fica registrada, com contadores e resumo de erro —, só a
divisão de responsabilidade entre workflow e função é mais simples do que
o padrão final. **Quando a FASE 20 construir `automation-dispatch`**, este
workflow (e a função `market-intelligence`) devem ser revisados para
delegar a ele, junto com todos os outros catorze workflows do catálogo.

**Não verificado numa instância n8n real** — nenhuma instância está
conectada a este projeto ainda. A estrutura do JSON segue o formato de
exportação padrão do n8n pelo que está documentado publicamente, mas não
foi importada e executada de ponta a ponta. Mesma ressalva já registrada
para o job `database` do CI (FASE 2) e para os agentes A1/A2 em si (FASE 4)
— construído e revisado, verificação de execução real pendente do sistema
externo existir.

## Antes de ligar de verdade

1. Configurar `ANTHROPIC_API_KEY` como Edge Function secret no Supabase
   (`supabase secrets set`) — sem ela, `market-intelligence` responde
   `misconfigured` corretamente, não simula uma resposta.
2. Configurar `AUTOMATION_WEBHOOK_SECRET` como Edge Function secret, e a
   mesma string como credencial `httpHeaderAuth` no n8n.
3. Cadastrar ao menos uma linha em `market_intelligence_sources` com
   `is_active = true` — sem fonte, a execução termina `succeeded` com
   `items_processed: 0`, não gera insight nenhum (comportamento correto,
   não um bug).
4. Importar este JSON numa instância n8n real e confirmar a execução
   manual antes de habilitar o cron — mesma disciplina de "todo workflow
   nasce desabilitado" do documento 20, subtarefa 4, aplicada por
   antecipação.

---

## WF-002 — Daily Publishing (FASE 6)

`WF-002-daily-publishing.json`. Cron a cada **15 minutos**, não uma vez por
dia: o horário fino de cada publicação vive em `content_calendar`, e o
workflow só pergunta se há job vencido e não travado. É isso que torna a
recuperação de falha automática — um job que falhou às 09:00 é retentado às
09:15, sem ninguém reenfileirar à mão.

**Um timeout aqui não deve virar retentativa do workflow.** A função
`social-publish` já trata timeout por dentro: consulta o LinkedIn para
verificar se o post existe antes de qualquer republicação, e manda o job
para revisão humana quando não consegue nem verificar. Repetir a chamada
por cima disso reintroduziria exatamente o risco de publicação duplicada
que a função existe para evitar. Por isso o nó HTTP tem timeout generoso
(120s, para uma leva de até 5 jobs) e nenhuma política de retry própria.

Mesma convenção do WF-015: nenhum segredo no arquivo, o header
`x-automation-secret` vem da credencial nomeada do n8n.

### Antes de ligar o WF-002

1. Deployar `social-publish` (ainda não enviada ao projeto remoto — ver
   docs/21-EXECUCAO-FASE-6.md).
2. `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`, `LINKEDIN_REDIRECT_URI`,
   `LINKEDIN_API_VERSION`, `OAUTH_STATE_SECRET` e `APP_URL` como Edge
   Function secrets.
3. Aprovação do **Community Management API** do LinkedIn para o app — sem
   ela nenhuma publicação sai, e o documento 12 prevê o modo assistido como
   degradação declarada, não como mock.
4. Conectar a página da empresa em `/social` e confirmar que a conta
   aparece como `connected`.
5. Ter ao menos uma peça `approved` com job agendado — o worker recusa
   publicar peça que não passou pela aprovação.
