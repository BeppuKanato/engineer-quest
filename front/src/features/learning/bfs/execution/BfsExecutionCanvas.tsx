"use client";

import { Box } from "@mui/material";
import { AnimatePresence, motion, useIsPresent, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import { playerTokens } from "../../player/player.tokens";
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
export function BfsExecutionCanvas({ canvas }: { canvas: BfsExecutionCanvasState }) {
  const host = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 600, height: 450 });
  const reducedMotion = useReducedMotion();
  // 教材固有の動きは UI 定義の範囲内。共通プレイヤーの #83 は変更しない。
  const duration = reducedMotion ? 0 : 0.6;
  const transition = { duration, ease: "easeInOut" } as const;
  useEffect(() => {
    if (!host.current) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) setSize(previous => previous.width === width && previous.height === height ? previous : { width, height });
    });
    observer.observe(host.current);
    return () => observer.disconnect();
  }, []);

  const { data, state, highlights } = canvas;
  const margin = 12;
  const graphWidth = size.width - margin * 2;
  const graphHeight = Math.max(170, size.height - 165);
  const radius = Math.max(16, Math.min(32, size.width * 0.035));
  const position = (id: string): Point => {
    const node = data.graph.nodes.find(node => node.id === id)!;
    return { x: margin + node.x / 600 * graphWidth, y: 30 + node.y / 300 * (graphHeight - 55) };
  };
  const focused = (kind: "node" | "queue-item", id: string) => highlights.some(item => item.kind === kind && item.id === id);
  const itemWidth = Math.min(86, (size.width - 80) / 3);
  const gap = 14;
  const queueWidth = state.queue.length * (itemWidth + gap) - gap;
  const queueY = graphHeight + 96;
  const queueX = (index: number) => (size.width - queueWidth) / 2 + itemWidth / 2 + index * (itemWidth + gap);

  return (
    <Box ref={host} sx={{ width: "100%", height: "100%", minHeight: 320 }}>
      <svg viewBox={`0 0 ${size.width} ${size.height}`} role="img" aria-label="BFSのグラフ・距離層・待ち行列"
        style={{ width: "100%", height: "100%", display: "block" }}>
        {data.graph.layers.map((layer, index) => {
          const active = state.activeDistance === layer.distance;
          return <g key={layer.distance} role="group" aria-label={`${layer.distance}歩の層${active ? "、現在の層" : ""}`}>
            <motion.rect initial={false} x={margin + layer.x / 600 * graphWidth} y={8}
              width={layer.width / 600 * graphWidth} height={graphHeight} rx={8}
              fill={index % 2 ? playerTokens.layers.layer1 : playerTokens.layers.layer0}
              animate={{ opacity: active ? 1 : 0.35 }} transition={transition} />
            <text x={margin + (layer.x + layer.width / 2) / 600 * graphWidth} y={32} textAnchor="middle"
              fill={playerTokens.text} fontSize={16} fontWeight={active ? 700 : 400}>{layer.distance}歩</text>
          </g>;
        })}
        {data.graph.edges.map(edge => {
          const from = position(edge.from), to = position(edge.to);
          const focus = highlights.find(item => item.kind === "edge" && item.id === edge.id);
          const dashed = focus?.kind === "edge" && focus.style === "dashed";
          return <motion.line key={edge.id} data-edge-id={edge.id} initial={false}
            x1={from.x} y1={from.y} x2={to.x} y2={to.y}
            animate={{ stroke: focus ? playerTokens.focus : playerTokens.states.idle.stroke, strokeWidth: focus ? 5 : 2 }}
            strokeDasharray={dashed ? "8 6" : undefined} transition={transition} />;
        })}
        {data.graph.nodes.map(node => {
          const value = state.nodes.find(value => value.id === node.id)!;
          const tone = playerTokens.states[value.status];
          const point = position(node.id);
          const focus = focused("node", node.id);
          return <motion.g key={node.id} role="img" aria-label={`${node.id}：${tone.label}${value.distance === null ? "" : `、${value.distance}歩`}`}
            initial={false} animate={{ x: point.x, y: point.y, scale: focus ? 1.06 : 1 }} transition={transition}>
            <AnimatePresence initial={false}>
              {focus && <motion.circle key="focus" r={radius + 6} fill="none" stroke={playerTokens.focus} strokeWidth={3}
                initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} transition={transition} />}
            </AnimatePresence>
            <motion.circle r={radius} initial={false} animate={{ fill: tone.fill, stroke: tone.stroke }} strokeWidth={2} transition={transition} />
            <text y={7} textAnchor="middle" fontSize={22} fontWeight={700}
              fill={value.status === "processing" ? playerTokens.surface : playerTokens.text}>{node.id}</text>
            {value.distance !== null && <text y={radius + 24} textAnchor="middle" fill={playerTokens.text} fontSize={15}>{value.distance}歩</text>}
          </motion.g>;
        })}
        <g role="group" aria-label={state.queueLabel}>
          <text x={size.width / 2} y={graphHeight + 46} textAnchor="middle" fill={playerTokens.text} fontSize={17} fontWeight={700}>{state.queueLabel}</text>
          <g role="list" aria-label="キューの中身（先頭から末尾）">
            {state.queue.length === 0 && <text role="listitem" aria-label="空" x={size.width / 2} y={queueY + 7} textAnchor="middle" fill={playerTokens.text} fontSize={18}>空</text>}
            <AnimatePresence initial={false}>
              {state.queue.map((item, index) => <QueueItem key={item.nodeId} {...item} duration={duration} width={itemWidth}
                position={{ x: queueX(index), y: queueY }} source={position(item.nodeId)}
                first={index === 0} highlighted={focused("queue-item", item.nodeId)} />)}
            </AnimatePresence>
          </g>
          {state.queue.length > 0 && <text x={queueX(0)} y={queueY + 49} textAnchor="middle" fill={playerTokens.text} fontSize={14}>先頭</text>}
        </g>
      </svg>
    </Box>
  );
}
