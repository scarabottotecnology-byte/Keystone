-- Correção — achado ao verificar a migração anterior contra o banco remoto,
-- antes de qualquer deploy.
--
-- `docs/07 §3` especifica o schema `private` assim:
--
--     create schema private;
--     revoke all on schema private from anon, authenticated;
--
-- ...e para pelo objetivo (esconder do PostgREST), sem dizer quem *pode*
-- alcançar a tabela. Um `create schema` não concede USAGE a ninguém além do
-- dono, e `service_role` não é o dono — então o caminho legítimo descrito no
-- próprio documento ("acesso apenas por Edge Function com service_role")
-- estava fechado junto com o ilegítimo:
--
--     set local role service_role;
--     insert into private.oauth_tokens (...);
--     -- ERROR: 42501: permission denied for schema private
--
-- `oauth-callback` falharia na primeira gravação de token, em runtime, com
-- um erro que não aparece em nenhum teste de schema. Corrigido aqui: USAGE no
-- schema e privilégio de tabela apenas para `service_role`. `anon` e
-- `authenticated` continuam sem nada, e o schema segue fora do PostgREST — a
-- proteção é a mesma, agora com a porta de serviço de fato aberta.
grant usage on schema private to service_role;
grant select, insert, update, delete on private.oauth_tokens to service_role;

-- Privilégio padrão para qualquer tabela futura em `private`, para que a
-- próxima não repita o mesmo achado.
alter default privileges in schema private
  grant select, insert, update, delete on tables to service_role;
