-- Ciclo de engajamento — FASE 8 (métricas) e FASE 9 (aprendizado) adaptadas
-- ao que de fato publica hoje: o Buffer.
--
-- ## Por que não `social_post_metrics`
--
-- `social_post_metrics` exige um `social_posts` correspondente, e a maior parte
-- do que sai hoje é criada direto no Buffer, sem passar pela fila interna. Uma
-- tabela própria, chaveada pelo id do post no Buffer, mede tudo o que foi
-- publicado, venha de onde vier. Mesmo desenho: snapshot diário, unicidade por
-- (post, dia), reexecução no mesmo dia vira upsert.
--
-- ## Por que a análise é estatística e não um modelo de IA
--
-- Contar, comparar média e medir incerteza é aritmética: um modelo de
-- linguagem aqui só custaria dinheiro e inventaria padrão. O guarda-corpo da
-- FASE 9 vale integralmente: aprendizado com amostra abaixo do mínimo não é
-- ativado, porque um post que foi bem por acaso enviesaria toda a geração
-- seguinte.

-- ── Métricas por post do Buffer ──────────────────────────────────────────────
create table buffer_post_metrics (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  buffer_post_id  text not null,
  channel_id      text not null,
  channel         text not null,
  format          text not null
    check (format in ('texto', 'imagem', 'carrossel', 'documento', 'video')),
  asset_count     int not null default 0,
  sent_at         timestamptz not null,
  local_hour      smallint not null check (local_hour between 0 and 23),
  -- 0 = domingo, como `extract(dow ...)`.
  local_dow       smallint not null check (local_dow between 0 and 6),
  hook_type       text not null check (hook_type in ('pergunta', 'numero', 'afirmacao')),
  hook            text not null,
  text_length     int not null,
  hashtag_count   int not null,
  has_link        boolean not null default false,
  collected_for   date not null,
  -- Nulo = a rede não fornece essa métrica. Nunca zero no lugar de "não sei".
  impressions     bigint,
  reach           bigint,
  views           bigint,
  reactions       bigint,
  comments        bigint,
  shares          bigint,
  saves           bigint,
  clicks          bigint,
  follows         bigint,
  engagement_rate numeric,
  metrics_updated_at timestamptz,
  raw             jsonb not null default '[]'::jsonb,
  collected_at    timestamptz not null default now(),
  unique (buffer_post_id, collected_for)
);

create index buffer_post_metrics_org_sent on buffer_post_metrics (organization_id, channel, sent_at desc);

alter table buffer_post_metrics enable row level security;
alter table buffer_post_metrics force row level security;

create policy tenant_select on buffer_post_metrics for select to authenticated
  using (organization_id in (select app.current_org_ids()));

-- Último snapshot de cada post, com os atributos que a análise compara.
--
-- `engagement_points` pondera o que mais indica interesse real: comentário,
-- compartilhamento e salvamento valem mais que uma curtida. `audience` é a
-- melhor medida de alcance que cada rede entrega (impressões no LinkedIn e no
-- Facebook, visualizações no Instagram).
create view buffer_post_features with (security_invoker = true) as
select distinct on (m.buffer_post_id)
  m.*,
  coalesce(m.reactions, 0)
    + 2 * coalesce(m.comments, 0)
    + 3 * coalesce(m.shares, 0)
    + 2 * coalesce(m.saves, 0)
    + coalesce(m.clicks, 0)
    + 3 * coalesce(m.follows, 0) as engagement_points,
  coalesce(m.impressions, m.views, m.reach) as audience,
  case
    when m.local_hour < 12 then 'manhã (até 12h)'
    when m.local_hour < 18 then 'tarde (12h às 18h)'
    else 'noite (após 18h)'
  end as periodo,
  case when m.local_dow in (0, 6) then 'fim de semana' else 'dia útil' end as tipo_dia,
  case
    when m.text_length < 400 then 'curto (até 400)'
    when m.text_length < 1200 then 'médio (400 a 1200)'
    else 'longo (mais de 1200)'
  end as tamanho_texto,
  case
    when m.hashtag_count = 0 then 'sem hashtag'
    when m.hashtag_count <= 5 then '1 a 5 hashtags'
    else '6 ou mais hashtags'
  end as faixa_hashtags
