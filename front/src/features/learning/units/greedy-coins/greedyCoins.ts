/**
 * 貪欲法（硬貨問題）の実行データを組み立てる正本（基準データ §1・§2、契約 greedy-coins-v1）。
 * 参照コードと同じ手順（額面を大きい順に回し、その額面を使える間くり返す）をたどり、
 * 硬貨1枚ごとの選択を完全な記録として返す。入力は変更しない（読み取りのみ）。
 */

/** 日本の硬貨6種（大きい順）。基準データ §1。 */
export const greedyCoinsDenominations: readonly number[] = [500, 100, 50, 10, 5, 1];
/** 主教材の金額（全6額面をすべて使う、基準データ §1、実行検証済み）。 */
export const greedyCoinsMainAmount = 786;
/** 転移用の金額（500が使えない金額から始まる、基準データ §1）。 */
export const greedyCoinsTransferAmount = 342;
/** 反例の額面と金額（フェーズ6用、基準データ §1）。貪欲は [4, 1, 1] の3枚、最適は [3, 3] の2枚。 */
export const greedyCoinsCounterexampleCoins: readonly number[] = [4, 3, 1];
export const greedyCoinsCounterexampleAmount = 6;

export type GreedyCoinsSelection = {
  /** 選んだ硬貨（何枚目の選択かは並び順で数える）。 */
  readonly coin: number;
  /** この硬貨を選ぶ直前の残額。 */
  readonly remainingBefore: number;
  /** この硬貨を選んだ直後の残額。 */
  readonly remainingAfter: number;
};

function assertGreedyCoinsInput(amount: number, coins: readonly number[]): void {
  if (!Number.isInteger(amount) || amount < 0) {
    throw new Error("Amount must be a non-negative integer");
  }
  if (!Array.isArray(coins) || coins.length === 0) {
    throw new Error("Coins need at least one denomination");
  }
  coins.forEach((coin, index) => {
    if (!Number.isInteger(coin) || coin <= 0) {
      throw new Error(`Coin must be a positive integer: index ${index}`);
    }
    // 契約 greedy-coins-v1 の前提: 額面は降順（大きい順）に渡される。関数内では並べ替えない。
    if (index > 0 && coin >= coins[index - 1]) {
      throw new Error("Coins must be in strictly descending order");
    }
  });
  if (coins[coins.length - 1] !== 1) {
    throw new Error("Coins must include 1 so any amount can be paid exactly");
  }
}

/** 参照コード（契約 greedy-coins-v1）の手順で、硬貨1枚ごとの選択をすべて記録する。 */
export function greedyCoinsSelections(amount: number, coins: readonly number[]): readonly GreedyCoinsSelection[] {
  assertGreedyCoinsInput(amount, coins);
  const selections: GreedyCoinsSelection[] = [];
  let remaining = amount;
  for (const coin of coins) {
    while (remaining >= coin) {
      const remainingBefore = remaining;
      remaining -= coin;
      selections.push({ coin, remainingBefore, remainingAfter: remaining });
    }
  }
  if (remaining !== 0) throw new Error("Amount was not paid exactly");
  return selections;
}

/** 選んだ硬貨のリスト（選択順）を返す。参照コードの戻り値そのもの。 */
export function runGreedyCoins(amount: number, coins: readonly number[]): readonly number[] {
  return greedyCoinsSelections(amount, coins).map((selection) => selection.coin);
}
