import type { PlayerLayer, PlayerStatus } from "./player.tokens";

/** 汎用の再生契約に載せるグラフ用 Canvas。教材データへ色の HEX 値は持ち込まない。 */
export type GraphCanvasState = {
  readonly data: {
    readonly kind: "graph";
    readonly nodes: readonly { id: string; label: string; x: number; y: number }[];
    readonly edges: readonly { id: string; from: string; to: string }[];
    readonly layers: readonly { id: string; label: string; y: number; height: number; tone: PlayerLayer }[];
  };
  readonly state: {
    readonly nodes: readonly { id: string; status: PlayerStatus; layerId?: string }[];
    readonly structures: readonly {
      id: string;
      kind: "queue" | "stack" | "array";
      label: string;
      items: readonly { id: string; value: string; nodeId?: string; status: PlayerStatus }[];
    }[];
    readonly variables: readonly { name: string; value: string | number | null }[];
  };
  readonly highlights: readonly {
    kind: "node" | "edge" | "item";
    id: string;
    tone: Exclude<PlayerStatus, "idle">;
  }[];
};

/** 型付き教材の参照整合性をロード時に検証し、不正な図を黙って再生しない。 */
export function validateGraphCanvas(canvas: GraphCanvasState): void {
  const uniqueIds = (ids: readonly string[]) => {
    if (ids.some((id) => !id.trim()) || new Set(ids).size !== ids.length) {
      throw new Error("Canvas IDs must be nonempty and unique");
    }
    return new Set(ids);
  };
  const nodes = uniqueIds(canvas.data.nodes.map((node) => node.id));
  const edges = uniqueIds(canvas.data.edges.map((edge) => edge.id));
  const layers = uniqueIds(canvas.data.layers.map((layer) => layer.id));
  uniqueIds(canvas.state.structures.map((structure) => structure.id));
  const items = uniqueIds(canvas.state.structures.flatMap((structure) => structure.items.map((item) => item.id)));
  const nodeStates = uniqueIds(canvas.state.nodes.map((node) => node.id));
  if (nodes.size !== nodeStates.size || [...nodes].some((id) => !nodeStates.has(id))) {
    throw new Error("Each graph node needs a state");
  }
  for (const node of canvas.data.nodes) {
    if (!Number.isFinite(node.x) || !Number.isFinite(node.y)) throw new Error("Invalid node position");
  }
  for (const edge of canvas.data.edges) {
    if (!nodes.has(edge.from) || !nodes.has(edge.to)) throw new Error("Unknown edge endpoint");
  }
  for (const node of canvas.state.nodes) {
    if (node.layerId && !layers.has(node.layerId)) throw new Error("Unknown layer");
  }
  for (const structure of canvas.state.structures) {
    for (const item of structure.items) {
      if (item.nodeId && !nodes.has(item.nodeId)) throw new Error("Unknown structure node");
    }
  }
  for (const highlight of canvas.highlights) {
    const targets = highlight.kind === "node" ? nodes : highlight.kind === "edge" ? edges : items;
    if (!targets.has(highlight.id)) throw new Error("Unknown highlight target");
  }
}
