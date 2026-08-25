import { defineConfig } from "nitro/config";

// Workaround for a Rolldown code-splitting bug (rolldown/rolldown#8809):
// when the SSR server bundle is split into multiple chunks, the generated
// `__exportAll` runtime helper can end up in a circular import between two
// chunks, causing `TypeError: __exportAll is not a function` at request time
// in production (every route, including "/").
//
// Bundling the whole server into a single file sidesteps the chunk-splitting
// circular-import entirely. The server bundle is small, so this has no
// meaningful cost.
export default defineConfig({
  inlineDynamicImports: true,
});
