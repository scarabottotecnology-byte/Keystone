-- O agente A1 (market-intelligence) falha todo dia desde 15/10 porque a API
-- paga de IA recusa a chamada. O `trend-radar` cobre o mesmo papel sem custo.
-- Pausado, não removido: volta com `cron.alter_job(<id>, active := true)`
-- quando houver crédito de IA.
do $$
declare v_id bigint;
begin
  select jobid into v_id from cron.job where jobname = 'keystone-market-intelligence';
  if v_id is not null then
    perform cron.alter_job(v_id, active := false);
  end if;
end $$;
