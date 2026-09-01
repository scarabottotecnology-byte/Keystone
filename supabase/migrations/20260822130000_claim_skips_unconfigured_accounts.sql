-- O worker não reivindica o que não tem como publicar.
--
-- `claim_publishing_job` incrementa `attempt` ao reivindicar. Enquanto a
-- chave do Buffer não estiver cadastrada, cada passada do cron gastaria uma
-- tentativa de cada job — em pouco mais de uma hora a fila inteira estouraria
-- `max_attempts`. Pior: depois, com a chave no lugar, nada publicaria porque
-- os jobs já teriam `failed`, e o sintoma seria "configurei e não funciona".
--
-- Mesmo raciocínio de `assertAccountUsable` para token vencido, um passo
-- antes: falta de credencial é problema do ambiente, não do job. A diferença
-- é que aqui a checagem acontece antes do lock, então nem tentativa se
-- consome — o item fica em `pending`, esperando a configuração chegar.

create or replace function public.publishing_credentials_ready(
  p_account_id uuid
) returns boolean
language plpgsql
stable
security definer
set search_path = public
as $fn$
declare
  v_integration text;
begin
  select integration into v_integration
    from social_accounts where id = p_account_id;

  if v_integration is null then
    return false;
  end if;

  -- Devolve só se a credencial existe, nunca o valor dela. Por isso pode ser
  -- executada por `authenticated` sem virar uma forma de ler o Vault.
  if v_integration = 'buffer' then
    return coalesce(
      nullif(trim(integration_secret('buffer_access_token')), ''),
      null
    ) is not null;
  end if;

  -- `direct`: a credencial é o token OAuth da própria conta.
  return exists (
    select 1
      from private.oauth_tokens t
      join social_accounts sa on sa.token_ref = t.ref
     where sa.id = p_account_id
  );
end;
$fn$;

revoke all on function public.publishing_credentials_ready(uuid) from public;
revoke execute on function public.publishing_credentials_ready(uuid) from anon;
grant execute on function public.publishing_credentials_ready(uuid)
  to authenticated;

comment on function public.publishing_credentials_ready(uuid) is
  'Diz se a conta tem credencial configurada para publicar. Devolve booleano, nunca o segredo.';

-- ---------------------------------------------------------------------------

create or replace function public.claim_publishing_job(
  p_organization_id uuid,
  p_worker text,
  p_limit int default 1
) returns setof publishing_jobs
language sql
volatile
security invoker
set search_path = public
as $fn$
  update publishing_jobs
     set status = 'locked',
         locked_at = now(),
         locked_by = p_worker,
         attempt = attempt + 1
   where id in (
     select id from publishing_jobs
      where organization_id = p_organization_id
        and status in ('pending', 'failed')
        and run_at <= now()
        and attempt < max_attempts
        -- Sem credencial, o job fica parado onde está em vez de ser
        -- reivindicado e queimar uma tentativa.
        and publishing_credentials_ready(social_account_id)
      order by run_at
        for update skip locked
      limit greatest(p_limit, 0)
   )
   returning *;
$fn$;

revoke all on function public.claim_publishing_job(uuid, text, int) from public;
revoke execute on function public.claim_publishing_job(uuid, text, int)
  from anon;
