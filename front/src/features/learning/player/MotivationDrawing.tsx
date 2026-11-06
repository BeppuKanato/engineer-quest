"use client";

import { motion, useIsPresent } from "framer-motion";
import { useId } from "react";

import { graphGeometry } from "./graphGeometry";
import { playerTokens, type PlayerStatus } from "./player.tokens";

export type MazeLayout = {
  readonly rows: number; readonly columns: number;
  readonly places: readonly { id: string; row: number; column: number }[];
};
export type MotivationPoint = { x: number; y: number };
type Transition = { duration: number; ease: "easeInOut" };

/** BFS・DFSの同じ格子を、同じ論理座標領域へ配置する。 */
export function motivationMazeGeometry(maze: MazeLayout) {
  const cell = Math.min(100, 440 / maze.columns, 240 / maze.rows);
  const origin = { x: (600 - cell * maze.columns) / 2, y: (360 - cell * maze.rows) / 2 };
  return { cell, origin, point: (id: string): MotivationPoint => {
    const place = maze.places.find(place => place.id === id);
    if (!place) throw new Error(`Unknown maze place: ${id}`);
    return { x: origin.x + (place.column + 0.5) * cell, y: origin.y + (place.row + 0.5) * cell };
  } };
}

export function MotivationMazeTiles({ maze, states = {} }: { maze: MazeLayout; states?: Readonly<Record<string, PlayerStatus>> }) {
  const wallId = useId();
  const { cell, origin } = motivationMazeGeometry(maze);
  return <>
    <defs><pattern id={wallId} width={8} height={8} patternUnits="userSpaceOnUse">
      <path d="M-2 2L2-2M0 8L8 0M6 10L10 6" stroke={playerTokens.states.idle.stroke} />
    </pattern></defs>
    {Array.from({ length: maze.rows * maze.columns }, (_, index) => {
      const row = Math.floor(index / maze.columns), column = index % maze.columns;
      const place = maze.places.find(place => place.row === row && place.column === column);
      return <rect key={index} data-maze-place={place?.id} x={origin.x + column * cell} y={origin.y + row * cell} width={cell} height={cell}
        fill={place ? playerTokens.states[states[place.id] ?? "idle"].fill : `url(#${wallId})`} stroke={playerTokens.states.idle.stroke} />;
    })}
  </>;
}

/** 各区間を保持するため、迷路とグラフで同じ道筋を重ねられる。 */
export function MotivationTrail({ trail, point, transition }: { trail: readonly string[]; point: (id: string) => MotivationPoint; transition: Transition }) {
  return trail.slice(1).map((id, index) => {
    const from = point(trail[index]), to = point(id);
    return <motion.line key={`${index}:${trail[index]}-${id}`} initial={{ x1: from.x, y1: from.y, x2: to.x, y2: to.y, pathLength: 0 }}
      animate={{ x1: from.x, y1: from.y, x2: to.x, y2: to.y, pathLength: 1 }}
      stroke={playerTokens.focus} strokeWidth={6} transition={transition} />;
  });
}

export function MotivationCurrentPlace({ position, path = [], outline = false, transition }: {
  position: MotivationPoint; path?: readonly MotivationPoint[]; outline?: boolean; transition: Transition;
}) {
  const present = useIsPresent();
  const points = path.length > 1 ? path : [position];
  return <motion.circle role="img" aria-label="現在地" aria-hidden={!present || undefined}
    initial={{ cx: points[0].x, cy: points[0].y, opacity: 0 }}
    animate={{ cx: points.length > 1 ? points.map(point => point.x) : position.x,
      cy: points.length > 1 ? points.map(point => point.y) : position.y, opacity: 1 }} exit={{ opacity: 0 }}
    transition={{ ...transition, duration: transition.duration * Math.max(1, points.length - 1) }}
    r={outline ? graphGeometry.ringRadius : 22} fill={outline ? "none" : playerTokens.states.processing.fill}
    stroke={playerTokens.states.processing.stroke} strokeWidth={outline ? graphGeometry.ringStrokeWidth : 2} />;
}
