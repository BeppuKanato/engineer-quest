import type { GraphCanvasState } from "./graphCanvas.types";

/** 対象データの600×300座標を表示枠へ投影し、同じ座標系内に内部状態も置く。 */
export function layoutGraphCanvas(canvas: GraphCanvasState, width: number, height: number) {
  const unit = Math.max(1, Math.min(width / 600, height / 400, 2));
  const columns = Math.max(1, Math.floor((width - 32) / (72 * unit)));
  const structureHeights = canvas.state.structures.map(({ items }) =>
    (36 + Math.max(1, Math.ceil(items.length / columns)) * 60) * unit);
  const variableHeight = canvas.state.variables.length ? 36 * unit : 0;
  const graphHeight = Math.max(160, height - structureHeights.reduce((sum, value) => sum + value, 0) - variableHeight);
  const nodes = canvas.data.nodes.map((node) => ({
    ...node, x: node.x / 600 * width, y: node.y / 300 * graphHeight,
  }));
  let structureY = graphHeight;
  const structures = canvas.state.structures.map((structure, index) => {
    const y = structureY;
    structureY += structureHeights[index];
    return {
      ...structure, y,
      items: structure.items.map((item, itemIndex) => {
        const row = Math.floor(itemIndex / columns);
        const rowLength = Math.min(columns, structure.items.length - row * columns);
        return {
          ...item,
          x: width / 2 + (itemIndex % columns - (rowLength - 1) / 2) * 72 * unit,
          y: y + (56 + row * 60) * unit,
        };
      }),
    };
  });
  return { nodes, structures, graphHeight, unit, variableY: structureY + 24 * unit };
}
