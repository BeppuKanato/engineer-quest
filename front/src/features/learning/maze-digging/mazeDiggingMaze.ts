import { mazeCellKey, parseMazeCellKey, type MazeCellKey } from "../player/mazeGrid.types";

/**
 * 穴掘り法の盤面データを組み立てる正本（基準データ §1・§2、契約 maze-digging-v1）。
 * 盤面は参照コードの手続き（スタックによる反復版）をそのまま実行して決定的に導出し、
 * 手書きのグリッドや壁リストは置かない。方向の選択は choices（その時点の候補リストへの
 * 番号）で外から与える決定論方式で、棒倒し法と同じ考え方。
 * 候補の提示順は方向リストの並び（上・右・下・左）そのもので、choices の意味を決める。
 */
export const mazeDiggingDirections = [
  { name: "up", x: 0, y: -1 },
  { name: "right", x: 1, y: 0 },
  { name: "down", x: 0, y: 1 },
  { name: "left", x: -1, y: 0 },
] as const;
export type MazeDiggingDirection = (typeof mazeDiggingDirections)[number]["name"];

/** 主教材 9×9 と転移用 7×7 の choices（基準データ §1、実行検証済み）。長さは 部屋の数 − 1。 */
export const mazeDiggingMainSize = 9;
export const mazeDiggingMainChoices: readonly number[] = [0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0, 0, 0, 0];
export const mazeDiggingSmallSize = 7;
export const mazeDiggingSmallChoices: readonly number[] = [0, 0, 0, 1, 0, 1, 0, 0];

/** グリッドの符号化は棒倒し法と共通（0 = 通路、1 = 壁）。 */
export type MazeDiggingGrid = readonly (readonly number[])[];

function emptyGrid(size: number, fill: number): number[][] {
  return Array.from({ length: size }, () => Array<number>(size).fill(fill));
}

/** 開始マス (1, 1) だけを掘った初期グリッド。 */
export function buildMazeDiggingInitialGrid(size: number): MazeDiggingGrid {
  const grid = emptyGrid(size, 1);
  grid[1][1] = 0;
  return grid;
}

/** グリッドから壁マスのキー集合を取り出す。 */
export function mazeDiggingWalls(grid: MazeDiggingGrid): readonly MazeCellKey[] {
  const walls: MazeCellKey[] = [];
  grid.forEach((row, y) => row.forEach((cell, x) => {
    if (cell === 1) walls.push(mazeCellKey(x, y));
  }));
  return walls;
}

/** 全部が壁の盤面の壁リスト（フェーズ1の「壁の塊」の場面用）。 */
export function mazeDiggingAllWallKeys(size: number): readonly MazeCellKey[] {
  return mazeDiggingWalls(emptyGrid(size, 1));
}

/** 1回の掘削の記録。盤面は掘削直後の完全スナップショットとして壁集合を持つ。 */
export type MazeDiggingDig = {
  /** 掘る前にいた現在マス（部屋）。 */
  readonly from: MazeCellKey;
  /** 掘った部屋（2マス先）。 */
  readonly room: MazeCellKey;
  /** 間の壁マス。 */
  readonly between: MazeCellKey;
  /** この掘削が終わった直後の壁集合。 */
  readonly wallsAfter: readonly MazeCellKey[];
  /** スタックに残る経路（部屋列を間のマスでつないだもの）。戻りの説明に使える。 */
  readonly stackPath: readonly MazeCellKey[];
};

function expandStackPath(stack: readonly { x: number; y: number }[]): MazeCellKey[] {
  const path: MazeCellKey[] = [];
  stack.forEach((room, index) => {
    if (index > 0) {
      const prev = stack[index - 1];
      path.push(mazeCellKey((prev.x + room.x) / 2, (prev.y + room.y) / 2));
    }
    path.push(mazeCellKey(room.x, room.y));
  });
  return path;
}

/**
 * 参照コード（契約 maze-digging-v1）の手続きを実行し、完成グリッドと掘削列を返す。
 * choices の消費個数は掘削回数（部屋の数 − 1）とちょうど一致しなければならない。
 * 一致しない場合は教材データの誤りとして弾く（棒倒し法の choices 検証と同じ方針）。
 */
