/**
 * フェーズ4・5・7のコード契約 greedy-coins-v1。識別は表示行番号ではなく意味IDで行う。
 * 原文: 基準データ §2 の greedy_coins（8行。行の追加・変更・言い換え禁止。
 * フェーズ7のコードと一致させる契約）。Python本文は変更せず、空白・インデントも維持する。
 */
export const greedyCoinsCode = {
  id: "greedy-coins-v1",
  version: 1,
  language: "python",
  lines: [
    { id: "define-function", text: "def greedy_coins(amount, coins):" },
    { id: "init-result", text: "    result = []" },
    { id: "init-remaining", text: "    remaining = amount" },
    { id: "for-coin", text: "    for coin in coins:" },
    { id: "while-remaining", text: "        while remaining >= coin:" },
    { id: "append-coin", text: "            result.append(coin)" },
    { id: "subtract-coin", text: "            remaining -= coin" },
    { id: "return-result", text: "    return result" },
  ],
} as const;

export type GreedyCoinsCodeLineId = typeof greedyCoinsCode.lines[number]["id"];
export const greedyCoinsCodeLineNumber = (id: GreedyCoinsCodeLineId): number =>
  greedyCoinsCode.lines.findIndex(line => line.id === id) + 1;
export const greedyCoinsCodeSource = greedyCoinsCode.lines.map(line => line.text).join("\n");
