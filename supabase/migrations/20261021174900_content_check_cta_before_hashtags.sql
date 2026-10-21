-- A chamada para interação costuma vir antes do bloco de hashtags. Checar o
-- fim do texto bruto marcava como "sem pergunta" um post que termina em
-- "...hoje?\n\n#Tag #Tag". Agora a checagem ignora as linhas finais que são
-- só hashtags.
create or replace function public.content_check_body(p_text text)
returns text
language sql
immutable
set search_path = public
as $$
  select regexp_replace(coalesce(p_text, ''), '(\s*(#[[:alnum:]_À-ÿ]+\s*)+)+$', '')
$$;

revoke execute on function public.content_check_body(text) from public, anon;
grant execute on function public.content_check_body(text) to authenticated, service_role;

create or replace function public.content_check(
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

  if public.content_check_body(p_text) !~* '(\?\s*$|coment|salve|compartilh|me conta|qual .*\?|marque)' then
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
