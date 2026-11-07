/**
 * 二分探索の実行データを組み立てる正本（基準データ §1・§2、契約 binary-search-v1）。
 * 参照コードと同じ手順をたどり、比較ごとの範囲を完全スナップショットとして返す。
 * 配列は手書きのベタ書きにせず、初期値から決定的に組み立てる。
 * 入力は変更しない（読み取りのみ。基準データ §2 の契約どおり）。
 */

/** 主教材 [3, 7, 12, 19, 25, 31, 42] で 25 を探す（左を捨てる→右を捨てる→一致の3回、基準データ §1、実行検証済み）。 */
export const binarySearchMainValues: readonly number[] = [3, 7, 12, 19, 25, 31, 42];
export const binarySearchMainTarget = 25;
/** 転移用 [2, 5, 8, 12, 16, 23, 38, 56, 72, 91] で 23 を探す（偶数長で中央が左寄りになる、基準データ §1）。 */
export const binarySearchTransferValues: readonly number[] = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91];
export const binarySearchTransferTarget = 23;

export type BinarySearchProbe = {
  /** この比較の時点で残っている範囲（両端含む位置）。 */
  readonly lo: number;
  readonly hi: number;
  /** 真ん中の位置。(lo + hi) // 2（切り捨て）。 */
  readonly mid: number;
  /** 真ん中の値。 */
  readonly value: number;
  /** 一致したか、真ん中より小さい側（左）を捨てるか、大きい側（右）を捨てるか。 */
  readonly outcome: "hit" | "drop-left" | "drop-right";
};

/** 参照コード（契約 binary-search-v1）の手順で全比較を記録する。 */
export function binarySearchProbes(values: readonly number[], target: number): readonly BinarySearchProbe[] {
  const probes: BinarySearchProbe[] = [];
  let lo = 0;
  let hi = values.length - 1;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const value = values[mid];
    if (value === target) {
      probes.push({ lo, hi, mid, value, outcome: "hit" });
      break;
    }
    if (value < target) {
      probes.push({ lo, hi, mid, value, outcome: "drop-left" });
      lo = mid + 1;
    } else {
      probes.push({ lo, hi, mid, value, outcome: "drop-right" });
      hi = mid - 1;
    }
  }
  return probes;
}

/** 探す値の位置を返す。無い場合は -1。入力は変更しない。 */
export function runBinarySearch(values: readonly number[], target: number): number {
  const probes = binarySearchProbes(values, target);
  const last = probes[probes.length - 1];
  return last !== undefined && last.outcome === "hit" ? last.mid : -1;
}

/**
 * 数当てゲームで候補が半分ずつ減るときの件数の列（基準データ §1「導入の数当て」）。
 * 100 なら [100, 50, 25, 13, 7, 4, 2, 1]（7 回で 1 個まで絞れる）。
 * 割り切れない場合は切り上げる（残る候補は多い側で数える）。
 */
export function binarySearchHalvingCounts(total: number): readonly number[] {
  if (!Number.isInteger(total) || total < 1) {
    throw new Error("Halving counts need a positive integer total");
  }
  const counts = [total];
  while (counts[counts.length - 1] > 1) {
    counts.push(Math.ceil(counts[counts.length - 1] / 2));
  }
  return counts;
}
