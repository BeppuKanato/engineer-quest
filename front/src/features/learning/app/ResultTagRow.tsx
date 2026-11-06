"use client";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ReplayIcon from "@mui/icons-material/Replay";
import { Box, Typography } from "@mui/material";
import type { ReactNode } from "react";

import { playerTokens } from "../player/player.tokens";

/**
 * 結果画面の論点1行分。正解は青いチェックで示し、初回で届かなかった論点は赤や❌で責めず、
 * 中立の復習アイコン＋「復習で確認できます」で示して復習導線を主役にする。
 * 論点が複数問を持つ場合は分数と小バーを足す（1問だけの論点では出さない）。
 */
export function ResultTagRow({ label, passed, correct, total, dataTag, reviewAction }: {
  label: string;
  passed: boolean;
  correct?: number;
  total?: number;
  dataTag?: string;
  reviewAction?: ReactNode;
}) {
  const multi = total !== undefined && total > 1 && correct !== undefined;
  return <Box component="li" data-result-tag={dataTag}
    sx={{ listStyle: "none", display: "flex", alignItems: "center", flexWrap: "wrap", gap: 1.5, p: 1.5,
      border: `1px solid ${playerTokens.layers.layer1}`, borderRadius: 2, bgcolor: playerTokens.surface }}>
    {passed
      ? <CheckCircleIcon aria-hidden sx={{ color: playerTokens.focus, fontSize: 34, flexShrink: 0 }} />
      : <Box aria-hidden sx={{ width: 34, height: 34, borderRadius: "50%", flexShrink: 0, display: "grid", placeItems: "center",
          border: `2px solid ${playerTokens.states.idle.stroke}` }}>
          <ReplayIcon sx={{ color: playerTokens.states.idle.stroke, fontSize: 20 }} />
        </Box>}
    <Box sx={{ minWidth: 0 }}>
      <Typography component="p" sx={{ fontWeight: 700, fontSize: 16 }}>{label}</Typography>
      <Typography component="p" sx={{ fontSize: 14 }}>
        {passed ? "初回正解" : "復習で確認できます"}{multi ? `（${correct}/${total} 問正解）` : ""}
      </Typography>
    </Box>
    {multi && <Box aria-hidden sx={{ width: 110, height: 8, borderRadius: 999, flexShrink: 0, overflow: "hidden",
        bgcolor: playerTokens.states.completed.fill }}>
      <Box sx={{ width: `${(correct / total) * 100}%`, height: "100%", bgcolor: playerTokens.focus }} />
    </Box>}
    {reviewAction && <Box sx={{ ml: "auto", flexShrink: 0 }}>{reviewAction}</Box>}
  </Box>;
}
