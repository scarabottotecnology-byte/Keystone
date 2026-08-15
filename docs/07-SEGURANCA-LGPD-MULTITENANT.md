# 07 — Segurança, LGPD e isolamento de acesso

Cobre os itens 14, 15 e 16 da seção 66.

> **Contexto:** o achado **C-01** da auditoria mostra que o banco atual é
> legível, gravável e deletável por qualquer pessoa na internet. Este documento
> descreve o estado-alvo. A FASE 2 é a que fecha essa falha, e por isso nenhuma
> fase posterior pode ser iniciada antes dela.

---

## §1. Modelo de ameaça

Quem estamos defendendo, contra quem, e por quê.

| Ativo | Ameaça | Controle |
|---|---|---|
| Lançamentos financeiros de clientes | Leitura anônima (**ativa hoje**) | RLS por tenant + auth obrigatória |
| Tokens OAuth de redes sociais | Vazamento → publicação em nome do cliente | Schema `private` + Vault, nunca no cliente |
| Chaves de LLM | Vazamento → custo e abuso | Somente em Edge Function |
| Dados pessoais de contatos | Vazamento, uso indevido | Minimização, RLS, hash, retenção |
| Base de conhecimento | Vazamento entre organizações | RLS + `SECURITY INVOKER` na busca vetorial |
| Endpoint público de leads | Injeção, spam, enumeração | Token por org, `zod`, rate limit, honeypot |
| Motor de outreach | Uso como ferramenta de spam | Cap, opt-out, consentimento, auditoria |
| Ambiente n8n | Comprometimento → acesso total | Token escopado, sem acesso direto ao banco |

O item mais desconfortável é o último da lista de ativos: **o próprio sistema é
uma arma potencial**. Um motor de outreach com IA e dados de empresas é, sem
controles, uma máquina de spam. Os limites descritos em `§5` não são
conformidade decorativa — são o que separa este produto de um risco reputacional
para a Keystone.

---

## §2. Escopo por organização e RLS

### Modelo

`organizations` ← `memberships` → `auth.users`. Toda tabela de negócio carrega
`organization_id NOT NULL`. Não existe dado de cliente fora de uma organização.

### A função de resolução

```sql
create or replace function app.current_org_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public, app
as $$
  select organization_id
    from public.memberships
   where user_id = auth.uid()
     and status = 'active'
$$;

revoke all on function app.current_org_ids() from public;
grant execute on function app.current_org_ids() to authenticated;
```

**Por que `SECURITY DEFINER` aqui.** A política de RLS de `memberships` precisa
consultar `memberships`. Sem `SECURITY DEFINER`, isso é recursão infinita — erro
clássico de RLS no Postgres. A função roda com privilégio do dono e ignora a RLS
apenas nessa leitura específica, que é intencional e restrita.

**Por que `STABLE`.** Permite ao planejador avaliar a função uma vez por
statement em vez de por linha. Numa varredura de 100 mil linhas, a diferença é
entre uma consulta e cem mil.

**Por que `set search_path`.** Sem isso, uma função `SECURITY DEFINER` é
vulnerável a sequestro de search_path — um objeto malicioso num schema anterior
seria executado com privilégio elevado.

### Padrão de política

Aplicado a **toda** tabela de negócio, sem exceção:

```sql
alter table <t> enable row level security;
alter table <t> force row level security;   -- vale inclusive para o dono

create policy tenant_select on <t> for select to authenticated
  using (organization_id in (select app.current_org_ids()));

create policy tenant_insert on <t> for insert to authenticated
  with check (organization_id in (select app.current_org_ids()));

create policy tenant_update on <t> for update to authenticated
  using      (organization_id in (select app.current_org_ids()))
  with check (organization_id in (select app.current_org_ids()));

create policy tenant_delete on <t> for delete to authenticated
  using (organization_id in (select app.current_org_ids()));
```

`FORCE ROW LEVEL SECURITY` é deliberado: sem ele, o dono da tabela ignora as
políticas, o que transforma qualquer engano de conexão em vazamento total.

`UPDATE` precisa de `USING` **e** `WITH CHECK`. Só com `USING`, um usuário pode
alterar o `organization_id` de uma linha sua e transferi-la para outra
organização.

### Papéis (RBAC)

Autorização fina acima da RLS, verificada em Edge Function e refletida na UI:

| Papel | Pode |
|---|---|
| `owner` | Tudo, inclusive faturamento e exclusão da organização |
| `admin` | Configuração, integrações, membros, automações |
| `operator` | Operação diária: conteúdo, outreach, CRM, inbox |
| `analyst` | Leitura + criação de conteúdo; sem envio nem publicação |
| `viewer` | Somente leitura |

A distinção que importa é `analyst` × `operator`: **quem pode disparar efeito
externo** (publicar, enviar). RLS isola organizações; RBAC limita o que cada
pessoa faz dentro da sua.

### A regra, sem exceção

