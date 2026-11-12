"use client";

import { Box } from "@mui/material";
import { AnimatePresence, motion, useIsPresent, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

import { GraphEdges, GraphNodes, GraphViewport } from "../../../player/GraphDrawing";
import { graphGeometry } from "../../../player/graphGeometry";

import { playerTokens } from "../../../player/player.tokens";
import type { BfsExecutionCanvasState } from "./execution.types";

type Point = { x: number; y: number };

function QueueItem({ nodeId, distance, position, source, first, highlighted, duration, width }: {
  nodeId: string; distance: number; position: Point; source: Point; first: boolean;
  highlighted: boolean; duration: number; width: number;
}) {
  const present = useIsPresent();
  const tone = playerTokens.states[present ? "queued" : "processing"];
  return (
    <motion.g role={present ? "listitem" : undefined} aria-hidden={!present || undefined}
      aria-label={`${nodeId}、${distance}歩${first ? "、先頭" : ""}`}
      initial={{ x: source.x, y: source.y, opacity: 0, scale: 0.7 }}
      animate={{ x: position.x, y: position.y, opacity: 1, scale: 1 }}
      exit={{ x: source.x, y: source.y, opacity: 0, scale: 0.7 }}
      transition={{ duration, ease: "easeInOut" }}>
      <rect x={-width / 2} y={-25} width={width} height={50} rx={4} fill={tone.fill} stroke={tone.stroke} strokeWidth={2} />
      {highlighted && <rect x={-width / 2 - 4} y={-29} width={width + 8} height={58} rx={6}
        fill="none" stroke={playerTokens.focus} strokeWidth={3} />}
      <text y={-3} textAnchor="middle" fill={present ? playerTokens.text : playerTokens.surface} fontSize={19} fontWeight={700}>{nodeId}</text>
      <text y={17} textAnchor="middle" fill={present ? playerTokens.text : playerTokens.surface} fontSize={14}>{distance}歩</text>
    </motion.g>
  );
}

/** フェーズ3の復習、フェーズ4の図にも同じ snapshot と renderer を渡せる。 */
export function BfsExecutionCanvas({ canvas, renderNodeOverlay, highlightNodes = true, graphAction }: {
  canvas: BfsExecutionCanvasState;
  /** 回答画面は操作用リングを使う。処理状態の塗りは残し、強調リングだけを抑える。 */
  highlightNodes?: boolean;
  /** 回答操作を図のすぐ下に置く任意スロット。未指定なら既存の座標・表示を維持する。 */
  graphAction?: { height: number; content: ReactNode };
  /** 同じノードの座標内に操作領域だけを重ねる。図の描画・状態は変更しない。 */
  renderNodeOverlay?: (nodeId: string, radius: number) => ReactNode;
}) {
  const reducedMotion = useReducedMotion();
  // 教材固有の動きは UI 定義の範囲内。共通プレイヤーの #83 は変更しない。
  const duration = reducedMotion ? 0 : 0.6;
  const transition = { duration, ease: "easeInOut" } as const;
  const { data, state, highlights } = canvas;
  const graphHeight = 300;
  const actionHeight = graphAction?.height ?? 0;
  const position = (id: string): Point => data.graph.nodes.find(node => node.id === id)!;
  const focused = (kind: "node" | "queue-item", id: string) => highlights.some(item => item.kind === kind && item.id === id);
  const itemWidth = 86;
  const gap = 14;
  const queueWidth = state.queue.length * (itemWidth + gap) - gap;
  const queueY = graphHeight + 96 + actionHeight;
  const queueX = (index: number) => (graphGeometry.width - queueWidth) / 2 + itemWidth / 2 + index * (itemWidth + gap);

  return (
    <Box sx={{ width: "100%", height: "100%", minHeight: 220 }}>
      <GraphViewport interactive={!!renderNodeOverlay} label="BFSのグラフ・距離層・待ち行列" height={graphGeometry.height + actionHeight}>
        {data.graph.layers.map((layer, index) => {
          const active = state.activeDistance === layer.distance;
          return <g key={layer.distance} role="group" aria-label={`${layer.distance}歩の層${active ? "、現在の層" : ""}`}>
            <motion.rect initial={false} x={layer.x} y={8}
              width={layer.width} height={graphHeight} rx={8}
              fill={index % 2 ? playerTokens.layers.layer1 : playerTokens.layers.layer0}
              animate={{ opacity: active ? 1 : 0.35 }} transition={transition} />
            <text x={layer.x + layer.width / 2} y={32} textAnchor="middle"
              fill={playerTokens.text} fontSize={16} fontWeight={active ? 700 : 400}>{layer.distance}歩</text>
          </g>;
        })}
        <GraphEdges position={position} transition={transition} edges={data.graph.edges.map(edge => {
          const focus = highlights.find(item => item.kind === "edge" && item.id === edge.id);
          return { ...edge, highlighted: !!focus, dashed: focus?.kind === "edge" && focus.style === "dashed" };
        })} />
        <GraphNodes transition={transition} nodes={data.graph.nodes.map(node => {
          const value = state.nodes.find(value => value.id === node.id)!;
          return { ...node, label: node.id, status: value.status, highlighted: highlightNodes && focused("node", node.id),
            ariaLabel: `${node.id}：${playerTokens.states[value.status].label}${value.distance === null ? "" : `、${value.distance}歩`}` };
        })} renderNodeDecoration={nodeId => {
          const value = state.nodes.find(value => value.id === nodeId)!;
          return value.distance !== null && <text y={graphGeometry.nodeRadius + 24} textAnchor="middle"
            fill={playerTokens.text} fontSize={15}>{value.distance}歩</text>;
        }} renderNodeOverlay={renderNodeOverlay} />
        {graphAction && <foreignObject x={0} y={graphHeight + 8} width={graphGeometry.width} height={actionHeight}>
          {graphAction.content}
        </foreignObject>}
        <g role="group" aria-label={state.queueLabel}>
          <text x={graphGeometry.width / 2} y={graphHeight + 46 + actionHeight} textAnchor="middle" fill={playerTokens.text} fontSize={17} fontWeight={700}>{state.queueLabel}</text>
          <g role="list" aria-label="キューの中身（先頭から末尾）">
            {state.queue.length === 0 && <text role="listitem" aria-label="空" x={graphGeometry.width / 2} y={queueY + 7} textAnchor="middle" fill={playerTokens.text} fontSize={18}>空</text>}
            <AnimatePresence initial={false}>
              {state.queue.map((item, index) => <QueueItem key={item.nodeId} {...item} duration={duration} width={itemWidth}
                position={{ x: queueX(index), y: queueY }} source={position(item.nodeId)}
                first={index === 0} highlighted={focused("queue-item", item.nodeId)} />)}
            </AnimatePresence>
          </g>
          {state.queue.length > 0 && <text x={queueX(0)} y={queueY + 49} textAnchor="middle" fill={playerTokens.text} fontSize={14}>先頭</text>}
        </g>
      </GraphViewport>
    </Box>
  );
}
