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

// 盤面の描画: 印は「提出した並び」への判定として固定される（Issue #354）。
// 盤面の現在の並び（初期並び [b,a,c,d]）ではなく、submittedLineIds から判定する。
const code = { lines: solution4.map(id => ({ id, text: `code-${id}` })) };
const question = { id: "q", kind: "parsons", lineIds: ["b", "a", "c", "d"], correctAnswer: { kind: "order", lineIds: solution4 } };
const board = (orderFeedback) => renderToStaticMarkup(createElement(ParsonsBoard, { question, code, orderFeedback }));
const keepRowOf = (html, id) => new RegExp(`data-parsons-line-id="${id}"[^>]*data-parsons-keep="true"`).test(html);
// 提出した並び [b,a,c,d] が誤答: 最長部分列 [b,c,d] にだけ印。a だけ印なし。
const submittedSame = board({ solutionLineIds: solution4, active: true, submittedLineIds: ["b", "a", "c", "d"] });
assert(submittedSame.includes("✓ は移動不要"), "legend is shown after a wrong submission");
assert.equal((submittedSame.match(/data-parsons-keep="true"/g) || []).length, 3, "three kept rows are marked");
assert(keepRowOf(submittedSame, "b") && keepRowOf(submittedSame, "c") && keepRowOf(submittedSame, "d") && !keepRowOf(submittedSame, "a"), "marks follow the submitted order's relative-order judgement");
// 提出した並びが現在の盤面と違っても、印は提出時の判定のまま（ドラッグで更新しない）。
// 逆順 [d,c,b,a] の提出では残せるのは d だけ。ライブ判定なら [b,c,d] に付くはずで、付かないことを確認する。
const submittedReversed = board({ solutionLineIds: solution4, active: true, submittedLineIds: ["d", "c", "b", "a"] });
assert.equal((submittedReversed.match(/data-parsons-keep="true"/g) || []).length, 1, "only the submitted order's keep row is marked");
assert(keepRowOf(submittedReversed, "d") && !keepRowOf(submittedReversed, "b") && !keepRowOf(submittedReversed, "c") && !keepRowOf(submittedReversed, "a"), "marks stay frozen to the submitted order, not the live order");
assert(submittedReversed.includes("data-parsons-order-legend"), "legend follows the frozen judgement");
// 提出した並びが正解なら、盤面の並びが誤っていても印も凡例も出ない。
const submittedCorrect = board({ solutionLineIds: solution4, active: true, submittedLineIds: solution4 });
assert(!submittedCorrect.includes("data-parsons-keep"), "no marks when the submitted order is correct");
assert(!submittedCorrect.includes("data-parsons-order-legend"), "no legend when the submitted order is correct");
// 未提出（submittedLineIds なし）のときは印も凡例も出ない。
const inactive = board({ solutionLineIds: solution4, active: false });
assert(!inactive.includes("data-parsons-keep"), "no marks before the first answer");
assert(!inactive.includes("data-parsons-order-legend"), "no legend before the first answer");
// orderFeedback 未指定（フェーズ7ヒントL4等）も従来表示のまま。
const plain = board(undefined);
assert(!plain.includes("data-parsons-keep") && !plain.includes("data-parsons-order-legend"), "default board is unchanged");

// フェード型: 固定行は正解位置に固定表示され、印は可動行だけを判定する。
const { parsonsMovableLineIds, parsonsMovableSegments } = load(`${root}/bfs/consolidation/parsonsOrderFeedback.ts`);
const solution5 = ["s1", "s2", "s3", "s4", "s5"];
const fixed5 = ["s1", "s5"];
assert.deepEqual([...parsonsMovableLineIds(solution5, fixed5)], ["s2", "s3", "s4"]);
assert.deepEqual([...parsonsMovableLineIds(solution5)], solution5);
assert.deepEqual([...parsonsMovableSegments(solution5, fixed5)].map(segment => [...segment]), [["s2", "s3", "s4"]]);
assert.deepEqual([...parsonsMovableSegments(solution5, ["s3"])].map(segment => [...segment]), [["s1", "s2"], ["s4", "s5"]], "fixed lines split the movable range into segments");
assert.deepEqual([...parsonsMovableSegments(solution5)].map(segment => [...segment]), [solution5], "no fixed lines means one full segment");
const fadedCode = { lines: solution5.map(id => ({ id, text: `code-${id}` })) };
const fadedQuestion = { id: "q-faded", kind: "parsons", lineIds: ["s4", "s1", "s3", "s5", "s2"], correctAnswer: { kind: "order", lineIds: solution5 }, fixedLineIds: fixed5 };
const fadedHtml = renderToStaticMarkup(createElement(ParsonsBoard, { question: fadedQuestion, code: fadedCode }));
assert.deepEqual([...fadedHtml.matchAll(/data-parsons-line-id="([^"]+)"/g)].map(match => match[1]), ["s1", "s4", "s3", "s2", "s5"],
  "fixed lines pin at their solution positions and movable lines fill the remaining slots in their presented order");
const fixedRendered = [...fadedHtml.matchAll(/<div[^>]*data-parsons-fixed="true"[^>]*>/g)].map(tag => /data-parsons-line-id="([^"]+)"/.exec(tag[0])[1]);
assert.deepEqual(fixedRendered, fixed5, "exactly the fixed lines render as non-operable");
const unfadedHtml = renderToStaticMarkup(createElement(ParsonsBoard, { question: { ...fadedQuestion, fixedLineIds: undefined }, code: fadedCode }));
assert.equal((unfadedHtml.match(/<button/g) || []).length - (fadedHtml.match(/<button/g) || []).length, fixed5.length * 3,
  "each fixed row loses its drag/up/down controls");
// 提出した可動列 [s3,s2,s4]（s2 と s3 の隣接交換）では、相対順序の判定は可動列の中だけで行われ s2 だけが印なしになる。
const fadedBoard = submittedLineIds => renderToStaticMarkup(createElement(ParsonsBoard, {
  question: fadedQuestion, code: fadedCode,
  orderFeedback: { solutionLineIds: solution5, active: true, submittedLineIds },
}));
const fadedSubmitted = fadedBoard(["s1", "s3", "s2", "s4", "s5"]);
assert.equal((fadedSubmitted.match(/data-parsons-keep="true"/g) || []).length, 2, "marks land on movable rows only");
assert(keepRowOf(fadedSubmitted, "s3") && keepRowOf(fadedSubmitted, "s4") && !keepRowOf(fadedSubmitted, "s2"), "keep set is judged within the movable subsequence");
assert(!/data-parsons-line-id="s1"[^>]*data-parsons-keep/.test(fadedSubmitted) && !/data-parsons-line-id="s5"[^>]*data-parsons-keep/.test(fadedSubmitted), "fixed rows never receive keep marks");
const fadedCorrect = fadedBoard(solution5);
assert(!fadedCorrect.includes("data-parsons-keep"), "no marks for a correct faded submission");

console.log("Parsons order feedback: relative-order keep set (identity, moved-line, adjacent swap, reverse, distractor, interchangeable group), board rendering (marks frozen to the submitted order, none for a correct submission, inactive/default unchanged) and faded boards (fixed lines pinned and non-operable, marks judged on movable lines only) passed.");
