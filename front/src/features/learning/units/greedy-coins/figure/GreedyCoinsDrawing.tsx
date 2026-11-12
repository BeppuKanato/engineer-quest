"use client";

import { motion, useReducedMotion } from "framer-motion";

import { GraphViewport } from "../../../player/GraphDrawing";
import { playerTokens, type PlayerStatus } from "../../../player/player.tokens";
import type { GreedyCoinStatus, GreedyCoinsCanvasState } from "./greedyCoins.types";
import { greedyCoinsGeometry as geometry, greedyCoinsLayout } from "./greedyCoinsGeometry";

/**
 * 硬貨の図の唯一の描画実装（基準データ §4）。構成は額面列・残額・トレイの3要素。
 * 単元側の額面状態からプレイヤートークンへの写像はここだけに置く:
 * current＝処理中（青）、upcoming＝未到達（ベージュ＝キューのトーン）、
 * passed＝通過済み（グレー）。情報テキストは黒、青いチップの上だけ白。緑は使わない。
 */
const coinStatusToPlayerStatus: Record<GreedyCoinStatus, PlayerStatus> = {
  current: "processing",
  upcoming: "queued",
  passed: "completed",
};

export function GreedyCoinsDrawing({ canvas, label }: { canvas: GreedyCoinsCanvasState; label: string }) {
  const { coins, coinStatuses, remaining, tray } = canvas.state;
  const reduced = useReducedMotion();
  const transition = { duration: reduced ? 0 : playerTokens.transitionMs / 1000, ease: "easeInOut" } as const;
  const layout = greedyCoinsLayout(coins.length);
  const highlighted = new Set(canvas.highlights.map((highlight) => highlight.id));

  return (
    <GraphViewport label={label}>
      {coins.map((coin, index) => {
        const center = layout.coinCenter(index);
        const tone = playerTokens.states[coinStatusToPlayerStatus[coinStatuses[index]]];
        return (
          <g key={coin} data-coin-chip={coin} data-coin-status={coinStatuses[index]}>
            {highlighted.has(index) && (
              <circle data-coin-highlight={coin} cx={center.x} cy={center.y} r={geometry.ringRadius}
                fill="none" stroke={playerTokens.focus} strokeWidth={geometry.ringStrokeWidth}
                strokeDasharray={geometry.ringDasharray} pointerEvents="none" />
            )}
            <motion.circle cx={center.x} cy={center.y} r={geometry.coinRadius} strokeWidth={2}
              initial={false} animate={{ fill: tone.fill, stroke: tone.stroke }} transition={transition} />
            <text x={center.x} y={center.y + 8} textAnchor="middle"
              fontSize={geometry.coinLabelFontSize} fontWeight={700}
              fill={coinStatuses[index] === "current" ? playerTokens.surface : playerTokens.text}>
              {coin}
            </text>
          </g>
        );
      })}
      <text data-remaining={remaining} x={geometry.width / 2} y={geometry.remainingCenterY}
        textAnchor="middle" fontSize={geometry.remainingFontSize} fontWeight={700} fill={playerTokens.text}>
        {`残り ${remaining}円`}
      </text>
      <text x={geometry.trayX} y={geometry.trayLabelY} fontSize={18} fontWeight={700} fill={playerTokens.text}>
        選んだ硬貨
      </text>
      <text data-tray-count={tray.length} x={geometry.trayX + geometry.trayWidth} y={geometry.trayLabelY}
        textAnchor="end" fontSize={18} fontWeight={700} fill={playerTokens.text}>
        {`${tray.length}枚`}
      </text>
      <rect x={geometry.trayX} y={geometry.trayY} width={geometry.trayWidth} height={geometry.trayHeight}
        rx={12} fill={playerTokens.layers.layer0} stroke={playerTokens.states.idle.stroke} strokeWidth={1} />
      {tray.length === 0 && (
        <text x={geometry.width / 2} y={geometry.trayCoinCenterY + 6} textAnchor="middle"
          fontSize={18} fill={playerTokens.text}>
          まだ選んでいません
        </text>
      )}
      {tray.map((coin, index) => {
        const center = layout.trayCoinCenter(index);
        return (
          <g key={index} data-tray-coin={coin}>
            <motion.circle cx={center.x} cy={center.y} r={geometry.trayCoinRadius} strokeWidth={2}
              initial={false}
              animate={{
                fill: playerTokens.states.queued.fill, stroke: playerTokens.states.queued.stroke,
              }} transition={transition} />
            <text x={center.x} y={center.y + 6} textAnchor="middle"
              fontSize={geometry.trayCoinLabelFontSize} fontWeight={700} fill={playerTokens.text}>
              {coin}
            </text>
          </g>
        );
      })}
    </GraphViewport>
  );
}
