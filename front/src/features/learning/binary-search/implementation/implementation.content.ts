import type { PythonTestCase } from "../../../../lib/pyodideRunner";
import {
  binarySearchMainTarget, binarySearchMainValues, binarySearchTransferTarget,
  binarySearchTransferValues, runBinarySearch,
} from "../binarySearch";
import { binarySearchCode } from "../code-mapping/binarySearchCode";
import { binarySearchConsolidationContent } from "../consolidation/consolidation.content";

export type ImplementationTest = PythonTestCase & { readonly visibility: "display" | "judgement" };

/** 期待する位置は教材データの正本（binarySearch の実行記録）から導き、フェーズ1〜6の教材とずらさない。 */
const testCase = (id: string, label: string, visibility: ImplementationTest["visibility"], values: readonly number[], target: number): ImplementationTest => ({
  id, label, visibility, functionName: "binary_search",
  args: [[...values], target], expected: runBinarySearch(values, target),
});

const parsonsQuestion = binarySearchConsolidationContent.questions.find(question => question.kind === "parsons");
if (!parsonsQuestion || parsonsQuestion.kind !== "parsons") throw new Error("Phase 6 Parsons question is required");

const skeletonLineIds = ["while-range", "if-hit", "elif-smaller", "else-larger"] as const;

export const binarySearchImplementationContent = {
  version: 1, id: "binary-search-implementation", phase: 7,
  caption: "小さい順に並んだ数字から目的の値を探すコードを完成させ、実行して確かめましょう。",
  template: "def binary_search(values, target):\n    \"\"\"values（小さい順に並んだ数字のリスト）の中から target を探し、その位置を返す。無い場合は -1 を返す。\"\"\"\n    pass",
  tests: [
    testCase("D1", "基本（動きの説明のリスト）", "display", binarySearchMainValues, binarySearchMainTarget),
    testCase("J1", "基本と同じリスト", "judgement", binarySearchMainValues, binarySearchMainTarget),
    testCase("J2", "長いリスト（応用問題のリスト）", "judgement", binarySearchTransferValues, binarySearchTransferTarget),
    testCase("J3", "リストに無い値", "judgement", binarySearchMainValues, 20),
  ] satisfies ImplementationTest[],
  hints: {
    labels: ["ヒント1：使う部品を見る", "ヒント2：処理の流れを見る", "ヒント3：条件とループの骨格を見る", "ヒント4：並び替えで確認する"],
    compactLabels: ["ヒント1", "ヒント2", "ヒント3", "ヒント4"],
    variables: [
      { name: "lo", description: "探す範囲の左端の位置" },
      { name: "hi", description: "探す範囲の右端の位置" },
      { name: "mid", description: "探す範囲の真ん中の位置" },
    ],
    tokens: ["lo", "hi", "mid", "values", "target", "len(values) - 1", "while", "if", "elif", "else", "(lo + hi) // 2", "values[mid] == target", "values[mid] < target", "lo = mid + 1", "hi = mid - 1", "return mid", "return -1"],
    tokenInstruction: "トークンを選ぶとヒントを閉じ、カーソル位置に挿入します。",
    tokenGroupLabel: "使う部品のトークン",
    flow: [
      "探す範囲の両端（左端と右端）を決める",
      "真ん中の位置を計算して、その値と探す値を比べる",
      "一致したら、その位置を返す",
      "真ん中より小さい側か大きい側かを捨てて、範囲を狭める",
      "範囲が空になったら、無いことを表す -1 を返す",
    ],
    loopLabel: "範囲が残っている間くり返し",
    skeletonLineIds,
    skeletonLines: skeletonLineIds.map(id => {
      const line = binarySearchCode.lines.find(line => line.id === id);
      if (!line) throw new Error("Missing skeleton line");
      return line;
    }),
    parsonsQuestion,
    closeLabel: "ヒントを閉じる",
    groupLabel: "段階式ヒント",
  },
  display: {
    listLabel: "テスト結果一覧", errorLabel: "直近の実行結果",
    valuesLabel: "リスト", targetLabel: "探す値",
    expectedLabel: "期待する位置", actualLabel: "実際の位置", noOutput: "—",
    position: "位置 {index}", notFound: "-1（見つかりませんでした）",
    invalid: "位置を表す数値ではありません", outOfRange: "リストの範囲外の位置です",
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
    title: "二分探索マスター！",
    finalButton: "単元の結果を見る",
    closing: "二分探索のコードを完成させ、基本・転移・不在のすべてのテストを通過しました。この単元の学習は完了です。",
  },
} as const;
