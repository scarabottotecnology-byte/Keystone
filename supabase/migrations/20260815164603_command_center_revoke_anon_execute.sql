-- Correção — achado durante a construção da FASE 3, não erro de produção.
--
-- `revoke all on function ... from public` na migração anterior não bastou:
-- o schema `public` deste projeto tem um privilégio padrão (`pg_default_acl`,
-- role `postgres`) que concede EXECUTE a `anon` diretamente em toda função
-- nova criada em `public` — não é herdado de `PUBLIC`, então revogar de
-- `PUBLIC` não o atinge. Confirmado por consulta direta:
--
--   select has_function_privilege('anon', 'rpc_command_center()', 'EXECUTE');
--   -- true, mesmo depois do revoke from public
--
-- As funções em `app` (current_org_ids, is_org_admin) não têm esse privilégio
-- padrão — só as de `public`. Toda função `public` futura precisa deste
-- revoke explícito por role, não só `revoke ... from public`.
revoke execute on function rpc_command_center() from anon;
revoke execute on function rpc_next_best_actions() from anon;
