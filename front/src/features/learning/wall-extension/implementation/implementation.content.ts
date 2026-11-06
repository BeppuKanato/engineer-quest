import type { PythonTestCase } from "../../../../lib/pyodideRunner";
import { mazeCellKey } from "../../player/mazeGrid.types";
import {
  buildWallExtensionWalls, wallExtensionMainChoices, wallExtensionMainSize,
  wallExtensionSmallChoices, wallExtensionSmallSize,
} from "../wallExtensionMaze";
import { wallExtensionCode } from "../code-mapping/wallExtensionCode";
import { wallExtensionConsolidationContent } from "../consolidation/consolidation.content";

export type ImplementationTest = PythonTestCase & { readonly visibility: "display" | "judgement" };

/** 期待する迷路は盤面データの正本（wallExtensionMaze）の組み立てから導き、フェーズ1〜6の盤面とずらさない。 */
const expectedGrid = (size: number, choices: readonly number[]): number[][] => {
  const walls = new Set(buildWallExtensionWalls(size, choices));
  return Array.from({ length: size }, (_, y) =>
    Array.from({ length: size }, (_, x) => (walls.has(mazeCellKey(x, y)) ? 1 : 0)));
};

const parsonsQuestion = wallExtensionConsolidationContent.questions.find(question => question.kind === "parsons");
if (!parsonsQuestion || parsonsQuestion.kind !== "parsons") throw new Error("Phase 6 Parsons question is required");

const skeletonLineIds = ["for-pillar-row", "for-pillar-column", "if-first-row"] as const;

export const wallExtensionImplementationContent = {
  version: 1, id: "wall-extension-implementation", phase: 7,
  caption: "柱から壁を伸ばして迷路を作るコードを完成させ、実行して確かめましょう。",
  template: "def generate_maze(size, choices):\n    directions = {\"up\": (0, -1), \"down\": (0, 1), \"left\": (-1, 0), \"right\": (1, 0)}\n    # ここに、迷路を作って返すコードを書く\n    pass",
  tests: [
    { id: "D1", label: "基本（動きの説明の迷路）", visibility: "display", functionName: "generate_maze", args: [wallExtensionMainSize, wallExtensionMainChoices], expected: expectedGrid(wallExtensionMainSize, wallExtensionMainChoices) },
    { id: "D2", label: "転移（応用問題の迷路）", visibility: "display", functionName: "generate_maze", args: [wallExtensionSmallSize, wallExtensionSmallChoices], expected: expectedGrid(wallExtensionSmallSize, wallExtensionSmallChoices) },
    { id: "J1", label: "9×9（別の方向の番号）", visibility: "judgement", functionName: "generate_maze", args: [9, [0, 3, 1, 2, 0, 1, 1, 0, 2]], expected: expectedGrid(9, [0, 3, 1, 2, 0, 1, 1, 0, 2]) },
    { id: "J2", label: "7×7（別の方向の番号）", visibility: "judgement", functionName: "generate_maze", args: [7, [0, 1, 1, 2]], expected: expectedGrid(7, [0, 1, 1, 2]) },
    { id: "J3", label: "11×11（大きな盤面）", visibility: "judgement", functionName: "generate_maze", args: [11, [0, 1, 2, 3, 1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 2, 0]], expected: expectedGrid(11, [0, 1, 2, 3, 1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 2, 0]) },
  ] satisfies ImplementationTest[],
  hints: {
    labels: ["ヒント1：使う部品を見る", "ヒント2：処理の流れを見る", "ヒント3：条件とループの骨格を見る", "ヒント4：並び替えで確認する"],
    compactLabels: ["ヒント1", "ヒント2", "ヒント3", "ヒント4"],
    variables: [
      { name: "grid", description: "迷路の盤面を表す2次元リスト（0が通路、1が壁）" },
      { name: "pillars", description: "柱の座標（x, y）を集めるリスト" },
    ],
    tokens: ["grid", "pillars", "directions", "choices", "allowed", "for", "if", "else", "append()", "zip(pillars, choices)", "range(2, size - 1, 2)", "return"],
    tokenInstruction: "トークンを選ぶとヒントを閉じ、カーソル位置に挿入します。",
    tokenGroupLabel: "使う部品のトークン",
    flow: [
      "外周を壁にする",
      "2マスおきに柱を立てる",
      "柱ごとに許される方向から1つ選び、隣のマスを壁にする",
    ],
    loopLabel: "柱の数だけくり返し",
    skeletonLineIds,
    skeletonLines: skeletonLineIds.map(id => {
      const line = wallExtensionCode.lines.find(line => line.id === id);
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
    title: "棒倒し法マスター！",
    closing: "棒倒し法のコードを完成させ、基本ケースと境界ケースのすべてのテストを通過しました。この単元の学習は完了です。",
  },
} as const;
