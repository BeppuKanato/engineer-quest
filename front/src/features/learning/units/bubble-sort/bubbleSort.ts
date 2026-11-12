/**
 * バブルソートの実行データを組み立てる正本（基準データ §1・§2、契約 bubble-sort-v1）。
 * 参照コードと同じ手順をたどり、比較ごとの配列を完全スナップショットとして返す。
 * 配列は手書きのベタ書きにせず、初期値から決定的に組み立てる。
 * 入力は変更せず、並び替えた新しいリストを作る（基準データ §2 の契約どおり）。
 */

/** 主教材 [4, 2, 5, 1, 3]（比較10回・交換6回）と転移用 [3, 1, 4, 2]（基準データ §1、実行検証済み）。 */
export const bubbleSortMainValues: readonly number[] = [4, 2, 5, 1, 3];
export const bubbleSortTransferValues: readonly number[] = [3, 1, 4, 2];

export type BubbleSortComparison = {
  /** 何周目か（1始まり）。 */
  readonly pass: number;
  /** 比べるペアの左側の位置。ペアは [j, j + 1]。 */
  readonly j: number;
  /** 比べた2つの値 [左, 右]。 */
  readonly pair: readonly [number, number];
  /** 左が大きくて入れ替えたかどうか。 */
  readonly swapped: boolean;
  /** この比較を終えた後の配列。 */
  readonly after: readonly number[];
};

/** 参照コード（契約 bubble-sort-v1）の手順で全比較を記録する。 */
export function bubbleSortComparisons(values: readonly number[]): readonly BubbleSortComparison[] {
  const result = [...values];
  const n = result.length;
  const comparisons: BubbleSortComparison[] = [];
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - 1 - i; j++) {
      const pair: readonly [number, number] = [result[j], result[j + 1]];
      const swapped = result[j] > result[j + 1];
      if (swapped) {
        result[j] = pair[1];
        result[j + 1] = pair[0];
      }
      comparisons.push({ pass: i + 1, j, pair, swapped, after: [...result] });
    }
  }
  return comparisons;
}

/** 並び替えた新しいリストを返す。入力は変更しない。 */
export function runBubbleSort(values: readonly number[]): readonly number[] {
  const comparisons = bubbleSortComparisons(values);
  return comparisons.length > 0 ? comparisons[comparisons.length - 1].after : [...values];
}
