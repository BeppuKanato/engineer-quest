/**
 * フェーズ4・5のコード契約 v1。識別は表示行番号ではなく意味IDで行う。
 * 原文: back/prisma/seedData/breadthFirstSearchCourseSeed.ts の breadthFirstSearchAnswerCode。
 * Python本文は変更せず、空白・インデントも維持する。
 */
export const bfsCode = {
  id: "bfs-distances-deque",
  version: 1,
  language: "python",
  lines: [
    { id: "import-deque", text: "from collections import deque" },
    { id: "define-function", text: "def bfs_distances(graph, start):" },
    { id: "initialize-distances", text: "    distances = {start: 0}" },
    { id: "initialize-queue", text: "    queue = deque([start])" },
    { id: "while-queue", text: "    while queue:" },
    { id: "dequeue-node", text: "        node = queue.popleft()" },
    { id: "for-neighbor", text: "        for neighbor in graph.get(node, []):" },
    { id: "if-undiscovered", text: "            if neighbor not in distances:" },
    { id: "assign-distance", text: "                distances[neighbor] = distances[node] + 1" },
    { id: "enqueue-neighbor", text: "                queue.append(neighbor)" },
    { id: "return-distances", text: "    return distances" },
  ],
} as const;

export type BfsCodeLineId = typeof bfsCode.lines[number]["id"];
export const bfsCodeLineNumber = (id: BfsCodeLineId): number => bfsCode.lines.findIndex(line => line.id === id) + 1;
