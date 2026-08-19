-- Correção — achado do próprio advisor de segurança do Supabase logo após
-- aplicar `public_match_knowledge_wrapper.sql`: a função criada ali não
-- fixava `search_path`, ao contrário de toda outra função deste projeto
-- (`app.match_knowledge`, `app.is_org_operator` etc. sempre fixam). Sem
-- isso, um objeto malicioso num schema anterior no `search_path` do
-- chamador poderia ser resolvido no lugar do pretendido — a mesma classe de
-- risco documentada em `docs/07 §2` para `SECURITY DEFINER`, e boa prática
-- mesmo em `SECURITY INVOKER`.
alter function public.match_knowledge(uuid, extensions.vector, int, numeric)
  set search_path = public, extensions;
