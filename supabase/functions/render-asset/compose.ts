/**
 * Compositor de arte: spec + payload → PNG.
 *
 * ## Por que não é navegador headless
 *
 * O documento 14 dizia "convertido em PNG por navegador headless". Estava
 * errado para o destino: Edge Function do Supabase roda em Deno Deploy, que
 * não permite subir um Chrome. A técnica que usei para gerar os arquivos de
 * marca em `public/brand/` era Playwright na minha máquina — não transporta.
 *
 * O que funciona no destino, e está verificado:
 *
 * - **satori** faz o layout (subset de flexbox, tipografia real com kerning e
 *   quebra de linha) e emite SVG.
 * - **resvg-wasm** rasteriza o SVG em PNG, em WebAssembly.
 *
 * Nenhum dos dois abre processo. Medido: **268 ms** para 1080×1080 — 118 ms de
 * layout, 150 ms de rasterização.
 *
 * ## As duas restrições que isso impõe
 *
 * 1. **Fonte precisa ser estática.** O parser do satori quebra na tabela `fvar`
 *    de fonte variável. Os `.ttf` em `fonts/` são instâncias fixas geradas com
 *    fontTools a partir das variáveis do Google Fonts — ver `fonts/README.md`.
 * 2. **Layout é subset de flexbox.** Sem grid, sem posicionamento absoluto
 *    arbitrário, sem float. É suficiente para peça de conteúdo editorial e é o
 *    preço de não ter navegador.
 */
import satori from "satori";
import { initWasm, Resvg } from "@resvg/resvg-wasm";

import {
  type Payload,
  type TemplateSpec,
  describeViolations,
  validatePayload,
} from "./templates.ts";
import { verifyNumbersGrounded } from "./guardrails.ts";

/** Tokens da marca. Espelham `src/index.css` — a peça e o produto usam a mesma paleta. */
const C = {
  ink: "#0B0F10",
  surface: "#141A1B",
  teal: "#3FA9A0",
  text: "#E8EDEC",
  muted: "#8A9A98",
} as const;

const FONT_DIR = new URL("./fonts/", import.meta.url);

let fontsPromise: Promise<Font[]> | null = null;
let wasmPromise: Promise<void> | null = null;

interface Font {
  name: string;
  data: Uint8Array;
  weight: 400 | 500 | 600;
  style: "normal";
}

/**
 * Carrega as fontes uma vez por instância da função.
 *
 * São ~900 kB; reler a cada requisição desperdiça o tempo que a rasterização
 * já custa. A promessa é memoizada, não o resultado, para que chamadas
 * concorrentes durante a primeira carga não disparem quatro leituras.
 */
function loadFonts(): Promise<Font[]> {
  fontsPromise ??= (async () => {
    const read = (f: string) => Deno.readFile(new URL(f, FONT_DIR));
    const [ir, im, nr, ns] = await Promise.all([
      read("Inter-Regular.ttf"),
      read("Inter-Medium.ttf"),
      read("Newsreader-Regular.ttf"),
      read("Newsreader-SemiBold.ttf"),
    ]);
    return [
      { name: "Inter", data: ir, weight: 400, style: "normal" },
      { name: "Inter", data: im, weight: 500, style: "normal" },
      { name: "Newsreader", data: nr, weight: 400, style: "normal" },
      { name: "Newsreader", data: ns, weight: 600, style: "normal" },
    ] satisfies Font[];
  })();
  return fontsPromise;
}

function initResvg(): Promise<void> {
  // O .wasm vem do pacote npm resolvido, não de CDN em tempo de execução:
  // depender da unpkg transformaria a indisponibilidade dela em falha de
  // publicação, e a arte é o caminho crítico do produto.
  wasmPromise ??= (async () => {
    const url = import.meta.resolve("@resvg/resvg-wasm/index_bg.wasm");
    await initWasm(await (await fetch(url)).arrayBuffer());
  })();
  return wasmPromise;
}

// ── Construtores de layout ───────────────────────────────────────────────────
// Um por template. Isto é código, não dado — ver a ressalva em `templates.ts`.

type Node = Record<string, unknown>;

const box = (style: Record<string, unknown>, children: unknown): Node => ({
  type: "div",
  props: { style: { display: "flex", ...style }, children },
});

const eyebrow = (text: string) =>
  box(
    {
      fontSize: 22,
      letterSpacing: 4,
      color: C.teal,
      textTransform: "uppercase",
      fontWeight: 500,
    },
    text,
  );