from buffer_post_metrics m
order by m.buffer_post_id, m.collected_for desc;

-- ── Aprendizados ─────────────────────────────────────────────────────────────
-- Uma linha por (canal, dimensão, segmento, métrica), atualizada a cada
-- análise. `is_active` só liga com amostra mínima e confiança mínima.
create table ai_learnings (
  id                 uuid primary key default gen_random_uuid(),
  organization_id    uuid not null references organizations (id) on delete cascade,
  channel            text not null,
  dimension          text not null,
  segment            text not null,
  metric             text not null check (metric in ('engajamento', 'alcance')),
  segment_mean       numeric not null,
  baseline_mean      numeric not null,
  lift               numeric,
  sample_size        int not null,
  baseline_sample    int not null,
  confidence         numeric not null,
  is_active          boolean not null default false,
  statement          text not null,
  evidence           jsonb not null default '{}'::jsonb,
  first_activated_at timestamptz,
  updated_at         timestamptz not null default now(),
  unique (organization_id, channel, dimension, segment, metric)
);

alter table ai_learnings enable row level security;
alter table ai_learnings force row level security;

create policy tenant_select on ai_learnings for select to authenticated
  using (organization_id in (select app.current_org_ids()));

-- Função de distribuição da normal padrão (Abramowitz e Stegun 26.2.17,
-- erro < 7.5e-8). O Postgres não traz `erf`.
create function private.norm_cdf(z double precision)
returns double precision
language sql immutable parallel safe
as $$
  select case when z >= 0 then 1 - p else p end
  from (
    select 0.3989422804014327 * exp(-x * x / 2)
      * t * (0.319381530 + t * (-0.356563782 + t * (1.781477937
      + t * (-1.821255978 + t * 1.330274429)))) as p
    from (select abs(z) as x, 1 / (1 + 0.2316419 * abs(z)) as t) s
  ) q
$$;

