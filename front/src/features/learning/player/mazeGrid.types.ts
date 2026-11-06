/**
 * 迷路グリッド用の Canvas（GraphDrawing に対するグリッド版）。
 * 正本: docs/concept/wall-extension-unit-baseline.md §4、docs/concept/learning-player-ui.md §2。
 * セルは "x,y" キーで表し、教材データへ色の HEX 値は持ち込まない（意味は描画側が
 * playerTokens へ変換する）。座標は x が列（右へ増加）、y が行（下へ増加）。
 */
export type MazeCellKey = string;

export function mazeCellKey(x: number, y: number): MazeCellKey {
  return `${x},${y}`;
}

export function parseMazeCellKey(key: MazeCellKey): { x: number; y: number } {
  const [x, y] = key.split(",").map(Number);
  if (!Number.isInteger(x) || !Number.isInteger(y)) throw new Error(`Invalid maze cell key: ${key}`);
  return { x, y };
}

export type MazeGridCanvasState = {
  readonly data: {
    readonly kind: "maze-grid";
    /** 盤面の一辺のマス数。棒倒し法・穴掘り法の盤面は奇数。 */
    readonly size: number;
  };
  readonly state: {
    /** 壁になっているマスのキー。柱も壁として含む。 */
    readonly walls: readonly MazeCellKey[];
    /** 今まさに処理している柱のキー。壁に含まれていなければならない。 */
    readonly processing: MazeCellKey | null;
    /** 次に壁になる予定のマス。まだ壁ではないマスでなければならない。 */
    readonly target: MazeCellKey | null;
    /** スタートからゴールまで（または途中まで）の経路。壁を通らず、隣接マスでつながる。 */
    readonly path: readonly MazeCellKey[];
    readonly start: MazeCellKey | null;
    readonly goal: MazeCellKey | null;
  };
  readonly highlights: readonly { kind: "cell"; id: MazeCellKey }[];
};

/** 型付き教材の参照整合性をロード時に検証し、不正な盤面を黙って再生しない。 */
export function validateMazeGridCanvas(canvas: MazeGridCanvasState): void {
  const { size } = canvas.data;
  if (canvas.data.kind !== "maze-grid") throw new Error("Unknown maze grid canvas kind");
  if (!Number.isInteger(size) || size < 3 || size % 2 === 0) {
    throw new Error("Maze grid size must be an odd integer of at least 3");
  }
  const inRange = (key: MazeCellKey) => {
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
    if (!walls.has(processing)) throw new Error("Processing cell must be a wall (pillar)");
  }
  if (target !== null) {
    if (!inRange(target)) throw new Error(`Target cell out of range: ${target}`);
    if (walls.has(target)) throw new Error("Target cell must not be a wall yet");
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
