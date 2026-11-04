"use client";

import { Box, Button } from "@mui/material";
import { AnimatePresence, motion, useIsPresent, useReducedMotion } from "framer-motion";
import { useId } from "react";

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

function CurrentPlace({ position, isMaze, transition }: { position: Point; isMaze: boolean; transition: Transition }) {
  const present = useIsPresent();
  return <motion.circle role="img" aria-label="現在地" aria-hidden={!present || undefined}
    initial={{ cx: position.x, cy: position.y, r: isMaze ? 22 : 27, opacity: 0 }}
    animate={{ cx: position.x, cy: position.y, r: isMaze ? 22 : 27, opacity: 1 }} exit={{ opacity: 0 }} transition={transition}
    fill={playerTokens.states.processing.fill} stroke={playerTokens.states.processing.stroke} strokeWidth={2} />;
}

/** 教材固有の図のみを描画する。再生、キャプション、操作バーは共通プレイヤーへ委譲。 */
export function BfsMotivationCanvas({ canvas }: { canvas: MotivationCanvasState }) {
  const { data, state, highlights } = canvas;
  const isMaze = data.view === "maze";
  const wallId = useId();
  const reducedMotion = useReducedMotion();
  const transition = { duration: reducedMotion ? 0 : 0.6, ease: "easeInOut" } as const;
  const point = (id: string) => {
    if (!isMaze) return data.graph.nodes.find((node) => node.id === id)!;
    const place = data.maze.places.find((node) => node.id === id)!;
    return { x: 100 + (place.column + 0.5) * 100, y: 80 + (place.row + 0.5) * 100 };
  };
  const focus = (kind: "node" | "edge" | "route", id: string) => highlights.some((target) => target.kind === kind && target.id === id);
  const goal = point(state.goal);
  const current = state.current === null ? null : point(state.current);

  return (
    <Box sx={{ height: "100%", display: "grid", gridTemplateRows: "minmax(0, 1fr) 48px" }}>
      <svg viewBox="0 0 600 360" role="img" aria-label={isMaze ? "格子の迷路と現在の場所" : "AからFの場所とつながり"}
        style={{ width: "100%", height: "100%", minHeight: 220 }}>
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
            return <rect key={index} x={100 + column * 100} y={80 + row * 100} width={100} height={100}
              fill={wall ? `url(#${wallId})` : playerTokens.surface} stroke={playerTokens.states.idle.stroke} />;
          })}
        </motion.g>
        {data.graph.edges.map((edge) => {
          const from = point(edge.from), to = point(edge.to);
          return <motion.line key={edge.id} initial={false} animate={{
            x1: from.x, y1: from.y, x2: to.x, y2: to.y, opacity: isMaze && !focus("edge", edge.id) ? 0 : 1,
            stroke: focus("edge", edge.id) ? playerTokens.focus : playerTokens.states.idle.stroke,
            strokeWidth: focus("edge", edge.id) ? 5 : 2,
          }} transition={transition} />;
        })}
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
        {data.graph.nodes.map((node) => {
          const p = point(node.id);
          const distance = state.distances.find((entry) => entry.id === node.id);
          return <motion.g key={node.id} role="img" aria-label={`${data.labels.nodeNames[node.id]}${node.id === state.goal ? `、${data.labels.goal}` : ""}${node.id === state.current ? "、現在地" : ""}`}
            initial={false} animate={{ x: p.x, y: p.y }} transition={transition}>
            <motion.rect x={-30} y={-30} width={60} height={60} rx={30} initial={false}
              animate={{ opacity: isMaze ? 0 : 1 }} fill={playerTokens.surface} stroke={playerTokens.states.idle.stroke} strokeWidth={2} transition={transition} />
            <motion.rect initial={false} fill="none" stroke={playerTokens.focus} strokeWidth={3} strokeDasharray="5 4"
              animate={{ x: isMaze ? -43 : -37, y: isMaze ? -43 : -37, width: isMaze ? 86 : 74,
                height: isMaze ? 86 : 74, rx: isMaze ? 4 : 37, opacity: focus("node", node.id) ? 1 : 0 }} transition={transition} />
            {distance && <text y={isMaze ? 44 : 55} textAnchor="middle" fill={playerTokens.text} fontSize={20}>
              {distance.value}{data.labels.distanceUnit}
            </text>}
          </motion.g>;
        })}
        <AnimatePresence initial={false}>
          {current && <CurrentPlace key="current" position={current} isMaze={isMaze} transition={transition} />}
        </AnimatePresence>
        {data.graph.nodes.map((node) => {
          const p = point(node.id);
          return <motion.g key={node.id} initial={false} animate={{ x: p.x, y: p.y }} transition={transition}>
            {state.showNames && <text y={7} textAnchor="middle" fontSize={data.view === "social" ? 20 : 24}
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
      </svg>
      <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
        {state.exit && <Button variant="outlined" disabled sx={{ "&.Mui-disabled": { color: playerTokens.text, borderColor: playerTokens.states.idle.stroke } }}
          aria-label={`${state.exit.label}（接続は後続Issueで実装）`}>
          {state.exit.label}
        </Button>}
      </Box>
    </Box>
  );
}
