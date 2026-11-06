/**
 * フェーズ4・5・7のコード契約 bubble-sort-v1。識別は表示行番号ではなく意味IDで行う。
 * 原文: 基準データ §2 の bubble_sort（行の追加・変更・言い換え禁止。フェーズ7のコードと一致させる契約）。
 * Python本文は変更せず、空白・インデントも維持する。
 */
export const bubbleSortCode = {
  id: "bubble-sort-v1",
  version: 1,
  language: "python",
  lines: [
    { id: "define-function", text: "def bubble_sort(values):" },
    { id: "copy-values", text: "    result = list(values)" },
    { id: "count-values", text: "    n = len(result)" },
    { id: "for-pass", text: "    for i in range(n - 1):" },
    { id: "for-compare", text: "        for j in range(n - 1 - i):" },
    { id: "if-larger", text: "            if result[j] > result[j + 1]:" },
    { id: "swap-values", text: "                result[j], result[j + 1] = result[j + 1], result[j]" },
    { id: "return-result", text: "    return result" },
  ],
} as const;

export type BubbleSortCodeLineId = typeof bubbleSortCode.lines[number]["id"];
export const bubbleSortCodeLineNumber = (id: BubbleSortCodeLineId): number =>
  bubbleSortCode.lines.findIndex(line => line.id === id) + 1;
export const bubbleSortCodeSource = bubbleSortCode.lines.map(line => line.text).join("\n");
