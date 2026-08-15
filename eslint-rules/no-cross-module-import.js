import path from "node:path";

/**
 * Proíbe import entre módulos de negócio.
 *
 * Um módulo pode importar de `components/`, `lib/`, `hooks/`, `app/` e
 * `integrations/`. **Não pode importar de outro módulo** — nem pelo alias
 * `@/modules/...`, nem por caminho relativo `../outro-modulo/...`.
 *
 * ## Por que uma regra própria
 *
 * `no-restricted-imports` casa contra o **texto** do import e não sabe onde o
 * arquivo está. Não consegue separar `../lib/x`, que fica dentro do próprio
 * módulo e é legítimo, de `../outro/x`, que atravessa a fronteira. As duas
 * strings começam igual.
 *
 * As alternativas prontas resolvem isso lendo o disco, e para lidar com `.ts` e
 * com o alias `@/` puxam junto uma cadeia de resolvedores. Aqui não é preciso:
 * a decisão depende só do **prefixo de diretório**, não do arquivo existir.
 * Comparar prefixo é exato e não tem o que quebrar.
 *
 * ## Por que a regra existe
 *
 * Fronteira frouxa entre domínios vira, em seis meses, um grafo em que mexer no
 * CRM quebra a fila de publicação. Quando dois módulos precisarem de verdade da
 * mesma coisa, ela sobe para `lib/` ou `components/shared/`, ou a conversa passa
 * pelo banco.
 */

const MODULES_ROOT = "src/modules";

/** Normaliza para caminho POSIX relativo à raiz do repositório. */
function toRepoPath(absolute, cwd) {
  return path.relative(cwd, absolute).split(path.sep).join("/");
}

/**
 * Nome do módulo a que um caminho pertence, ou `null` se ele estiver fora de
 * `src/modules/`.
 */
function moduleOf(repoPath) {
  const prefix = `${MODULES_ROOT}/`;
  if (!repoPath.startsWith(prefix)) return null;
  const [name] = repoPath.slice(prefix.length).split("/");
  return name || null;
}

/**
 * Resolve o alvo do import para caminho relativo à raiz.
 * Devolve `null` para pacote externo, que não interessa a esta regra.
 */
function resolveTarget(source, fromRepoPath) {
  if (source.startsWith("@/")) {
    return `src/${source.slice(2)}`;
  }
  if (source.startsWith("./") || source.startsWith("../")) {
    const dir = path.posix.dirname(fromRepoPath);
    return path.posix.normalize(path.posix.join(dir, source));
  }
  return null;
}

export const noCrossModuleImport = {
  meta: {
    type: "problem",
    docs: {
      description: "Proíbe um módulo de negócio importar de outro módulo.",
    },
    schema: [],
    messages: {
      crossModule:
        "Módulo `{{from}}` não pode importar do módulo `{{to}}`. " +
        "Promova o código compartilhado para `lib/` ou `components/shared/`, " +
        "ou faça a conversa passar pelo banco.",
    },
  },

  create(context) {
    const cwd = context.cwd ?? process.cwd();
    const fromRepoPath = toRepoPath(context.filename, cwd);
    const fromModule = moduleOf(fromRepoPath);

    // A regra só se aplica a arquivos dentro de um módulo.
    if (!fromModule) return {};

    function check(node, source) {
      if (typeof source !== "string") return;

      const target = resolveTarget(source, fromRepoPath);
      if (!target) return;

      const toModule = moduleOf(target);
      if (!toModule || toModule === fromModule) return;

      context.report({
        node,
        messageId: "crossModule",
        data: { from: fromModule, to: toModule },
      });
    }

    return {
      ImportDeclaration: (node) => check(node, node.source.value),
      ExportNamedDeclaration: (node) => node.source && check(node, node.source.value),
      ExportAllDeclaration: (node) => check(node, node.source.value),
      ImportExpression: (node) =>
        node.source.type === "Literal" && check(node, node.source.value),
    };
  },
};

export default {
  rules: { "no-cross-module-import": noCrossModuleImport },
};
