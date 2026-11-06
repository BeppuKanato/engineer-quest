"use client";

import { motion, useReducedMotion } from "framer-motion";

import { GraphViewport } from "./GraphDrawing";
import { graphGeometry } from "./graphGeometry";
import type { ArrayBarsCanvasState } from "./arrayBars.types";
import { arrayBarsGeometry, arrayBarsLayout } from "./arrayBarsGeometry";
import { playerTokens } from "./player.tokens";

/**
 * 配列（棒）の唯一の描画実装（GraphDrawing / MazeGridDrawing に対する配列版）。
 * 色の意味は UI 定義 §2 に従い、すべて playerTokens から取る。緑は使わない。
 * 比べているペアは処理中（フォーカス青）、確定済みの右端は完了グレー、
 * それ以外は未処理（白地＋グレーの輪郭）。highlight はフォーカス青の内側の枠で示す。
 */
export function ArrayDrawing({ canvas, label }: { canvas: ArrayBarsCanvasState; label: string }) {
  const { values, comparing, fixedFrom } = canvas.state;
  const reduced = useReducedMotion();
  const transition = { duration: reduced ? 0 : playerTokens.transitionMs / 1000, ease: "easeInOut" } as const;
  const layout = arrayBarsLayout(values);
  const highlighted = new Set(canvas.highlights.map((highlight) => highlight.id));
  const comparingPair = new Set(comparing ?? []);

  const toneFor = (index: number) =>
    comparingPair.has(index) ? playerTokens.states.processing :
    index >= fixedFrom ? playerTokens.states.completed :
    playerTokens.states.idle;

  return (
    <GraphViewport label={label}>
      <line data-array-baseline
        x1={arrayBarsGeometry.marginX - 24} x2={arrayBarsGeometry.width - arrayBarsGeometry.marginX + 24}
        y1={layout.baselineY} y2={layout.baselineY}
        stroke={playerTokens.states.idle.stroke} strokeWidth={2} />
      {values.map((value, index) => {
        const bar = layout.bar(index);
        const tone = toneFor(index);
        return (
          <g key={index}>
            <motion.rect data-array-bar={index} data-array-value={value}
              data-array-comparing={comparingPair.has(index) || undefined}
              data-array-fixed={index >= fixedFrom || undefined}
              x={bar.x} width={bar.width} strokeWidth={2}
              initial={false}
              animate={{ y: bar.y, height: bar.height, fill: tone.fill, stroke: tone.stroke }}
              transition={transition} />
            {highlighted.has(index) && (
              <rect data-array-highlight={index} x={bar.x + 3} y={bar.y + 3} width={bar.width - 6} height={Math.max(bar.height - 6, 0)}
                fill="none" stroke={playerTokens.focus} strokeWidth={graphGeometry.ringStrokeWidth} pointerEvents="none" />
            )}
            <motion.text data-array-value-label={index} x={bar.centerX} textAnchor="middle"
              fontSize={arrayBarsGeometry.valueLabelFontSize} fontWeight={700}
              initial={false}
              animate={{ y: bar.y - arrayBarsGeometry.valueLabelGap, fill: playerTokens.text }}
              transition={transition}>
              {value}
            </motion.text>
            <text x={bar.centerX} y={arrayBarsGeometry.baselineY + arrayBarsGeometry.indexLabelOffsetY} textAnchor="middle"
              fontSize={arrayBarsGeometry.indexLabelFontSize} fill={playerTokens.states.idle.stroke}>
              {index}
            </text>
          </g>
        );
      })}
    </GraphViewport>
  );
}
