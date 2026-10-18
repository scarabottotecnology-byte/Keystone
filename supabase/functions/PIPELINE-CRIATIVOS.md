# Pipeline de criativos gratuito

Quatro Edge Functions que produzem e conferem as artes publicadas pelo Buffer,
sem ferramenta paga e sem marca d'água. Estavam só em produção no projeto
`rplnjrqpzqznbxfascqs`; o código aqui é o publicado (formatado para o `deno fmt`
do repositório, sem mudança de comportamento).

| Função | O que faz |
|---|---|
| `render-post` | Monta a arte (1080×1350 ou 1080×1920) com Satori + Resvg, ambos open source: foto, gradiente, tipografia e cores da marca. Modelos: `cover`, `photoTop`, `number`, `list`, `cards`. Grava o PNG no bucket `linkedin-artes` |
| `import-asset` | Copia um arquivo de uma URL `https` (ou de base64) para o bucket. Usado para trazer fotos do Pexels |
| `peek-asset` | Devolve uma prévia reduzida (base64) de um arquivo do bucket, para revisão visual antes de publicar |
| `import-zip-images` | Descompacta o ZIP de PNGs exportado pelo Gamma e grava cada card no bucket. Aceita só `assets.api.gamma.app` |

Todas exigem o cabeçalho `x-automation-secret`, conferido pela função de banco
`verify_automation_secret` (só a `service_role` pode executá-la). Por isso são
publicadas com `verify_jwt = false`.

## Fluxo

1. `import-asset` traz as fotos (Pexels, licença livre para uso comercial).
2. `render-post` monta cada slide a partir de um modelo e dos textos.
3. `peek-asset` gera as prévias para conferir texto, foto e números.
4. O Buffer publica a partir da URL pública do bucket.

Chamadas a partir do banco: `select private.invoke_edge_function('<função>', '<json>'::jsonb);`
e a resposta em `net._http_response`.

## Publicar

```bash
supabase functions deploy render-post --project-ref rplnjrqpzqznbxfascqs --no-verify-jwt
supabase functions deploy import-asset --project-ref rplnjrqpzqznbxfascqs --no-verify-jwt
supabase functions deploy peek-asset --project-ref rplnjrqpzqznbxfascqs --no-verify-jwt
supabase functions deploy import-zip-images --project-ref rplnjrqpzqznbxfascqs --no-verify-jwt
```

## Diferença entre o repositório e produção (18/10/2026)

Comparando este branch com o que está publicado:

- `social-publish`: idêntica (a diferença é só comentário, que o deploy remove).
- `market-intelligence`, `oauth-start` e `oauth-callback`: publicadas depois do
  último commit de cada uma, compatível com estarem em dia.
- `content-strategist`, `content-factory`, `knowledge-ingest` e `invite-member`:
  **o repositório está à frente de produção**. O commit `03d9ebf` ("quatro
  defeitos latentes que o CI nunca pegou", 19/08) mexe nas quatro e veio depois
  do último deploy de cada uma; as correções não foram publicadas.
- `render-asset` existe aqui, mas não está publicada.
- `cleanup-extra-reels`, `gen-photo` e `patch-image` estão publicadas como stubs
  desativados e não entram no repositório (remoção na issue #9 do
  `centro-de-custos-inteligente`).
