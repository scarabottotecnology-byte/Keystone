/**
 * Monta o texto publicado a partir da peça aprovada.
 *
 * Módulo puro e separado do `index.ts` porque é a única parte de
 * `social-publish` com regra de formatação de verdade — e porque o texto
 * publicado é também o que o tratamento de timeout usa para procurar o post
 * na plataforma. As duas chamadas precisam produzir exatamente a mesma
 * string: se divergirem, a verificação não encontra o post que ela mesma
 * publicou e o job vai para revisão humana sem motivo.
 *
 * O limite de 3000 caracteres é o do post de texto do LinkedIn. Cortar não é
 * ideal, mas é melhor que a plataforma recusar a publicação inteira — e o
 * corte é visível (reticências), nunca silencioso.
 *
 * Módulo puro: sem Deno, sem rede.
 */

const LINKEDIN_TEXT_LIMIT = 3000;

export interface PublishableAsset {
  headline?: string | null;
  hook?: string | null;
  body?: string | null;
  cta?: string | null;
  hashtags?: string[] | null;
}

/**
 * Ordem: hook, corpo, CTA, hashtags.
 *
 * `headline` fica de fora de propósito: no LinkedIn não existe campo de
 * título para post de texto, e repetir a headline antes do hook produziria
 * uma duplicação visível no feed. Ela continua na peça, usada por outros
 * canais e pela biblioteca.
 */
export function composeCommentary(asset: PublishableAsset): string {
  const blocks: string[] = [];

  const hook = asset.hook?.trim();
  const body = asset.body?.trim();
  const cta = asset.cta?.trim();

  if (hook) blocks.push(hook);
  // Um corpo que já começa com o hook (o gerador às vezes repete) entraria
  // duplicado no feed.
  if (body && body !== hook) {
    blocks.push(
      hook && body.startsWith(hook) ? body.slice(hook.length).trim() : body,
    );
  }
  if (cta) blocks.push(cta);

  const tags = (asset.hashtags ?? [])
    .map((tag) => tag.trim().replace(/^#+/, ""))
    .filter((tag) => tag.length > 0)
    .map((tag) => `#${tag}`);
  if (tags.length > 0) blocks.push(tags.join(" "));

  const text = blocks.filter((b) => b.length > 0).join("\n\n");

  if (text.length <= LINKEDIN_TEXT_LIMIT) return text;
  return `${text.slice(0, LINKEDIN_TEXT_LIMIT - 1)}…`;
}
