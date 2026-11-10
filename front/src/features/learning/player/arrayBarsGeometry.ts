/**
 * 600×450 の論理座標に、値の大きさに比例する高さの棒を横並びにする（UI 定義 §2.3 の均等拡縮に従う）。
 * 底辺（基準線）は全場面で共通にし、値のラベルは棒の真上、位置（インデックス）は基準線の下に置く。
 */
export const arrayBarsGeometry = {
  width: 600,
  height: 450,
  /** 左右の余白。棒の並びはこの内側に収める。 */
  marginX: 60,
  /** 棒の底辺の y 座標。 */
  baselineY: 368,
  /** 最大値の棒の高さ。 */
  maxBarHeight: 288,
  /** 1マス分の幅に対する棒の幅の割合。 */
  barRatio: 0.62,
  valueLabelFontSize: 24,
  valueLabelGap: 12,
  indexLabelFontSize: 14,
  indexLabelOffsetY: 30,
} as const;

export function arrayBarsLayout(values: readonly number[]) {
  const { marginX, baselineY, maxBarHeight, barRatio } = arrayBarsGeometry;
  const maxValue = Math.max(...values, 0);
  const slotWidth = (arrayBarsGeometry.width - marginX * 2) / values.length;
  const barWidth = slotWidth * barRatio;
  return {
    baselineY,
    bar: (index: number) => {
      const height = maxValue > 0 ? (values[index] / maxValue) * maxBarHeight : 0;
      return {
        x: marginX + index * slotWidth + (slotWidth - barWidth) / 2,
        y: baselineY - height,
        width: barWidth,
        height,
        centerX: marginX + (index + 0.5) * slotWidth,
      };
    },
  };
}
