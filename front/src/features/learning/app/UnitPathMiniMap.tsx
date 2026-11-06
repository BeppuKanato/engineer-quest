"use client";

import { Box } from "@mui/material";

import { playerTokens } from "../player/player.tokens";
import { WAVE, wavePath, wavePoint } from "./unitPathGeometry";

/**
 * 単元完了時の静的な全灯マップ。単元画面の UnitPathMap と同じ波形（unitPathGeometry）で、
 * 軌跡と全ノードを達成の青で灯す。操作は持たず、内訳は下のフェーズ別行が担うため装飾として扱う。
 */
export function UnitPathMiniMap({ count }: { count: number }) {
  if (count < 1) return null;
  const points = Array.from({ length: count }, (_, index) => wavePoint(count === 1 ? 0 : index / (count - 1)));
  const first = points[0], last = points[points.length - 1];
  return <Box aria-hidden sx={{ width: "100%", maxWidth: 640 }}>
    <svg viewBox={`0 0 ${WAVE.width} ${WAVE.height}`} width="100%" style={{ display: "block" }}>
      <path d={wavePath(1)} fill="none" stroke={playerTokens.focus} strokeWidth={9} strokeLinecap="round" />
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
        <circle cx={point.x} cy={point.y} r={44} fill={playerTokens.focus} stroke={playerTokens.surface} strokeWidth={5} />
        <text x={point.x} y={point.y} textAnchor="middle" dominantBaseline="central" fontSize={30} fontWeight={800} fill={playerTokens.surface}>{index + 1}</text>
      </g>)}
    </svg>
  </Box>;
}
