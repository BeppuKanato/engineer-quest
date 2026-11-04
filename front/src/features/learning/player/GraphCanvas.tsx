"use client";

import { Box } from "@mui/material";
import { AnimatePresence, motion, useIsPresent, useReducedMotion } from "framer-motion";

import { GraphEdges, GraphNodes, GraphViewport } from "./GraphDrawing";
import { graphGeometry } from "./graphGeometry";
import type { GraphCanvasState } from "./graphCanvas.types";
import { layoutGraphCanvas } from "./graphLayout";
import { playerTokens } from "./player.tokens";

type StructureItem = ReturnType<typeof layoutGraphCanvas>["structures"][number]["items"][number];
type Point = { x: number; y: number };

/** 同じ SVG 座標内で、図→キューの出現・並び替え・キュー→図の退出を繋ぐ。 */
function AnimatedItem({ item, source, highlighted, leading, duration, unit }: {
  item: StructureItem; source: Point; highlighted: boolean; leading: boolean; duration: number; unit: number;
}) {
  const present = useIsPresent();
  const tone = playerTokens.states[item.status];
  return (
    <motion.g role={present ? "listitem" : undefined} aria-hidden={!present || undefined}
      aria-label={`${item.value}：${tone.label}${leading ? "、先頭" : ""}`}
      initial={{ x: source.x, y: source.y, scale: 0.7, opacity: 0 }}
      animate={{ x: item.x, y: item.y, scale: 1, opacity: 1 }}
      exit={{ x: source.x, y: source.y, scale: 0.7, opacity: 0 }}
      transition={{ duration, ease: "easeInOut" }}>
      <g transform={`scale(${unit})`}>
      <rect x={-28} y={-22} width={56} height={44} rx={4} fill={tone.fill} stroke={tone.stroke} strokeWidth={2} />
      {highlighted && <rect x={-33} y={-27} width={66} height={54} rx={6}
        fill="none" stroke={playerTokens.focus} strokeWidth={2} strokeDasharray="5 4" />}
      <text textAnchor="middle" y={7} fill={item.status === "processing" ? playerTokens.surface : playerTokens.text} fontSize={20} fontWeight={700}>
        {leading ? `← ${item.value}` : item.value}
      </text>
      </g>
    </motion.g>
  );
}

export function GraphCanvas({ canvas }: { canvas: GraphCanvasState }) {
  const reducedMotion = useReducedMotion();
  const duration = reducedMotion ? 0 : playerTokens.transitionMs / 1000;
  const transition = { duration, ease: "easeInOut" } as const;

  const { data, state, highlights } = canvas;
  const contentHeight = layoutGraphCanvas(canvas, graphGeometry.width, graphGeometry.height).contentHeight;
  const size = { width: graphGeometry.width, height: contentHeight };
  const layout = layoutGraphCanvas(canvas, size.width, size.height);
  const highlighted = (kind: "node" | "edge" | "item", id: string) =>
    highlights.some((highlight) => highlight.kind === kind && highlight.id === id);

  return (
    <Box sx={{ width: "100%", height: "100%", minHeight: 280 }}>
      <GraphViewport height={contentHeight} label="対象データと内部状態">
        {data.layers.map((layer) => (
          <g key={layer.id}>
            <motion.rect initial={false} x={size.width * 0.08} width={size.width * 0.84} rx={8}
              animate={{ y: layer.y, height: layer.height }}
              fill={playerTokens.layers[layer.tone]} transition={transition} />
            <text x={size.width * 0.09} y={layer.y + 25 * layout.unit}
              fill={playerTokens.text} fontSize={16 * layout.unit}>{layer.label}</text>
          </g>
        ))}
        <GraphEdges edges={data.edges.map(edge => ({ ...edge, highlighted: highlighted("edge", edge.id) }))}
          position={id => layout.nodes.find(node => node.id === id)!} transition={transition} />
        <GraphNodes transition={transition} nodes={layout.nodes.map(node => {
          const status = state.nodes.find(entry => entry.id === node.id)!.status;
          const focus = highlighted("node", node.id);
          return { ...node, status, highlighted: focus,
            ariaLabel: `${node.label}：${playerTokens.states[status].label}${focus ? "、強調" : ""}` };
        })} />
        {layout.structures.map((structure) => (
          <g key={structure.id} role="group" aria-label={structure.label}>
            <text x={size.width / 2} y={structure.y + 15 * layout.unit} textAnchor="middle" fill={playerTokens.text} fontSize={16 * layout.unit} fontWeight={600}>
              {structure.label}
            </text>
            <g role="list" aria-label={structure.label}>
              {structure.items.length === 0 && <text role="listitem" aria-label="空" x={size.width / 2} y={structure.y + 64 * layout.unit}
                textAnchor="middle" fill={playerTokens.text} fontSize={20 * layout.unit}>∅</text>}
              <AnimatePresence initial={false}>
                {structure.items.map((item, index) => (
                  <AnimatedItem key={item.id} item={item}
                    source={layout.nodes.find((node) => node.id === item.nodeId) ?? { x: item.x, y: item.y - 48 }}
                    highlighted={highlighted("item", item.id)} leading={index === 0 && structure.kind === "queue"} duration={duration} unit={layout.unit} />
                ))}
              </AnimatePresence>
            </g>
          </g>
        ))}
        <text x={size.width / 2} y={layout.variableY} textAnchor="middle" fill={playerTokens.text} fontSize={18 * layout.unit}>
          {state.variables.map((variable) => `${variable.name} = ${variable.value ?? "∅"}`).join("　")}
        </text>
      </GraphViewport>
    </Box>
  );
}
