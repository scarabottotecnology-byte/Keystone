-- O schema `public` concede EXECUTE a `anon` por padrão em função nova (ver
-- `command_center_revoke_anon_execute.sql`), e `rls_anon.sql` falha o CI
-- quando isso acontece. As duas leituras do ciclo de engajamento são para
-- quem está logado.
revoke execute on function public.content_check(text, text, text, int, text) from public, anon;
revoke execute on function public.best_posting_slots(text, int) from public, anon;
grant execute on function public.content_check(text, text, text, int, text) to authenticated, service_role;
grant execute on function public.best_posting_slots(text, int) to authenticated, service_role;