export function runMazeDigging(size: number, choices: readonly number[]): {
  readonly grid: MazeDiggingGrid;
  readonly digs: readonly MazeDiggingDig[];
} {
  if (!Number.isInteger(size) || size < 3 || size % 2 === 0) {
    throw new Error("Maze-digging size must be an odd integer of at least 3");
  }
  const grid = emptyGrid(size, 1);
  grid[1][1] = 0;
  const stack: { x: number; y: number }[] = [{ x: 1, y: 1 }];
  const digs: MazeDiggingDig[] = [];
  let step = 0;
  while (stack.length > 0) {
    const { x, y } = stack[stack.length - 1];
    const candidates: { x: number; y: number }[] = [];
    for (const direction of mazeDiggingDirections) {
      const nx = x + 2 * direction.x;
      const ny = y + 2 * direction.y;
      if (nx >= 1 && nx < size - 1 && ny >= 1 && ny < size - 1 && grid[ny][nx] === 1) {
        candidates.push({ x: nx, y: ny });
      }
    }
    if (candidates.length > 0) {
      const choice = choices[step];
      if (!Number.isInteger(choice) || choice < 0 || choice >= candidates.length) {
        throw new Error(`Invalid maze-digging choice at step ${step}: ${choice}`);
      }
      step += 1;
      const { x: nx, y: ny } = candidates[choice];
      const between = { x: (x + nx) / 2, y: (y + ny) / 2 };
      grid[between.y][between.x] = 0;
      grid[ny][nx] = 0;
      stack.push({ x: nx, y: ny });
      digs.push({
        from: mazeCellKey(x, y),
        room: mazeCellKey(nx, ny),
        between: mazeCellKey(between.x, between.y),
        wallsAfter: mazeDiggingWalls(grid),
        stackPath: expandStackPath(stack),
      });
    } else {
      stack.pop();
    }
  }
  if (step !== choices.length) {
    throw new Error(`Maze-digging choices not fully consumed: used ${step} of ${choices.length}`);
  }
  return { grid, digs };
}

/** 完成グリッドだけが要る場合の短縮形。 */
export function buildMazeDiggingGrid(size: number, choices: readonly number[]): MazeDiggingGrid {
  return runMazeDigging(size, choices).grid;
}

/** 1回のバックトラックの記録。掘削列から決定的に導出する（盤面は変わらない）。 */
export type MazeDiggingBacktrack = {
  /** このバックトラックが起きる直前の掘削の位置（digs への 0 始まりの添字）。 */
  readonly afterDigIndex: number;
  /** 行き止まりで取り除かれた部屋（現在マス側から再開マス側へ向かう順）。 */
  readonly poppedRooms: readonly MazeCellKey[];
  /** 戻り終えた先の部屋。ここから掘り直す。 */
  readonly resumeRoom: MazeCellKey;
  /** 盤面の壁集合。直前の掘削直後と変わらない。 */
  readonly wallsAfter: readonly MazeCellKey[];
  /** 戻り終えた時点のスタック経路（部屋列を間のマスでつないだもの）。 */
  readonly stackPath: readonly MazeCellKey[];
};

/**
 * 掘削列からバックトラックを導出する。次の掘削の開始マスが直前の掘削先と
 * 異なれば、その間にスタックの巻き戻しが起きている。再開マスと戻り終えた
 * スタックは、次の掘削のスタック経路（末尾の間の壁＋部屋を除いたもの）から
 * 読み取れる。最後の掘削の後にスタックが空になるまで戻る過程は、完成側の
 * 状態であり、バックトラックには含めない。
 */
export function mazeDiggingBacktracks(digs: readonly MazeDiggingDig[]): readonly MazeDiggingBacktrack[] {
  const backtracks: MazeDiggingBacktrack[] = [];
  for (let index = 0; index + 1 < digs.length; index += 1) {
    const next = digs[index + 1];
    if (next.from === digs[index].room) continue;
    const rooms = digs[index].stackPath.filter((_, position) => position % 2 === 0);
    const resumeIndex = rooms.indexOf(next.from);
    if (resumeIndex < 0) throw new Error(`Backtrack resume room is not on the stack: ${next.from}`);
    backtracks.push({
      afterDigIndex: index,
      poppedRooms: rooms.slice(resumeIndex + 1).reverse(),
      resumeRoom: next.from,
      wallsAfter: digs[index].wallsAfter,
      stackPath: next.stackPath.slice(0, -2),
    });
  }
  return backtracks;
}

/**
 * 完成した迷路の start から goal への経路を幅優先探索で導出する。
 * 完全迷路では経路は1つに定まるため、結果は決定的になる。
 */
export function solveMazeDiggingPath(grid: MazeDiggingGrid, start: MazeCellKey, goal: MazeCellKey): readonly MazeCellKey[] {
  const size = grid.length;
  const isOpen = (key: MazeCellKey) => {
    const { x, y } = parseMazeCellKey(key);
    return x >= 0 && x < size && y >= 0 && y < size && grid[y][x] === 0;
  };
  if (!isOpen(start) || !isOpen(goal)) throw new Error("Maze path endpoints must be open cells");
  const previous = new Map<MazeCellKey, MazeCellKey | null>([[start, null]]);
  const queue: MazeCellKey[] = [start];
  while (queue.length > 0) {
    const here = queue.shift()!;
    if (here === goal) break;
    const { x, y } = parseMazeCellKey(here);
    for (const direction of mazeDiggingDirections) {
      const next = mazeCellKey(x + direction.x, y + direction.y);
      if (isOpen(next) && !previous.has(next)) {
        previous.set(next, here);
        queue.push(next);
      }
    }
  }
  if (!previous.has(goal)) throw new Error(`Maze path not found: ${start} -> ${goal}`);
  const path: MazeCellKey[] = [];
  let cursor: MazeCellKey | null = goal;
  while (cursor !== null) {
    path.push(cursor);
    cursor = previous.get(cursor) ?? null;
  }
  return path.reverse();
}