create function public.refresh_content_learnings(
  p_organization_id uuid,
  p_min_sample int default 8,
  p_window_days int default 120,
  p_min_confidence numeric default 0.8
)
returns int
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_rows int;
begin
  with posts as (
    select *
    from buffer_post_features
    where organization_id = p_organization_id
      and sent_at >= now() - make_interval(days => p_window_days)
  ),
  long as (
    select channel, 'formato'::text as dimension, format as segment,
           engagement_points::numeric as eng, audience::numeric as aud
      from posts
    union all
    select channel, 'período do dia', periodo, engagement_points, audience from posts
    union all
    select channel, 'dia da semana', tipo_dia, engagement_points, audience from posts
    union all
    select channel, 'gancho', hook_type, engagement_points, audience from posts
    union all
    select channel, 'tamanho do texto', tamanho_texto, engagement_points, audience from posts
    union all
    select channel, 'hashtags', faixa_hashtags, engagement_points, audience from posts
  ),
  metrics as (
    select channel, dimension, segment, 'engajamento'::text as metric, eng as y from long
    union all
    select channel, dimension, segment, 'alcance', aud from long where aud is not null
  ),
  seg as (
    select channel, dimension, segment, metric,
           count(*)::numeric as n, sum(y) as s, sum(y * y) as ss
      from metrics group by 1, 2, 3, 4
  ),
  tot as (
    select channel, dimension, metric,
           sum(n) as n, sum(s) as s, sum(ss) as ss
      from seg group by 1, 2, 3
  ),
  cmp as (
    select seg.channel, seg.dimension, seg.segment, seg.metric,
           seg.n as n1, seg.s / seg.n as m1,
           greatest((seg.ss - seg.s * seg.s / seg.n) / greatest(seg.n - 1, 1), 0.25) as v1,
           tot.n - seg.n as n2,
           (tot.s - seg.s) / nullif(tot.n - seg.n, 0) as m2,
           greatest(
             ((tot.ss - seg.ss) - (tot.s - seg.s) ^ 2 / nullif(tot.n - seg.n, 0))
               / greatest(tot.n - seg.n - 1, 1),
             0.25
           ) as v2
      from seg join tot using (channel, dimension, metric)
  ),
  scored as (
    select *,
           (m1 - m2) / sqrt(v1 / n1 + v2 / nullif(n2, 0)) as z,
           case when m2 > 0 then (m1 - m2) / m2 end as lift
      from cmp
     where n2 > 0
  ),
  final as (
    select *,
           (2 * private.norm_cdf(abs(z)) - 1)::numeric as confidence
      from scored
  ),
  upserted as (
    insert into ai_learnings as l (
      organization_id, channel, dimension, segment, metric,
      segment_mean, baseline_mean, lift, sample_size, baseline_sample,
      confidence, is_active, statement, evidence, first_activated_at, updated_at
    )
    select
      p_organization_id, channel, dimension, segment, metric,
      round(m1, 2), round(m2, 2), round(lift, 3), n1::int, n2::int,
      round(confidence, 3),
      n1 >= p_min_sample and n2 >= p_min_sample and confidence >= p_min_confidence
        and (abs(coalesce(lift, 1)) >= 0.2),
      format(
        'No %s, posts com %s = "%s" têm %s %s (média %s contra %s; %s posts contra %s; confiança %s%%).',
        channel, dimension, segment,
        case
          when lift is null then 'diferença de ' || round(m1 - m2, 1) || ' pontos em'
          when lift >= 0 then round(lift * 100) || '% mais'
          else round(-lift * 100) || '% menos'
        end,
        case metric when 'engajamento' then 'engajamento' else 'alcance' end,
        round(m1, 1), round(m2, 1), n1::int, n2::int, round(confidence * 100)
      ),
      jsonb_build_object(
        'window_days', p_window_days,
        'min_sample', p_min_sample,
        'z', round(z::numeric, 3)
      ),
      case
        when n1 >= p_min_sample and n2 >= p_min_sample and confidence >= p_min_confidence
          and abs(coalesce(lift, 1)) >= 0.2 then now()
      end,
      now()
    from final
    on conflict (organization_id, channel, dimension, segment, metric) do update set
      segment_mean = excluded.segment_mean,
      baseline_mean = excluded.baseline_mean,
      lift = excluded.lift,
      sample_size = excluded.sample_size,
      baseline_sample = excluded.baseline_sample,
      confidence = excluded.confidence,
      is_active = excluded.is_active,
      statement = excluded.statement,
      evidence = excluded.evidence,
      first_activated_at = case
        when excluded.is_active then coalesce(l.first_activated_at, now())
        else l.first_activated_at
      end,
      updated_at = now()
    returning 1
  )
  select count(*) into v_rows from upserted;

  return v_rows;
end;
$$;

revoke execute on function public.refresh_content_learnings(uuid, int, int, numeric)
  from public, anon, authenticated;
grant execute on function public.refresh_content_learnings(uuid, int, int, numeric)
  to service_role;

