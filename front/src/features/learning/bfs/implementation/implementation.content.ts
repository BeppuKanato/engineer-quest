import type { PythonTestCase } from "../../../../lib/pyodideRunner";
import { searchGraph } from "../../graphs/searchGraph";
import { transferGraph } from "../consolidation/consolidation.graphs";
import { bfsCode } from "../code-mapping/bfsCode";
import { bfsConsolidationContent } from "../consolidation/consolidation.content";

export type ImplementationTest = PythonTestCase & { readonly visibility: "display" | "judgement" };
const basic = { A: ["B", "C"], B: ["A", "D", "E"], C: ["A", "E"], D: ["B", "F"], E: ["B", "C", "F"], F: ["D", "E"] };
const transfer = { G: ["H", "I"], H: ["G", "J"], I: ["G", "J", "K"], J: ["H", "I", "L"], K: ["I", "L"], L: ["J", "K"] };
const distances = { A: 0, B: 1, C: 1, D: 2, E: 2, F: 3 };
const parsonsQuestion = bfsConsolidationContent.questions.find(question => question.kind === "parsons");
if (!parsonsQuestion || parsonsQuestion.kind !== "parsons") throw new Error("Phase 6 Parsons question is required");

const skeletonLineIds = ["while-queue", "for-neighbor", "if-undiscovered"] as const;

export const bfsImplementationContent = {
  version: 1, id: "bfs-implementation", phase: 7,
  caption: "出発点から各場所までの距離を返すコードを完成させ、実行して確かめましょう。",
  template: "from collections import deque\ndef bfs_distances(graph, start):\n    # ここに、出発点からの距離を返すコードを書く\n    pass",
  tests: [
    { id: "D1", label: "基本（動きの説明のグラフ）", visibility: "display", functionName: "bfs_distances", args: [basic, "A"], expected: distances },
    { id: "D2", label: "転移（応用問題のグラフ）", visibility: "display", functionName: "bfs_distances", args: [transfer, "G"], expected: { G: 0, H: 1, I: 1, J: 2, K: 2, L: 3 } },
    { id: "J1", label: "たどり着けない場所を含む", visibility: "judgement", functionName: "bfs_distances", args: [{ ...basic, Z: [] }, "A"], expected: distances },
    { id: "J2", label: "出発点だけのグラフ", visibility: "judgement", functionName: "bfs_distances", args: [{ A: [] }, "A"], expected: { A: 0 } },
    { id: "J3", label: "隣の情報が未登録の場所を含む", visibility: "judgement", functionName: "bfs_distances", args: [{ A: ["B"] }, "A"], expected: { A: 0, B: 1 } },
  ] satisfies ImplementationTest[],
  displayScenes: [
    { testId: "D1", graph: searchGraph, start: "A" },
    { testId: "D2", graph: transferGraph, start: "G" },
  ],
  hints: {
    labels: ["ヒント1：使う部品を見る", "ヒント2：処理の流れを見る", "ヒント3：条件とループの骨格を見る", "ヒント4：並び替えで確認する"],
    compactLabels: ["ヒント1", "ヒント2", "ヒント3", "ヒント4"],
    variables: [
      { name: "distances", description: "出発点からの距離を記録する辞書" },
      { name: "queue", description: "これから調べる場所を並べるキュー" },
    ],
    tokens: ["deque", "queue", "distances", "graph", "start", "node", "neighbor", "popleft()", "append()", "while", "for", "if", "not in", "return"],
    tokenInstruction: "トークンを選ぶとヒントを閉じ、カーソル位置に挿入します。",
    tokenGroupLabel: "使う部品のトークン",
    flow: [
      "出発点の距離を0として記録し、出発点をキューに入れる",
      "キューの先頭の場所を取り出す",
      "取り出した場所の隣のうち、まだ距離が決まっていない場所について、取り出した場所の距離に1を足したものを距離として記録し、キューに入れる",
      "キューが空になるまで2と3を繰り返し、最後に記録した距離を返す",
    ],
    skeletonLineIds,
    skeletonLines: skeletonLineIds.map(id => {
      const line = bfsCode.lines.find(line => line.id === id);
      if (!line) throw new Error("Missing skeleton line");
      return line;
    }),
    parsonsQuestion,
    closeLabel: "ヒントを閉じる",
    groupLabel: "段階式ヒント",
  },
  display: {
    listLabel: "テスト結果一覧", startLabel: "出発点", errorLabel: "直近の実行結果",
    expectedLabel: "期待値", actualLabel: "実際の出力", noOutput: "—", unit: "歩",
    missing: "項目なし", extra: "余分な項目", different: "期待と異なる", invalid: "距離の辞書ではありません", invalidValue: "数値ではありません",
    statuses: { passed: { icon: "✓", label: "通過" }, failed: { icon: "×", label: "未通過" }, unexecuted: { icon: "○", label: "未実行" } },
    messages: {
      syntax: "文法エラーのため実行できていないテストがあります。",
      runtime: "実行時エラーが起きているテストがあります。",
      timeout: "実行が終わらないテストがあります（無限ループの可能性があります）",
      mismatch: "実行はできていますが、結果が期待と違うテストがあります。",
    },
  },
  status: {
    loading: "Python実行環境を読み込み中です。", ready: "実行できます。", running: "テストを実行中です（{current}/{total}件目）",
    timeoutNotice: "各テストの実行は最大15秒です。タイムアウト後も残りのテストを続けます。",
    unavailable: "Python実行環境を読み込めませんでした。再読込して試してください。",
    editorLoading: "コードエディタを読み込み中です。",
  },
  controls: { run: "テストを実行する", reload: "実行環境を再読込" },
  result: {
    runsLabel: "テスト実行回数：{count}回", hintLabel: "ヒントレベル{level}：{count}回",
    title: "幅優先探索（BFS）マスター！",
    finalButton: "単元の結果を見る",
    closing: "幅優先探索のコードを完成させ、基本ケースと境界ケースのすべてのテストを通過しました。この単元の学習は完了です。",
  },
} as const;
