/**
 * 硬貨の盤面型（基準データ §4）。フェーズ1・2で定義し、フェーズ3〜7と
 * トレース変換が同じスナップショットを再利用する。
 *
 * 盤面は3要素で構成する: 額面列（大きい順の円形チップ）、残額、選んだ硬貨のトレイ。
 * 額面の状態は単元側の語彙で持つ。
 * - current: 今見ている額面（このステップで選ぶ／選んだ硬貨）。処理中の青で示す。
 * - upcoming: まだ先の額面。未到達のベージュで示す。
 * - passed: 通過した額面（使い終わった／残額より大きくて使えなかった）。グレーで示す。
 * 色への写像は描画側（GreedyCoinsDrawing）が playerTokens で行い、
 * 教材データへ色の HEX 値は持ち込まない。完了の表現に緑は使わない。
 */
export type GreedyCoinStatus = "current" | "upcoming" | "passed";

export type GreedyCoinsBoardState = {
  /** 額面列。大きい順（降順）に並べる。 */
  readonly coins: readonly number[];
  /** 額面ごとの状態。coins と同じ長さで、額面の順に並ぶ。 */
  readonly coinStatuses: readonly GreedyCoinStatus[];
  /** 払う金額（元の金額）。残額とトレイの合計と一致しなければならない。 */
  readonly amount: number;
  /** 残額。 */
  readonly remaining: number;
  /** 選んだ硬貨（選択順）。トレイに並ぶ。 */
  readonly tray: readonly number[];
};

export type GreedyCoinsCanvasState = {
  readonly data: { readonly kind: "greedy-coins" };
  readonly state: GreedyCoinsBoardState;
  /** 強調は額面チップだけを指す（位置は coins のインデックス）。 */
  readonly highlights: readonly { kind: "coin"; id: number }[];
};

const coinStatuses: readonly string[] = ["current", "upcoming", "passed"];
/** 額面を進む順序: passed（通過済み）→ current（今見ている）→ upcoming（まだ先）。 */
const statusRank: Record<GreedyCoinStatus, number> = { passed: 0, current: 1, upcoming: 2 };

/** 盤面そのものの整合性を検証する。フェーズ固有の Canvas 検証からも再利用する。 */
export function validateGreedyCoinsBoard(board: GreedyCoinsBoardState): void {
  const { coins, coinStatuses: statuses, amount, remaining, tray } = board;
  if (!Array.isArray(coins) || coins.length === 0) {
    throw new Error("Coin board needs at least one denomination");
  }
  coins.forEach((coin, index) => {
    if (!Number.isInteger(coin) || coin <= 0) {
      throw new Error(`Coin must be a positive integer: index ${index}`);
    }
    if (index > 0 && coin >= coins[index - 1]) {
      throw new Error("Coins must be in strictly descending order");
    }
  });
  if (!Array.isArray(statuses) || statuses.length !== coins.length) {
    throw new Error("Coin statuses must cover every denomination");
  }
  statuses.forEach((status, index) => {
    if (!coinStatuses.includes(status)) throw new Error(`Unknown coin status: index ${index}`);
  });
  if (statuses.filter((status) => status === "current").length > 1) {
    throw new Error("At most one current denomination");
  }
  // 額面は大きい順に1つずつ進むため、状態は passed → current → upcoming の順を崩さない。
  const statusList: readonly GreedyCoinStatus[] = statuses;
  statusList.forEach((status, index) => {
    if (index > 0 && statusRank[status] < statusRank[statusList[index - 1]]) {
      throw new Error("Coin statuses must progress passed, current, then upcoming");
    }
  });
  if (!Number.isInteger(amount) || amount < 0) {
    throw new Error("Amount must be a non-negative integer");
  }
  if (!Number.isInteger(remaining) || remaining < 0 || remaining > amount) {
    throw new Error(`Remaining out of board: ${remaining}`);
  }
  if (!Array.isArray(tray)) throw new Error("Tray must be a list of coins");
  tray.forEach((coin, index) => {
    if (!coins.includes(coin)) throw new Error(`Tray coin is not a denomination: ${coin}`);
    // 選択順は大きい額面から進むため、トレイは単調非増加（同じ額面の連続は可）。
    if (index > 0 && coin > tray[index - 1]) {
      throw new Error("Tray coins must be in selection order (non-increasing)");
    }
  });
  const paid = tray.reduce((sum, coin) => sum + coin, 0);
  if (paid + remaining !== amount) {
    throw new Error(`Tray total and remaining must add up to the amount: ${paid} + ${remaining} !== ${amount}`);
  }
}

/** 型付き教材の参照整合性をロード時に検証し、不正な盤面を黙って再生しない。 */
export function validateGreedyCoinsCanvas(canvas: GreedyCoinsCanvasState): void {
  if (canvas.data.kind !== "greedy-coins") {
    throw new Error("Unknown greedy coins canvas kind");
  }
  validateGreedyCoinsBoard(canvas.state);
  const highlighted = new Set<number>();
  for (const highlight of canvas.highlights) {
    if (highlight.kind !== "coin" || !Number.isInteger(highlight.id)
      || highlight.id < 0 || highlight.id >= canvas.state.coins.length) {
      throw new Error(`Unknown coin highlight: ${highlight.id}`);
    }
    if (highlighted.has(highlight.id)) throw new Error(`Duplicate highlight: ${highlight.id}`);
    highlighted.add(highlight.id);
  }
}
