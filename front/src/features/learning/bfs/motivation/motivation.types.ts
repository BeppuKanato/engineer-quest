import type { LearningContent } from "../../player/content.types";
import type { GraphCanvasState } from "../../player/graphCanvas.types";

/** #68 の完全スナップショット契約を具体化し、格子とグラフの場所を同じ ID で結ぶ。 */
export type MotivationCanvasState = {
  readonly data: {
    readonly kind: "bfs-motivation";
    readonly view: "maze" | "graph" | "rail" | "social";
    readonly graph: GraphCanvasState["data"];
    readonly maze: {
      readonly rows: number;
      readonly columns: number;
      readonly places: readonly { id: string; row: number; column: number }[];
    };
    readonly routes: readonly {
      id: string; places: readonly string[];
      labels: Readonly<Record<"maze" | "graph" | "rail" | "social", string>>;
      labelPosition: Readonly<Record<"maze" | "graph", { x: number; y: number }>>;
    }[];
    readonly labels: { start: string; goal: string; moveUnit: string; distanceUnit: string; nodeNames: Readonly<Record<string, string>> };
  };
  readonly state: {
    readonly start: string;
    readonly goal: string;
    readonly current: string | null;
    readonly trail: readonly string[];
    readonly shownRoutes: readonly string[];
    readonly showNames: boolean;
    readonly distances: readonly { id: string; value: number }[];
    readonly annotations: readonly { kind: "node" | "edge"; id: string; label: string }[];
    readonly exit: { label: string; nextPhase: 2 } | null;
  };
  readonly highlights: readonly { kind: "node" | "edge" | "route"; id: string }[];
};

export type VocabularyEntry = {
  readonly concept: string;
  readonly everyday: string;
  readonly technical: string;
  readonly firstStepId: string;
  readonly usage: string;
};

export type MotivationContent = LearningContent<MotivationCanvasState> & {
  readonly vocabulary: readonly VocabularyEntry[];
};

export function validateMotivationCanvas(canvas: MotivationCanvasState): void {
  const { graph, maze, routes } = canvas.data;
  const ids = new Set(graph.nodes.map((node) => node.id));
  const requireNode = (id: string) => {
    if (!ids.has(id)) throw new Error(`Unknown motivation place: ${id}`);
  };
  const connected = (from: string, to: string) => graph.edges.some((edge) =>
    (edge.from === from && edge.to === to) || (edge.to === from && edge.from === to));
  const requirePath = (path: readonly string[]) => {
    path.forEach(requireNode);
    if (path.some((id, i) => i > 0 && !connected(path[i - 1], id))) throw new Error("Disconnected motivation path");
  };
  if (!Number.isInteger(maze.rows) || !Number.isInteger(maze.columns) || maze.rows < 1 || maze.columns < 1 ||
    ids.size !== graph.nodes.length || ids.size !== maze.places.length ||
    new Set(maze.places.map((place) => place.id)).size !== ids.size ||
    new Set(maze.places.map((place) => `${place.row}:${place.column}`)).size !== ids.size) {
    throw new Error("Invalid maze / graph correspondence");
  }
  for (const place of maze.places) {
    requireNode(place.id);
    if (!Number.isInteger(place.row) || !Number.isInteger(place.column) || place.row < 0 || place.row >= maze.rows ||
      place.column < 0 || place.column >= maze.columns) throw new Error("Invalid maze position");
  }
  for (const edge of graph.edges) {
    requireNode(edge.from); requireNode(edge.to);
    const from = maze.places.find((place) => place.id === edge.from)!;
    const to = maze.places.find((place) => place.id === edge.to)!;
    if (Math.abs(from.row - to.row) + Math.abs(from.column - to.column) !== 1) throw new Error("Maze edge must be one move");
  }
  if (new Set(routes.map((route) => route.id)).size !== routes.length) throw new Error("Duplicate route ID");
  routes.forEach((route) => requirePath(route.places));
  requireNode(canvas.state.start); requireNode(canvas.state.goal);
  if (canvas.state.current !== null) requireNode(canvas.state.current);
  requirePath(canvas.state.trail);
  if (canvas.state.trail.length && (canvas.state.trail[0] !== canvas.state.start || canvas.state.trail.at(-1) !== canvas.state.current)) {
    throw new Error("Trail must connect start and current place");
  }
  for (const id of canvas.state.shownRoutes) {
    if (!routes.some((route) => route.id === id)) throw new Error("Unknown shown route");
  }
  for (const distance of canvas.state.distances) {
    requireNode(distance.id);
    if (!Number.isInteger(distance.value) || distance.value < 0) throw new Error("Invalid distance");
  }
  for (const target of [...canvas.highlights, ...canvas.state.annotations]) {
    const known = target.kind === "node" ? ids.has(target.id) : target.kind === "edge" ? graph.edges.some((edge) => edge.id === target.id) : routes.some((route) => route.id === target.id);
    if (!known) throw new Error("Unknown motivation highlight / annotation");
  }
}
