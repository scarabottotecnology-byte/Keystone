import type { ComponentType } from "react";

export type PostMeta = {
  slug: string;
  title: string;
  description: string;
  date: string; // ISO
  readingTime: string;
  category: string;
  author: string;
};

export type PostModule = {
  meta: PostMeta;
  default: ComponentType;
};

// Explicit static imports instead of `import.meta.glob(..., { eager: true })`.
// Investigated as a possible fix for a "__exportAll is not a function" SSR crash
// (a circular chunk between this module and the server entry) — did not resolve
// it (the crash happens on every route, not just ones touching post content), but
// kept anyway since explicit imports are more predictable for the bundler than a
// glob. Add new posts here when they're added to ./posts/.
import * as controladoriaPme from "./posts/controladoria-pme";
import * as modeloFinanceiroIntegrado from "./posts/modelo-financeiro-integrado";
import * as precificacaoMargem from "./posts/precificacao-margem";

const modules: PostModule[] = [controladoriaPme, modeloFinanceiroIntegrado, precificacaoMargem];

export const posts: PostModule[] = [...modules].sort(
  (a, b) => new Date(b.meta.date).getTime() - new Date(a.meta.date).getTime(),
);

export function getPost(slug: string): PostModule | undefined {
  return posts.find((p) => p.meta.slug === slug);
}
