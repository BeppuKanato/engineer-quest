/** 基準書§7.1のコード契約v1。意味ID・本文・Pythonのインデントをここで固定する。 */
export const dfsCode = {
  id: "dfs-order-stack", version: 1, language: "python",
  lines: [
    { id: "define-function", text: "def dfs_order(graph, start):" },
    { id: "initialize-visited", text: "    visited = {start}" },
    { id: "initialize-order", text: "    order = []" },
    { id: "initialize-stack", text: "    stack = [start]" },
    { id: "while-stack", text: "    while stack:" },
    { id: "pop-node", text: "        node = stack.pop()" },
    { id: "append-order", text: "        order.append(node)" },
    { id: "for-neighbor-reversed", text: "        for neighbor in reversed(graph.get(node, [])):" },
    { id: "if-unvisited", text: "            if neighbor not in visited:" },
    { id: "mark-visited", text: "                visited.add(neighbor)" },
    { id: "append-stack", text: "                stack.append(neighbor)" },
    { id: "return-order", text: "    return order" },
  ],
} as const;

export type DfsCodeLineId = typeof dfsCode.lines[number]["id"];
export const dfsCodeLineNumber = (id: DfsCodeLineId): number => dfsCode.lines.findIndex(line => line.id === id) + 1;
export const dfsCodeSource = dfsCode.lines.map(line => line.text).join("\n");
