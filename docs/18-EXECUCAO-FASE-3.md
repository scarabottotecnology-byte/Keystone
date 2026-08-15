# 18 — Execução da FASE 3 (concluída)

Registro do que foi construído na FASE 3 — Command Center. Segue os STEPs 11
e 12 do método (DOCUMENT e REPORT) do documento 09.

**Status:** completa. Command Center é o primeiro módulo de negócio ativo do
produto — `src/modules/` deixou de estar vazio.

---

## Nota de projeto que governa a fase inteira

Os seis componentes do Growth Score (Content, Leads, Prospecting, Pipeline,
Conversion, Revenue — documento 06 §5) dependem de tabelas que ainda não
existem: conteúdo nasce na FASE 5, leads na 10, prospecção na 12,
pipeline/conversão/receita na 17. Por isso quase todo número desta fase
chega vazio — e isso é o resultado correto, não um defeito. A tela precisa
explicar o que vai mostrar quando houver dado, nunca fingir com zero.

O `no-masking-fallback` (FASE 2) e este princípio são a mesma ideia em dois
lugares: um é regra de lint contra `a || 0`, o outro é o contrato da API —
`rpc_command_center()` devolve `null` para todo componente sem fonte, nunca
`0`.

## Migração `command_center_growth_score` (subtarefas 1–4)

`growth_score_config` — uma linha por organização, peso e meta por
componente, editável só por owner/admin. Os pesos padrão são os do
documento 06 §5 (15/15/15/20/15/20). Provisionada para a Keystone no mesmo
padrão de bootstrap da FASE 2.

`growth_score_snapshots` — snapshot diário; um score isolado não informa
nada, o que informa é a tendência. `components` em `jsonb`, mesmo padrão de
`audit_log.before`/`after`. Sem `UPDATE`/`DELETE`, de propósito: é registro
histórico. Não há automação escrevendo aqui ainda nesta fase — a política
existe para quando o primeiro componente ganhar dado real.

`rpc_command_center()` — `SECURITY INVOKER` (não `DEFINER`: a RLS de
`growth_score_config`/`growth_score_snapshots` precisa continuar valendo
dentro da função — uma agregação `DEFINER` vazaria dado entre organizações,
achado C-01 com outro nome), `STABLE`, devolve um único `jsonb` com pesos,
metas, bruto (tudo `null` hoje) e os dois snapshots mais recentes. Uma
chamada de rede só — critério de aceite da fase.

`rpc_next_best_actions()` — mesma assinatura de segurança, devolve `[]`
hoje. A matemática vem do banco; a IA só escreve a justificativa depois
(FASE 19).

## Achado durante a construção: `anon` executava as duas RPCs

`revoke all on function rpc_command_center() from public` não bastou.
Descoberto ao verificar `has_function_privilege('anon', ..., 'EXECUTE')`
diretamente contra o catálogo: o schema `public` deste projeto tem um
privilégio padrão (`pg_default_acl`, role `postgres`) que concede `EXECUTE`
a `anon` **diretamente** em toda função nova criada em `public` — não
herdado de `PUBLIC`, então revogar de `PUBLIC` não o atinge. As funções em
`app` (`current_org_ids`, `is_org_admin`, da FASE 2) não têm esse privilégio
padrão — só as de `public`.

Consequência prática: `anon` conseguia *chamar* `rpc_command_center()` —
confirmado empiricamente antes da correção, a chamada executava e caía no
`raise exception` interno da função por falta de vínculo, em vez de barrar
no próprio `GRANT`. RLS habilitada dando aparência de proteção enquanto o
privilégio real está solto por outro caminho é exatamente a classe do
achado C-01 — só que em função, não em tabela.

**Corrigido** com uma segunda migração,
`command_center_revoke_anon_execute`, revogando `EXECUTE` de `anon`
explicitamente por role. **Generalizado** na suíte pgTAP: uma nova asserção
de catálogo confirma que nenhuma função de `public`, presente ou futura,
concede `EXECUTE` a `anon` — para que este achado não dependa de alguém
lembrar do `revoke` correto a cada RPC nova.

## `growthScore.ts` — cálculo puro, testado (subtarefa 8)

