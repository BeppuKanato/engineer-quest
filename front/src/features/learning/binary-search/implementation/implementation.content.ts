import type { ImplementationInputLevel } from "../../implementation/inputLevel";
import { binarySearchCode, type BinarySearchCodeLineId } from "../code-mapping/binarySearchCode";
import { binarySearchMainTarget, binarySearchMainValues, binarySearchTransferTarget, binarySearchTransferValues } from "../binarySearch";
import { binarySearchConsolidationContent } from "../consolidation/consolidation.content";

/**
 * フェーズ7（自分で実装）の問題と判定データ（プログラム形式）。
 * BFS・DFS と同じ契約で、学習者は関数ではなくプログラムを書く。
 * 入力は標準入力で与えられ、探す値が並びの何番目にあるか（なければ -1）を
 * 標準出力へ1行で出す。関数名・変数名・書き方は固定しない。
 * 旧・関数形は implementation-legacy に保存した。
 *
 * 入力の形式：
 *   1行目：探す値
 *   2行目：小さい順に並んだ数値（半角スペース区切り、重複なし）
 * 出力：探す値の位置（0から数える）。なければ -1。
 */
export type ProgramTest = {
  readonly id: string;
  readonly label: string;
  readonly visibility: "display" | "judgement";
  readonly inputText: string;
  readonly values: readonly number[];
  readonly target: number;
  /** 期待する位置（0から数える）。なければ -1。 */
  readonly expected: number;
};

const testCase = (
  id: string,
  label: string,
  visibility: ProgramTest["visibility"],
  values: readonly number[],
  target: number,
): ProgramTest => ({
  id, label, visibility,
  inputText: [String(target), values.join(" ")].join("\n"),
  values, target,
  expected: values.indexOf(target),
});

const parsonsQuestion = binarySearchConsolidationContent.questions.find(question => question.kind === "parsons");
if (!parsonsQuestion || parsonsQuestion.kind !== "parsons") throw new Error("Phase 6 Parsons question is required");

const skeletonLineIds = ["while-range", "if-hit", "elif-smaller", "else-larger"] as const;

const codeLineText = (id: BinarySearchCodeLineId): string => {
  const line = binarySearchCode.lines.find(line => line.id === id);
  if (!line) throw new Error("Missing canonical line");
  return line.text;
};
/** 正解コードは関数の中の行（インデント4つ分）なので、プログラムのトップレベル用に4つ外す。 */
const dedent = (text: string): string => text.replace(/^ {4}/u, "");
const bodyLine = (id: BinarySearchCodeLineId): string => dedent(codeLineText(id));
const placeholderLine = (id: BinarySearchCodeLineId, description: string): string => {
  const indent = /^ */u.exec(dedent(codeLineText(id)))?.[0] ?? "";
  return `${indent}raise NotImplementedError  # ここを書く：${description}`;
};
const placeholderGuide = "# 「ここを書く」の行が、まだ書けていない場所です。その行を消して、自分のコードを書いてください。";

/** 入力の受け取り（用意する行）。探す値と、並んだ数値の列にする。 */
const inputLines = [
  "import sys",
  "",
  "lines = [line.split() for line in sys.stdin.read().splitlines() if line.strip()]",
  "target = int(lines[0][0])",
  "values = list(map(int, lines[1]))",
];
/** 見つけた位置を入れる変数の用意（用意する行）。見つからなければ -1 のまま。 */
const answerInitLine = "answer = -1";
/** 一致したときの処理（用意する行）。位置を記録して、探すのを終える。 */
const hitLines = ["        answer = mid", "        break"];
/** 出力（用意する行）。 */
const outputLine = "print(answer)";

/** 自由実装の初期コード。決まりは入出力の形式だけ。 */
const fullTemplate = "# ここを書く：入力を受け取り、探す値の位置を出力するプログラムを書く\n# 入力の1行目は探す値、2行目は小さい順に並んだ数値です。\n";

