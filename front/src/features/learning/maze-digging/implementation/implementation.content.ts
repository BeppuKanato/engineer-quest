import type { PythonTestCase } from "../../../../lib/pyodideRunner";
import type { ImplementationInputLevel } from "../../implementation/inputLevel";
import {
  buildMazeDiggingGrid, mazeDiggingMainChoices, mazeDiggingMainSize,
  mazeDiggingSmallChoices, mazeDiggingSmallSize,
} from "../mazeDiggingMaze";
import { mazeDiggingCode, type MazeDiggingCodeLineId } from "../code-mapping/mazeDiggingCode";
import { mazeDiggingConsolidationContent } from "../consolidation/consolidation.content";

export type ImplementationTest = PythonTestCase & { readonly visibility: "display" | "judgement" };

/** 期待する迷路は盤面データの正本（mazeDiggingMaze）の組み立てから導き、フェーズ1〜6の盤面とずらさない。 */
const expectedGrid = (size: number, choices: readonly number[]): number[][] =>
  buildMazeDiggingGrid(size, choices).map(row => [...row]);

const parsonsQuestion = mazeDiggingConsolidationContent.questions.find(question => question.kind === "parsons");
if (!parsonsQuestion || parsonsQuestion.kind !== "parsons") throw new Error("Phase 6 Parsons question is required");

const skeletonLineIds = ["while-stack", "if-diggable", "if-candidates", "else-branch"] as const;

/**
 * 入力量レベル別の初期テンプレート（Issue #328）。
 * 「骨格から書く」「穴埋めで書く」は、正解コード（mazeDiggingCode）の行から組み立てる。
 * 残す行は正解コードの行そのものを使い、置き換える行は、その行のインデントを保った
 * プレースホルダ行（raise NotImplementedError ＋「ここを書く」の目印）にする。
 * プレースホルダが残っていると必ずテストに失敗する。
 */
const codeLineText = (id: MazeDiggingCodeLineId): string => {
  const line = mazeDiggingCode.lines.find(line => line.id === id);
  if (!line) throw new Error("Missing canonical line");
  return line.text;
};
const placeholderLine = (id: MazeDiggingCodeLineId, description: string): string => {
  const indent = /^ */u.exec(codeLineText(id))?.[0] ?? "";
  return `${indent}raise NotImplementedError  # ここを書く：${description}`;
};
const placeholderGuide = "    # 「ここを書く」の行が、まだ書けていない場所です。その行を消して、自分のコードを書いてください。";

const fullTemplate = "def dig_maze(size, choices):\n    directions = [(0, -1), (1, 0), (0, 1), (-1, 0)]\n    # ここに、迷路を作って返すコードを書く\n    pass";

/** 骨格：制御構造と初期化の枠だけを残し、本体の行をすべてプレースホルダにする。 */
const skeletonTemplate = [
  codeLineText("define-function"),
  placeholderGuide,
  codeLineText("initialize-grid"),
  codeLineText("define-directions"),
  placeholderLine("dig-start", "開始マス（1, 1）を掘る"),
  placeholderLine("initialize-stack", "掘った部屋を積むスタックを用意して、開始マスを入れる"),
  placeholderLine("initialize-step", "方向の番号の位置を表す step を用意する"),
  codeLineText("while-stack"),
  placeholderLine("current-room", "スタックの一番上にある今の部屋を x, y に取り出す"),
  placeholderLine("initialize-candidates", "掘れる部屋を集める candidates を空で用意する"),
  codeLineText("for-direction"),
  placeholderLine("compute-next", "方向の2マス先の部屋 nx, ny を計算する"),
  codeLineText("if-diggable"),
  placeholderLine("append-candidate", "掘れる部屋を候補に加える"),
  codeLineText("if-candidates"),
  placeholderLine("choose-candidate", "choices と step で候補を1つ選び、nx, ny に取り出す"),
  placeholderLine("advance-step", "step を1つ進める"),
  placeholderLine("dig-between", "今の部屋と選んだ部屋の間の壁を掘る"),
  placeholderLine("dig-room", "選んだ部屋を掘る"),
  placeholderLine("push-stack", "選んだ部屋をスタックに積む"),
  codeLineText("else-branch"),
  placeholderLine("pop-stack", "スタックから1つ戻る"),
  codeLineText("return-grid"),
].join("\n");

/** 穴埋め：要点の行（2マス先の計算、掘れる条件と候補追加、候補の選択、間の壁を掘る）だけをプレースホルダにする。 */
const fillInTemplate = [
  codeLineText("define-function"),
  placeholderGuide,
  codeLineText("initialize-grid"),
  codeLineText("define-directions"),
  codeLineText("dig-start"),
  codeLineText("initialize-stack"),
  codeLineText("initialize-step"),
  codeLineText("while-stack"),
  codeLineText("current-room"),
  codeLineText("initialize-candidates"),
  codeLineText("for-direction"),
  placeholderLine("compute-next", "方向の2マス先の部屋 nx, ny を計算する"),
  placeholderLine("if-diggable", "2マス先が盤の内側で、まだ壁のままのときだけ、候補に加える"),
  codeLineText("if-candidates"),
  placeholderLine("choose-candidate", "choices と step で候補を1つ選び、nx, ny に取り出す"),
  codeLineText("advance-step"),
  placeholderLine("dig-between", "今の部屋と選んだ部屋の間の壁を掘る"),
  codeLineText("dig-room"),
  codeLineText("push-stack"),
  codeLineText("else-branch"),
  codeLineText("pop-stack"),
  codeLineText("return-grid"),
].join("\n");