`rpc_command_center()` já faz a agregação real no Postgres. O que sobra —
aplicar peso e normalizar bruto contra meta — é aritmética sobre seis
escalares já agregados, não a "agregação no cliente" que o critério de
aceite proíbe (isso é sobre somar linha crua, não multiplicar seis números).

Isolado porque é fórmula, não porque é caro: uma ponderação errada não
lança exceção, produz um número plausível e errado — mesma classe de risco
que motivou testar `deriveIdempotencyKey` à parte na FASE 1.

Decisão central: o **total** fica `null` a menos que os **seis** componentes
tenham dado. Um score parcial pareceria uma nota real, calculada sobre uma
base que muda de fase em fase — subiria ou desceria pela cobertura, não pelo
desempenho. Componentes individuais que já têm dado aparecem normalmente; só
o composto espera todos.

10 testes cobrindo: normalização exata na meta, abaixo da meta, saturação em
100 quando o bruto ultrapassa a meta (nunca 150), componente sem bruto,
componente sem meta, meta zero/negativa tratada como indisponível (não como
divisão por zero disfarçada), total `null` com um único componente faltando
entre seis, ponderação correta com os seis presentes, lista vazia, soma de
pesos diferente de 100.

## Command Center (subtarefas 5–7)

`src/modules/command-center/` — primeiro diretório de módulo de negócio.
`CommandCenterPage`, `GrowthScoreCard`, `KpiTiles`, `NextBestActionsCard`,
`AiGrowthInsightCard`, `useCommandCenter`/`useNextBestActions`.

Duas ausências diferentes, duas mensagens diferentes:

- **Next Best Action**: a consulta já existe (`rpc_next_best_actions`), só
  não tem fonte — estado vazio no padrão `QueryState` do resto do produto,
  explicando que a lista passa a priorizar de verdade a partir da FASE 10.
- **AI Growth Insight**: não é "sem dado", é "a análise não existe ainda" —
  depende do agente A9 (FASE 19). Usa `PendingSection`, promovido de
  `src/app/settings/` para `src/components/shared/` nesta fase, porque deixou
  de ser específico de uma tela: é o mesmo padrão do `ModulePlaceholder`, em
  escala de seção, reutilizável por qualquer tela ativa incompleta.

Cada um dos seis componentes do Growth Score, quando indisponível, mostra
"sem dado — fase N" com a fase real que o desbloqueia (Content → 5, Leads →
10, Prospecting → 12, Pipeline/Conversion/Revenue → 17) — não um rótulo
genérico.

## Verificação

| | |
|---|---|
| Typecheck | limpo |
| Lint | 0 erros, 9 avisos (mesmos de sempre) |
| Testes | 95 passando (10 novos de `growthScore.ts`) |
| Build | ✓ · bundle 769 kB (225 kB gzip) |
| `get_advisors(security)` | zero lints, contra o projeto remoto |
| RPCs | verificadas por chamada direta contra o banco remoto, como usuário autenticado (dentro de transação revertida) — payload confere com o tipo TypeScript |
| `anon` × RPCs | verificado por catálogo (`has_function_privilege`) e por chamada real — `permission denied`, não mais o erro interno da função |
| pgTAP | suíte estendida para 23 asserções (7 tabelas, duas RPCs, catálogo de função); cada uma verificada manualmente contra o banco remoto antes de commitar, mesma disciplina da FASE 2 |
| Navegador | `/` protegido redireciona para `/entrar` sem sessão, console sem erro (Chromium headless); renderização com dado real não verificada nesta sessão — o proxy de saída da sandbox bloqueia HTTPS direto a `*.supabase.co`, mesma limitação documentada na FASE 2 |

---

## Pendente

Nada desta fase ficou pendente — as nove subtarefas do documento 12 (FASE 3)
estão cobertas: 1–4 na migração, 5–7 na tela, 8 nos testes do
`growthScore.ts`, 9 na verificação acima (orçamento de performance não
cronometrado com dado de produção porque não há dado de produção ainda —
critério fica naturalmente reavaliado quando a FASE 17 preencher a última
origem).

O achado do `anon` executando RPCs por privilégio padrão do schema é um
lembrete estrutural para toda fase daqui pra frente: **toda função nova em
`public` precisa de `revoke execute ... from anon` explícito**, e a suíte
pgTAP agora falha sozinha se alguém esquecer.
