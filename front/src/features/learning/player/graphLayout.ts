import type { GraphCanvasState } from "./graphCanvas.types";
import { graphGeometry } from "./graphGeometry";

/** グラフと内部状態を論理座標で配置し、全体へ同一倍率を適用する。 */
export function layoutGraphCanvas(canvas: GraphCanvasState, width: number, height: number) {
  const columns = 7;
  const structureHeights = canvas.state.structures.map(({ items }) =>
    36 + Math.max(1, Math.ceil(items.length / columns)) * 60);
  const variableHeight = canvas.state.variables.length ? 36 : 0;
  const contentHeight = Math.max(graphGeometry.height,
    graphGeometry.graphHeight + structureHeights.reduce((sum, value) => sum + value, 0) + variableHeight);
  const unit = Math.min(width / graphGeometry.width, height / contentHeight);
  const offsetX = (width - graphGeometry.width * unit) / 2;
  const offsetY = (height - contentHeight * unit) / 2;
  const graphHeight = offsetY + graphGeometry.graphHeight * unit;
  const nodes = canvas.data.nodes.map(node => ({ ...node,
    x: offsetX + node.x * unit, y: offsetY + node.y * unit,
  }));
  let structureY = graphHeight;
  const structures = canvas.state.structures.map((structure, index) => {
    const y = structureY;
    structureY += structureHeights[index] * unit;
    return { ...structure, y, items: structure.items.map((item, itemIndex) => {
      const row = Math.floor(itemIndex / columns);
      const rowLength = Math.min(columns, structure.items.length - row * columns);
      return { ...item,
        x: width / 2 + (itemIndex % columns - (rowLength - 1) / 2) * 72 * unit,
        y: y + (56 + row * 60) * unit,
      };
    }) };
  });
  return { nodes, structures, graphHeight, unit, contentHeight, variableY: structureY + 24 * unit };
}
