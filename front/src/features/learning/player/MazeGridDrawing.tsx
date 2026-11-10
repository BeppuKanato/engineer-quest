"use client";

import { motion, useReducedMotion } from "framer-motion";

import { GraphViewport } from "./GraphDrawing";
import { graphGeometry } from "./graphGeometry";
import { mazeCellKey, type MazeGridCanvasState } from "./mazeGrid.types";
import { mazeGridLayout } from "./mazeGridGeometry";
import { playerTokens } from "./player.tokens";

/**
 * 迷路グリッドの唯一の描画実装（GraphDrawing に対するグリッド版）。
 * 色の意味は UI 定義 §2 に従い、すべて playerTokens から取る。緑は使わない。
 * 壁は、レイヤー系で最も濃いニュートラル色として text を使う（専用トークンは無い）。
 * highlight はフォーカス青の内側の枠で示す。壁マスは「今回壁になったマス」の
 * 表現として実線の枠、通路マスはグラフのリングと同じ破線にする。
 */
export function MazeGridDrawing({ canvas, label }: { canvas: MazeGridCanvasState; label: string }) {
  const { size } = canvas.data;
  const { walls, processing, target, path, start, goal } = canvas.state;
  const reduced = useReducedMotion();
  const transition = { duration: reduced ? 0 : playerTokens.transitionMs / 1000, ease: "easeInOut" } as const;
  const layout = mazeGridLayout(size);
  const wallSet = new Set(walls);
  const highlighted = new Set(canvas.highlights.map((highlight) => highlight.id));

  const fillFor = (key: string) =>
    key === processing ? playerTokens.states.processing.fill :
    key === target ? playerTokens.states.queued.fill :
    wallSet.has(key) ? playerTokens.text :
    playerTokens.surface;
  const strokeFor = (key: string) =>
    key === processing ? playerTokens.states.processing.stroke :
    key === target ? playerTokens.states.queued.stroke :
    wallSet.has(key) ? playerTokens.text :
    playerTokens.states.idle.stroke;

  const flag = (key: string, kind: "start" | "goal") => {
    const center = layout.center(key);
    return (
      <g key={kind} data-maze-flag={kind} transform={`translate(${center.x} ${center.y})`} aria-hidden>
        <path d="M6 12V-14M6 -14L20 -9L6 -4" fill="none" stroke={playerTokens.text} strokeWidth={2.5} />
      </g>
    );
  };

  return (
    <GraphViewport label={label}>
      {Array.from({ length: size * size }, (_, index) => {
        const key = mazeCellKey(index % size, Math.floor(index / size));
        const rect = layout.rect(key);
        return (
          <g key={key}>
            <motion.rect data-maze-cell={key} data-maze-wall={wallSet.has(key) || undefined}
              x={rect.x} y={rect.y} width={rect.width} height={rect.height}
              initial={false}
              animate={{ fill: fillFor(key), stroke: strokeFor(key), strokeWidth: key === target ? 2.5 : 1 }}
              transition={transition} />
            {highlighted.has(key) && (
              <rect data-maze-highlight={key} x={rect.x + 3} y={rect.y + 3} width={rect.width - 6} height={rect.height - 6}
                fill="none" stroke={playerTokens.focus} strokeWidth={graphGeometry.ringStrokeWidth}
                strokeDasharray={wallSet.has(key) ? undefined : graphGeometry.ringDasharray} pointerEvents="none" />
            )}
          </g>
        );
      })}
      {path.length > 1 && (
        <motion.polyline data-maze-path={path.join(" ")}
          points={path.map((key) => { const p = layout.center(key); return `${p.x},${p.y}`; }).join(" ")}
          fill="none" stroke={playerTokens.focus} strokeWidth={6} strokeLinejoin="round" strokeLinecap="round"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={transition} />
      )}
      {start && flag(start, "start")}
      {goal && flag(goal, "goal")}
    </GraphViewport>
  );
}
