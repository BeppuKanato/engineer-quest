"use client";

import { Box } from "@mui/material";
import { AnimatePresence, motion, useIsPresent, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

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
  const host = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 600, height: 400 });
  const reducedMotion = useReducedMotion();
  const duration = reducedMotion ? 0 : playerTokens.transitionMs / 1000;
  const transition = { duration, ease: "easeInOut" } as const;

  useEffect(() => {
    if (!host.current) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) setSize((current) =>
        current.width === width && current.height === height ? current : { width, height });
    });
    observer.observe(host.current);
    return () => observer.disconnect();
  }, []);

  const { data, state, highlights } = canvas;
  const layout = layoutGraphCanvas(canvas, size.width, size.height);
  const highlighted = (kind: "node" | "edge" | "item", id: string) =>
    highlights.some((highlight) => highlight.kind === kind && highlight.id === id);
  const radius = Math.max(22, Math.min(40, size.width * 0.045));

  return (
    <Box ref={host} sx={{ width: "100%", height: "100%", minHeight: 280 }}>
      <svg viewBox={`0 0 ${size.width} ${size.height}`} role="img" aria-label="対象データと内部状態"
        style={{ display: "block", width: "100%", height: "100%", overflow: "visible" }}>
        {data.layers.map((layer) => (
          <g key={layer.id}>
            <motion.rect initial={false} x={size.width * 0.08} width={size.width * 0.84} rx={8}
              animate={{ y: layer.y / 300 * layout.graphHeight, height: layer.height / 300 * layout.graphHeight }}
              fill={playerTokens.layers[layer.tone]} transition={transition} />
            <text x={size.width * 0.09} y={layer.y / 300 * layout.graphHeight + 25 * layout.unit}
              fill={playerTokens.text} fontSize={16 * layout.unit}>{layer.label}</text>
          </g>
        ))}
        {data.edges.map((edge) => {
          const from = layout.nodes.find((node) => node.id === edge.from)!;
          const to = layout.nodes.find((node) => node.id === edge.to)!;
          return <motion.line key={edge.id} initial={false}
            animate={{ x1: from.x, y1: from.y, x2: to.x, y2: to.y,
              stroke: highlighted("edge", edge.id) ? playerTokens.focus : playerTokens.states.idle.stroke,
              strokeWidth: highlighted("edge", edge.id) ? 5 : 2 }} transition={transition} />;
        })}
        {layout.nodes.map((node) => {
          const status = state.nodes.find((entry) => entry.id === node.id)!.status;
          const tone = playerTokens.states[status];
          const focus = highlighted("node", node.id);
          const label = `${node.label}：${tone.label}${focus ? "、強調" : ""}`;
          return (
            <motion.g key={node.id} role="img" aria-label={label} initial={false}
              animate={{ x: node.x, y: node.y, scale: focus ? 1.06 : 1 }} transition={transition}>
              <title>{label}</title>
              <g transform={`scale(${layout.unit})`}>
              <AnimatePresence initial={false}>
                {focus && <motion.circle key="focus" r={radius + 7} fill="none" stroke={playerTokens.focus}
                  strokeWidth={3} strokeDasharray="5 4" initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={transition} />}
              </AnimatePresence>
              <motion.circle r={radius} initial={false} animate={{ fill: tone.fill, stroke: tone.stroke }} strokeWidth={3} transition={transition} />
              <text y={8} textAnchor="middle" fill={status === "processing" ? playerTokens.surface : playerTokens.text}
                fontSize={24} fontWeight={700}>{node.label}</text>
              </g>
            </motion.g>
          );
        })}
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
      </svg>
    </Box>
  );
}
