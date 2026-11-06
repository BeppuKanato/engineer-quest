"use client";

import { Box } from "@mui/material";
import { AnimatePresence, motion, useIsPresent, useReducedMotion } from "framer-motion";
import { useId } from "react";

import { GraphEdges, GraphNodes, GraphViewport } from "../../player/GraphDrawing";
import { graphGeometry } from "../../player/graphGeometry";
import { PhaseNextButton } from "../../app/PhaseNextButton";
import { playerTokens } from "../../player/player.tokens";
import type { MotivationCanvasState } from "./motivation.types";

type Point = { x: number; y: number };
type Transition = { duration: number; ease: "easeInOut" };

function CandidateRoute({ route, view, point, focused, transition }: {
  route: MotivationCanvasState["data"]["routes"][number]; view: MotivationCanvasState["data"]["view"];
  point: (id: string) => Point; focused: boolean; transition: Transition;
}) {
  const present = useIsPresent();
  const anchor = route.labelPosition[view === "maze" ? "maze" : "graph"];
  return <motion.g aria-hidden={!present || undefined} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={transition}>
    <motion.polyline points={route.places.map((id) => { const p = point(id); return `${p.x},${p.y}`; }).join(" ")}
      fill="none" stroke={focused ? playerTokens.focus : playerTokens.states.idle.stroke}
      strokeWidth={focused ? 6 : 3} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={transition} />
    <text x={anchor.x} y={anchor.y} textAnchor="middle" fill={playerTokens.text} fontSize={24} fontWeight={700}>
      {route.labels[view]}
    </text>
  </motion.g>;
}

function CurrentPlace({ position, transition }: { position: Point; transition: Transition }) {
  const present = useIsPresent();
  return <motion.circle role="img" aria-label="現在地" aria-hidden={!present || undefined}
    initial={{ cx: position.x, cy: position.y, r: 22, opacity: 0 }}
    animate={{ cx: position.x, cy: position.y, r: 22, opacity: 1 }} exit={{ opacity: 0 }} transition={transition}
    fill={playerTokens.states.processing.fill} stroke={playerTokens.states.processing.stroke} strokeWidth={2} />;
}

/** 教材固有の図のみを描画する。再生、キャプション、操作バーは共通プレイヤーへ委譲。
 * onExit が渡された場合だけ、最終場面の終了ボタンを実際に押せるようにする（単元フローでの意思確認の区切り）。 */
