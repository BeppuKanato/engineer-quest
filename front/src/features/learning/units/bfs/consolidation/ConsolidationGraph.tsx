"use client";

import { Box } from "@mui/material";
import { useReducedMotion } from "framer-motion";

import { GraphEdges, GraphNodes, GraphViewport } from "../../../player/GraphDrawing";
import { playerTokens } from "../../../player/player.tokens";
import type { ConsolidationGraph as Graph } from "./consolidation.graphs";

/** ノード・辺は共通描画のみ。出発点の注記と回答ボタンだけを重ねる。 */
export function ConsolidationGraph({ graph, start, onSelect, minHeight = 320 }: { graph: Graph; start: string; onSelect?: (id: string) => void; minHeight?: number }) {
  const reduced = useReducedMotion();
  const transition = { duration: reduced ? 0 : 0.6, ease: "easeInOut" } as const;
  const source = graph.nodes.find(node => node.id === start)!;
  return <Box sx={{ width: "100%", flex: 1, minHeight, position: "relative", "& > svg": { position: "absolute", inset: 0 } }}>
    <GraphViewport interactive={!!onSelect} label={`出発点${start}のグラフ`}>
      <GraphEdges edges={graph.edges.map(edge => ({ ...edge, highlighted: false }))} position={id => graph.nodes.find(node => node.id === id)!} transition={transition} />
      <GraphNodes nodes={graph.nodes.map(node => ({ ...node, status: "idle", highlighted: false, ariaLabel: `${node.label}${node.id === start ? "、出発点" : ""}` }))}
        transition={transition} renderNodeOverlay={onSelect ? (id, radius) => <foreignObject x={-radius} y={-radius} width={radius * 2} height={radius * 2}>
          <Box component="button" type="button" aria-label={`${id}を選ぶ`} onClick={() => onSelect(id)}
            sx={{ width: "100%", height: "100%", p: 0, border: 0, borderRadius: "50%", bgcolor: "transparent", cursor: "pointer",
              outline: `3px dashed ${playerTokens.focus}`, outlineOffset: 2, "&:hover, &:focus-visible": { outlineWidth: 5 } }} />
        </foreignObject> : undefined} />
      <text x={source.x} y={source.y - 48} textAnchor="middle" fontSize={18} fill={playerTokens.text}>出発点 {start}</text>
    </GraphViewport>
  </Box>;
}
