import type { MazeCellKey } from "../../player/mazeGrid.types";
import { defineLearningContent } from "../../player/content.types";
import {
  buildWallExtensionWalls, wallExtensionBorderWalls, wallExtensionExtensions,
  wallExtensionMainChoices, wallExtensionMainSize,
} from "../wallExtensionMaze";
import {
  validateWallExtensionExecutionCanvas, type WallExtensionExecutionCanvasState, type WallExtensionExecutionContent,
} from "./execution.types";

/**
 * 基準データ §3 フェーズ2。盤面は wallExtensionMaze の組み立てを使い、手書きしない。
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

const sequence = defineLearningContent<WallExtensionExecutionCanvasState>({
  version: 1, kind: "step-sequence", id: "wall-extension-execution", phase: 2, intervalMs: 3500,
  steps: [
    {
      id: "empty-board", caption: "9×9の空の盤面を用意します。",
      canvas: snapshot([], null, null),
    },
    {
      id: "border-walls", caption: "外側を壁で囲みます。",
      canvas: snapshot(wallExtensionBorderWalls(size), null, null),
    },
    {
      id: "pillars", caption: "2マスおきに、柱を9本立てます。",
      canvas: snapshot(buildWallExtensionWalls(size, wallExtensionMainChoices, 0), null, null),
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
  ],
}, validateWallExtensionExecutionCanvas);

export const wallExtensionExecutionContent: WallExtensionExecutionContent = {
  ...sequence, stageName: "動きの説明",
};