const levelTemplates: Readonly<Record<ImplementationInputLevel, string>> = {
  full: fullTemplate,
  skeleton: skeletonTemplate,
  "fill-in": fillInTemplate,
};

export const mazeDiggingImplementationContent = {
  version: 1, id: "maze-digging-implementation", phase: 7,
  caption: "壁の塊から通路を掘って迷路を作るコードを完成させ、実行して確かめましょう。",
  template: fullTemplate,
  templates: levelTemplates,
  tests: [
    { id: "D1", label: "基本（動きの説明の迷路）", visibility: "display", functionName: "dig_maze", args: [mazeDiggingMainSize, mazeDiggingMainChoices], expected: expectedGrid(mazeDiggingMainSize, mazeDiggingMainChoices) },
    { id: "D2", label: "転移（応用問題の迷路）", visibility: "display", functionName: "dig_maze", args: [mazeDiggingSmallSize, mazeDiggingSmallChoices], expected: expectedGrid(mazeDiggingSmallSize, mazeDiggingSmallChoices) },
    { id: "J1", label: "9×9（別の方向の番号）", visibility: "judgement", functionName: "dig_maze", args: [9, [1, 0, 1, 2, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0]], expected: expectedGrid(9, [1, 0, 1, 2, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0]) },
    { id: "J2", label: "7×7（別の方向の番号）", visibility: "judgement", functionName: "dig_maze", args: [7, [1, 1, 0, 1, 0, 0, 0, 0]], expected: expectedGrid(7, [1, 1, 0, 1, 0, 0, 0, 0]) },
    { id: "J3", label: "11×11（大きな盤面）", visibility: "judgement", functionName: "dig_maze", args: [11, [0, 1, 2, 0, 0, 1, 2, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 1, 0, 0]], expected: expectedGrid(11, [0, 1, 2, 0, 0, 1, 2, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 1, 0, 0]) },
  ] satisfies ImplementationTest[],
  hints: {
    labels: ["ヒント1：使う部品を見る", "ヒント2：処理の流れを見る", "ヒント3：条件とループの骨格を見る", "ヒント4：並び替えで確認する"],
    compactLabels: ["ヒント1", "ヒント2", "ヒント3", "ヒント4"],
    variables: [
      { name: "grid", description: "迷路の盤面を表す2次元リスト（0が通路、1が壁。壁のままの部屋は、まだ掘っていない部屋）" },
      { name: "stack", description: "掘った部屋を積むリスト。一番上が今いる部屋で、行き止まりでは1つ戻る" },
      { name: "directions", description: "候補を集める方向のリスト（上・右・下・左の順が、番号の意味を決める）" },
      { name: "candidates", description: "今いる部屋から掘れる部屋（2マス先が盤内で、まだ壁のままの部屋）を集めるリスト" },
    ],
    tokens: ["grid", "stack", "directions", "candidates", "choices", "step", "while", "for", "if", "else", "append((nx, ny))", "pop()", "range(size)", "return"],
    tokenInstruction: "トークンを選ぶとヒントを閉じ、カーソル位置に挿入します。",
    tokenGroupLabel: "使う部品のトークン",
    flow: [
      "全部を壁にして、開始マス（1, 1）を掘る",
      "今いる部屋から、2マス先が盤内でまだ壁のままの部屋を集める",
      "方向の番号で1つ選んで、間の壁ごと掘り、スタックに積む",
      "掘れる部屋がなければ、スタックから1つ戻る",
    ],
    loopLabel: "スタックが空になるまでくり返し",
    skeletonLineIds,
    skeletonLines: skeletonLineIds.map(id => {
      const line = mazeDiggingCode.lines.find(line => line.id === id);
      if (!line) throw new Error("Missing skeleton line");
      return line;
    }),
    parsonsQuestion,
    closeLabel: "ヒントを閉じる",
    groupLabel: "段階式ヒント",
  },
  display: {
    listLabel: "テスト結果一覧", errorLabel: "直近の実行結果",
    sizeLabel: "盤面", choicesLabel: "方向の番号",
    expectedLabel: "期待する迷路", actualLabel: "実際の迷路", noOutput: "—",
    invalid: "迷路の盤面ではありません", sizeMismatch: "盤面の大きさが期待と違います",
    different: "期待と違うマス：{count}個",
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
    title: "穴掘り法マスター！",
    finalButton: "単元の結果を見る",
    closing: "穴掘り法のコードを完成させ、基本ケースと境界ケースのすべてのテストを通過しました。この単元の学習は完了です。",
  },
} as const;
