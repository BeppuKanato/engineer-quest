import type { PythonTestCase } from "../../../../lib/pyodideRunner";
import { bubbleSortMainValues, bubbleSortTransferValues, runBubbleSort } from "../bubbleSort";
import { bubbleSortCode } from "../code-mapping/bubbleSortCode";
import { bubbleSortConsolidationContent } from "../consolidation/consolidation.content";

export type ImplementationTest = PythonTestCase & { readonly visibility: "display" | "judgement" };

/** 期待する並びは教材データの正本（bubbleSort の組み立て）から導き、フェーズ1〜6の教材とずらさない。 */
const testCase = (id: string, label: string, visibility: ImplementationTest["visibility"], values: readonly number[]): ImplementationTest => ({
  id, label, visibility, functionName: "bubble_sort",
  args: [[...values]], expected: [...runBubbleSort(values)],
});

const parsonsQuestion = bubbleSortConsolidationContent.questions.find(question => question.kind === "parsons");
if (!parsonsQuestion || parsonsQuestion.kind !== "parsons") throw new Error("Phase 6 Parsons question is required");

const skeletonLineIds = ["for-pass", "for-compare", "if-larger"] as const;

export const bubbleSortImplementationContent = {
  version: 1, id: "bubble-sort-implementation", phase: 7,
  caption: "数を小さい順に並び替えるコードを完成させ、実行して確かめましょう。",
  template: "def bubble_sort(values):\n    # ここに、並び替えた新しいリストを返すコードを書く\n    pass",
  tests: [
    testCase("D1", "基本（動きの説明の並び）", "display", bubbleSortMainValues),
    testCase("D2", "転移（応用問題の並び）", "display", bubbleSortTransferValues),
    testCase("J1", "重複あり", "judgement", [3, 1, 3, 2]),
    testCase("J2", "逆順", "judgement", [5, 4, 3, 2, 1]),
    testCase("J3", "並び済み", "judgement", [1, 2, 3, 4]),
  ] satisfies ImplementationTest[],
  hints: {
    labels: ["ヒント1：使う部品を見る", "ヒント2：処理の流れを見る", "ヒント3：条件とループの骨格を見る", "ヒント4：並び替えで確認する"],
    compactLabels: ["ヒント1", "ヒント2", "ヒント3", "ヒント4"],
    variables: [
      { name: "result", description: "並び替えるための、入力をコピーしたリスト" },
      { name: "n", description: "リストの長さ" },
    ],
    tokens: ["result", "values", "n", "for", "if", "list(values)", "len(result)", "range(n - 1)", "range(n - 1 - i)", "result[j] > result[j + 1]", "result[j], result[j + 1] = result[j + 1], result[j]", "return"],
    tokenInstruction: "トークンを選ぶとヒントを閉じ、カーソル位置に挿入します。",
    tokenGroupLabel: "使う部品のトークン",
    flow: [
      "左端から右端まで、隣同士を比べていく",
      "左が大きければ入れ替える",
      "右端が決まったら、範囲を1つ狭めてくり返す",
    ],
    loopLabel: "範囲が1つになるまでくり返し",
    skeletonLineIds,
    skeletonLines: skeletonLineIds.map(id => {
      const line = bubbleSortCode.lines.find(line => line.id === id);
      if (!line) throw new Error("Missing skeleton line");
      return line;
    }),
    parsonsQuestion,
    closeLabel: "ヒントを閉じる",
    groupLabel: "段階式ヒント",
  },
  display: {
    listLabel: "テスト結果一覧", errorLabel: "直近の実行結果",
    inputLabel: "入力",
    expectedLabel: "期待する並び", actualLabel: "実際の並び", noOutput: "—",
    invalid: "数値のリストではありません", lengthMismatch: "リストの長さが期待と違います",
    different: "期待と違う場所：{count}個",
    statuses: { passed: { icon: "✓", label: "通過" }, failed: { icon: "×", label: "未通過" }, unexecuted: { icon: "○", label: "未実行" } },
    messages: {
      syntax: "文法エラーのため実行できていないテストがあります。",
      runtime: "実行時エラーが起きているテストがあります。",
      timeout: "実行が終わらないテストがあります（無限ループの可能性があります）。",
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
    title: "バブルソートマスター！",
    finalButton: "単元の結果を見る",
    closing: "バブルソートのコードを完成させ、基本ケースと境界ケースのすべてのテストを通過しました。この単元の学習は完了です。",
  },
} as const;