-- ── Melhores horários ────────────────────────────────────────────────────────
-- Média de engajamento por hora, puxada para a média do canal quando a hora
-- tem poucos posts (encolhimento bayesiano, peso 5). Sem isso, uma hora com um
-- único post que foi bem viraria "o melhor horário". Devolve as horas que
-- melhor performam (`exploit`) e uma hora pouco testada (`explore`), para o
-- sistema continuar aprendendo em vez de repetir sempre o mesmo horário.
create function public.best_posting_slots(p_channel text, p_limit int default 3)
returns table (local_hour int, score numeric, sample_size int, kind text)
language sql
stable
security invoker
set search_path = public
as $$
  with posts as (
    select local_hour, engagement_points::numeric as y
      from buffer_post_features
     where channel = p_channel
       and sent_at >= now() - interval '120 days'
  ),
  channel_mean as (select coalesce(avg(y), 0) as mu from posts),
  by_hour as (
    select p.local_hour::int as local_hour, count(*)::int as n, avg(p.y) as m
      from posts p group by 1
  ),
  ranked as (
    select b.local_hour,
           round((b.n * b.m + 5 * c.mu) / (b.n + 5), 3) as score,
           b.n as sample_size
      from by_hour b cross join channel_mean c
  ),
  exploit as (
    select local_hour, score, sample_size, 'exploit'::text as kind
      from ranked
     order by score desc, sample_size desc
     limit p_limit
  ),
  candidates as (
    select h as local_hour,
           case p_channel
             when 'linkedin' then array_position(array[8, 12, 18, 7, 17, 13, 9, 19], h)
             when 'instagram' then array_position(array[19, 12, 21, 18, 20, 13, 11, 9], h)
             else array_position(array[9, 13, 19, 12, 18, 20, 8, 21], h)
           end as preference
      from generate_series(7, 22) as h
  )
  select * from exploit
  union all
  (
    select c.local_hour, null::numeric, coalesce(r.sample_size, 0), 'explore'
      from candidates c
      left join ranked r using (local_hour)
     where c.preference is not null
       and coalesce(r.sample_size, 0) < 3
       and c.local_hour not in (select e.local_hour from exploit e)
     order by coalesce(r.sample_size, 0), c.preference
     limit 1
  )
$$;

-- ── Testes planejados ────────────────────────────────────────────────────────
-- Um teste compara dois valores de uma dimensão num canal, a partir de uma
-- data. Os posts entram sozinhos pelo atributo que têm (formato, horário,
-- gancho…): não há etiqueta manual para esquecer.
create table content_experiments (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  name            text not null,
  channel         text not null,
  dimension       text not null
    check (dimension in ('formato', 'período do dia', 'gancho', 'tamanho do texto', 'hashtags')),
  arm_a           text not null,
  arm_b           text not null,
  starts_on       date not null default current_date,
  target_per_arm  int not null default 8,
  status          text not null default 'running' check (status in ('running', 'done', 'cancelled')),
  hypothesis      text,
  created_at      timestamptz not null default now(),
  unique (organization_id, name)
);

alter table content_experiments enable row level security;
alter table content_experiments force row level security;

create policy tenant_select on content_experiments for select to authenticated
  using (organization_id in (select app.current_org_ids()));

create view content_experiment_results with (security_invoker = true) as
with arms as (
  select e.id as experiment_id, e.organization_id, e.name, e.channel, e.dimension,
         e.starts_on, e.target_per_arm, e.status, e.hypothesis,
         a.arm, a.label
    from content_experiments e
    cross join lateral (values ('A', e.arm_a), ('B', e.arm_b)) as a (arm, label)
),
posts as (
  select f.*,
         case
           when a.dimension = 'formato' then f.format
           when a.dimension = 'período do dia' then f.periodo
           when a.dimension = 'gancho' then f.hook_type
           when a.dimension = 'tamanho do texto' then f.tamanho_texto
           when a.dimension = 'hashtags' then f.faixa_hashtags
         end as value,
         a.experiment_id, a.arm, a.label
    from arms a
    join buffer_post_features f
      on f.organization_id = a.organization_id
     and f.channel = a.channel
     and f.sent_at >= a.starts_on
)
select a.experiment_id, a.name, a.channel, a.dimension, a.status, a.hypothesis,
       a.arm, a.label, a.target_per_arm,
       count(p.buffer_post_id)::int as posts,
       round(avg(p.engagement_points), 2) as avg_engagement,
       round(avg(p.audience), 1) as avg_audience,
       greatest(a.target_per_arm - count(p.buffer_post_id), 0)::int as posts_missing
  from arms a
  left join posts p
    on p.experiment_id = a.experiment_id and p.arm = a.arm and p.value = a.label
 group by a.experiment_id, a.name, a.channel, a.dimension, a.status, a.hypothesis,
          a.arm, a.label, a.target_per_arm;

