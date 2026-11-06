import { defineLearningContent } from "../../player/content.types";
import { mazeCellKey } from "../../player/mazeGrid.types";
import {
  buildMazeDiggingInitialGrid, mazeDiggingAllWallKeys, mazeDiggingMainChoices, mazeDiggingMainSize,
  mazeDiggingSmallChoices, mazeDiggingSmallSize, mazeDiggingWalls, runMazeDigging, solveMazeDiggingPath,
} from "../mazeDiggingMaze";
import {
  validateMazeDiggingMotivationCanvas, type MazeDiggingMotivationCanvasState, type MazeDiggingMotivationContent,
} from "./motivation.types";

/**
 * 基準データ §3 フェーズ1。完成迷路と途中状態は §1 の検証済みトレース（参照コードの実行）から組み立てる。
 * 棒倒し法とは逆に「全部が壁の盤面から掘る」作り方の逆転を体験させる構成にする。
 * 用語（穴掘り法）はフェーズ1では出さず、名称付けは後続フェーズに置く。
 */
const mainRun = runMazeDigging(mazeDiggingMainSize, mazeDiggingMainChoices);
const smallRun = runMazeDigging(mazeDiggingSmallSize, mazeDiggingSmallChoices);
const mainWalls = mazeDiggingWalls(mainRun.grid);
const smallWalls = mazeDiggingWalls(smallRun.grid);
const initialWalls = mazeDiggingWalls(buildMazeDiggingInitialGrid(mazeDiggingMainSize));
const mainPath = solveMazeDiggingPath(mainRun.grid, mazeCellKey(1, 1), mazeCellKey(7, 7));
const firstDig = mainRun.digs[0];
const afterFirstBacktrackDig = mainRun.digs[6];

function scene(size: number, state: Partial<MazeDiggingMotivationCanvasState["state"]> = {},
  highlights: MazeDiggingMotivationCanvasState["highlights"] = []): MazeDiggingMotivationCanvasState {
  return {
    data: { kind: "maze-grid", size },
    state: {
      walls: [], processing: null, target: null, path: [], start: null, goal: null, exit: null,
      ...state,
    },
    highlights,
  };
}

const sequence = defineLearningContent<MazeDiggingMotivationCanvasState>({
  version: 1, kind: "step-sequence", id: "maze-digging-motivation", phase: 1, intervalMs: 3500,
  steps: [
    {
      id: "maze-question", caption: "ゲームの迷路は、どうすればコンピュータに作らせることができるでしょう？",
      canvas: scene(mazeDiggingMainSize, {
        walls: mainWalls, start: mazeCellKey(1, 1), goal: mazeCellKey(7, 7), path: mainPath,
      }),
    },
    {
      id: "another-maze", caption: "同じ作り方でも、遊ぶたびに違う迷路が出来上がります。",
      canvas: scene(mazeDiggingSmallSize, { walls: smallWalls }),
    },
    {
      id: "all-walls", caption: "迷路は、壁の塊から通路を掘っても作れます。",
      canvas: scene(mazeDiggingMainSize, { walls: mazeDiggingAllWallKeys(mazeDiggingMainSize) }),
    },
    {
      id: "dig-start", caption: "まず、スタートの部屋を1つ掘ります。",
      canvas: scene(mazeDiggingMainSize, {
        walls: initialWalls, processing: mazeCellKey(1, 1),
      }, [{ kind: "cell", id: mazeCellKey(1, 1) }]),
    },
    {
      id: "first-dig", caption: "今いる部屋から、2マス先の部屋まで掘り進みます。",
      canvas: scene(mazeDiggingMainSize, {
        walls: firstDig.wallsAfter, processing: firstDig.room,
      }, [
        { kind: "cell", id: firstDig.between },
        { kind: "cell", id: firstDig.room },
      ]),
    },
    {
      id: "backtrack", caption: "行き止まりになったら、掘れる部屋があるところまで戻って掘り直します。",
      canvas: scene(mazeDiggingMainSize, {
        walls: afterFirstBacktrackDig.wallsAfter, processing: afterFirstBacktrackDig.room,
        path: afterFirstBacktrackDig.stackPath,
      }, [
        { kind: "cell", id: afterFirstBacktrackDig.between },
        { kind: "cell", id: afterFirstBacktrackDig.room },
      ]),
    },
    {
      id: "complete-and-exit", caption: "掘ることと、行き止まったら戻ることをくり返すだけで、毎回違う迷路が出来上がります。",
      canvas: scene(mazeDiggingMainSize, {
        walls: mainWalls, exit: { label: "動きの説明へ進む", nextPhase: 2 },
      }),
    },
  ],
}, validateMazeDiggingMotivationCanvas);

export const mazeDiggingMotivationContent: MazeDiggingMotivationContent = {
  ...sequence, stageName: "導入",
  vocabulary: [
    { concept: "room", everyday: "部屋", technical: "部屋", firstStepId: "dig-start", usage: "座標が両方とも奇数のマス。掘る対象を壁マスと区別して指す言葉として、フェーズ1から使う。" },
    { concept: "dig", everyday: "掘る", technical: "掘る", firstStepId: "first-dig", usage: "壁マスを通路に変える操作。間の壁と2マス先の部屋を一緒に掘る。" },
    { concept: "backtrack", everyday: "戻る", technical: "戻る", firstStepId: "backtrack", usage: "行き止まりから、掘れる部屋があるところまで引き返す動き。戻り方の仕組みは後続フェーズで扱う。" },
  ],
};

for (const entry of mazeDiggingMotivationContent.vocabulary) {
  if (!sequence.steps.some((step) => step.id === entry.firstStepId)) throw new Error("Unknown vocabulary introduction step");
}
