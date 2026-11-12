const path = require("node:path");
const sourceRoot = path.resolve(__dirname, "../src");
const shared = new Set(["components", "hooks", "lib", "config", "types", "utils", "api", "testing"]);
const learningShared = new Set(["components", "assessment", "implementation", "code", "player", "trace", "unit"]);
const unitNames = new Set(["bfs", "dfs", "bubble-sort", "binary-search", "greedy-coins", "wall-extension", "maze-digging"]);
const relative = file => path.relative(sourceRoot, file).split(path.sep).join("/");
module.exports = {
  rules: {
    "import-boundaries": {
      meta: { type: "problem", schema: [], messages: {
        shared: "共有領域から{{target}}へ依存できません。機能側へ移すか、構成側から渡してください。",
        app: "featureからappの内部へ依存できません。共通契約かappの組み立てへ分けてください。",
        feature: "独立feature間の内部参照は禁止です。appで組み合わせるか共通契約を使ってください。",
        unit: "学習の共有部品から特定単元へ依存できません。教材・描画・実行器を渡してください。",
      } },
      create(context) {
        const filename = context.filename ?? context.getFilename();
        const from = relative(filename).split("/");
        function check(node, name) {
          if (typeof name !== "string") return;
          const resolved = name.startsWith("@/") ? path.resolve(sourceRoot, name.slice(2))
            : name.startsWith(".") ? path.resolve(path.dirname(filename), name) : null;
          if (!resolved) return;
          const target = relative(resolved).split("/");
          let messageId;
          if (shared.has(from[0]) && ["features", "app"].includes(target[0])) messageId = "shared";
          else if (from[0] === "features" && target[0] === "app") messageId = "app";
          else if (from[0] === "features" && target[0] === "features" && from[1] !== target[1]) messageId = "feature";
          else if (from[0] === "features" && from[1] === "learning" && learningShared.has(from[2]) && target[0] === "features" && target[1] === "learning" && (target[2] === "units" || unitNames.has(target[2]))) messageId = "unit";
          if (messageId) context.report({ node, messageId, data: { target: target[0] } });
        }
        return {
          ImportDeclaration: node => check(node.source, node.source.value),
          ExportNamedDeclaration: node => node.source && check(node.source, node.source.value),
          ExportAllDeclaration: node => check(node.source, node.source.value),
          ImportExpression: node => check(node.source, node.source.value),
          TSImportType: node => { const literal = node.argument?.literal ?? node.argument; if (literal) check(literal, literal.value); },
          CallExpression: node => { if (node.callee.type === "Identifier" && node.callee.name === "require") check(node.arguments[0], node.arguments[0]?.value); },
        };
      },
    },
  },
};