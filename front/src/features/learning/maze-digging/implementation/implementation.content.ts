import type { PythonTestCase } from "../../../../lib/pyodideRunner";
import {
  buildMazeDiggingGrid, mazeDiggingMainChoices, mazeDiggingMainSize,
  mazeDiggingSmallChoices, mazeDiggingSmallSize,
} from "../mazeDiggingMaze";
import { mazeDiggingCode } from "../code-mapping/mazeDiggingCode";
import { mazeDiggingConsolidationContent } from "../consolidation/consolidation.content";

export type ImplementationTest = PythonTestCase & { readonly visibility: "display" | "judgement" };

/** 期待する迷路は盤面データの正本（mazeDiggingMaze）の組み立てから導き、フェーズ1〜6の盤面とずらさない。 */
const expectedGrid = (size: number, choices: readonly number[]): number[][] =>
  buildMazeDiggingGrid(size, choices).map(row => [...row]);

const parsonsQuestion = mazeDiggingConsolidationContent.questions.find(question => question.kind === "parsons");
if (!parsonsQuestion || parsonsQuestion.kind !== "parsons") throw new Error("Phase 6 Parsons question is required");

const skeletonLineIds = ["while-stack", "if-diggable", "if-candidates", "else-branch"] as const;

export const mazeDiggingImplementationContent = {
  version: 1, id: "maze-digging-implementation", phase: 7,
  caption: "壁の塊から通路を掘って迷路を作るコードを完成させ、実行して確かめましょう。",
  template: "def dig_maze(size, choices):\n    directions = [(0, -1), (1, 0), (0, 1), (-1, 0)]\n    # ここに、迷路を作って返すコードを書く\n    pass",
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
    closing: "穴掘り法のコードを完成させ、基本ケースと境界ケースのすべてのテストを通過しました。この単元の学習は完了です。",
  },
} as const;
