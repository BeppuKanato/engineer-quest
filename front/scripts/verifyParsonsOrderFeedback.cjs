const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const cache = new Map();
function load(filename) {
  filename = path.resolve(filename);
  if (cache.has(filename)) return cache.get(filename);
  const exports = {};
  cache.set(filename, exports);
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, { exports, require: name => {
    if (!name.startsWith(".")) return require(name);
    const base = path.resolve(path.dirname(filename), name);
    return load([`${base}.ts`, `${base}.tsx`].find(file => fs.existsSync(file)));
  } }, { filename });
  return exports;
}
const root = path.resolve(__dirname, "../src/features/learning");
const { parsonsKeepLineIds, isParsonsOrderCorrect } = load(`${root}/bfs/consolidation/parsonsOrderFeedback.ts`);
const { ParsonsBoard } = load(`${root}/bfs/consolidation/ParsonsBoard.tsx`);
const { createElement } = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const sorted = set => [...set].sort();

// 同一順序: 全行が残せる。
const solution4 = ["a", "b", "c", "d"];
assert.deepEqual(sorted(parsonsKeepLineIds(solution4, solution4)), solution4);
assert.equal(isParsonsOrderCorrect(solution4, solution4), true);

// ユーザーの例: 15行のうち最後の行だけを先頭へ動かした並び。
// 絶対位置照合ではずれた全行が間違いになるが、相対順序では動かした1行だけが対象外になる。
const solution15 = Array.from({ length: 15 }, (_, i) => `line-${i + 1}`);
const moved = ["line-15", ...solution15.slice(0, 14)];
const keepMoved = parsonsKeepLineIds(moved, solution15);
assert.equal(keepMoved.size, 14);
assert(!keepMoved.has("line-15"), "only the moved line is unmarked");
assert.deepEqual(sorted(keepMoved), sorted(solution15.slice(0, 14)));
assert.equal(isParsonsOrderCorrect(moved, solution15), false);

// 隣接交換: 印が付かないのは1行だけ。現在の並びで前に出た行（c）が残り、後ろの行（b）が対象になる。
const swapped = ["a", "c", "b", "d"];
const keepSwapped = parsonsKeepLineIds(swapped, solution4);
assert.deepEqual(sorted(keepSwapped), ["a", "c", "d"]);
assert(!keepSwapped.has("b"), "the later-position line of the swapped pair is the one to move");

// 完全な逆順: 残せるのは1行だけ（現在の並びで最も前の行）。
const reversed = ["d", "c", "b", "a"];
assert.deepEqual(sorted(parsonsKeepLineIds(reversed, solution4)), ["d"]);

// 空・1行・正解に無い行（ディストラクタ）。
assert.deepEqual(sorted(parsonsKeepLineIds([], solution4)), []);
assert.deepEqual(sorted(parsonsKeepLineIds(["a"], solution4)), ["a"]);
assert.deepEqual(sorted(parsonsKeepLineIds(["x"], solution4)), []);
assert.deepEqual(sorted(parsonsKeepLineIds(["x", "a", "b"], solution4)), ["a", "b"]);

// 入れ替え可能グループ: 連続ブロック内の交換は正解として扱い、全行が残せる。
const groups = [["init-d", "init-q"]];
const solutionG = ["init-d", "init-q", "body", "tail"];
const learnerG = ["init-q", "init-d", "body", "tail"];
assert.equal(isParsonsOrderCorrect(learnerG, solutionG, groups), true);
assert.deepEqual(sorted(parsonsKeepLineIds(learnerG, solutionG, groups)), sorted(solutionG));
// グループが非連続に散らばった場合は許容しない。
const scattered = ["init-q", "body", "init-d", "tail"];
assert.equal(isParsonsOrderCorrect(scattered, solutionG, groups), false);

// 盤面の描画: 回答済み（active）で未正解の初期並びでは、残せる行にだけ印と凡例が出る。
const code = { lines: solution4.map(id => ({ id, text: `code-${id}` })) };
const question = { id: "q", kind: "parsons", lineIds: ["b", "a", "c", "d"], correctAnswer: { kind: "order", lineIds: solution4 } };
const board = (orderFeedback) => renderToStaticMarkup(createElement(ParsonsBoard, { question, code, orderFeedback }));
const active = board({ solutionLineIds: solution4, active: true });
// 初期並び [b,a,c,d] の最長部分列は [b,c,d]（前の行優先）なので、a だけ印なし。
assert(active.includes("✓ が付いた行は、動かさなくて大丈夫です"), "legend is shown while feedback is active");
assert.equal((active.match(/data-parsons-keep="true"/g) || []).length, 3, "three kept rows are marked");
const keepRowOf = (html, id) => new RegExp(`data-parsons-line-id="${id}"[^>]*data-parsons-keep="true"`).test(html);
assert(keepRowOf(active, "b") && keepRowOf(active, "c") && keepRowOf(active, "d") && !keepRowOf(active, "a"), "marks follow the relative-order judgement");
// 未回答（active でない）ときは印も凡例も出ない。
const inactive = board({ solutionLineIds: solution4, active: false });
assert(!inactive.includes("data-parsons-keep"), "no marks before the first answer");
assert(!inactive.includes("動かさなくて大丈夫です"), "no legend before the first answer");
// orderFeedback 未指定（フェーズ7ヒントL4等）も従来表示のまま。
const plain = board(undefined);
assert(!plain.includes("data-parsons-keep") && !plain.includes("動かさなくて大丈夫です"), "default board is unchanged");

console.log("Parsons order feedback: relative-order keep set (identity, moved-line, adjacent swap, reverse, distractor, interchangeable group) and board rendering (marks, legend, inactive/default unchanged) passed.");
