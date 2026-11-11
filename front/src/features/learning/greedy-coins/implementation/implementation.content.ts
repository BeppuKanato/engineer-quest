import type { PythonTestCase } from "../../../../lib/pyodideRunner";
import type { ImplementationInputLevel } from "../../implementation/inputLevel";
import {
  greedyCoinsCounterexampleAmount, greedyCoinsCounterexampleCoins, greedyCoinsDenominations,
  greedyCoinsMainAmount, greedyCoinsTransferAmount, runGreedyCoins,
} from "../greedyCoins";
import { greedyCoinsCode } from "../code-mapping/greedyCoinsCode";
import { greedyCoinsConsolidationContent } from "../consolidation/consolidation.content";

export type ImplementationTest = PythonTestCase & { readonly visibility: "display" | "judgement" };

/** 期待する硬貨の並びは教材データの正本（greedyCoins の実行記録）から導き、フェーズ1〜6の教材とずらさない。 */
const testCase = (id: string, label: string, visibility: ImplementationTest["visibility"], amount: number, coins: readonly number[]): ImplementationTest => ({
  id, label, visibility, functionName: "greedy_coins",
  args: [amount, [...coins]], expected: [...runGreedyCoins(amount, coins)],
});

/** 別額面の例（基準データ §1、J3）。 */
const otherCoins: readonly number[] = [25, 10, 5, 1];
const otherAmount = 41;

const phase6Parsons = greedyCoinsConsolidationContent.questions.find(question => "kind" in question && question.kind === "parsons");
if (!phase6Parsons || !("kind" in phase6Parsons) || phase6Parsons.kind !== "parsons") throw new Error("Phase 6 Parsons question is required");

/**
 * ヒント4の練習盤面（基準データ §3 フェーズ7、教材指針 §7-2）。
 * フェーズ6の設問を土台に、固定行を外して全8行を並べ替え対象にする
 * （フェードさせない。DFS のヒント4と同じ扱い）。互換グループ
 * （append-coin / subtract-coin）は土台の設問から引き継ぐ。
 */
const parsonsQuestion = {
  ...phase6Parsons,
  fixedLineIds: undefined,
  lineIds: [
    "append-coin", "init-result", "while-remaining", "return-result",
    "for-coin", "subtract-coin", "define-function", "init-remaining",
  ],
  instruction: "行をドラッグするか、↑↓ボタンで動かして、処理の流れを確認します。",
};

const skeletonLineIds = ["for-coin", "while-remaining"] as const;

/**
 * 入力量レベル別の初期テンプレート（基準データ §3 フェーズ7）。
 * 「全部書く」は関数定義と docstring のみ（プレースホルダ0個）。
 * docstring の文は基準データに無いため、契約（引数 amount / coins と
 * 戻り値＝選んだ硬貨のリスト・選択順）から書いた。
 * 「骨格から書く」（3個）と「穴埋めで書く」（2個）は、基準データ §3
 * フェーズ7のコードブロックどおりの文字列をそのまま使う。
 * プレースホルダが残っていると必ずテストに失敗する。
 */
const fullTemplate = "def greedy_coins(amount, coins):\n    \"\"\"amount 円を、大きい順に与えられた coins で払い、選んだ硬貨のリスト（選択順）を返す。\"\"\"";

const skeletonTemplate = [
  "def greedy_coins(amount, coins):",
  "    result = []",
  "    remaining = amount",
  "    raise NotImplementedError # ここを書く：額面を大きい順に1つずつ取り出す繰り返し",
  "    raise NotImplementedError # ここを書く：その硬貨を、残額がその額面以上である間くり返し使う繰り返し",
  "    raise NotImplementedError # ここを書く：選んだ硬貨を記録して、残額を減らす処理",
  "    return result",
].join("\n");

const fillInTemplate = [
  "def greedy_coins(amount, coins):",
  "    result = []",
  "    remaining = amount",
  "    for coin in coins:",
  "        while remaining >= coin:",
  "            raise NotImplementedError # ここを書く：選んだ硬貨を結果に入れる",
  "            raise NotImplementedError # ここを書く：残額を使った硬貨の分だけ減らす",
  "    return result",
].join("\n");