const rodape = (fonte: string) =>
  box(
    {
      justifyContent: "space-between",
      alignItems: "flex-end",
      borderTop: `1px solid ${C.surface}`,
      paddingTop: 28,
    },
    [
      box({ fontSize: 20, color: C.muted }, fonte),
      box(
        {
          fontSize: 24,
          letterSpacing: 5,
          color: C.text,
          fontFamily: "Newsreader",
          fontWeight: 600,
        },
        "KEYSTONE",
      ),
    ],
  );

const moldura = (children: unknown[]) =>
  box(
    {
      width: 1080,
      height: 1080,
      flexDirection: "column",
      justifyContent: "space-between",
      backgroundColor: C.ink,
      padding: 88,
      fontFamily: "Inter",
    },
    children,
  );

const LAYOUTS: Record<string, (p: Payload) => Node> = {
  dado: (p) =>
    moldura([
      eyebrow(p.eyebrow!),
      box({ flexDirection: "column", gap: 24 }, [
        box(
          {
            fontSize: 210,
            lineHeight: 1,
            letterSpacing: -6,
            color: C.teal,
            fontFamily: "Newsreader",
            fontWeight: 600,
          },
          p.valor!,
        ),
        box(
          {
            fontSize: 52,
            lineHeight: 1.25,
            letterSpacing: -1,
            color: C.text,
            fontFamily: "Newsreader",
            maxWidth: 820,
          },
          p.afirmacao!,
        ),
      ]),
      rodape(p.fonte!),
    ]),

  afirmacao: (p) =>
    moldura([
      eyebrow(p.eyebrow!),
      box({ flexDirection: "column", gap: 32 }, [
        box(
          {
            fontSize: 76,
            lineHeight: 1.15,
            letterSpacing: -2,
            color: C.text,
            fontFamily: "Newsreader",
            fontWeight: 600,
            maxWidth: 860,
          },
          p.tese!,
        ),
        ...(p.apoio
          ? [box({ fontSize: 30, lineHeight: 1.5, color: C.muted, maxWidth: 760 }, p.apoio)]
          : []),
      ]),
      rodape(p.fonte!),
    ]),
};

// ── Erro de composição ───────────────────────────────────────────────────────

export type ComposeErrorCode =
  | "unknown_template"
  | "zone_violation"
  | "ungrounded_number";

export class ComposeError extends Error {
  constructor(
    readonly code: ComposeErrorCode,
    message: string,
    readonly detail?: unknown,
  ) {
    super(message);
    this.name = "ComposeError";
  }
}

export interface ComposeInput {
  spec: TemplateSpec;
  payload: Payload;
  /** A copy da peça. As zonas `grounded` são conferidas contra ela. */
  copy: string;
}

export interface ComposeOutput {
  png: Uint8Array;
  svg: string;
  width: number;
  height: number;
  durationMs: number;
}

/**
 * Compõe a peça. Lança `ComposeError` antes de rasterizar quando algo não
 * fecha — renderizar uma peça errada custa mais que não renderizar.
 */
export async function compose({
  spec,
  payload,
  copy,
}: ComposeInput): Promise<ComposeOutput> {
  const layout = LAYOUTS[spec.key];
  if (!layout) {
    throw new ComposeError(
      "unknown_template",
      `Template sem layout implementado: ${spec.key}`,
    );
  }

  const violations = validatePayload(spec, payload);
  if (violations.length > 0) {
    throw new ComposeError(
      "zone_violation",
      describeViolations(violations),
      violations,
    );
  }

  // O guardrail do documento 14, aplicado só às zonas que fazem afirmação.
  const artText = spec.zones
    .filter((z) => z.grounded)
    .map((z) => payload[z.key] ?? "")
    .join(" ");

  const grounding = verifyNumbersGrounded(artText, copy);
  if (!grounding.ok) {
    throw new ComposeError(
      "ungrounded_number",
      `A arte exibe número que não consta na copy: ${grounding.ungrounded.join(", ")}`,
      grounding.ungrounded,
    );
  }

  const started = performance.now();

  const [fonts] = await Promise.all([loadFonts(), initResvg()]);

  // deno-lint-ignore no-explicit-any
  const svg = await satori(layout(payload) as any, {
    width: spec.width,
    height: spec.height,
    fonts,
  });

  const png = new Resvg(svg, {
    fitTo: { mode: "width", value: spec.width },
  }).render().asPng();

  return {
    png,
    svg,
    width: spec.width,
    height: spec.height,
    durationMs: Math.round(performance.now() - started),
  };
}
