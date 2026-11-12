import type { LearningContent } from "../../../player/content.types";
import type { GraphCanvasState } from "../../../player/graphCanvas.types";
import type { MazeLayout } from "../../../player/MotivationDrawing";
import type { VocabularyEntry } from "../../bfs/motivation/motivation.types";
import { searchGraph, searchMaze } from "../../../graphs/searchGraph";

export type DfsMotivationCanvasState = {
  readonly data: {
    readonly kind: "dfs-motivation";
    readonly view: "maze" | "graph" | "folders";
    readonly graph: GraphCanvasState["data"];
    readonly maze: MazeLayout;
    readonly treasure: string;
  };
  readonly state: {
    readonly current: string | null;
    readonly trail: readonly string[];
    readonly movement: readonly string[];
    readonly visited: readonly string[];
    readonly showNames: boolean;
    readonly treasureVisible: boolean;
    readonly preview: boolean;
    readonly returnTrail: boolean;
    readonly annotations: boolean;
    readonly exit: boolean;
  };
  readonly highlights: readonly { kind: "node" | "edge"; id: string }[];
};
export type DfsMotivationContent = LearningContent<DfsMotivationCanvasState> & {
  readonly stageName: "導入";
  readonly vocabulary: readonly VocabularyEntry[];
};

export function validateDfsMotivationCanvas(canvas: DfsMotivationCanvasState): void {
  const { data, state, highlights } = canvas;
  if (data.graph !== searchGraph || data.maze !== searchMaze) throw new Error("DFS must share the canonical BFS graph and maze");
  const ids = new Set(data.graph.nodes.map(node => node.id));
  const node = (id: string) => { if (!ids.has(id)) throw new Error(`Unknown DFS place: ${id}`); };
  const path = (places: readonly string[]) => {
    places.forEach(node);
    for (let i = 1; i < places.length; i++) {
      if (!data.graph.edges.some(edge => edge.from === places[i - 1] && edge.to === places[i] || edge.to === places[i - 1] && edge.from === places[i])) {
        throw new Error("Disconnected DFS motivation path");
      }
    }
  };
  if (data.kind !== "dfs-motivation" || !["maze", "graph", "folders"].includes(data.view)) throw new Error("Unknown DFS motivation view");
  if (data.graph.layers.length !== 0) throw new Error("DFS does not have distance layers");
  node(data.treasure);
  if (state.current !== null) node(state.current);
  path(state.trail); path(state.movement); state.visited.forEach(node);
  if (new Set(state.visited).size !== state.visited.length) throw new Error("Duplicate visited place");
  for (const places of [state.trail, state.movement]) {
    if (places.length && places.at(-1) !== state.current) throw new Error("DFS path must end at current place");
  }
  if (state.trail.length && state.trail[0] !== "A") throw new Error("DFS walk must start at A");
  if ([...state.trail, ...state.movement].some(id => !state.visited.includes(id))) throw new Error("DFS path must contain visited places");
  if (state.treasureVisible && !state.visited.includes(data.treasure)) throw new Error("Treasure cannot appear before it is visited");
  if (data.view === "folders" && (state.current !== null || state.trail.length || state.movement.length || state.treasureVisible)) throw new Error("Folders cannot retain a maze actor");
  for (const target of highlights) {
    if (target.kind === "node" ? !ids.has(target.id) : !data.graph.edges.some(edge => edge.id === target.id)) throw new Error("Unknown DFS highlight");
  }
}