const levelTemplates: Readonly<Record<ImplementationInputLevel, string>> = {
  full: fullTemplate,
  skeleton: skeletonTemplate,
  "fill-in": fillInTemplate,
};

export const greedyCoinsImplementationContent = {
  version: 1, id: "greedy-coins-implementation", phase: 7,
  caption: "金額を、硬貨の枚数が少なくなるように払うコードを完成させ、実行して確かめましょう。",
  template: fullTemplate,
  templates: levelTemplates,
  tests: [
    testCase("D1", "基本（動きの説明の金額）", "display", greedyCoinsMainAmount, greedyCoinsDenominations),
    testCase("J1", "基本と同じ金額", "judgement", greedyCoinsMainAmount, greedyCoinsDenominations),
    testCase("J2", "転移（応用問題の金額）", "judgement", greedyCoinsTransferAmount, greedyCoinsDenominations),
    testCase("J3", "別の額面", "judgement", otherAmount, otherCoins),
    testCase("J4", "別の額面・小さい金額", "judgement", greedyCoinsCounterexampleAmount, greedyCoinsCounterexampleCoins),
  ] satisfies ImplementationTest[],
  hints: {
    labels: ["ヒント1：使う部品を見る", "ヒント2：処理の流れを見る", "ヒント3：条件とループの骨格を見る", "ヒント4：並び替えで確認する"],
    compactLabels: ["ヒント1", "ヒント2", "ヒント3", "ヒント4"],
    variables: [
      { name: "result", description: "選んだ硬貨を入れる結果のリスト" },
      { name: "remaining", description: "残額を表す変数" },
      { name: "coin", description: "今見ている額面" },
    ],
    tokens: ["result", "remaining", "coin", "amount", "coins", "for coin in coins:", "while remaining >= coin:", "result.append(coin)", "remaining -= coin", "return result"],
    tokenInstruction: "トークンを選ぶとヒントを閉じ、カーソル位置に挿入します。",
    tokenGroupLabel: "使う部品のトークン",
    flow: [
      "結果のリストと残額を用意する",
      "額面を大きい順に1つずつ取り出す",
      "残額がその額面以上である間、その硬貨を記録して残額から引く",
      "最後に結果のリストを返す",
    ],
    loopLabel: "額面を大きい順に進め、その硬貨を使える間くり返し",
    skeletonLineIds,
    skeletonLines: skeletonLineIds.map(id => {
      const line = greedyCoinsCode.lines.find(line => line.id === id);
      if (!line) throw new Error("Missing skeleton line");
      return line;
    }),
    parsonsQuestion,
    closeLabel: "ヒントを閉じる",
    groupLabel: "段階式ヒント",
  },
  display: {
    listLabel: "テスト結果一覧", errorLabel: "直近の実行結果",
    amountLabel: "金額", coinsLabel: "硬貨の額面",
    expectedLabel: "期待する硬貨の並び", actualLabel: "実際の硬貨の並び", noOutput: "—",
    invalid: "数値のリストではありません", lengthMismatch: "リストの長さが期待と違います",
    different: "期待と違う場所：{count}個",
    statuses: { passed: { icon: "✓", label: "通過" }, failed: { icon: "×", label: "未通過" }, unexecuted: { icon: "○", label: "未実行" } },
    messages: {
      syntax: "文法エラーのため実行できていないテストがあります。",
      runtime: "実行時エラーが起きているテストがあります。",
      timeout: "実行が終わらないテストがあります（無限ループの可能性があります）。",
      mismatch: "実行はできていますが、結果が期待と違うテストがあります。",
    },
    lineNote: "（{line}行目付近）",
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
    title: "貪欲法マスター！",
    finalButton: "単元の結果を見る",
    closing: "貪欲法のコードを完成させ、主教材・転移・別額面のすべてのテストを通過しました。この単元の学習は完了です。",
  },
} as const;
