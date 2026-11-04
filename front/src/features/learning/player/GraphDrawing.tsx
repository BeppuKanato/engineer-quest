"use client";

import { Box } from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";

import { graphGeometry as geometry } from "./graphGeometry";
import { playerTokens, type PlayerStatus } from "./player.tokens";

type Point = { x: number; y: number };
type Transition = { duration: number; ease: "easeInOut" };
type Node = Point & {
  id: string;
  label: string;
  status: PlayerStatus;
  highlighted: boolean;
  ariaLabel: string;
};
type Edge = {
  id: string;
  from: string;
  to: string;
  highlighted: boolean;
  dashed?: boolean;
  hidden?: boolean;
};

/** 全キャンバスが同じ座標空間を使う。ノードだけ固定pxにする投影はしない。 */
export function GraphViewport({ children, label, interactive = false, height = geometry.height }: {
  children: ReactNode; label: string; interactive?: boolean; height?: number;
}) {
  return <Box component="svg" viewBox={`0 0 ${geometry.width} ${height}`} preserveAspectRatio="xMidYMid meet"
    role={interactive ? "group" : "img"} aria-label={label}
    sx={{ width: "100%", height: "100%", display: "block", "& foreignObject": { overflow: "visible" } }}>
    {children}
  </Box>;
}

/** 辺の描画はここだけに置く。ルート等の教材固有レイヤーは呼び出し側で重ねる。 */
export function GraphEdges({ edges, position, transition }: {
  edges: readonly Edge[]; position: (id: string) => Point; transition: Transition;
}) {
  return edges.map(edge => {
    const from = position(edge.from), to = position(edge.to);
    return <motion.line key={edge.id} data-edge-id={edge.id} initial={false}
      animate={{ x1: from.x, y1: from.y, x2: to.x, y2: to.y, opacity: edge.hidden ? 0 : 1,
        stroke: edge.highlighted ? playerTokens.focus : playerTokens.states.idle.stroke,
        strokeWidth: edge.highlighted ? geometry.highlightedEdgeStrokeWidth : geometry.edgeStrokeWidth }}
      strokeDasharray={edge.dashed ? "8 6" : undefined} transition={transition} />;
  });
}

/** ノード・ラベル・強調リングの唯一の描画実装。差分は同じノード座標に重ねる。 */
export function GraphNodes({ nodes, transition, renderNodeOverlay, renderNodeDecoration }: {
  nodes: readonly Node[]; transition: Transition;
  renderNodeOverlay?: (nodeId: string, radius: number) => ReactNode;
  renderNodeDecoration?: (nodeId: string) => ReactNode;
}) {
  return nodes.map(node => {
    const tone = playerTokens.states[node.status];
    return <motion.g key={node.id} data-node-id={node.id} role={renderNodeOverlay ? "group" : "img"}
      aria-label={node.ariaLabel} initial={false} animate={{ x: node.x, y: node.y }} transition={transition}>
      <title>{node.ariaLabel}</title>
      <AnimatePresence initial={false}>
        {node.highlighted && <motion.circle key="focus" r={geometry.ringRadius} fill="none"
          stroke={playerTokens.focus} strokeWidth={geometry.ringStrokeWidth} strokeDasharray={geometry.ringDasharray}
          initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }} transition={transition} />}
      </AnimatePresence>
      <motion.circle r={geometry.nodeRadius} initial={false} animate={{ fill: tone.fill, stroke: tone.stroke }}
        strokeWidth={geometry.nodeStrokeWidth} transition={transition} />
      <text y={geometry.labelBaseline} textAnchor="middle" fontSize={geometry.labelFontSize} fontWeight={700}
        fill={node.status === "processing" ? playerTokens.surface : playerTokens.text}>{node.label}</text>
      {renderNodeDecoration?.(node.id)}
      {renderNodeOverlay?.(node.id, geometry.nodeRadius)}
    </motion.g>;
  });
}
