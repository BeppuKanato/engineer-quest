import { parseMazeCellKey, type MazeGridCanvasState } from "../player/mazeGrid.types";

/**
 * 穴掘り法のグリッド Canvas。型と描画（MazeGridDrawing・mazeGridGeometry）は棒倒し法と
 * 共有するが、状態の意味は逆になる（基準データ §4、要判断ポイント8の推奨デフォルト）:
 * - walls: その時点でまだ壁のマス。盤面は全部壁から始まり、壁が減っていく。
 * - processing: 現在マス。部屋（通路側のマス）でなければならない。
 * - target: 次に掘る部屋。まだ壁のマスでなければならない。
 * - highlights: 掘ったばかりのマス（間の壁＋部屋）。
 * - path: スタックの経路。壁を通らず、隣接マスでつながる。
 * 共有の validateMazeGridCanvas は棒倒し法の前提（processing は壁・target は非壁）で
 * 作られているため使わず、検証はこの単元側の意味に合わせた検証器を別に持つ。
 */
export type MazeDiggingCanvasState = MazeGridCanvasState;

/** 型付き教材の参照整合性をロード時に検証し、不正な盤面を黙って再生しない。 */
export function validateMazeDiggingCanvas(canvas: MazeDiggingCanvasState): void {
  const { size } = canvas.data;
  if (canvas.data.kind !== "maze-grid") throw new Error("Unknown maze grid canvas kind");
  if (!Number.isInteger(size) || size < 3 || size % 2 === 0) {
    throw new Error("Maze grid size must be an odd integer of at least 3");
  }
  const inRange = (key: string) => {
    const { x, y } = parseMazeCellKey(key);
    return x >= 0 && x < size && y >= 0 && y < size;
  };
  const walls = new Set<string>();
  for (const key of canvas.state.walls) {
    if (!inRange(key)) throw new Error(`Wall out of range: ${key}`);
    if (walls.has(key)) throw new Error(`Duplicate wall: ${key}`);
    walls.add(key);
  }
  const { processing, target, path, start, goal } = canvas.state;
  if (processing !== null) {
    if (!inRange(processing)) throw new Error(`Processing cell out of range: ${processing}`);
    if (walls.has(processing)) throw new Error("Processing cell must be an open cell (current room)");
  }
  if (target !== null) {
    if (!inRange(target)) throw new Error(`Target cell out of range: ${target}`);
    if (!walls.has(target)) throw new Error("Target cell must still be a wall (room to dig)");
    if (target === processing) throw new Error("Target cell must differ from processing cell");
  }
  if (start !== null && (!inRange(start) || walls.has(start))) throw new Error("Start must be an open in-range cell");
  if (goal !== null && (!inRange(goal) || walls.has(goal))) throw new Error("Goal must be an open in-range cell");
  if (start !== null && start === goal) throw new Error("Start and goal must differ");
  if (new Set(path).size !== path.length) throw new Error("Path must not revisit a cell");
  path.forEach((key, index) => {
    if (!inRange(key) || walls.has(key)) throw new Error(`Path cell must be open and in range: ${key}`);
    if (index > 0) {
      const prev = parseMazeCellKey(path[index - 1]);
      const here = parseMazeCellKey(key);
      if (Math.abs(prev.x - here.x) + Math.abs(prev.y - here.y) !== 1) throw new Error("Path must move one cell at a time");
    }
  });
  if (path.length > 0) {
    if (start !== null && path[0] !== start) throw new Error("Path must start at the start cell");
    if (goal !== null && path.at(-1) !== goal) throw new Error("Path must end at the goal cell");
  }
  for (const highlight of canvas.highlights) {
    if (highlight.kind !== "cell" || !inRange(highlight.id)) throw new Error(`Unknown maze highlight: ${highlight.id}`);
  }
}
