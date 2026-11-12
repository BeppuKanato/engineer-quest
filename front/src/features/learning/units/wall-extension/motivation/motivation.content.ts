import { defineLearningContent } from "../../../player/content.types";
import {
  buildWallExtensionWalls, wallExtensionBorderWalls, wallExtensionExtensions, wallExtensionMainChoices,
  wallExtensionMainPath, wallExtensionMainSize, wallExtensionSmallChoices, wallExtensionSmallSize,
} from "../wallExtensionMaze";
import {
  validateWallExtensionMotivationCanvas, type WallExtensionMotivationCanvasState, type WallExtensionMotivationContent,
} from "./motivation.types";

/**
 * 基準データ §3 フェーズ1。完成迷路は §1 の検証済みトレースから組み立てる。
 * 用語（棒倒し法）はフェーズ1では出さず、名称付けは後続フェーズに置く。
 */
const mainWalls = buildWallExtensionWalls(wallExtensionMainSize, wallExtensionMainChoices);
const smallWalls = buildWallExtensionWalls(wallExtensionSmallSize, wallExtensionSmallChoices);
const smallBeforeExtension = buildWallExtensionWalls(wallExtensionSmallSize, wallExtensionSmallChoices, 0);
const firstExtension = wallExtensionExtensions(wallExtensionSmallSize, wallExtensionSmallChoices)[0];

function scene(size: number, state: Partial<WallExtensionMotivationCanvasState["state"]> = {}): WallExtensionMotivationCanvasState {
  return {
    data: { kind: "maze-grid", size },
    state: {
      walls: [], processing: null, target: null, path: [], start: null, goal: null, exit: null,
      ...state,
    },
    highlights: [],
  };
}

const sequence = defineLearningContent<WallExtensionMotivationCanvasState>({
  version: 1, kind: "step-sequence", id: "wall-extension-motivation", phase: 1, intervalMs: 3500,
  steps: [
    {
      id: "maze-question", caption: "ゲームの迷路は、どうすればコンピュータに作らせることができるでしょう？",
      canvas: scene(wallExtensionMainSize, {
        walls: mainWalls, start: "1,7", goal: "7,7", path: wallExtensionMainPath,
      }),
    },
    {
      id: "another-maze", caption: "同じ作り方でも、遊ぶたびに違う迷路が出来上がります。",
      canvas: scene(wallExtensionSmallSize, { walls: smallWalls }),
    },
    {
      id: "empty-board", caption: "迷路の作り方は、3つの手順だけです。",
      canvas: scene(wallExtensionSmallSize),
    },
    {
      id: "border-walls", caption: "まず、外側を壁で囲みます。",
      canvas: scene(wallExtensionSmallSize, { walls: wallExtensionBorderWalls(wallExtensionSmallSize) }),
    },
    {
      id: "pillars", caption: "次に、2マスおきに柱を立てます。",
      canvas: scene(wallExtensionSmallSize, { walls: smallBeforeExtension }),
    },
    {
      id: "first-extension", caption: "柱から1方向へ、隣のマスまで壁を伸ばします。",
      canvas: scene(wallExtensionSmallSize, {
        walls: smallBeforeExtension, processing: firstExtension.pillar, target: firstExtension.target,
      }),
    },
    {
      id: "complete-and-exit", caption: "3つの手順をくり返すだけで、毎回違う迷路が出来上がります。",
      canvas: scene(wallExtensionSmallSize, {
        walls: smallWalls, exit: { label: "動きの説明へ進む", nextPhase: 2 },
      }),
    },
  ],
}, validateWallExtensionMotivationCanvas);

export const wallExtensionMotivationContent: WallExtensionMotivationContent = {
  ...sequence, stageName: "導入",
  vocabulary: [
    { concept: "pillar", everyday: "柱", technical: "柱", firstStepId: "pillars", usage: "2マスおきに立つ壁。フェーズ1では日常語のまま使い、座標では表さない。" },
    { concept: "extend", everyday: "壁を伸ばす", technical: "壁を伸ばす", firstStepId: "first-extension", usage: "柱から隣のマスへ壁を広げる操作。方向の選び方と規則はフェーズ2で扱う。" },
  ],
};

for (const entry of wallExtensionMotivationContent.vocabulary) {
  if (!sequence.steps.some((step) => step.id === entry.firstStepId)) throw new Error("Unknown vocabulary introduction step");
}
