import { mazeCellKey, type MazeCellKey } from "../player/mazeGrid.types";

/**
 * 棒倒し法の盤面データを組み立てる正本（基準データ §1・§2、契約 wall-extension-v1）。
 * 壁リストは「外周＋柱＋伸長」から組み立て、手書きのベタ書きはしない。
 * 方向の選択は choices（許される方向リストへの番号）で外から与える決定論方式。
 */
export const wallExtensionDirections = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
} as const;
export type WallExtensionDirection = keyof typeof wallExtensionDirections;

/** 主教材 9×9 の choices と転移用 7×7 の choices（基準データ §1、実行検証済み）。 */
export const wallExtensionMainSize = 9;
export const wallExtensionMainChoices: readonly number[] = [3, 1, 2, 0, 2, 0, 2, 2, 0];
export const wallExtensionSmallSize = 7;
export const wallExtensionSmallChoices: readonly number[] = [1, 2, 2, 0];

/** 主教材 9×9 でスタート (1,7) からゴール (7,7) へたどる検証済みの経路。 */
export const wallExtensionMainPath: readonly MazeCellKey[] = [
  "1,7", "1,6", "1,5", "1,4", "1,3", "1,2", "1,1", "2,1", "3,1", "4,1",
  "5,1", "6,1", "7,1", "7,2", "7,3", "7,4", "7,5", "7,6", "7,7",
];

/** 柱の座標。左上から右下へ、2マスおき（座標が両方とも偶数）。 */
export function wallExtensionPillars(size: number): readonly MazeCellKey[] {
  const pillars: MazeCellKey[] = [];
  for (let y = 2; y < size - 1; y += 2) {
    for (let x = 2; x < size - 1; x += 2) {
      pillars.push(mazeCellKey(x, y));
    }
  }
  return pillars;
}

/** その柱から伸ばせる方向。一番上の段（y === 2）だけ4方向、それ以外は上を除く3方向。 */
export function wallExtensionAllowedDirections(pillar: MazeCellKey): readonly WallExtensionDirection[] {
  const y = Number(pillar.split(",")[1]);
  return y === 2 ? ["up", "down", "left", "right"] : ["down", "left", "right"];
}

/** 外周の壁。 */
export function wallExtensionBorderWalls(size: number): readonly MazeCellKey[] {
  const walls: MazeCellKey[] = [];
  for (let i = 0; i < size; i++) {
    walls.push(mazeCellKey(i, 0), mazeCellKey(i, size - 1), mazeCellKey(0, i), mazeCellKey(size - 1, i));
  }
  return [...new Set(walls)];
}

export type WallExtensionExtension = {
  readonly pillar: MazeCellKey;
  readonly direction: WallExtensionDirection;
  readonly target: MazeCellKey;
};

/** choices に従って各柱の伸長先を決める。既に壁のマスを選んだ場合は教材データの誤りとして弾く。 */
export function wallExtensionExtensions(size: number, choices: readonly number[]): readonly WallExtensionExtension[] {
  const taken = new Set<MazeCellKey>([...wallExtensionBorderWalls(size), ...wallExtensionPillars(size)]);
  return wallExtensionPillars(size).map((pillar, index) => {
    const allowed = wallExtensionAllowedDirections(pillar);
    const choice = choices[index];
    if (!Number.isInteger(choice) || choice < 0 || choice >= allowed.length) {
      throw new Error(`Invalid wall-extension choice at pillar ${pillar}: ${choice}`);
    }
    const direction = allowed[choice];
    const delta = wallExtensionDirections[direction];
    const [x, y] = pillar.split(",").map(Number);
    const target = mazeCellKey(x + delta.x, y + delta.y);
    if (taken.has(target)) throw new Error(`Wall-extension target already walled: ${target}`);
    taken.add(target);
    return { pillar, direction, target };
  });
}

/**
 * 壁リストを組み立てる。extensionCount を省略すると完成形、
 * 指定するとその本数まで伸ばした途中状態（柱はすべて立った状態）。
 */
export function buildWallExtensionWalls(size: number, choices: readonly number[], extensionCount?: number): readonly MazeCellKey[] {
  const extensions = wallExtensionExtensions(size, choices);
  const applied = extensionCount === undefined ? extensions : extensions.slice(0, extensionCount);
  return [
    ...wallExtensionBorderWalls(size),
    ...wallExtensionPillars(size),
    ...applied.map((extension) => extension.target),
  ];
}
