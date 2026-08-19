-- FASE 5 · subtarefa 6 (preparação) — expõe `app.match_knowledge` para o
-- cliente supabase-js.
--
-- ACHADO ao começar `content-factory`: PostgREST (a API que `@supabase/
-- supabase-js` usa, tanto no frontend quanto nas Edge Functions) só expõe o
-- schema `public` por padrão — não há `db.schema` alternativo configurado
-- neste projeto (`supabase/config.toml` não declara nenhum). `app.
-- match_knowledge`, criada na migração `brand_and_knowledge_base.sql`, é
-- inalcançável por `caller.db.rpc(...)` como está: o schema `app` nunca foi
-- pensado para ser chamado direto por código de aplicação, só usado
-- internamente por política de RLS e trigger (`app.is_org_operator`,
-- `app.current_org_ids` etc.).
--
-- Mesmo problema, mesma solução já usada em `command_center_growth_score.sql`
-- para `rpc_command_center`/`rpc_next_best_actions`: um wrapper fino em
-- `public`, que só repassa para a função real em `app`. A lógica de
-- segurança (SECURITY INVOKER, filtro explícito por `p_organization_id`)
-- continua inteiramente em `app.match_knowledge` — este wrapper não duplica
-- nada, só expõe.
create or replace function public.match_knowledge(
  p_organization_id uuid,
  p_query_embedding extensions.vector(1536),
  p_limit int default 5,
  p_min_similarity numeric default 0.7
)
returns table (
  chunk_id        uuid,
  document_id     uuid,
  document_title  text,
  content         text,
  similarity      numeric
)
language sql
stable
security invoker
as $$
  select * from app.match_knowledge(p_organization_id, p_query_embedding, p_limit, p_min_similarity)
$$;

-- Mesmo achado da FASE 3 (`command_center_revoke_anon_execute.sql`): toda
-- função nova em `public` recebe EXECUTE automático de `anon` via
-- `pg_default_acl`, não herdado de `PUBLIC` — `revoke ... from public`
-- sozinho não bastaria. `app.*` não tem esse privilégio padrão; `public.*`
-- sempre tem, e precisa do revoke explícito por role todo vez.
revoke all on function public.match_knowledge(uuid, extensions.vector, int, numeric) from public;
revoke execute on function public.match_knowledge(uuid, extensions.vector, int, numeric) from anon;
grant execute on function public.match_knowledge(uuid, extensions.vector, int, numeric) to authenticated;
