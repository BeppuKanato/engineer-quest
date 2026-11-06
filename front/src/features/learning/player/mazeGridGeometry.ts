import { parseMazeCellKey, type MazeCellKey } from "./mazeGrid.types";

/**
 * 600×450 の論理座標に正方形グリッドを中央配置する（UI 定義 §2.3 の均等拡縮に従う）。
 * 基準データ §4 の「9×9 で1マス約48px」に合わせ、グリッド一辺は 432 とする。
 */
export const mazeGridGeometry = {
  width: 600,
  height: 450,
  extent: 432,
} as const;

export function mazeGridLayout(size: number) {
  const cell = mazeGridGeometry.extent / size;
  const originX = (mazeGridGeometry.width - mazeGridGeometry.extent) / 2;
  const originY = (mazeGridGeometry.height - mazeGridGeometry.extent) / 2;
  return {
    cell,
    originX,
    originY,
    rect: (key: MazeCellKey) => {
      const { x, y } = parseMazeCellKey(key);
      return { x: originX + x * cell, y: originY + y * cell, width: cell, height: cell };
    },
    center: (key: MazeCellKey) => {
      const { x, y } = parseMazeCellKey(key);
      return { x: originX + (x + 0.5) * cell, y: originY + (y + 0.5) * cell };
    },
  };
}
