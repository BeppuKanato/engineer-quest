import { mazeCellKey, type MazeCellKey } from "../../../player/mazeGrid.types";
import { defineLearningContent, type LearningStep } from "../../../player/content.types";
import {
  buildWallExtensionWalls, wallExtensionAnotherChoices, wallExtensionBorderWalls, wallExtensionExtensions,
  wallExtensionMainChoices, wallExtensionMainSize, wallExtensionPillars,
} from "../wallExtensionMaze";
import {
  validateWallExtensionExecutionCanvas, type WallExtensionExecutionCanvasState, type WallExtensionExecutionContent,
} from "./execution.types";

/**
 * 基準データ §3 フェーズ2。盤面は wallExtensionMaze の組み立てを使い、手書きしない。
 * 図の変化はコードの実行単位に合わせる（教材指針 §2-5）：外周はループ1周ごと、
 * 柱は1本ごと、伸長は1本ごとにステップを分ける。
 * 方向の決まり・輪の実演・別の迷路は、コードの実行単位に対応しない説明専用
 * ステップ（§2-6）として置き、フェーズ4のチェックポイントには含めない。
 * 伸長ステップの caption は基準データの位置＋方向の一文（柱の処理順に対応）。
 */
const size = wallExtensionMainSize;
const extensions = wallExtensionExtensions(size, wallExtensionMainChoices);

const extensionCaptions: readonly string[] = [
  "一番上の段の左の柱から、右へ壁を伸ばします。",
  "一番上の段の真ん中の柱から、下へ壁を伸ばします。",
  "一番上の段の右の柱から、左へ壁を伸ばします。",
  "真ん中の段の左の柱からは、上には伸ばさず、下へ壁を伸ばします。",
  "真ん中の段の真ん中の柱から、右へ壁を伸ばします。",
  "真ん中の段の右の柱から、下へ壁を伸ばします。",
  "一番下の段の左の柱から、右へ壁を伸ばします。",
  "一番下の段の真ん中の柱から、右へ壁を伸ばします。",
  "一番下の段の右の柱から、下へ壁を伸ばします。",
];
if (extensionCaptions.length !== extensions.length) throw new Error("Extension captions must cover every extension");

function snapshot(walls: readonly MazeCellKey[], processing: MazeCellKey | null, becameWall: MazeCellKey | null): WallExtensionExecutionCanvasState {
  return {
    data: { kind: "maze-grid", size },
    state: { walls, processing, target: null, path: [], start: null, goal: null },
    highlights: becameWall === null ? [] : [{ kind: "cell", id: becameWall }],
  };
}

/** 外周ループの i 周目が終わった時点の壁（上下左右の端から i+1 マス目まで）。 */
function borderWallsThrough(iteration: number): readonly MazeCellKey[] {
  const walls = new Set<MazeCellKey>();
  for (let i = 0; i <= iteration; i++) {
    walls.add(mazeCellKey(i, 0));
    walls.add(mazeCellKey(i, size - 1));
    walls.add(mazeCellKey(0, i));
    walls.add(mazeCellKey(size - 1, i));
  }
  return [...walls];
}

const rowLabels: Readonly<Record<number, string>> = { 2: "一番上の段", 4: "真ん中の段", 6: "一番下の段" };
const columnLabels: Readonly<Record<number, string>> = { 2: "左", 4: "真ん中", 6: "右" };

const borderSteps: LearningStep<WallExtensionExecutionCanvasState>[] = Array.from({ length: size }, (_, i) => ({
  id: `border-${i}`,
  caption: i === 0 ? "外側の壁を、端から1マス目まで作ります。"
    : i === size - 1 ? "外側を、すべて壁で囲みました。"
    : `外側の壁を、端から${i + 1}マス目まで広げます。`,
  canvas: snapshot(borderWallsThrough(i), null, null),
}));

const pillarKeys = wallExtensionPillars(size);
const pillarSteps: LearningStep<WallExtensionExecutionCanvasState>[] = pillarKeys.map((pillar, index) => {
  const [x, y] = pillar.split(",").map(Number);
  return {
    id: `pillar-${x}-${y}`,
    caption: index === 0
      ? "外側から1マス空けて2マスおきに柱を立てるのは、間に壁を伸ばす場所と通路を残すためです。"
      : `${rowLabels[y]}の${columnLabels[x]}に、柱を立てます。`,
    canvas: snapshot(
      [...wallExtensionBorderWalls(size), ...pillarKeys.slice(0, index + 1)],
      null, null,
    ),
  };
});

const allPillarsWalls = [...wallExtensionBorderWalls(size), ...pillarKeys];

/**
 * 輪の実演用の仮定の盤面。正本の生成過程のうち、真ん中の段の右の柱（6, 4）だけが
 * 下ではなく上へ伸ばした状態で、伸ばした壁（6, 3）が周りの壁とつながり、
 * 間のマス（5, 3）が四方を壁に囲まれて取り残される。
 */
const whatIfWalls: readonly MazeCellKey[] = [
  ...wallExtensionBorderWalls(size),
  ...pillarKeys,
  ...extensions.map(extension => extension.pillar === "6,4" ? mazeCellKey(6, 3) : extension.target),
];

const steps: [LearningStep<WallExtensionExecutionCanvasState>, ...LearningStep<WallExtensionExecutionCanvasState>[]] = [
  {
    id: "empty-board", caption: "9×9の空の盤面を用意します。",
    canvas: snapshot([], null, null),
  },
  ...borderSteps,
  ...pillarSteps,
  {
    id: "directions-rule", explanationOnly: true,
    caption: "一番上の段の柱は上下左右の4方向へ、それ以外の柱は、上へ伸ばすと輪ができるため上を除く3方向へ、壁を伸ばせます。",
    canvas: snapshot(allPillarsWalls, pillarKeys[0], null),
  },
  ...extensions.map((extension, index) => ({
    id: `extend-${extension.pillar.split(",").join("-")}`,
    caption: extensionCaptions[index],
    canvas: snapshot(
      buildWallExtensionWalls(size, wallExtensionMainChoices, index + 1),
      extension.pillar,
      extension.target,
    ),
  })),
  {
    id: "complete", caption: "迷路が完成し、すべてのマスがつながりました。",
    canvas: snapshot(buildWallExtensionWalls(size, wallExtensionMainChoices), null, null),
  },
  {
    id: "loop-what-if", explanationOnly: true,
    caption: "下の段の柱から上へ伸ばすと、壁がつながって輪になり、間のマスが囲まれてしまうため、上には伸ばしません。",
    canvas: snapshot(whatIfWalls, "6,4", mazeCellKey(6, 3)),
  },
  {
    id: "another-maze", explanationOnly: true,
    caption: "倒す方向をランダムに選ぶと、作るたびに違う形の迷路になります。",
    canvas: snapshot(buildWallExtensionWalls(size, wallExtensionAnotherChoices), null, null),
  },
];

const sequence = defineLearningContent<WallExtensionExecutionCanvasState>({
  version: 1, kind: "step-sequence", id: "wall-extension-execution", phase: 2, intervalMs: 3500,
  steps,
}, validateWallExtensionExecutionCanvas);

export const wallExtensionExecutionContent: WallExtensionExecutionContent = {
  ...sequence, stageName: "動きの説明",
};
