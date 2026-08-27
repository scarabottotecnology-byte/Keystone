-- O agendador interno: pg_cron + pg_net no lugar do n8n.
--
-- ## Por que trocar
--
-- O WF-002 e o WF-015 foram exportados como workflows de n8n. Só que não
-- existe instância de n8n rodando em lugar nenhum — e enquanto não existir,
-- o worker de publicação nunca é disparado. Um robô que depende de uma
-- infraestrutura que ninguém subiu é um robô desligado.
--
-- `pg_cron` e `pg_net` já estão disponíveis no projeto. Com os dois, o
-- agendamento vive dentro do mesmo Postgres que guarda a fila: zero
-- infraestrutura nova, zero servidor a manter, e o ciclo diário passa a
-- rodar sozinho.
--
-- Os JSONs em `n8n/` continuam no repositório. Eles deixam de ser o caminho
-- principal e passam a ser a alternativa para quem já tiver n8n — o que
-- muda é que o sistema não depende mais deles para funcionar.
--
-- ## Por que o segredo vem do Vault
--
-- `cron.job.command` guarda o SQL agendado em texto puro. Escrever
-- `'Bearer <segredo>'` direto no comando exporia o segredo de automação a
-- qualquer um que consiga ler essa tabela. O comando agendado chama uma
-- função que lê o segredo do Vault na hora — o texto agendado não contém
-- credencial nenhuma.

create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

-- ---------------------------------------------------------------------------
-- private.invoke_edge_function
-- ---------------------------------------------------------------------------
--
-- `security definer` porque quem executa é o cron (dono: postgres) e a função
-- precisa ler o Vault. Vive em `private`, que não tem USAGE para `anon` nem
-- para `authenticated` — nenhum cliente da API alcança esta função.
create or replace function private.invoke_edge_function(
  p_function_name text,
  p_body jsonb default '{}'::jsonb
) returns bigint
language plpgsql
security definer
set search_path = private, public, extensions, vault
as $fn$
declare
  v_base_url text;
  v_secret text;
  v_request_id bigint;
begin
  select decrypted_secret into v_base_url
    from vault.decrypted_secrets
   where name = 'edge_functions_base_url';

  select decrypted_secret into v_secret
    from vault.decrypted_secrets
   where name = 'automation_webhook_secret';

  -- Falhar alto: um cron que dispara silenciosamente contra uma URL nula
  -- vira um robô que parece rodar e não faz nada. Ver o registro em
  -- cron.job_run_details.
  if v_base_url is null then
    raise exception
      'Segredo `edge_functions_base_url` ausente no Vault — o agendador não sabe para onde chamar';
  end if;
  if v_secret is null then
    raise exception
      'Segredo `automation_webhook_secret` ausente no Vault — a Edge Function recusaria a chamada';
  end if;

  select net.http_post(
    url := v_base_url || p_function_name,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-automation-secret', v_secret
    ),
    body := p_body,
    timeout_milliseconds := 55000
  ) into v_request_id;

  return v_request_id;
end;
$fn$;

revoke all on function private.invoke_edge_function(text, jsonb) from public;

comment on function private.invoke_edge_function(text, jsonb) is
  'Chama uma Edge Function a partir do cron, lendo o segredo de automação do Vault em vez de embuti-lo no comando agendado.';

-- ---------------------------------------------------------------------------
-- Os dois segredos que o agendador precisa
-- ---------------------------------------------------------------------------
--
-- O segredo de automação é gerado AQUI, dentro do banco: assim ele nunca
-- aparece num arquivo versionado, num log de terminal nem numa conversa.
-- Para lê-lo (é preciso, para configurar `AUTOMATION_WEBHOOK_SECRET` nas
-- Edge Functions), use o painel do Supabase em Project Settings → Vault.
do $seed$
declare
  v_secret text;
begin
  if not exists (select 1 from vault.secrets where name = 'edge_functions_base_url') then
    perform vault.create_secret(
      'https://rplnjrqpzqznbxfascqs.supabase.co/functions/v1/',
      'edge_functions_base_url',
      'Prefixo das Edge Functions usado pelo agendador interno (pg_cron + pg_net).'
    );
  end if;

  if not exists (select 1 from vault.secrets where name = 'automation_webhook_secret') then
    v_secret := encode(gen_random_bytes(32), 'hex');
    perform vault.create_secret(
      v_secret,
      'automation_webhook_secret',
      'Segredo compartilhado entre o cron e as Edge Functions de automação. O MESMO valor precisa estar em AUTOMATION_WEBHOOK_SECRET nos secrets das Edge Functions.'
    );
  end if;
end;
$seed$;

-- ---------------------------------------------------------------------------
-- Os jobs
-- ---------------------------------------------------------------------------
--
-- ⚠️ `pg_cron` avalia o cron em **GMT** neste projeto (`cron.timezone`), não
-- no fuso da organização. `0 12` são 9h de São Paulo — e vira 8h quando o
-- horário de verão do hemisfério norte não estiver mais em jogo. Escrever
-- `0 9` aqui dispararia às 6h da manhã, que é o tipo de engano que ninguém
-- percebe até estranhar o horário dos registros.
do $jobs$
begin
  if not exists (select 1 from cron.job where jobname = 'keystone-social-publish') then
    perform cron.schedule(
      'keystone-social-publish',
      '*/15 * * * *',
      $cmd$select private.invoke_edge_function('social-publish')$cmd$
    );
  end if;

  if not exists (select 1 from cron.job where jobname = 'keystone-market-intelligence') then
    perform cron.schedule(
      'keystone-market-intelligence',
      '0 12 * * 1-5',
      $cmd$select private.invoke_edge_function('market-intelligence')$cmd$
    );
  end if;
end;
$jobs$;
