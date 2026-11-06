/** Sin カーブの軌跡。t は 0〜1、段階 i のノードは t = i / (段階数 - 1) に乗る。単元画面の UnitPathMap と最終リザルトのミニマップで共有する。 */
export const WAVE = { width: 1200, height: 480, margin: 90, center: 225, amplitude: 100 } as const;
export const wavePoint = (t: number) => ({
  x: WAVE.margin + t * (WAVE.width - WAVE.margin * 2),
  y: WAVE.center - WAVE.amplitude * Math.sin(t * Math.PI * 3),
});
export const wavePath = (until: number) => {
  const segments = Math.max(1, Math.round(72 * until));
  return Array.from({ length: segments + 1 }, (_, i) => {
    const point = wavePoint((i / segments) * until);
    return `${i === 0 ? "M" : "L"}${point.x.toFixed(1)},${point.y.toFixed(1)}`;
  }).join(" ");
};
