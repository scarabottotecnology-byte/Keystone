-- `exp(-x²/2)` estoura por baixo (underflow) quando o z passa de ~38, e o
-- alcance de um post com centenas de impressões contra uma média de dezenas
-- chega lá. Acima de 8 a normal já é 1 para qualquer fim prático: limitar o
-- argumento não muda o resultado e evita o erro que derrubou a primeira
-- sincronização em produção.
create or replace function private.norm_cdf(z double precision)
returns double precision
language sql immutable parallel safe
as $$
  select case when z >= 0 then 1 - p else p end
  from (
    select 0.3989422804014327 * exp(-x * x / 2)
      * t * (0.319381530 + t * (-0.356563782 + t * (1.781477937
      + t * (-1.821255978 + t * 1.330274429)))) as p
    from (select least(abs(z), 8) as x, 1 / (1 + 0.2316419 * least(abs(z), 8)) as t) s
  ) q
$$;
