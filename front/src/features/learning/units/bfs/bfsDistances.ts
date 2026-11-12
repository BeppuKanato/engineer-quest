import { searchGraphEdges } from "../../graphs/searchGraph";

/** BFS固有の距離計算。中立な共有グラフへアルゴリズムの意味を持ち込まない。 */
export function bfsDistancesFrom(startId: string): ReadonlyMap<string, number> {
  const distances = new Map<string, number>([[startId, 0]]);
  const queue = [startId];
  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const edge of searchGraphEdges) {
      const next = edge.from === current ? edge.to : edge.to === current ? edge.from : null;
      if (next !== null && !distances.has(next)) {
        distances.set(next, distances.get(current)! + 1);
        queue.push(next);
      }
    }
  }
  return distances;
}
