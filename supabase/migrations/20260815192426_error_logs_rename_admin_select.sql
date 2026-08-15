-- Correção de nomenclatura, achada na revisão da migração anterior.
--
-- `error_logs`' policy de SELECT foi criada como `tenant_select`, mas a
-- condição é `app.is_org_admin(organization_id)` — admin, não "qualquer
-- membro". Em toda outra tabela deste projeto, `tenant_select` significa
-- especificamente "qualquer membro ativo pode ler". Manter o nome como estava
-- teria enganado a próxima pessoa (ou a próxima sessão) lendo o catálogo.
alter policy tenant_select on error_logs rename to admin_select;
