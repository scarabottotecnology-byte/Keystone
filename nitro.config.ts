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
  // Pin the Vercel Serverless Function runtime explicitly instead of letting
  // Nitro auto-detect it from the build machine's own Node.js version. Nitro
  // 3.0.260610-beta added "24" to its list of candidate versions, so if the
  // Vercel build container happens to run Node 24 the generated
  // `.vc-config.json` gets `"runtime": "nodejs24.x"` — and if that identifier
  // isn't (yet) an accepted Vercel Function runtime, the deployment fails
  // after a successful build with no useful log ("Deployment has failed").
  // nodejs22.x is a long-established, definitely-supported runtime.
  vercel: {
    functions: {
      runtime: "nodejs22.x",
    },
  },
});
