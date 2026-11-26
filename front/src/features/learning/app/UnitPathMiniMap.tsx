"use client";

import { Box } from "@mui/material";
import { motion, useReducedMotion } from "framer-motion";

import { playerTokens } from "../player/player.tokens";
import { wavePath, wavePoint } from "./unitPathGeometry";

/** 軌跡を描き切るまでの秒数。ノードは線が届いた順に灯る。 */
const DRAW_SECONDS = 1.4;

/** 中心 (cx, cy)・外径 r の五芒星の頂点列。 */
const starPoints = (cx: number, cy: number, r: number) =>
  Array.from({ length: 10 }, (_, i) => {
    const radius = i % 2 === 0 ? r : r * 0.45;
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    return `${cx + radius * Math.cos(angle)},${cy + radius * Math.sin(angle)}`;
  }).join(" ");

/**
 * 単元完了時の全灯マップ。単元画面の UnitPathMap と同じ波形（unitPathGeometry）を使う。
 * 出現時は軌跡が 1 から順に描かれ、ノードは線が届くたびに達成の青で灯る。
 * 描き切ったところで図全体が一回り大きくなり、完成感を出す。
 * 操作は持たず、内訳は下のフェーズ別行が担うため装飾として扱う。
 * 動きを減らす設定では最初から灯し切った状態を出す。
 */
export function UnitPathMiniMap({ count, labels }: { count: number; labels?: readonly string[] }) {
  const reduced = useReducedMotion();
  if (count < 1) return null;
  const points = Array.from({ length: count }, (_, index) => wavePoint(count === 1 ? 0 : index / (count - 1)));
  const first = points[0], last = points[points.length - 1];
  const reachDelay = (index: number) => 0.15 + (count === 1 ? 0 : index / (count - 1)) * DRAW_SECONDS;
  return <Box component={motion.div} aria-hidden data-unit-path-mini-map
    initial={{ scale: 1 }}
    animate={reduced ? { scale: 1 } : { scale: [1, 1.05, 1.03] }}
    transition={reduced ? { duration: 0 } : { duration: 0.6, delay: 0.15 + DRAW_SECONDS + 0.1, times: [0, 0.55, 1], ease: "easeOut", repeat: 0 }}
    sx={{ width: "100%", maxWidth: 1060 }}>
    <svg viewBox="0 70 1200 350" width="100%" style={{ display: "block" }}>
      <path d={wavePath(1)} fill="none" stroke="#c3d4ec" strokeWidth={9} strokeLinecap="round" />
      <motion.path d={wavePath(1)} fill="none" stroke={playerTokens.focus} strokeWidth={9} strokeLinecap="round"
        initial={reduced ? false : { pathLength: 0 }} animate={{ pathLength: 1 }}
        transition={{ duration: reduced ? 0 : DRAW_SECONDS, delay: reduced ? 0 : 0.15, ease: "easeInOut", repeat: 0 }} />
      <g>
        <line x1={first.x} y1={first.y} x2={first.x} y2={first.y - 46} stroke="#475569" strokeWidth={4} strokeLinecap="round" />
        <polygon points={`${first.x},${first.y - 46} ${first.x},${first.y - 22} ${first.x + 28},${first.y - 34}`} fill={playerTokens.focus} />
        <text x={first.x - 6} y={first.y - 56} fontSize={24} fontWeight={700} fill={playerTokens.focus}>スタート</text>
      </g>
      <g>
        <line x1={last.x} y1={last.y} x2={last.x} y2={last.y - 46} stroke="#475569" strokeWidth={4} strokeLinecap="round" />
        <polygon points={`${last.x},${last.y - 46} ${last.x},${last.y - 22} ${last.x - 28},${last.y - 34}`} fill="#d97706" />
        <text x={last.x + 6} y={last.y - 56} textAnchor="end" fontSize={24} fontWeight={700} fill="#d97706">ゴール</text>
      </g>
      {points.map((point, index) => <g key={index}>
        <circle cx={point.x} cy={point.y} r={44} fill={playerTokens.surface} stroke="#c3d4ec" strokeWidth={5} />
        <text x={point.x} y={point.y} textAnchor="middle" dominantBaseline="central" fontSize={30} fontWeight={800} fill={playerTokens.states.idle.stroke}>{index + 1}</text>
        <motion.g
          initial={reduced ? false : { opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: reduced ? 0 : 0.35, delay: reduced ? 0 : reachDelay(index), ease: "easeOut", repeat: 0 }}
          style={{ transformBox: "fill-box", transformOrigin: "center" }}>
          <circle cx={point.x} cy={point.y} r={44} fill={index === points.length - 1 && points.length > 1 ? "#d97706" : playerTokens.focus} stroke={playerTokens.surface} strokeWidth={5} />
          {index === points.length - 1 && points.length > 1 ? (
            // ゴールのノードだけ数字ではなく星にし、金色で到達点として区別する
            // （2026-11-24）。金は修了の象徴としてこのノードとリザルトのトロフィーに限る。
            <polygon points={starPoints(point.x, point.y, 21)} fill={playerTokens.surface} />
          ) : (
            // 番号ではなくチェックを入れる（2026-11-24、Kanato の指定）。
            // 何番の段階かはノード下のフェーズ名が担う。
            <path d={`M ${point.x - 15} ${point.y} l 10 10 l 20 -22`} fill="none" stroke={playerTokens.surface} strokeWidth={7.5} strokeLinecap="round" strokeLinejoin="round" />
          )}
        </motion.g>
        {labels?.[index] && (
          // 番号が何の段階かを示すフェーズ名（2026-11-24）。ノードの下に置き、
          // 軌跡と重なる箇所は白の縁取りで文字を浮かせる。点灯に合わせて出す。
          <motion.text x={point.x} y={point.y + 76} textAnchor="middle" fontSize={25} fontWeight={700}
            fill={playerTokens.text} stroke="#ffffff" strokeWidth={6} strokeLinejoin="round" style={{ paintOrder: "stroke" }}
            initial={reduced ? false : { opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: reduced ? 0 : 0.3, delay: reduced ? 0 : reachDelay(index) }}>
            {labels[index]}
          </motion.text>
        )}
      </g>)}
    </svg>
  </Box>;
}