-- ── Tendências ───────────────────────────────────────────────────────────────
create table trend_signals (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references organizations (id) on delete cascade,
  source           text not null,
  title            text not null,
  url              text not null,
  traffic          text,
  matched_keywords text[] not null default '{}',
  relevance        int not null check (relevance between 0 and 100),
  observed_at      timestamptz,
  collected_at     timestamptz not null default now(),
  promoted_insight_id uuid references ai_insights (id) on delete set null,
  unique (organization_id, url)
);

create index trend_signals_org_relevance on trend_signals (organization_id, collected_at desc, relevance desc);

alter table trend_signals enable row level security;
alter table trend_signals force row level security;

create policy tenant_select on trend_signals for select to authenticated
  using (organization_id in (select app.current_org_ids()));

-- ── Palavras-chave (SEO e relevância de tendência) ───────────────────────────
create table seo_keywords (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  keyword         text not null,
  weight          int not null default 10 check (weight between 1 and 40),
  pillar          text,
  unique (organization_id, keyword)
);

alter table seo_keywords enable row level security;
alter table seo_keywords force row level security;

create policy tenant_select on seo_keywords for select to authenticated
  using (organization_id in (select app.current_org_ids()));

-- ── Checagem de peça antes de publicar ───────────────────────────────────────
-- Regras determinísticas de copy, formato e SEO por rede. Os formatos
-- recomendados partem do que a Keystone já observou (LinkedIn responde a
-- infográfico, Instagram a carrossel, post sem imagem rende menos) e cedem
-- ao aprendizado ativo quando os dados disserem outra coisa.
create function public.content_check(
  p_channel text,
  p_text text,
  p_format text,
  p_asset_count int default 0,
  p_alt_text text default null
)
returns jsonb
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_issues text[] := '{}';
  v_tips text[] := '{}';
  v_score int := 100;
  v_first_line text := split_part(coalesce(p_text, ''), E'\n', 1);
  v_len int := length(coalesce(p_text, ''));
  v_tags int := (select count(*) from regexp_matches(coalesce(p_text, ''), '#[[:alnum:]_À-ÿ]+', 'g'));
  v_best_format text;
  v_keywords text[];
  v_head text := lower(left(coalesce(p_text, ''), 300));
  v_min int; v_max int; v_tag_min int; v_tag_max int; v_hook_max int;
