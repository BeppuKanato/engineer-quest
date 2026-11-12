/**
 * 600×450 の論理座標に、額面列・残額・トレイを縦一直線に配置する
 * （教材指針 §1 の1キャンバス集約、UI 定義 §2.3 の均等拡縮に従う）。
 * 額面列は全場面で同じ位置・大きさにし、図の大きさが場面で変わらないようにする。
 */
export const greedyCoinsGeometry = {
  width: 600,
  height: 450,
  /** 額面列: 円形チップの中心 y と半径。 */
  coinRowCenterY: 104,
  coinRadius: 38,
  coinFirstCenterX: 70,
  coinGapX: 92,
  /** 額面チップの強調リング。 */
  ringRadius: 45,
  ringStrokeWidth: 3,
  ringDasharray: "5 4",
  coinLabelFontSize: 22,
  /** 残額表示: 「残り ○円」の中心 y と文字サイズ。 */
  remainingCenterY: 224,
  remainingFontSize: 40,
  /** トレイ: ラベルの y、領域の矩形、小さいチップの配置。 */
  trayLabelY: 282,
  trayX: 40,
  trayY: 296,
  trayWidth: 520,
  trayHeight: 100,
  trayCoinRadius: 24,
  trayCoinFirstCenterX: 82,
  trayCoinGapX: 54,
  trayCoinCenterY: 346,
  trayCoinLabelFontSize: 16,
} as const;

export function greedyCoinsLayout(coinCount: number) {
  const { coinFirstCenterX, coinGapX, coinRowCenterY, trayCoinFirstCenterX, trayCoinGapX, trayCoinCenterY } =
    greedyCoinsGeometry;
  return {
    coinCenter: (index: number) => ({ x: coinFirstCenterX + index * coinGapX, y: coinRowCenterY }),
    trayCoinCenter: (index: number) => ({ x: trayCoinFirstCenterX + index * trayCoinGapX, y: trayCoinCenterY }),
    coinCount,
  };
}
