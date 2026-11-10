"use client";

import { Box } from "@mui/material";
import { motion, useReducedMotion } from "framer-motion";

import { playerTokens } from "../../player/player.tokens";
import { WAVE, wavePath, wavePoint } from "../unitPathGeometry";

export type FeedbackNodeState = "done" | "current" | "upcoming";

/**
 * フィードバック専用画面の現在位置の図（Issue #369）。
 * 単元のパス表現（サインカーブ、スタート／ゴールの旗）のミニ版で、
 * 固定された構造目標（単元の全ステージ完了）に対する現在位置だけを示す。
 * 完了は到達の青、現在地は同じ青に輪を重ねて示し、未到達はベージュにする。
 * 完了グレー・赤・× などの非難表現は使わない。図は進捗の可視化に限る
 * （目標と次の一歩は文章とボタンが担う）ため、操作は持たない。
 */
export function FeedbackPositionFigure({ states, phaseNames }: {
  states: readonly FeedbackNodeState[];
  phaseNames: readonly string[];
}) {
  const reduced = useReducedMotion();
  const count = states.length;
  if (count < 1) return null;
  const points = states.map((_, index) => wavePoint(count === 1 ? 0 : index / (count - 1)));
  const currentIndex = states.lastIndexOf("current");
  const doneCount = states.filter(state => state !== "upcoming").length;
  const reachedIndex = currentIndex >= 0 ? currentIndex : doneCount - 1;
  const until = count === 1 || reachedIndex < 0 ? 0 : reachedIndex / (count - 1);
  const first = points[0], last = points[points.length - 1];
  const label = currentIndex >= 0
    ? `全${count}ステージのうち${doneCount}つが完了し、現在地は${phaseNames[currentIndex] ?? ""}です`
    : `全${count}ステージのうち${doneCount}つが完了しています`;
  return <Box role="img" aria-label={label} sx={{ width: "100%", maxWidth: 640 }}>
    <svg viewBox={`0 0 ${WAVE.width} ${WAVE.height}`} width="100%" style={{ display: "block" }}>
      <path d={wavePath(1)} fill="none" stroke="#c3d4ec" strokeWidth={9} strokeLinecap="round" />
      {until > 0 && <path d={wavePath(until)} fill="none" stroke={playerTokens.focus} strokeWidth={9} strokeLinecap="round" />}
      <g aria-hidden>
        <line x1={first.x} y1={first.y} x2={first.x} y2={first.y - 46} stroke="#475569" strokeWidth={4} strokeLinecap="round" />
        <polygon points={`${first.x},${first.y - 46} ${first.x},${first.y - 22} ${first.x + 28},${first.y - 34}`} fill={playerTokens.focus} />
        <text x={first.x - 6} y={first.y - 56} fontSize={24} fontWeight={700} fill={playerTokens.focus}>スタート</text>
      </g>
      <g aria-hidden>
        <line x1={last.x} y1={last.y} x2={last.x} y2={last.y - 46} stroke="#475569" strokeWidth={4} strokeLinecap="round" />
        <polygon points={`${last.x},${last.y - 46} ${last.x},${last.y - 22} ${last.x - 28},${last.y - 34}`} fill="#d97706" />
        <text x={last.x + 6} y={last.y - 56} textAnchor="end" fontSize={24} fontWeight={700} fill="#d97706">ゴール</text>
      </g>
      {points.map((point, index) => {
        const state = states[index];
        return <motion.g key={index}
          initial={reduced ? false : { opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: reduced ? 0 : 0.3, delay: reduced ? 0 : 0.15 + index * 0.06, ease: "easeOut" }}
          style={{ transformBox: "fill-box", transformOrigin: "center" }}>
          {state === "current" && <circle cx={point.x} cy={point.y} r={58} fill="none" stroke={playerTokens.focus} strokeWidth={5} />}
          <circle cx={point.x} cy={point.y} r={44}
            fill={state === "upcoming" ? playerTokens.states.queued.fill : playerTokens.focus}
            stroke={state === "upcoming" ? playerTokens.states.queued.stroke : playerTokens.surface}
            strokeWidth={5} />
          <text x={point.x} y={point.y} textAnchor="middle" dominantBaseline="central" fontSize={30} fontWeight={800}
            fill={state === "upcoming" ? playerTokens.text : playerTokens.surface}>{index + 1}</text>
          {state === "current" && <text x={point.x} y={point.y - 84} textAnchor="middle" fontSize={26} fontWeight={800} fill={playerTokens.focus}>現在地</text>}
        </motion.g>;
      })}
    </svg>
  </Box>;
}
