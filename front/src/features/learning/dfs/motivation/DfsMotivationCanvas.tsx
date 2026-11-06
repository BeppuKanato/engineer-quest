"use client";

import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import FolderOpenOutlinedIcon from "@mui/icons-material/FolderOpenOutlined";
import { Box, Typography } from "@mui/material";
import { motion, useReducedMotion } from "framer-motion";
import { useId } from "react";

import { PhaseNextButton } from "../../app/PhaseNextButton";
import { GraphEdges, GraphNodes, GraphViewport } from "../../player/GraphDrawing";
import { motivationMazeGeometry, MotivationMazeTiles, MotivationTrail, MotivationCurrentPlace } from "../../player/MotivationDrawing";
import { playerTokens, type PlayerStatus } from "../../player/player.tokens";
import { dfsMotivationWalk } from "./motivation.content";
import type { DfsMotivationCanvasState } from "./motivation.types";

function FolderExample() {
  const folder = (label: string) => <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
    <FolderOpenOutlinedIcon aria-hidden sx={{ fontSize: 36, color: playerTokens.focus }} />
    <Typography sx={{ fontSize: "clamp(18px, 1.5vw, 26px)", color: playerTokens.text, fontWeight: 700 }}>{label}</Typography>
  </Box>;
  return <Box role="img" aria-label="フォルダの入れ子とファイル" sx={{ height: "100%", display: "grid", placeItems: "center" }}>
    <Box sx={{ width: "min(90%, 480px)" }}>
      {folder("資料")}
      <Box sx={{ ml: 2, pl: 3, mt: 1, borderLeft: `2px solid ${playerTokens.states.idle.stroke}` }}>
        {folder("写真")}
        <Box sx={{ ml: 2, pl: 3, py: 2, borderLeft: `2px solid ${playerTokens.states.idle.stroke}`, display: "flex", alignItems: "center", gap: 1 }}>
          <DescriptionOutlinedIcon aria-hidden sx={{ color: playerTokens.text, fontSize: 32 }} /><Typography sx={{ color: playerTokens.text, fontSize: 18 }}>旅の記録.jpg</Typography>
        </Box>
        <Box sx={{ py: 2, display: "flex", alignItems: "center", gap: 1 }}>
          <DescriptionOutlinedIcon aria-hidden sx={{ color: playerTokens.text, fontSize: 32 }} /><Typography sx={{ color: playerTokens.text, fontSize: 18 }}>メモ.txt</Typography>
        </Box>
      </Box>
    </Box>
  </Box>;
}

/** 図の差分だけを描画する。格子・現在地・軌跡はBFSと共用、グラフはGraphDrawingに委譲。 */
export function DfsMotivationCanvas({ canvas }: { canvas: DfsMotivationCanvasState }) {
  const { data, state, highlights } = canvas;
  const reduced = useReducedMotion(), returnArrow = useId();
  const transition = { duration: reduced ? 0 : playerTokens.transitionMs / 1000, ease: "easeInOut" } as const;
  if (data.view === "folders") return <FolderExample />;
  const isMaze = data.view === "maze";
  const maze = motivationMazeGeometry(data.maze);
  const point = (id: string) => isMaze ? maze.point(id) : data.graph.nodes.find(node => node.id === id)!;
  const focus = (kind: "node" | "edge", id: string) => highlights.some(target => target.kind === kind && target.id === id);
  const states: Record<string, PlayerStatus> = Object.fromEntries(data.graph.nodes.map(node => [node.id,
    node.id === state.current ? "processing" : state.visited.includes(node.id) ? "completed" : "idle"]));
  const points = (ids: readonly string[]) => ids.map(id => { const p = point(id); return `${p.x},${p.y}`; }).join(" ");
  const treasure = point(data.treasure);
  return <Box sx={{ height: "100%", minHeight: 220, position: "relative" }}>
    <GraphViewport label={isMaze ? "宝を探す迷路と現在地" : "AからFの場所と探索の道筋"}>
      {isMaze && <MotivationMazeTiles maze={data.maze} states={Object.fromEntries(Object.entries(states).map(([id, status]) => [id, status === "processing" ? "idle" : status]))} />}
      <GraphEdges transition={transition} position={point} edges={data.graph.edges.map(edge => ({ ...edge,
        hidden: isMaze && !focus("edge", edge.id), highlighted: focus("edge", edge.id),
      }))} />
      {state.preview && <motion.polyline points={points(dfsMotivationWalk)} fill="none" stroke={playerTokens.focus} strokeWidth={4}
        strokeDasharray="8 6" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={transition} />}
      <MotivationTrail trail={state.trail} point={point} transition={transition} />
      {!isMaze && <GraphNodes transition={transition} nodes={data.graph.nodes.map(node => ({ ...node, label: node.id,
        status: states[node.id], highlighted: focus("node", node.id),
        ariaLabel: `${node.id}${node.id === state.current ? "、現在地" : state.visited.includes(node.id) ? "、調べた場所" : "、まだ調べていない場所"}`,
      }))} />}
      {state.current && <MotivationCurrentPlace key={`${data.view}:${state.movement.join()}`} position={point(state.current)}
        path={state.movement.map(point)} outline={!isMaze} transition={transition} />}
      {isMaze && state.showNames && data.graph.nodes.map(node => {
        const p = point(node.id);
        return <g key={node.id} transform={`translate(${p.x} ${p.y})`}>
          <rect x={-16} y={-18} width={32} height={36} rx={4} fill={states[node.id] === "processing" ? playerTokens.focus : playerTokens.states[states[node.id]].fill} />
          <text y={7} textAnchor="middle" fill={states[node.id] === "processing" ? playerTokens.surface : playerTokens.text} fontWeight={700} fontSize={24}>{node.id}</text>
        </g>;
      })}
      {state.treasureVisible && <g role="img" aria-label="見つけた宝" transform={`translate(${treasure.x} ${treasure.y - 47})`}>
        <path d="M-18 0V-12Q0-25 18-12V0ZM-18 0H18V18H-18Z" fill={playerTokens.states.queued.fill} stroke={playerTokens.text} strokeWidth={2} />
        <rect x={-4} y={-3} width={8} height={9} fill={playerTokens.focus} />
      </g>}
      {state.returnTrail && <>
        <defs><marker id={returnArrow} markerWidth={9} markerHeight={9} refX={8} refY={4} orient="auto"><path d="M0 0L8 4L0 8" fill="none" stroke={playerTokens.text} /></marker></defs>
        <polyline points={points([...state.trail].reverse())} fill="none" stroke={playerTokens.text} strokeWidth={2} strokeDasharray="7 5" markerEnd={`url(#${returnArrow})`} />
      </>}
      {state.annotations && <>
        <text x={point("A").x} y={point("A").y + 68} textAnchor="middle" fill={playerTokens.text} fontSize={18}>場所（ノード）</text>
        <text x={(point("A").x + point("B").x) / 2} y={point("A").y - 62} textAnchor="middle" fill={playerTokens.text} fontSize={18}>つながり（辺）</text>
      </>}
    </GraphViewport>
    {state.exit && <Box component={motion.div} initial={reduced ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={transition}
      sx={{ position: "absolute", left: "50%", bottom: 12, transform: "translateX(-50%)" }}>
      <PhaseNextButton label="動きの説明へ進む" disabled onClick={() => {}} />
    </Box>}
  </Box>;
}
