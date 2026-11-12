/**
 * フェーズ4・5・7のコード契約 binary-search-v1。識別は表示行番号ではなく意味IDで行う。
 * 原文: 基準データ §2 の binary_search（行の追加・変更・言い換え禁止。フェーズ7のコードと一致させる契約）。
 * Python本文は変更せず、空白・インデントも維持する。
 * なお基準データ §2 の見出し周辺は「11行」と記すが、コードブロック自体は12行ある。
 * 契約の正はコードブロックの本文であり、本ファイルは12行で固定する（PR で要確認として明示）。
 */
export const binarySearchCode = {
  id: "binary-search-v1",
  version: 1,
  language: "python",
  lines: [
    { id: "define-function", text: "def binary_search(values, target):" },
    { id: "init-lo", text: "    lo = 0" },
    { id: "init-hi", text: "    hi = len(values) - 1" },
    { id: "while-range", text: "    while lo <= hi:" },
    { id: "compute-mid", text: "        mid = (lo + hi) // 2" },
    { id: "if-hit", text: "        if values[mid] == target:" },
    { id: "return-mid", text: "            return mid" },
    { id: "elif-smaller", text: "        elif values[mid] < target:" },
    { id: "drop-left", text: "            lo = mid + 1" },
    { id: "else-larger", text: "        else:" },
    { id: "drop-right", text: "            hi = mid - 1" },
    { id: "return-missing", text: "    return -1" },
  ],
} as const;

export type BinarySearchCodeLineId = typeof binarySearchCode.lines[number]["id"];
export const binarySearchCodeLineNumber = (id: BinarySearchCodeLineId): number =>
  binarySearchCode.lines.findIndex(line => line.id === id) + 1;
export const binarySearchCodeSource = binarySearchCode.lines.map(line => line.text).join("\n");