O papel `anon` não recebe `SELECT`, `INSERT`, `UPDATE` nem `DELETE` em nenhuma
tabela de negócio. A única superfície pública de escrita é `lead-capture`, que é
Edge Function com token próprio — não PostgREST.

### Ordem da FASE 2

O banco nasce vazio, então não há backfill nem convivência com política antiga —
a sequência delicada de migrar dado em produção enquanto se troca a segurança
embaixo não existe aqui. Sobra o essencial:

1. Criar `organizations`, `profiles`, `memberships` e `app.current_org_ids()`.
2. Criar a organização Keystone e vincular os usuários.
3. Criar as tabelas de negócio já com `organization_id NOT NULL`, `ENABLE` e
   `FORCE ROW LEVEL SECURITY`, e a política de tenancy desde a primeira linha.
4. Validar com o pacote de testes de RLS (`08 §4`) antes de liberar.

A regra que não se negocia: **nenhuma tabela é criada antes da política dela.**
Tabela que existe sem RLS, mesmo por uma migração, é uma janela aberta — e é
exatamente assim que nasce um C-01.

---

## §3. Gestão de segredos

### Regra

**Nenhum segredo no frontend.** O bundle contém apenas a URL do Supabase e a
publishable key — ambas públicas por design. Elas só são seguras porque a RLS
está correta; é exatamente essa premissa que está quebrada hoje.

### Tokens OAuth

```sql
create schema private;
revoke all on schema private from anon, authenticated;

create table private.oauth_tokens (
  ref              text primary key,      -- referenciado por social_accounts.token_ref
  organization_id  uuid not null,
  provider         text not null,
  access_token     text not null,
  refresh_token    text,
  expires_at       timestamptz,
  scopes           text[],
  created_at       timestamptz not null default now(),
  rotated_at       timestamptz
);
```

O schema `private` **não é exposto pelo PostgREST** (não consta em
`db.schemas`). Não há caminho pelo qual um cliente alcance esta tabela, mesmo com
JWT válido e mesmo se uma política for escrita errado. Acesso apenas por Edge
Function com `service_role`.

`social_accounts` — visível ao frontend — guarda `token_ref`, `status` e
`token_expires_at`. Suficiente para a UI mostrar saúde da conexão, inútil para
um atacante.

Rotação: WF-014 verifica `token_expires_at` diariamente; renova antecipadamente
quando o provedor permite refresh; alerta em `expiring` a 7 dias e marca
`expired` no vencimento, pausando os jobs da conta em vez de acumular falhas.

### Chaves de provedor

Chaves de LLM, e-mail e dados empresariais ficam em variável de ambiente de Edge
Function (Supabase secrets), nunca em tabela e nunca em `ai_providers.config` —
essa coluna guarda configuração, não credencial, e a distinção é verificada em
code review.

---

## §4. Validação, rate limiting e auditoria

**Validação.** `zod` na fronteira de toda Edge Function e em todo formulário.
Nada entra no banco sem schema. Corrige os achados **H-04** e **H-05**: o import
de planilha passa a validar tipo, faixa e formato antes de inserir, com formato
de data brasileira tratado explicitamente em vez de heurística sobre número.

**Rate limiting.** Por organização e por IP nos endpoints públicos; por
organização nas funções autenticadas. Contador em Postgres com janela
deslizante. `lead-capture` recebe o limite mais restritivo.

**Auditoria.** `audit_log` registra toda ação sensível — mudança de papel,
conexão e desconexão de conta, envio de outreach, mudança de estágio de
oportunidade, alteração de automação, exclusão de dado, exportação. Com
`before`/`after`, ator, `correlation_id` e hash de IP.

**Logs nunca contêm segredo.** `integration_logs.request_summary` grava método,
recurso, status e latência — não corpo completo, não header de autorização. O
scrubber é uma função compartilhada em `_shared/`, não uma lembrança de cada
desenvolvedor. Um teste verifica que payloads com chaves sensíveis saem
redigidos.

---

## §5. Antispam por construção

Controles que impedem o sistema de ser usado como ferramenta de spam (seções 25
e 65). Não são configuráveis para desligar.

| Controle | Implementação |
|---|---|
| Verificação de supressão antes de todo envio | Consulta obrigatória em `suppression_list` na função de envio |
| Opt-out em toda mensagem | Link/instrução obrigatória no template; validado na aprovação |
| Opt-out processado automaticamente | Webhook e detecção em resposta → `suppression_list` |
| Cap diário por campanha e por conta | `campaigns.daily_cap`, `email_accounts.daily_cap` |
| Respeito ao tier do WhatsApp | `whatsapp_accounts.messaging_tier` |
| Parada ao receber resposta | `campaign_steps.stop_on_reply` padrão `true` |
| Sem multiplicação de números para burlar limite | Não implementado, por decisão |
| Horário comercial | Verificado antes do envio, no fuso da organização |
| Base legal registrada | `consents.basis` obrigatório |
| Primeira abordagem exige aprovação | `approval_mode` padrão |

