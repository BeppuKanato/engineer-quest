import { mazeCellKey, parseMazeCellKey, type MazeCellKey } from "../../../player/mazeGrid.types";
import { defineLearningContent, type LearningStep } from "../../../player/content.types";
import {
  buildMazeDiggingInitialGrid, mazeDiggingAllWallKeys, mazeDiggingBacktracks, mazeDiggingMainChoices,
  mazeDiggingMainSize, mazeDiggingWalls, runMazeDigging, solveMazeDiggingPath, type MazeDiggingBacktrack,
  type MazeDiggingDig,
} from "../mazeDiggingMaze";
import {
  validateMazeDiggingExecutionCanvas, type MazeDiggingExecutionCanvasState, type MazeDiggingExecutionContent,
} from "./execution.types";

/**
 * 基準データ §3 フェーズ2。盤面とステップは mazeDiggingMaze の組み立て（参照コードの
 * 実行と掘削列からのバックトラック導出）から作り、手書きしない。
 * キャプションは基準データの形式で、掘削は現在マス＋方向、バックトラックは
 * 行き止まりの理由と再開マスを、データから組み立てる。
 */
const size = mazeDiggingMainSize;
const run = runMazeDigging(size, mazeDiggingMainChoices);
const backtracks = mazeDiggingBacktracks(run.digs);
const backtrackAfterDig = new Map<number, { backtrack: MazeDiggingBacktrack; ordinal: number }>(
  backtracks.map((backtrack, index) => [backtrack.afterDigIndex, { backtrack, ordinal: index + 1 }]),
);

function directionName(from: MazeCellKey, room: MazeCellKey): string {
  const start = parseMazeCellKey(from), end = parseMazeCellKey(room);
  if (end.x > start.x) return "右";
  if (end.x < start.x) return "左";
  if (end.y > start.y) return "下";
  return "上";
}

/** 座標の表示は、コードの grid[y][x] の添字順に合わせ (y, x) とする（Issue #326）。 */
function coordinate(key: MazeCellKey): string {
  const { x, y } = parseMazeCellKey(key);
  return `(${y}, ${x})`;
}

function snapshot(state: Partial<MazeDiggingExecutionCanvasState["state"]>,
  highlights: MazeDiggingExecutionCanvasState["highlights"] = []): MazeDiggingExecutionCanvasState {
  return {
    data: { kind: "maze-grid", size },
    state: { walls: [], processing: null, target: null, path: [], start: null, goal: null, ...state },
    highlights,
  };
}

function digStep(dig: MazeDiggingDig, index: number): LearningStep<MazeDiggingExecutionCanvasState> {
  return {
    id: `dig-${index + 1}`,
    caption: `${coordinate(dig.from)} から${directionName(dig.from, dig.room)}へ掘ります。`,
    canvas: snapshot(
      { walls: dig.wallsAfter, processing: dig.room, path: dig.stackPath },
      [{ kind: "cell", id: dig.between }, { kind: "cell", id: dig.room }],
    ),
  };
}

function backtrackStep(backtrack: MazeDiggingBacktrack, ordinal: number): LearningStep<MazeDiggingExecutionCanvasState> {
  return {
    id: `backtrack-${ordinal}`,
    caption: `行き止まりになったので、掘れる部屋がある ${coordinate(backtrack.resumeRoom)} まで戻ります。`,
    canvas: snapshot({ walls: backtrack.wallsAfter, processing: backtrack.resumeRoom, path: backtrack.stackPath }),
  };
}

const steps: LearningStep<MazeDiggingExecutionCanvasState>[] = [
  {
    id: "all-walls", caption: "全部が壁の9×9の盤面を用意します。",
    canvas: snapshot({ walls: mazeDiggingAllWallKeys(size) }),
  },
  {
    id: "dig-start", caption: "まず、スタートの部屋 (1, 1) を掘ります。",
    canvas: snapshot(
      { walls: mazeDiggingWalls(buildMazeDiggingInitialGrid(size)), processing: mazeCellKey(1, 1) },
      [{ kind: "cell", id: mazeCellKey(1, 1) }],
    ),
  },
];
run.digs.forEach((dig, index) => {
  steps.push(digStep(dig, index));
  const found = backtrackAfterDig.get(index);
  if (found) steps.push(backtrackStep(found.backtrack, found.ordinal));
});
steps.push({
  id: "complete", caption: "迷路が完成し、輪がなく、どの部屋からどの部屋へも必ずたどり着けます。",
  canvas: snapshot({
    walls: mazeDiggingWalls(run.grid),
    start: mazeCellKey(1, 1), goal: mazeCellKey(size - 2, size - 2),
    path: solveMazeDiggingPath(run.grid, mazeCellKey(1, 1), mazeCellKey(size - 2, size - 2)),
  }),
});

/**
 * 説明専用ステップ（ガイドライン §2-6、Issue #334）。「輪ができない理由」は
 * コードの実行瞬間には対応しないため、完成の後に置き、フェーズ4の
 * チェックポイントには含めない（棒倒し法の loop-what-if と同じ扱い）。
 * 仮定盤面は完成グリッドから決定的に作る: 間の壁を1つだけ余分に掘ると、
 * もとの一本道（両側の部屋の間の最短路）と新しい道で輪ができる。
 * その間の壁と両側の部屋は検証スクリプトで固定する。
 */
const whatIfGrid = run.grid.map(row => [...row]);
whatIfGrid[1][4] = 0;
steps.push(
  {
    id: "no-loops", explanationOnly: true,
    caption: "掘り進める先はまだ掘っていない部屋だけなので、通路に輪はできず、どの部屋へも道は1本だけです。",
    canvas: snapshot({ walls: mazeDiggingWalls(run.grid) }),
  },
  {
    id: "loop-what-if", explanationOnly: true,
    caption: "ためしに、すでに掘った部屋へ間の壁を掘ってみると、もとの道と合わせて輪ができてしまいます。",
    canvas: snapshot(
      {
        walls: mazeDiggingWalls(whatIfGrid), processing: mazeCellKey(5, 1),
        path: [...solveMazeDiggingPath(run.grid, mazeCellKey(3, 1), mazeCellKey(5, 1)), mazeCellKey(4, 1)],
      },
      [{ kind: "cell", id: mazeCellKey(4, 1) }, { kind: "cell", id: mazeCellKey(5, 1) }],
    ),
  },
);

const sequence = defineLearningContent<MazeDiggingExecutionCanvasState>({
  version: 1, kind: "step-sequence", id: "maze-digging-execution", phase: 2, intervalMs: 3500,
  steps: steps as [LearningStep<MazeDiggingExecutionCanvasState>, ...LearningStep<MazeDiggingExecutionCanvasState>[]],
}, validateMazeDiggingExecutionCanvas);

export const mazeDiggingExecutionContent: MazeDiggingExecutionContent = {
  ...sequence, stageName: "動きの説明",
};
