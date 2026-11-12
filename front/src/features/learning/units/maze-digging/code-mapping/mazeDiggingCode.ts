/**
 * フェーズ4・5のコード契約 maze-digging-v1。識別は表示行番号ではなく意味IDで行う。
 * 原文: 基準データ §2 の dig_maze（行の追加・変更・言い換え禁止。フェーズ7のコードと一致させる契約）。
 * Python本文は変更せず、空白・インデントも維持する。
 */
export const mazeDiggingCode = {
  id: "maze-digging-v1",
  version: 1,
  language: "python",
  lines: [
    { id: "define-function", text: "def dig_maze(size, choices):" },
    { id: "initialize-grid", text: "    grid = [[1] * size for _ in range(size)]" },
    { id: "define-directions", text: "    directions = [(0, -1), (1, 0), (0, 1), (-1, 0)]" },
    { id: "dig-start", text: "    grid[1][1] = 0" },
    { id: "initialize-stack", text: "    stack = [(1, 1)]" },
    { id: "initialize-step", text: "    step = 0" },
    { id: "while-stack", text: "    while stack:" },
    { id: "current-room", text: "        x, y = stack[-1]" },
    { id: "initialize-candidates", text: "        candidates = []" },
    { id: "for-direction", text: "        for dx, dy in directions:" },
    { id: "compute-next", text: "            nx, ny = x + 2 * dx, y + 2 * dy" },
    { id: "if-diggable", text: "            if 1 <= nx < size - 1 and 1 <= ny < size - 1 and grid[ny][nx] == 1:" },
    { id: "append-candidate", text: "                candidates.append((nx, ny))" },
    { id: "if-candidates", text: "        if candidates:" },
    { id: "choose-candidate", text: "            nx, ny = candidates[choices[step]]" },
    { id: "advance-step", text: "            step += 1" },
    { id: "dig-between", text: "            grid[(y + ny) // 2][(x + nx) // 2] = 0" },
    { id: "dig-room", text: "            grid[ny][nx] = 0" },
    { id: "push-stack", text: "            stack.append((nx, ny))" },
    { id: "else-branch", text: "        else:" },
    { id: "pop-stack", text: "            stack.pop()" },
    { id: "return-grid", text: "    return grid" },
  ],
} as const;

export type MazeDiggingCodeLineId = typeof mazeDiggingCode.lines[number]["id"];
export const mazeDiggingCodeLineNumber = (id: MazeDiggingCodeLineId): number =>
  mazeDiggingCode.lines.findIndex(line => line.id === id) + 1;
export const mazeDiggingCodeSource = mazeDiggingCode.lines.map(line => line.text).join("\n");