/** 橋渡し（骨格）：入力の受け取り・出力と制御構造は用意し、本体の行をプレースホルダにする。 */
const skeletonTemplate = [
  ...inputLines,
  "",
  placeholderGuide,
  answerInitLine,
  placeholderLine("init-lo", "探す範囲の左端（0）を用意する"),
  placeholderLine("init-hi", "探す範囲の右端（最後の位置）を用意する"),
  bodyLine("while-range"),
  placeholderLine("compute-mid", "真ん中の位置を計算する"),
  bodyLine("if-hit"),
  ...hitLines,
  bodyLine("elif-smaller"),
  placeholderLine("drop-left", "左端を、真ん中の1つ右へ移す"),
  bodyLine("else-larger"),
  placeholderLine("drop-right", "右端を、真ん中の1つ左へ移す"),
  outputLine,
].join("\n");

/** 橋渡し（穴埋め）：要点の行（範囲の狭め方）だけをプレースホルダにする。 */
const fillInTemplate = [
  ...inputLines,
  "",
  placeholderGuide,
  answerInitLine,
  bodyLine("init-lo"),
  bodyLine("init-hi"),
  bodyLine("while-range"),
  bodyLine("compute-mid"),
  bodyLine("if-hit"),
  ...hitLines,
  bodyLine("elif-smaller"),
  placeholderLine("drop-left", "左端を、真ん中の1つ右へ移す"),
  bodyLine("else-larger"),
  placeholderLine("drop-right", "右端を、真ん中の1つ左へ移す"),
  outputLine,
].join("\n");

const levelTemplates: Readonly<Record<ImplementationInputLevel, string>> = {
  full: fullTemplate,
  skeleton: skeletonTemplate,
  "fill-in": fillInTemplate,
};

/** お手本のプログラム（フェーズ6までの正解コードを、プログラムの形に組み直したもの）。 */
export const binarySearchExampleProgram = [
  ...inputLines,
  "",
  answerInitLine,
  bodyLine("init-lo"),
  bodyLine("init-hi"),
  bodyLine("while-range"),
  bodyLine("compute-mid"),
  bodyLine("if-hit"),
  ...hitLines,
  bodyLine("elif-smaller"),
  bodyLine("drop-left"),
  bodyLine("else-larger"),
  bodyLine("drop-right"),
  outputLine,
].join("\n");

/**
 * 自動チェック。種を固定した乱数で並びと探す値を作り（毎回同じケースになり、
 * 結果が再現できる）、期待値は並びの中の位置で求める。
 * 探す値がある場合とない場合の両方を含む。
 */
const autoTests: readonly ProgramTest[] = (() => {
  let seed = 20261125;
  const random = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  const cases: ProgramTest[] = [];
  for (let index = 0; index < 24; index++) {
    const length = 1 + Math.floor(random() * 12);
    const pool = new Set<number>();
    while (pool.size < length) pool.add(1 + Math.floor(random() * 99));
    const values = [...pool].sort((a, b) => a - b);
    const present = random() < 0.6;
    const target = present ? values[Math.floor(random() * values.length)] : 1 + Math.floor(random() * 99);
    cases.push(testCase(`A${index + 1}`, `自動チェック${index + 1}`, "judgement", values, target));
  }
  return cases;
})();

export const binarySearchAutoTests: readonly ProgramTest[] = autoTests;

