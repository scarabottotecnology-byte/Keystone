# Ciclo de engajamento

O que mede, aprende e orienta a produção de conteúdo, sem ferramenta paga e
sem IA paga. Em produção desde 20/10/2026 no projeto `rplnjrqpzqznbxfascqs`.

| Peça | O que faz | Quando roda |
|---|---|---|
| `social-metrics-sync` | Lê do Buffer tudo o que foi publicado nos últimos 120 dias, com as métricas, e grava um snapshot por post por dia em `buffer_post_metrics`. Depois chama `refresh_content_learnings`. | Todo dia, 07:10 em São Paulo |
| `refresh_content_learnings` | Compara, por canal, formato, período do dia, dia da semana, tipo de gancho, tamanho do texto e hashtags. Grava em `ai_learnings`; só ativa com 8+ posts de cada lado, 80%+ de confiança e diferença de 20%+. | Junto com a sincronização |
| `trend-radar` | Google Trends Brasil, Google Notícias (temas da Keystone) e as fontes de `market_intelligence_sources`. Pontua cada item pelas palavras de `seo_keywords`; grava em `trend_signals` e transforma os fortes em pauta (`ai_insights`). | A cada 4 horas |
| `best_posting_slots(canal)` | Melhores horas pelo engajamento (com encolhimento para não premiar acaso) e uma hora pouco testada, para continuar aprendendo. | Sob demanda |
| `content_check(canal, texto, formato, n_artes, alt)` | Nota de 0 a 100 antes de publicar: formato recomendado, imagem, gancho, tamanho, hashtags, chamada para interação, palavras-chave, link no corpo, texto alternativo. Aprova a partir de 70. | Antes de cada post |
| `content_experiments` / `content_experiment_results` | Testes A/B por canal (infográfico x imagem no LinkedIn, carrossel x imagem no Instagram, manhã x noite, pergunta x número). O post entra no braço pelo próprio atributo, sem etiqueta manual. | Contínuo |
| `content_weekly_plan` | Por canal: formato principal, horários, testes que faltam, aprendizados ativos e as tendências da semana. | Consulta |
| `compose-pdf` | Junta artes PNG/JPG do bucket `linkedin-artes` num PDF (`{dst, paths, title}`), para o documento-carrossel do LinkedIn. | Ao montar um post |
| `contact-sheet` | Folha de contato: miniaturas de várias artes numa imagem só (`{paths, cols?, tw?, th?}`), para revisar o lote antes de publicar. | Ao revisar um lote |

## Regras de publicação (desde 22/10/2026)

- **Frequência: um dia sim, um dia não**, um post por rede em cada dia de
  publicação. O plano gratuito do Buffer aceita 10 agendados por rede, então a
  fila cobre 10 dias de publicação (cerca de 20 dias de calendário).
- **Sempre com foto e no modelo do `render-post`** (1080×1350, faixa
  "Keystone Controladoria", fundo azul-marinho e dourado). Nada de cartão só com
  frase nem arte quadrada: a grade do Instagram mostra cada post em 3:4 e corta
  as laterais de uma arte 1:1. A fila antiga desses cartões no
  `content_calendar` foi cancelada (migração `cancel_legacy_text_cards`); os
  temas continuam em `content_assets` para voltar como carrossel.
- **Formato por rede:** carrossel no Instagram, documento (PDF do
  `compose-pdf`) no LinkedIn e imagem única no Facebook.
- **Reels:** a cada dois carrosséis, um vira Reel 1080×1920 com
  `scripts/mkreel.sh` (ffmpeg). É o único formato que o Instagram mostra para
  quem ainda não segue a conta. O vídeo vai para o ramo `claude/midia-reels` e
  a `import-asset` copia para o bucket a partir do link `raw.githubusercontent`.
- **Tema não se repete** em menos de duas semanas, e nenhum tema domina a fila.
- Link do diagnóstico só no texto do LinkedIn e do Facebook. No Instagram,
  "link na bio".

## Engajamento

`engagement_points = reações + 2×comentários + 3×compartilhamentos +
2×salvamentos + cliques + 3×novos seguidores`. Alcance é `impressions` (LinkedIn,
Facebook) ou `views` (Instagram). Métrica que a rede não fornece fica nula,
nunca zero.

## Consultas úteis

```sql
select * from content_weekly_plan;
select statement from ai_learnings where is_active order by confidence desc;
select * from content_experiment_results order by name, arm;
select title, relevance, url from trend_signals order by collected_at desc, relevance desc limit 20;
select content_check('linkedin', '<texto>', 'documento', 1, '<alt>');
```

## Publicar

```bash
supabase functions deploy social-metrics-sync --project-ref rplnjrqpzqznbxfascqs --no-verify-jwt
supabase functions deploy trend-radar --project-ref rplnjrqpzqznbxfascqs --no-verify-jwt
supabase functions deploy compose-pdf --project-ref rplnjrqpzqznbxfascqs --no-verify-jwt
supabase functions deploy contact-sheet --project-ref rplnjrqpzqznbxfascqs --no-verify-jwt
```

O robô antigo de inteligência de mercado (`keystone-market-intelligence`) está
pausado: dependia de crédito de IA e o `trend-radar` cobre a mesma função.

Todas exigem `x-automation-secret`, como as demais automações.
