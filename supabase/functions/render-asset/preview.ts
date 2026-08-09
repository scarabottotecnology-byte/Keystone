/**
 * Pré-visualização local dos templates.
 *
 * ```
 * deno run -A supabase/functions/render-asset/preview.ts
 * ```
 *
 * Gera um PNG por template em `.preview/`. Existe porque template é trabalho de
 * design, e design se avalia olhando — não lendo o spec. Sem isto, ajustar um
 * corpo de fonte exigiria fazer deploy para ver o resultado.
 *
 * `.preview/` é ignorado pelo git.
 */
import { compose } from "./compose.ts";
import { TEMPLATES } from "./templates.ts";

const AMOSTRAS: Record<string, { payload: Record<string, string>; copy: string }> = {
  dado: {
    payload: {
      eyebrow: "Controladoria · Custos",
      valor: "43%",
      afirmacao:
        "do overhead industrial não é rateado por nenhuma base defensável — vira margem que ninguém explica.",
      fonte: "Keystone Controladoria · amostra de 34 indústrias, 2026",
    },
    copy:
      "Levantamos 34 indústrias e o número não muda muito: 43% do overhead não " +
      "tem base de rateio defensável. Não é erro de cálculo, é ausência de critério.",
  },
  afirmacao: {
    payload: {
      eyebrow: "Controladoria · Margem",
      tese: "Produto deficitário não aparece no DRE. Ele aparece na conta bancária, três meses depois.",
      apoio:
        "Custeio por absorção distribui o fixo por volume e faz o item que dá prejuízo parecer saudável.",
      fonte: "Keystone Controladoria",
    },
    copy:
      "Produto deficitário não aparece no DRE consolidado. O custeio por absorção " +
      "distribui o fixo por volume, e o item que destrói margem sai do relatório parecendo saudável.",
  },
};

const outDir = new URL("./.preview/", import.meta.url);
await Deno.mkdir(outDir, { recursive: true });

for (const [key, spec] of Object.entries(TEMPLATES)) {
  const amostra = AMOSTRAS[key];
  if (!amostra) {
    console.log(`· ${key.padEnd(12)} sem amostra — pulado`);
    continue;
  }

  try {
    const out = await compose({ spec, ...amostra });
    const file = new URL(`${key}.png`, outDir);
    await Deno.writeFile(file, out.png);
    console.log(
      `✓ ${key.padEnd(12)} ${out.width}×${out.height}  ${out.durationMs}ms  ` +
        `${(out.png.length / 1024).toFixed(0)} kB`,
    );
  } catch (error) {
    console.error(`✗ ${key.padEnd(12)} ${(error as Error).message}`);
  }
}