export const binarySearchImplementationContent = {
  version: 2, id: "binary-search-implementation", phase: 7,
  caption: "探す値が並びの何番目にあるかを二分探索で求めるプログラムを完成させて、ミッションを達成しましょう。",
  template: fullTemplate,
  templates: levelTemplates,
  /** 単元ミッション（ミッションバンド表示用）。文言は単元ミッションの登録と一致させる。 */
  mission: {
    title: "ほしい商品を少ない回数で見つける",
    successCondition: "範囲を正しく狭めて、目的の商品を見つけたとき達成",
  },
  /** 問題文（仕様）。入口の画面ではなく、作業画面の「問題」タブに常駐させる。 */
  statement: {
    tabLabel: "問題",
    title: "探す値の位置を求めるプログラム",
    lead: "商品が値段の順にずらりと並んでいます。探す値を受け取って、範囲を半分ずつに絞る二分探索で、その値が何番目にあるかを求めるプログラムを作りましょう。",
    inputLabel: "入力",
    inputFormat: "入力の1行目は探す値です。2行目は、小さい順に並んだ数値が半角スペース区切りで並びます。同じ数値が重複することはありません。",
    outputLabel: "出力",
    outputFormat: "探す値の位置（0から数えて何番目か）を1行に出力してください。探す値が並びにない場合は -1 を出力してください。",
    constraintsLabel: "条件",
    constraints: [
      "数値はすべて整数です。",
      "並びは小さい順（昇順）に並んでいます。",
      "書き方は自由です。関数を使っても、使わなくてもかまいません。",
    ],
    exampleInputLabel: "入力の例",
    exampleOutputLabel: "出力の例",
  },
  tests: [
    testCase("D1", "基本（動きの説明の並び）", "display", binarySearchMainValues, binarySearchMainTarget),
    testCase("D2", "応用（別の並び）", "display", binarySearchTransferValues, binarySearchTransferTarget),
    testCase("J1", "探す値がない", "judgement", binarySearchMainValues, 20),
    testCase("J2", "先頭にある", "judgement", binarySearchMainValues, binarySearchMainValues[0]),
    testCase("J3", "末尾にある", "judgement", binarySearchMainValues, binarySearchMainValues[binarySearchMainValues.length - 1]),
  ] satisfies ProgramTest[],
  /**
   * 支援エスカレーション（ヒント → 橋渡し → お手本）の文言。
   * 書き方レベル（骨格・穴埋め）は任意フェーズ6.5「実装の橋渡し」の中身。
   */
  freeForm: {
    modeFree: "自由に書く",
    bridgeLabel: "実装の橋渡し",
    bridgeButton: "型を使う（橋渡し）",
    bridgeChangeButton: "型を変える",
    bridgeBackButton: "自由に書くに戻る",
    bridgeDialogTitle: "実装の橋渡し（任意フェーズ 6.5）",
    bridgeDialogLead: "型を使うと、入力の受け取りや出力、コードの骨格が用意された状態から書けます。型のコードは、今のコードとは別の下書きに残ります。",
    bridgeUseButton: "この型で書く",
    bannerText: "詰まってきたら、型（橋渡し）を使って書くこともできます。",
    bannerDismiss: "閉じる",
    exampleButton: "お手本を見る",
    exampleTitle: "お手本（考え方の確認用）",
    exampleNote: "お手本は、フェーズ6までで学んだ考え方をプログラムの形にしたものです。写すためではなく、考え方を確認するために見ましょう。",
    autoLabel: "いろいろな並び（自動チェック）",
    autoShortLabel: "自動チェック",
    autoCaptionNone: "並びの長さや探す値の違うケースで自動的に確認します。内容は非公開です。",
    autoCaptionPassed: "{total} 件すべて、期待どおりの位置になりました。",
    autoCaptionFailed: "{total} 件中 {passed} 件が期待どおりでした。先頭・末尾・ない値の場合で確かめてみましょう。",
  },
  hints: {
    labels: ["ヒント1：使う部品を見る", "ヒント2：処理の流れを見る", "ヒント3：条件とループの骨格を見る", "ヒント4：並び替えで確認する"],
    descriptions: ["使える変数やコードの部品を確認する", "どのような順序で処理するかを確認する", "コードの構造を確認する", "コードを並べ替えながら復習する"],
    compactLabels: ["ヒント1", "ヒント2", "ヒント3", "ヒント4"],
    variables: [
      { name: "values", description: "小さい順に並んだ数値の列" },
      { name: "target", description: "探す値" },
      { name: "lo", description: "探す範囲の左端の位置" },
      { name: "hi", description: "探す範囲の右端の位置" },
      { name: "mid", description: "探す範囲の真ん中の位置" },
      { name: "answer", description: "見つけた位置（見つからなければ -1）" },
    ],
    tokens: ["int(lines[0][0])", "list(map(int, lines[1]))", "lo = 0", "hi = len(values) - 1", "while lo <= hi:", "mid = (lo + hi) // 2", "values[mid] == target", "values[mid] < target", "lo = mid + 1", "hi = mid - 1", "print(answer)"],
    tokenInstruction: "トークンを選ぶと、カーソル位置に挿入します。",
    tokenGroupLabel: "使う部品のトークン",
    flow: [
      "探す範囲の両端（左端と右端）を決める",
      "真ん中の位置を計算して、その値と探す値を比べる",
      "一致したらその位置を答えにして終える。そうでなければ、小さい側か大きい側かを捨てて範囲を狭める",
    ],
    loopLabel: "範囲がなくなるまでくり返し",
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
    inputLabel: "入力",
    expectedLabel: "期待する位置", actualLabel: "実際の位置", noOutput: "—",
    invalid: "数値ではありません", lengthMismatch: "出力の数が期待と違います",
    different: "期待と違う位置：{count}個",
    statuses: { passed: { icon: "✓", label: "通過" }, failed: { icon: "×", label: "不一致" }, unexecuted: { icon: "○", label: "未実行" },
      errorSyntax: { icon: "!", label: "実行不可" }, errorRuntime: { icon: "!", label: "実行エラー" }, errorTimeout: { icon: "!", label: "タイムアウト" } },
    messages: {
      syntax: "文法エラーのため実行できていないテストがあります。",
      runtime: "実行時エラーが起きているテストがあります。",
      timeout: "実行が終わらないテストがあります（無限ループの可能性があります）。",
      mismatch: "実行はできていますが、結果が期待と違うテストがあります。",
    },
    guidance: {
      syntax: "括弧の対応や、式が途中で終わっていないか確認してみましょう。",
      runtime: "エラーの起きた行で、変数の値がどうなっているか確認してみましょう。",
      timeout: "繰り返しが終わる条件を確認してみましょう。範囲が狭まっているか確かめてみましょう。",
    },
    // 例外クラスごとの定型文（LLMなし）。分類名ではなく「何が起きたか」を出す。
    exceptionMessages: {
      NameError: { title: "変数『{name}』が定義されていません", titleNoName: "変数が定義されていません", guidance: "使う前に、その変数へ値を代入しているか確認してみましょう。" },
      IndexError: { title: "リストの範囲外の場所を参照しています", guidance: "リストの長さと、参照している位置（番号）を確認してみましょう。" },
      TypeError: { title: "値の種類が合わず、処理できませんでした", guidance: "その行で使っている値が、期待される種類（数やリストなど）になっているか確認してみましょう。" },
      ZeroDivisionError: { title: "0で割り算をしています", guidance: "割る数が0になっていないか確認してみましょう。" },
      ValueError: { title: "値が処理できる形になっていません", guidance: "その行で渡している値を確認してみましょう。入力の数値は、int() で数に直してから使いましょう。" },
    } as Readonly<Record<string, { title: string; titleNoName?: string; guidance: string }>>,
    notExecuted: "テストはまだ実行されていません",
    notJudged: "テスト結果を判定できませんでした",
    lineNote: "（{line}行目付近）",
    format: {
      empty: "出力がありませんでした。探す値の位置（なければ -1）を出力してください。",
      nonNumeric: "出力が数値ではありません。位置を表す数値1つだけを出力してください。",
      length: "出力された数値の数が違います。位置を表す数値1つだけを出力してください。",
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
    celebrationHeading: "ミッション達成！",
    celebrationText: "探す値の位置を、二分探索で求めるプログラムが完成しました",
    finalButton: "単元の結果を見る",
    closing: "二分探索のプログラムを完成させ、基本ケースと境界ケースのすべてのテストを通過しました。この単元の学習は完了です。",
  },
} as const;
