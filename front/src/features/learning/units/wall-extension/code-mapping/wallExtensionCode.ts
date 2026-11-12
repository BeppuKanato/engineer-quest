/**
 * フェーズ4・5のコード契約 wall-extension-v1。識別は表示行番号ではなく意味IDで行う。
 * 原文: 基準データ §2 の generate_maze（行の追加・変更・言い換え禁止。フェーズ7のコードと一致させる契約）。
 * Python本文は変更せず、空白・インデントも維持する。
 */
export const wallExtensionCode = {
  id: "wall-extension-v1",
  version: 1,
  language: "python",
  lines: [
    { id: "define-function", text: "def generate_maze(size, choices):" },
    { id: "initialize-grid", text: "    grid = [[0] * size for _ in range(size)]" },
    { id: "for-border", text: "    for i in range(size):" },
    { id: "border-top", text: "        grid[0][i] = 1" },
    { id: "border-bottom", text: "        grid[size - 1][i] = 1" },
    { id: "border-left", text: "        grid[i][0] = 1" },
    { id: "border-right", text: "        grid[i][size - 1] = 1" },
    { id: "initialize-pillars", text: "    pillars = []" },
    { id: "for-pillar-row", text: "    for y in range(2, size - 1, 2):" },
    { id: "for-pillar-column", text: "        for x in range(2, size - 1, 2):" },
    { id: "place-pillar", text: "            grid[y][x] = 1" },
    { id: "append-pillar", text: "            pillars.append((x, y))" },
    { id: "define-directions", text: "    directions = {\"up\": (0, -1), \"down\": (0, 1), \"left\": (-1, 0), \"right\": (1, 0)}" },
    { id: "for-extension", text: "    for (x, y), choice in zip(pillars, choices):" },
    { id: "if-first-row", text: "        if y == 2:" },
    { id: "allowed-four", text: "            allowed = [\"up\", \"down\", \"left\", \"right\"]" },
    { id: "else-branch", text: "        else:" },
    { id: "allowed-three", text: "            allowed = [\"down\", \"left\", \"right\"]" },
    { id: "lookup-delta", text: "        dx, dy = directions[allowed[choice]]" },
    { id: "write-wall", text: "        grid[y + dy][x + dx] = 1" },
    { id: "return-grid", text: "    return grid" },
  ],
} as const;

export type WallExtensionCodeLineId = typeof wallExtensionCode.lines[number]["id"];
export const wallExtensionCodeLineNumber = (id: WallExtensionCodeLineId): number =>
  wallExtensionCode.lines.findIndex(line => line.id === id) + 1;
export const wallExtensionCodeSource = wallExtensionCode.lines.map(line => line.text).join("\n");