begin
  select l.segment into v_best_format
    from ai_learnings l
   where l.channel = p_channel and l.dimension = 'formato'
     and l.metric = 'engajamento' and l.is_active and l.lift > 0
   order by l.lift desc limit 1;

  v_best_format := coalesce(v_best_format, case p_channel
    when 'linkedin' then 'documento'
    when 'instagram' then 'carrossel'
    else 'imagem'
  end);

  case p_channel
    when 'linkedin' then v_min := 500; v_max := 1500; v_tag_min := 3; v_tag_max := 5; v_hook_max := 140;
    when 'instagram' then v_min := 150; v_max := 1200; v_tag_min := 3; v_tag_max := 8; v_hook_max := 125;
    else v_min := 80; v_max := 600; v_tag_min := 0; v_tag_max := 3; v_hook_max := 120;
  end case;

  if p_format = 'texto' or coalesce(p_asset_count, 0) = 0 then
    v_score := v_score - 30;
    v_issues := array_append(v_issues, 'Post sem imagem: na Keystone, posts sem arte têm rendido menos.');
  end if;

  if p_format <> v_best_format then
    v_score := v_score - 15;
    v_tips := array_append(v_tips, format('No %s, o formato recomendado agora é "%s".', p_channel, v_best_format));
  end if;

  if length(v_first_line) > v_hook_max then
    v_score := v_score - 10;
    v_issues := array_append(v_issues, format('Gancho com %s caracteres: a rede corta em ~%s antes do "ver mais".', length(v_first_line), v_hook_max));
  end if;

  if v_first_line !~ '[?0-9%]' then
    v_score := v_score - 5;
    v_tips := array_append(v_tips, 'Gancho sem pergunta nem número: teste uma versão com um dos dois.');
  end if;

  if v_len < v_min then
    v_score := v_score - 10;
    v_issues := array_append(v_issues, format('Texto curto para o %s (%s caracteres; ideal a partir de %s).', p_channel, v_len, v_min));
  elsif v_len > v_max then
    v_score := v_score - 5;
    v_tips := array_append(v_tips, format('Texto longo para o %s (%s caracteres; ideal até %s).', p_channel, v_len, v_max));
  end if;

  if v_tags < v_tag_min or v_tags > v_tag_max then
    v_score := v_score - 5;
    v_tips := array_append(v_tips, format('Use entre %s e %s hashtags no %s (tem %s).', v_tag_min, v_tag_max, p_channel, v_tags));
  end if;

  if coalesce(p_text, '') !~* '(\?\s*$|coment|salve|compartilh|me conta|qual .*\?|marque)' then
    v_score := v_score - 10;
    v_issues := array_append(v_issues, 'Sem chamada para interação no fim (pergunta, "comente", "salve").');
  end if;

  select array_agg(k.keyword) into v_keywords
    from seo_keywords k where position(lower(k.keyword) in v_head) > 0;
  if v_keywords is null then
    v_score := v_score - 10;
    v_issues := array_append(v_issues, 'Nenhuma palavra-chave da Keystone nas primeiras linhas (SEO e busca da rede).');
  end if;

  if coalesce(p_text, '') ~* 'https?://' and p_channel in ('instagram', 'linkedin') then
    v_score := v_score - 5;
    v_tips := array_append(v_tips, format('Link no corpo: no %s isso reduz alcance (Instagram nem deixa clicar). Prefira o primeiro comentário.', p_channel));
  end if;

  if coalesce(p_text, '') ~* 'v[eé]rtice' then
    v_score := v_score - 20;
    v_issues := array_append(v_issues, 'Menção ou link da Vértice: suspenso por enquanto.');
  end if;

  if coalesce(p_asset_count, 0) > 0 and coalesce(length(trim(p_alt_text)), 0) = 0 then
    v_score := v_score - 5;
    v_tips := array_append(v_tips, 'Imagem sem texto alternativo: ele também conta para busca e acessibilidade.');
  end if;

  return jsonb_build_object(
    'score', greatest(v_score, 0),
    'aprovado', greatest(v_score, 0) >= 70,
    'formato_recomendado', v_best_format,
    'problemas', to_jsonb(v_issues),
    'sugestoes', to_jsonb(v_tips),
    'palavras_chave_encontradas', coalesce(to_jsonb(v_keywords), '[]'::jsonb)
  );
end;
$$;

-- ── Plano da semana ──────────────────────────────────────────────────────────
-- O que produzir e quando, por canal: formato principal, formato em teste,
-- horários, testes que ainda precisam de posts e as tendências da semana.
create view content_weekly_plan with (security_invoker = true) as
with channels as (
  select unnest(array['linkedin', 'instagram', 'facebook']) as channel
)
select
  c.channel,
  coalesce(
    (select l.segment from ai_learnings l
      where l.channel = c.channel and l.dimension = 'formato'
        and l.metric = 'engajamento' and l.is_active and l.lift > 0
      order by l.lift desc limit 1),
    case c.channel when 'linkedin' then 'documento' when 'instagram' then 'carrossel' else 'imagem' end
  ) as formato_principal,
  (select jsonb_agg(jsonb_build_object('hora', s.local_hour, 'tipo', s.kind, 'amostra', s.sample_size))
     from public.best_posting_slots(c.channel) s) as horarios,
  (select jsonb_agg(jsonb_build_object(
            'teste', r.name, 'braço', r.label, 'faltam', r.posts_missing))
     from content_experiment_results r
    where r.channel = c.channel and r.status = 'running' and r.posts_missing > 0) as testes_pendentes,
  (select jsonb_agg(l.statement order by l.confidence desc)
     from ai_learnings l
    where l.channel = c.channel and l.is_active) as aprendizados_ativos,
  (select jsonb_agg(jsonb_build_object('titulo', t.title, 'url', t.url, 'relevancia', t.relevance)
                    order by t.relevance desc)
     from (select title, url, relevance from trend_signals
            where collected_at >= now() - interval '7 days'
            order by relevance desc limit 5) t) as tendencias
