# `supabase/legacy/` — referência, não migração

O arquivo desta pasta **não é uma migração deste projeto** e não deve ser
aplicado. Ele está aqui como registro do esquema de origem, para que a migração
real da FASE 2 seja derivada dele sem depender de acesso ao projeto antigo.

## `centro-de-custos-20260327.sql`

Esquema do produto **Centro de Custos Inteligente**, que roda num projeto
Supabase gerenciado pela Lovable (`hlvkkziiaeyqyenekdck`), fora da organização
da Keystone. É a origem dos dados que o módulo Cost Intelligence recebe quando
migrar para cá.

### Por que ele não pode ser aplicado como está

Contém o achado **C-01** da auditoria da FASE 0:

```sql
CREATE POLICY "Anon can read financial entries"   ... TO anon USING (true);
CREATE POLICY "Anon can insert financial entries" ... TO anon WITH CHECK (true);
CREATE POLICY "Anon can delete financial entries" ... TO anon USING (true);
```

RLS habilitada, mas com política que concede leitura, escrita e **exclusão** ao
papel `anon` sobre a tabela inteira. Como a chave publishable vai no bundle do
frontend por natureza, isso equivale a expor os lançamentos financeiros de
clientes a qualquer visitante — inclusive o `DELETE`, sem soft delete e sem
backup configurado.

Faltam também: `organization_id`, `updated_at`, `deleted_at`, e `FORCE ROW LEVEL
SECURITY`.

### O que a FASE 2 faz com ele

A tabela renasce aqui multi-tenant desde a primeira linha — `organization_id`
obrigatório, política sobre `app.current_org_ids()`, `ENABLE` **e** `FORCE`.
Os dados entram por carga única, com o `organization_id` atribuído na
importação. O C-01 morre na migração: não há política `anon` para herdar.

**Enquanto a aplicação antiga continuar no ar**, porém, o C-01 segue explorável
lá — duplicar o dado aqui não fecha o buraco de lá. Ver
`docs/15-REVERSAO-ADR-001-INFRAESTRUTURA.md`.
