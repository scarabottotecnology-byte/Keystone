/**
 * Proíbe `a || literal-que-mascara` — FASE 2, subtarefa 10 do documento 12.
 *
 * ## O defeito que a regra impede
 *
 * `saldo || 0`, `nome || ""` e `ativo || false` fazem duas situações muito
 * diferentes renderizarem exatamente igual: "o valor é zero/vazio/falso" e "o
 * dado não chegou". A tela que devia mostrar "indisponível" mostra um número
 * real — e ninguém percebe a diferença até um relatório sair errado.
 *
 * `??` resolve isto porque só substitui `null`/`undefined`, preservando um
 * zero ou uma string vazia genuínos como o que são.
 *
 * ## Por que só estes três literais
 *
 * `||` tem uso legítimo de sobra — lógica booleana, encadeamento de condição,
 * `className || "default"` num componente puramente visual. Marcar todo `||`
 * produziria ruído sem relação com o defeito real. O padrão que de fato mascara
 * dado ausente é específico: o lado direito é um literal que **também é** o
 * valor "vazio" do tipo — `0` para número, `""` para texto, `false` para
 * booleano. É esse literal, não o operador em si, que denuncia a intenção de
 * preencher um buraco em vez de tratar o estado desconhecido.
 *
 * Módulo em JS puro, sem dependência nova — mesmo padrão de
 * `no-cross-module-import.js`.
 */

const MASKING_VALUES = new Set([0, "", false]);

function isMaskingLiteral(node) {
  return node.type === "Literal" && MASKING_VALUES.has(node.value);
}

export const noMaskingFallback = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Proíbe `a || 0`, `a || \"\"` e `a || false` — use `??` para não " +
        "confundir dado ausente com dado igual ao valor vazio do tipo.",
    },
    schema: [],
    messages: {
      maskingFallback:
        "`{{left}} || {{right}}` esconde a diferença entre \"o valor é " +
        "{{right}}\" e \"o campo não veio\". Troque por `??` — ou, se o " +
        "estado ausente precisa de tratamento próprio, escreva-o explicitamente.",
    },
  },

  create(context) {
    return {
      LogicalExpression(node) {
        if (node.operator !== "||") return;
        if (!isMaskingLiteral(node.right)) return;

        const sourceCode = context.sourceCode ?? context.getSourceCode();
        context.report({
          node,
          messageId: "maskingFallback",
          data: {
            left: sourceCode.getText(node.left),
            right: JSON.stringify(node.right.value),
          },
        });
      },
    };
  },
};

export default {
  rules: { "no-masking-fallback": noMaskingFallback },
};
