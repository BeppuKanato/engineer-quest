/** 600幅の論理座標。SVG全体を等倍比で拡縮し、線・文字も同じ倍率にする。 */
export const graphGeometry = {
  width: 600,
  height: 450,
  graphHeight: 360,
  nodeRadius: 30,
  nodeStrokeWidth: 2,
  edgeStrokeWidth: 2,
  highlightedEdgeStrokeWidth: 5,
  ringRadius: 37,
  ringStrokeWidth: 3,
  ringDasharray: "5 4",
  labelFontSize: 24,
  labelBaseline: 7,
} as const;
