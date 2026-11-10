"use client";

import { Box } from "@mui/material";
import { AnimatePresence, motion, useIsPresent, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { GraphEdges, GraphNodes, GraphViewport } from "../../player/GraphDrawing";
import { graphGeometry } from "../../player/graphGeometry";
import { playerTokens } from "../../player/player.tokens";
import type { DfsExecutionCanvasState } from "./execution.types";

type Point = { x: number; y: number };
export const dfsExecutionCanvasHeight = 510;
/** コードの1行間の中間状態。通常再生・設問は元のsnapshotのまま使う。 */
export type DfsExecutionView = {
  readonly state: Pick<DfsExecutionCanvasState["state"], "current" | "stack" | "order" | "nodes">;
  readonly highlights: DfsExecutionCanvasState["highlights"];
};

function StackItem({ nodeId, position, source, top, highlighted, duration }: {
  nodeId: string; position: Point; source: Point; top: boolean; highlighted: boolean; duration: number;
}) {
  const present = useIsPresent();
  const tone = playerTokens.states[present ? "queued" : "processing"];
  return <motion.g role={present ? "listitem" : undefined} aria-hidden={!present || undefined}
    aria-label={`${nodeId}${top ? "、末尾、次に取り出す" : ""}`}
    initial={{ x: source.x, y: source.y, opacity: 0, scale: 0.7 }}
    animate={{ x: position.x, y: position.y, opacity: 1, scale: 1 }}
    exit={{ x: source.x, y: source.y, opacity: 0, scale: 0.7 }}
    transition={{ duration, ease: "easeInOut" }}>
    <rect x={-34} y={-24} width={68} height={48} rx={4} fill={tone.fill} stroke={tone.stroke} strokeWidth={2} />
    {highlighted && <rect x={-38} y={-28} width={76} height={56} rx={6} fill="none" stroke={playerTokens.focus} strokeWidth={3} />}
    <text y={7} textAnchor="middle" fontSize={24} fontWeight={700} fill={present ? playerTokens.text : playerTokens.surface}>{nodeId}</text>
  </motion.g>;
}

/** 図・スタック・訪問順は同じ完全スナップショットから表示する。 */
export function DfsExecutionCanvas({ canvas, renderNodeOverlay, highlightNodes = true, view }: {
  canvas: Pick<DfsExecutionCanvasState, "data"> & DfsExecutionView;
  /** 回答中は共通の回答リングを使い、処理状態の塗りと辺は残す。 */
  highlightNodes?: boolean;
  renderNodeOverlay?: (nodeId: string, radius: number) => ReactNode;
  view?: DfsExecutionView;
}) {
  const reducedMotion = useReducedMotion();
  const duration = reducedMotion ? 0 : 0.6;
  const transition = { duration, ease: "easeInOut" } as const;
  const { data } = canvas;
  const { state, highlights } = view ?? canvas;
  const position = (id: string): Point => data.graph.nodes.find(node => node.id === id)!;
  const focused = (kind: "node" | "stack-item", id: string) => highlights.some(item => item.kind === kind && item.id === id);
  const stackX = (index: number) => graphGeometry.width / 2 + (index - (state.stack.length - 1) / 2) * 86;
  const orderX = (index: number) => graphGeometry.width / 2 + (index - (state.order.length - 1) / 2) * 72;
  return <Box sx={{ width: "100%", height: "100%", minHeight: 220 }}>
    <GraphViewport interactive={!!renderNodeOverlay} label="DFSのグラフ・スタック・訪問順" height={dfsExecutionCanvasHeight}>
      <GraphEdges position={position} transition={transition} edges={data.graph.edges.map(edge => {
        const focus = highlights.find(item => item.kind === "edge" && item.id === edge.id);
        return { ...edge, highlighted: !!focus, dashed: focus?.kind === "edge" && focus.style === "dashed" };
      })} />
      <GraphNodes transition={transition} nodes={data.graph.nodes.map(node => {
        const { status } = state.nodes.find(value => value.id === node.id)!;
        const label = status === "queued" ? "スタック内" : status === "completed" ? "調べ終えた" : playerTokens.states[status].label;
        return { ...node, status, highlighted: highlightNodes && focused("node", node.id), ariaLabel: `${node.id}：${label}` };
      })} renderNodeOverlay={renderNodeOverlay} />
      <g role="group" aria-label="スタック">
        <text x={300} y={310} textAnchor="middle" fill={playerTokens.text} fontSize={20} fontWeight={700}>スタック</text>
        <g role="list" aria-label="スタックの中身（左が底、右が末尾）">
          {!state.stack.length && <text role="listitem" aria-label="空" x={300} y={358} textAnchor="middle" fill={playerTokens.text} fontSize={20}>空</text>}
          <AnimatePresence initial={false}>
            {state.stack.map((nodeId, index) => <StackItem key={nodeId} nodeId={nodeId} source={position(nodeId)}
              position={{ x: stackX(index), y: 350 }} top={index === state.stack.length - 1}
              highlighted={highlightNodes && focused("stack-item", nodeId)} duration={duration} />)}
          </AnimatePresence>
        </g>
        {!!state.stack.length && <text x={stackX(state.stack.length - 1)} y={399} textAnchor="middle"
          fill={playerTokens.text} fontSize={16} fontWeight={700}>↑ 末尾（次に取り出す）</text>}
      </g>
      <g role="group" aria-label="訪問順">
        <text x={300} y={432} textAnchor="middle" fill={playerTokens.text} fontSize={20} fontWeight={700}>訪問順</text>
        <g role="list" aria-label="訪問順の中身">
          {!state.order.length && <text role="listitem" aria-label="まだ訪れていません" x={300} y={478} textAnchor="middle" fill={playerTokens.text} fontSize={20}>まだ訪れていません</text>}
          <AnimatePresence initial={false}>
            {state.order.map((id, index) => {
              const active = id === state.current;
              const tone = playerTokens.states[active ? "processing" : "completed"];
              return <motion.g key={id} role="listitem" aria-label={`${index + 1}番目、${id}${active ? "、処理中" : "、調べ終えた"}`}
                initial={{ ...position(id), opacity: 0 }} animate={{ x: orderX(index), y: 470, opacity: 1 }} exit={{ opacity: 0 }} transition={transition}>
                {index > 0 && <text x={-36} y={7} textAnchor="middle" fill={playerTokens.text} fontSize={20}>→</text>}
                <motion.rect x={-24} y={-24} width={48} height={48} rx={4} initial={false}
                  animate={{ fill: tone.fill, stroke: tone.stroke }} strokeWidth={2} transition={transition} />
                <text y={7} textAnchor="middle" fill={active ? playerTokens.surface : playerTokens.text} fontSize={24} fontWeight={700}>{id}</text>
              </motion.g>;
            })}
          </AnimatePresence>
        </g>
      </g>
    </GraphViewport>
  </Box>;
}
