import type { PythonTestCase } from "../../../../lib/pyodideRunner";
import { bfsCode } from "../code-mapping/bfsCode";
import { bfsConsolidationContent } from "../consolidation/consolidation.content";

export type ImplementationTest = PythonTestCase & { readonly visibility: "display" | "judgement" };
const basic = { A: ["B", "C"], B: ["A", "D", "E"], C: ["A", "E"], D: ["B", "F"], E: ["B", "C", "F"], F: ["D", "E"] };
const transfer = { G: ["H", "I"], H: ["G", "J"], I: ["G", "J", "K"], J: ["H", "I", "L"], K: ["I", "L"], L: ["J", "K"] };
const distances = { A: 0, B: 1, C: 1, D: 2, E: 2, F: 3 };
const parsonsQuestion = bfsConsolidationContent.questions.find(question => question.kind === "parsons");
if (!parsonsQuestion || parsonsQuestion.kind !== "parsons") throw new Error("Phase 6 Parsons question is required");

export const bfsImplementationContent = {
  version: 1, id: "bfs-implementation", phase: 7,
  caption: "出発点から各場所までの距離を返すコードを完成させ、実行して確かめましょう。",
  template: "from collections import deque\ndef bfs_distances(graph, start):\n    # ここに、出発点からの距離を返すコードを書く\n    pass",
  chips: ["deque", "queue", "distances", "graph", "start", "node", "neighbor", "popleft()", "append()", "while", "for", "if", "not in", "return"],
  chipInstruction: "トークンをタップすると、カーソル位置に挿入できます。",
  tests: [
    { id: "D1", label: "基本（フェーズ2のグラフ）", visibility: "display", functionName: "bfs_distances", args: [basic, "A"], expected: distances },
    { id: "D2", label: "転移（フェーズ6のグラフ）", visibility: "display", functionName: "bfs_distances", args: [transfer, "G"], expected: { G: 0, H: 1, I: 1, J: 2, K: 2, L: 3 } },
    { id: "J1", label: "たどり着けない場所を含む", visibility: "judgement", functionName: "bfs_distances", args: [{ ...basic, Z: [] }, "A"], expected: distances },
    { id: "J2", label: "出発点だけのグラフ", visibility: "judgement", functionName: "bfs_distances", args: [{ A: [] }, "A"], expected: { A: 0 } },
    { id: "J3", label: "隣の情報が未登録の場所を含む", visibility: "judgement", functionName: "bfs_distances", args: [{ A: ["B"] }, "A"], expected: { A: 0, B: 1 } },
  ] satisfies ImplementationTest[],
  hints: {
    labels: ["ヒント1：エラーの種別を見る", "ヒント2：フェーズ6のParsonsを確認する", "ヒント3：正解コードとの差分を見る"],
    compactLabels: ["ヒント1", "ヒント2", "ヒント3"],
    messages: {
      unexecuted: "まだコードを実行していません。",
      syntax: "文法エラーのため実行できていないテストがあります。",
      runtime: "実行の途中でエラーが起きているテストがあります。",
      mismatch: "実行はできていますが、結果が期待と違うテストがあります。",
    },
    parsonsTitle: "フェーズ6のコードの流れを再確認する",
    parsonsQuestion,
    diffTitle: "現在のコードと正解コードを見比べる",
    referenceCode: bfsCode.lines.map(line => line.text).join("\n"),
  },
  status: {
    loading: "Python実行環境を読み込み中です。", ready: "実行できます。", running: "テストを実行中です。",
    unavailable: "Python実行環境を読み込めませんでした。再読込して試してください。",
    editorLoading: "コードエディタを読み込み中です。", error: "実行の途中でエラーが起きました。",
  },
  result: {
    title: "幅優先探索（BFS）マスター！",
    closing: "幅優先探索のコードを完成させ、基本ケースと境界ケースのすべてのテストを通過しました。この単元の学習は完了です。",
  },
} as const;
