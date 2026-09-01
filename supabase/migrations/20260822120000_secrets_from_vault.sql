-- Configuração pelo Vault, não por variável de ambiente.
--
-- ## Por quê
--
-- Cadastrar secret de Edge Function exige o painel do Supabase numa tela que
-- não coopera no celular, ou o CLI com token de acesso. O Vault é uma
-- tabela: preenche pelo SQL editor do navegador, de qualquer aparelho. Isso
-- transformou "precisa de um computador para colocar no ar" em "precisa de
-- um navegador".
--
-- ## A contrapartida, dita em voz alta
--
-- Um segredo no Vault é legível por quem tem a `service_role`. Como a
-- `service_role` já dá acesso total ao banco, isso não abre uma porta nova —
-- mas também não é equivalente a uma variável de ambiente, que fica fora do
-- alcance de qualquer consulta SQL. Quem puder usar o ambiente deve
-- continuar usando: por isso o código lê ambiente primeiro e Vault depois.
--
-- ## O segredo de automação é diferente dos outros
--
-- Ele não é devolvido por função nenhuma. A comparação acontece dentro do
-- banco e o que sai é `true`/`false`. Uma função que devolvesse o valor
-- esperado seria uma forma de lê-lo — exatamente o que se quer evitar.

create or replace function public.verify_automation_secret(p_secret text)
returns boolean
language plpgsql
stable
security definer
set search_path = public, vault
as $fn$
declare
  v_expected text;
begin
  select decrypted_secret into v_expected
    from vault.decrypted_secrets
   where name = 'automation_webhook_secret';

  if v_expected is null or p_secret is null then
    return false;
  end if;

  return v_expected = p_secret;
end;
$fn$;

revoke all on function public.verify_automation_secret(text) from public;
revoke execute on function public.verify_automation_secret(text) from anon;
revoke execute on function public.verify_automation_secret(text)
  from authenticated;

comment on function public.verify_automation_secret(text) is
  'Confere o segredo de automação contra o Vault sem devolvê-lo. Só service_role executa.';

-- ---------------------------------------------------------------------------
-- Leitura de credencial de integração
-- ---------------------------------------------------------------------------
--
-- A lista de nomes permitidos é fechada de propósito. Sem ela, esta função
-- seria uma porta genérica para ler qualquer linha do Vault — inclusive o
-- próprio segredo de automação, que a função acima existe justamente para
-- não expor.
create or replace function public.integration_secret(p_name text)
returns text
language plpgsql
stable
security definer
set search_path = public, vault
as $fn$
declare
  v_value text;
begin
  if p_name not in (
    'buffer_access_token',
    'buffer_organization_id',
    'anthropic_api_key',
    'openai_api_key'
  ) then
    raise exception 'Credencial % não está na lista permitida', p_name
      using errcode = 'insufficient_privilege';
  end if;

  select decrypted_secret into v_value
    from vault.decrypted_secrets
   where name = p_name;

  return v_value;
end;
$fn$;

revoke all on function public.integration_secret(text) from public;
revoke execute on function public.integration_secret(text) from anon;
revoke execute on function public.integration_secret(text) from authenticated;

comment on function public.integration_secret(text) is
  'Devolve uma credencial de integração do Vault, restrita a uma lista fechada de nomes. Só service_role executa.';