from channels c;

-- ── Sementes ─────────────────────────────────────────────────────────────────
do $$
declare
  v_org uuid;
begin
  select id into v_org from organizations where slug = 'keystone';
  if v_org is null then
    return;
  end if;

  insert into seo_keywords (organization_id, keyword, weight, pillar) values
    (v_org, 'controladoria', 30, 'controladoria'),
    (v_org, 'custo', 20, 'custos'),
    (v_org, 'custos', 20, 'custos'),
    (v_org, 'precificação', 25, 'precificação'),
    (v_org, 'preço', 15, 'precificação'),
    (v_org, 'margem', 20, 'rentabilidade'),
    (v_org, 'lucro', 15, 'rentabilidade'),
    (v_org, 'dre', 20, 'controladoria'),
    (v_org, 'fluxo de caixa', 25, 'caixa'),
    (v_org, 'caixa', 10, 'caixa'),
    (v_org, 'orçamento', 20, 'planejamento'),
    (v_org, 'planejamento financeiro', 25, 'planejamento'),
    (v_org, 'gestão financeira', 25, 'gestão'),
    (v_org, 'ponto de equilíbrio', 25, 'custos'),
    (v_org, 'capital de giro', 25, 'caixa'),
    (v_org, 'tributária', 20, 'tributos'),
    (v_org, 'imposto', 15, 'tributos'),
    (v_org, 'simples nacional', 20, 'tributos'),
    (v_org, 'reforma tributária', 30, 'tributos'),
    (v_org, 'folha de pagamento', 20, 'pessoas'),
    (v_org, 'escala 6x1', 30, 'pessoas'),
    (v_org, 'jornada de trabalho', 20, 'pessoas'),
    (v_org, 'pequena empresa', 15, 'mercado'),
    (v_org, 'média empresa', 20, 'mercado'),
    (v_org, 'empresário', 15, 'mercado'),
    (v_org, 'inadimplência', 20, 'caixa'),
    (v_org, 'juros', 15, 'economia'),
    (v_org, 'selic', 20, 'economia'),
    (v_org, 'inflação', 15, 'economia'),
    (v_org, 'fp&a', 25, 'controladoria'),
    (v_org, 'indicadores', 15, 'gestão'),
    (v_org, 'kpi', 15, 'gestão')
  on conflict (organization_id, keyword) do nothing;

  insert into content_experiments (organization_id, name, channel, dimension, arm_a, arm_b, hypothesis) values
    (v_org, 'LinkedIn: infográfico x imagem', 'linkedin', 'formato', 'documento', 'imagem',
     'Infográfico em documento (carrossel PDF) engaja mais que imagem única no LinkedIn.'),
    (v_org, 'Instagram: carrossel x imagem', 'instagram', 'formato', 'carrossel', 'imagem',
     'Carrossel engaja mais que imagem única no Instagram.'),
    (v_org, 'LinkedIn: manhã x noite', 'linkedin', 'período do dia', 'manhã (até 12h)', 'noite (após 18h)',
     'Quase tudo sai às 9h; a noite nunca foi testada.'),
    (v_org, 'LinkedIn: gancho com pergunta x com número', 'linkedin', 'gancho', 'pergunta', 'numero',
     'Pergunta no gancho puxa mais comentários que número.'),
    (v_org, 'Instagram: manhã x noite', 'instagram', 'período do dia', 'manhã (até 12h)', 'noite (após 18h)',
     'Público de Instagram tende a estar mais ativo à noite.')
  on conflict (organization_id, name) do nothing;
end $$;
