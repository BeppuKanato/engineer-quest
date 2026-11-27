/** #541: ダイクストラ法・A*探索の共通教材データ。実験条件・既存教材から独立。 */
export type WeightedNodeId = "A" | "B" | "C" | "D" | "E" | "F";
export type WeightedSearchMode = "dijkstra" | "astar";
export const weightedNodes: readonly { id: WeightedNodeId; x: number; y: number }[] = [
  {
    "id": "A",
    "x": 0,
    "y": 0
  },
  {
    "id": "B",
    "x": 2,
    "y": 0
  },
  {
    "id": "C",
    "x": 0,
    "y": 1
  },
  {
    "id": "D",
    "x": 4,
    "y": 0
  },
  {
    "id": "E",
    "x": 3,
    "y": 1
  },
  {
    "id": "F",
    "x": 6,
    "y": 0
  }
];
export const weightedEdges: readonly { from: WeightedNodeId; to: WeightedNodeId; weight: number }[] = [
  {
    "from": "A",
    "to": "B",
    "weight": 2
  },
  {
    "from": "A",
    "to": "C",
    "weight": 1
  },
  {
    "from": "B",
    "to": "D",
    "weight": 2
  },
  {
    "from": "B",
    "to": "E",
    "weight": 2
  },
  {
    "from": "C",
    "to": "E",
    "weight": 5
  },
  {
    "from": "D",
    "to": "F",
    "weight": 2
  },
  {
    "from": "E",
    "to": "F",
    "weight": 5
  }
];
export const weightedStart: WeightedNodeId = "A";
export const weightedGoal: WeightedNodeId = "F";
export const weightedHeuristic: Readonly<Record<WeightedNodeId, number>> = {"A":6,"B":4,"C":7,"D":2,"E":4,"F":0};
export type WeightedSnapshot = {
  operation: "init" | "select" | "relax" | "keep" | "finish";
  from: WeightedNodeId | null;
  to: WeightedNodeId | null;
  candidate: number | null;
  distances: Readonly<Record<WeightedNodeId, number | null>>;
  predecessors: Readonly<Partial<Record<WeightedNodeId, WeightedNodeId>>>;
  frontier: readonly WeightedNodeId[];
  selected: readonly WeightedNodeId[];
};
/** 同じ最小候補選択・緩和を使用し、優先値だけを切り替える。null は未到達。 */
export function buildWeightedTrace(mode: WeightedSearchMode): WeightedSnapshot[] {
  const distances: Record<WeightedNodeId, number | null> = { A: 0, B: null, C: null, D: null, E: null, F: null };
  const predecessors: Partial<Record<WeightedNodeId, WeightedNodeId>> = {};
  const frontier = new Set<WeightedNodeId>([weightedStart]);
  const selected: WeightedNodeId[] = [];
  const trace: WeightedSnapshot[] = [];
  const priority = (node: WeightedNodeId) => (distances[node] ?? Infinity) + (mode === "astar" ? weightedHeuristic[node] : 0);
  const ordered = () => [...frontier].sort((a, b) => priority(a) - priority(b) || (a < b ? -1 : a > b ? 1 : 0));
  const save = (operation: WeightedSnapshot["operation"], from: WeightedNodeId | null = null, to: WeightedNodeId | null = null, candidate: number | null = null) => {
    trace.push({ operation, from, to, candidate, distances: { ...distances }, predecessors: { ...predecessors }, frontier: ordered(), selected: [...selected] });
  };
  save("init");
  while (frontier.size > 0) {
    const current = ordered()[0];
    frontier.delete(current);
    selected.push(current);
    save("select", current);
    if (current === weightedGoal) {
      save("finish", current);
      break;
    }
    const distance = distances[current];
    if (distance === null) throw new Error("Unreachable frontier");
    for (const edge of weightedEdges) {
      const next = edge.from === current ? edge.to : edge.to === current ? edge.from : null;
      if (next === null) continue;
      const candidate = distance + edge.weight;
      if (candidate < (distances[next] ?? Infinity)) {
        distances[next] = candidate;
        predecessors[next] = current;
        frontier.add(next);
        save("relax", current, next, candidate);
      } else {
        save("keep", current, next, candidate);
      }
    }
  }
  return trace;
}
export function reconstructWeightedPath(state: WeightedSnapshot): WeightedNodeId[] {
  if (!state.selected.includes(weightedGoal)) return [];
  const path: WeightedNodeId[] = [weightedGoal];
  while (path[0] !== weightedStart) {
    const parent = state.predecessors[path[0]];
    if (!parent || path.includes(parent)) throw new Error("Invalid predecessor chain");
    path.unshift(parent);
  }
  return path;
}