export function BfsMotivationCanvas({ canvas, onExit }: { canvas: MotivationCanvasState; onExit?: () => void }) {
  const { data, state, highlights } = canvas;
  const isMaze = data.view === "maze";
  const wallId = useId();
  const reducedMotion = useReducedMotion();
  const transition = { duration: reducedMotion ? 0 : 0.6, ease: "easeInOut" } as const;
  // 迷路はグラフ領域（600×360）の中へ中央配置する。
  const cell = Math.min(100, 440 / data.maze.columns, 240 / data.maze.rows);
  const mazeOrigin = {
    x: (600 - cell * data.maze.columns) / 2,
    y: (360 - cell * data.maze.rows) / 2,
  };
  const point = (id: string) => {
    if (!isMaze) return data.graph.nodes.find((node) => node.id === id)!;
    const place = data.maze.places.find((node) => node.id === id)!;
    return { x: mazeOrigin.x + (place.column + 0.5) * cell, y: mazeOrigin.y + (place.row + 0.5) * cell };
  };
  const focus = (kind: "node" | "edge" | "route", id: string) => highlights.some((target) => target.kind === kind && target.id === id);
  const goal = point(state.goal);
  const current = state.current === null ? null : point(state.current);

  return (
    <Box sx={{ height: "100%", minHeight: 220, position: "relative" }}>
      <GraphViewport label={isMaze ? "格子の迷路と現在の場所" : "AからFの場所とつながり"}>
        <defs>
          <pattern id={wallId} width={8} height={8} patternUnits="userSpaceOnUse">
            <path d="M-2 2L2-2M0 8L8 0M6 10L10 6" stroke={playerTokens.states.idle.stroke} />
          </pattern>
        </defs>
        <motion.g initial={false} animate={{ opacity: isMaze ? 1 : 0 }} transition={transition} aria-hidden={!isMaze}>
          {Array.from({ length: data.maze.rows * data.maze.columns }, (_, index) => {
            const row = Math.floor(index / data.maze.columns);
            const column = index % data.maze.columns;
            const wall = !data.maze.places.some((place) => place.row === row && place.column === column);
            return <rect key={index} x={mazeOrigin.x + column * cell} y={mazeOrigin.y + row * cell} width={cell} height={cell}
              fill={wall ? `url(#${wallId})` : playerTokens.surface} stroke={playerTokens.states.idle.stroke} />;
          })}
        </motion.g>
        <GraphEdges transition={transition} position={point} edges={data.graph.edges.map(edge => ({
          ...edge, highlighted: focus("edge", edge.id), hidden: isMaze && !focus("edge", edge.id),
        }))} />
        <AnimatePresence initial={false}>
          {data.routes.filter((route) => state.shownRoutes.includes(route.id)).map((route) =>
            <CandidateRoute key={route.id} route={route} view={data.view} point={point} focused={focus("route", route.id)} transition={transition} />)}
        </AnimatePresence>
        {state.trail.slice(1).map((id, index) => {
          const from = point(state.trail[index]), to = point(id);
          return <motion.line key={`${state.trail[index]}-${id}`} initial={{ x1: from.x, y1: from.y, x2: to.x, y2: to.y, pathLength: 0 }}
            animate={{ x1: from.x, y1: from.y, x2: to.x, y2: to.y, pathLength: 1 }}
            stroke={playerTokens.focus} strokeWidth={6} transition={transition} />;
        })}
        {!isMaze && <GraphNodes transition={transition} nodes={data.graph.nodes.map(node => ({
          ...node, label: state.showNames ? data.labels.nodeNames[node.id] : "",
          status: node.id === state.current ? "processing" : "idle",
          highlighted: focus("node", node.id),
          ariaLabel: `${data.labels.nodeNames[node.id]}${node.id === state.goal ? `、${data.labels.goal}` : ""}${node.id === state.current ? "、現在地" : ""}`,
        }))} renderNodeDecoration={id => {
          const distance = state.distances.find(entry => entry.id === id);
          return distance && <text y={55} textAnchor="middle" fill={playerTokens.text} fontSize={20}>
            {distance.value}{data.labels.distanceUnit}
          </text>;
        }} />}
        {isMaze && data.maze.places.map(place => {
          const p = point(place.id);
          const distance = state.distances.find(entry => entry.id === place.id);
          return <motion.g key={place.id} role="img" aria-label={`${data.labels.nodeNames[place.id]}${place.id === state.goal ? `、${data.labels.goal}` : ""}${place.id === state.current ? "、現在地" : ""}`}
            initial={false} animate={{ x: p.x, y: p.y }} transition={transition}>
            <motion.rect x={-(cell - 14) / 2} y={-(cell - 14) / 2} width={cell - 14} height={cell - 14} rx={4}
              fill="none" stroke={playerTokens.focus} strokeWidth={graphGeometry.ringStrokeWidth} strokeDasharray={graphGeometry.ringDasharray}
              initial={false} animate={{ opacity: focus("node", place.id) ? 1 : 0 }} transition={transition} />
            {distance && <text y={cell * 0.44} textAnchor="middle" fill={playerTokens.text} fontSize={20}>
              {distance.value}{data.labels.distanceUnit}
            </text>}
          </motion.g>;
        })}
        <AnimatePresence initial={false}>
          {isMaze && current && <CurrentPlace key="current" position={current} transition={transition} />}
        </AnimatePresence>
        {data.graph.nodes.map(node => {
          const p = point(node.id);
          return <motion.g key={node.id} initial={false} animate={{ x: p.x, y: p.y }} transition={transition}>
            {isMaze && state.showNames && <rect x={-16} y={-18} width={32} height={36} rx={4}
              fill={node.id === state.current ? playerTokens.states.processing.fill : playerTokens.surface} />}
            {isMaze && state.showNames && <text y={7} textAnchor="middle" fontSize={24}
              fill={node.id === state.current ? playerTokens.surface : playerTokens.text} fontWeight={700}>
              {data.labels.nodeNames[node.id]}
            </text>}
            {node.id === state.start && <text y={isMaze ? -56 : -48} textAnchor="middle" fill={playerTokens.text} fontSize={20}>{data.labels.start}</text>}
          </motion.g>;
        })}
        <motion.g key="goal" initial={false} animate={{ x: goal.x, y: goal.y }} transition={transition}>
          <path d="M18 -38V-15M18 -38H35L30 -31H18" fill="none" stroke={playerTokens.text} strokeWidth={2} />
          <text y={isMaze ? -56 : 48} textAnchor="middle" fill={playerTokens.text} fontSize={20}>{data.labels.goal}</text>
        </motion.g>
        {state.annotations.map((annotation) => {
          const edge = data.graph.edges.find((entry) => entry.id === annotation.id);
          const p = annotation.kind === "node" ? point(annotation.id) : {
            x: (point(edge!.from).x + point(edge!.to).x) / 2 - 50,
            y: (point(edge!.from).y + point(edge!.to).y) / 2 - 45,
          };
          return <text key={`${annotation.kind}-${annotation.id}`} x={p.x} y={p.y + (annotation.kind === "node" ? 65 : 0)}
            textAnchor="middle" fill={playerTokens.text} fontSize={16}>{annotation.label}</text>;
        })}
        {isMaze && state.trail.length > 1 && <text x={300} y={340} textAnchor="middle" fill={playerTokens.text} fontSize={24}>
          {state.trail.length - 1}{data.labels.moveUnit}
        </text>}
      </GraphViewport>
      {/* 出口ボタンは SVG の外に置く。foreignObject 内では SVG の拡大率に引きずられ、指定した大きさで表示されない（#157）。 */}
      {state.exit && <Box sx={{ position: "absolute", right: 16, bottom: 12 }}>
        <PhaseNextButton label={state.exit.label} disabled={!onExit} onClick={() => onExit?.()}
          ariaLabel={onExit ? state.exit.label : `${state.exit.label}（接続は後続Issueで実装）`} />
      </Box>}
    </Box>
  );
}
