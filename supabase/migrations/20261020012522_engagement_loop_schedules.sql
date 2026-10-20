-- Agendamento do ciclo de engajamento. `pg_cron` roda em GMT neste projeto
-- (ver `internal_scheduler.sql`).
do $$
begin
  if exists (select 1 from cron.job where jobname = 'keystone-social-metrics-sync') then
    perform cron.unschedule('keystone-social-metrics-sync');
  end if;
  if exists (select 1 from cron.job where jobname = 'keystone-trend-radar') then
    perform cron.unschedule('keystone-trend-radar');
  end if;

  -- 07:10 em São Paulo: o Buffer atualiza as métricas uma vez por dia.
  perform cron.schedule(
    'keystone-social-metrics-sync',
    '10 10 * * *',
    $cmd$select private.invoke_edge_function('social-metrics-sync')$cmd$
  );

  -- A cada 4 horas, para pegar a tendência enquanto ela ainda está subindo.
  perform cron.schedule(
    'keystone-trend-radar',
    '20 */4 * * *',
    $cmd$select private.invoke_edge_function('trend-radar')$cmd$
  );
end $$;