Nenhuma dessas verificações é responsabilidade do n8n. Todas vivem na Edge
Function de envio, ponto único e testável — um workflow mal configurado não
consegue contorná-las.

---

## §6. LGPD

### Dados tratados

| Categoria | Exemplo | Base legal |
|---|---|---|
| Contato profissional B2B | nome, cargo, e-mail corporativo | Legítimo interesse (art. 7º, IX) |
| Dado cadastral de PJ | CNPJ, razão social, CNAE | Dado público; PJ não é titular sob a LGPD |
| Lead que se cadastrou | formulário, material rico | Consentimento (art. 7º, I) |
| Conversa de WhatsApp | mensagens | Consentimento / execução de contrato |
| Usuários do sistema | e-mail, nome | Execução de contrato |

**Sobre legítimo interesse.** É base legal válida para prospecção B2B, mas
condicionada: exige finalidade legítima, necessidade, expectativa razoável do
titular e — o ponto que costuma ser ignorado — **teste de balanceamento
documentado** e direito de oposição efetivo. O sistema materializa isso em
`consents.basis`, no opt-out de um clique e em `suppression_list` perpétua. O
documento de balanceamento é entregável da FASE 21.

**O que não tratamos.** Sem dado pessoal sensível (art. 5º, II). Sem CPF. Sem
dado de menor. Sem contato pessoal (e-mail e telefone particulares) — apenas
profissional. `companies` guarda dado de pessoa jurídica; onde houver sócio
pessoa física no cadastro público, o campo **não é importado**.

### Minimização

Só se armazena o que tem uso definido. Concretamente: não guardamos o corpo
completo de resposta de API externa em log; `to_hash` em vez de e-mail em
`email_messages`; hash em `suppression_list`; hash de IP em `audit_log`.

### Direitos do titular

| Direito | Implementação | Prazo |
|---|---|---|
| Confirmação e acesso | `dsr-export` gera JSON com tudo ligado ao titular | 15 dias |
| Correção | Edição pela UI, registrada em `audit_log` | — |
| Eliminação | `dsr-erase`: apaga PII, mantém agregado e hash de supressão | 15 dias |
| Portabilidade | Export estruturado | 15 dias |
| Oposição | Opt-out imediato + supressão perpétua | imediato |
| Informação sobre compartilhamento | Registro de operadores no aviso de privacidade | — |

```sql
create table dsr_requests (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  subject_email   text not null,
  request_type    text not null,   -- access|erasure|correction|portability|objection
  status          text not null default 'received',
  requested_at    timestamptz not null default now(),
  due_at          timestamptz not null,
  completed_at    timestamptz,
  handled_by      uuid references auth.users(id),
  notes           text
);
```

**A eliminação preserva o opt-out.** Ao apagar um titular, os campos pessoais são
removidos, mas o registro em `suppression_list` (que é apenas hash) permanece.
Sem isso, o próximo ciclo de Company Discovery redescobriria a pessoa e a
contataria de novo — transformando um pedido de eliminação em causa de novo
contato indesejado. Este é o detalhe que mais frequentemente escapa em sistemas
de prospecção e é a razão de `suppression_list` ter sido modelada com hash desde
o início.

### Operadores

Supabase, provedor de LLM, provedor de e-mail, Meta/WhatsApp, provedor de dados
empresariais, hospedagem do n8n. Cada um listado no aviso de privacidade, com
verificação de transferência internacional e cláusulas contratuais. Registro de
operações de tratamento (ROPA) é entregável da FASE 21.

**Nota sobre LLM:** o contexto enviado ao provedor pode conter dado pessoal de
contatos. Exigências: contrato que vede treinamento com os dados enviados,
retenção zero ou mínima, e — quando o dado não for necessário para a tarefa —
pseudonimização antes do envio. A6 (Prospect Researcher) trabalha sobre dado de
PJ e sinais; não precisa de nome de pessoa e não o recebe.

---

## §7. Checklist de segurança por fase

Verificado ao encerrar cada fase; nenhuma fase é `COMPLETE` com item pendente.

- [ ] Toda tabela nova tem `organization_id NOT NULL`
- [ ] RLS habilitada **e** forçada
- [ ] As quatro políticas (select/insert/update/delete) existem
- [ ] Política de `UPDATE` tem `USING` **e** `WITH CHECK`
- [ ] Teste automatizado provando que a organização A não lê dados da B
- [ ] Nenhuma função de agregação é `SECURITY DEFINER` sem justificativa escrita
- [ ] `SECURITY DEFINER` existente tem `set search_path`
- [ ] Nenhum segredo em tabela do schema `public`
- [ ] Nenhum segredo no bundle do frontend
- [ ] Entrada validada com `zod` em toda Edge Function
- [ ] Logs sem credencial, sem corpo completo, sem PII desnecessária
- [ ] Ação sensível registrada em `audit_log`
- [ ] Endpoint público com rate limit
- [ ] Advisors de segurança do Supabase sem alerta aberto
