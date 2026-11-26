"use client";

import { Box } from "@mui/material";
import { motion, useReducedMotion } from "framer-motion";

import { playerTokens } from "../player/player.tokens";

/**
 * リザルトのスコア図示。総問題数分のドットを並べ、初回正解は塗り、再挑戦で正解した分は輪郭にする。
 * summary の件数だけで描く集計表示であり、問題ごとの内訳ではない（内訳データは保持していない）。
 * 件数が不正・多すぎる場合は何も描かない（事実文側に任せる）。
 * revealed が渡された場合は、その数までを1つずつ点灯させる（称賛の順序演出用）。
 * 渡されなければ全点灯の静止表示。
 */
export function ResultScoreDots({ total, firstAttemptCorrect, eventuallyCorrect, revealed, dotSize = 18 }: {
  total: number;
  firstAttemptCorrect: number;
  /** 最終的に正解へ到達した数。渡された場合、それを超えるドットは「まだ」を表す灰色の輪郭にする。 */
  eventuallyCorrect?: number;
  /** ここまで点灯済みにする。未指定なら全部出す。 */
  revealed?: number;
  /** ドットの直径（px）。要約など控えめに出す場所では小さくする。 */
  dotSize?: number;
}) {
  const reduce = useReducedMotion();
  if (!Number.isInteger(total) || !Number.isInteger(firstAttemptCorrect)
    || total <= 0 || total > 10 || firstAttemptCorrect < 0 || firstAttemptCorrect > total) return null;
  const animated = revealed !== undefined && !reduce;
  const eventual = eventuallyCorrect ?? total;
  return <Box data-score-dots role="img"
    aria-label={`全${total}問中、初回で${firstAttemptCorrect}問正解${eventuallyCorrect !== undefined ? `、最終的に${eventuallyCorrect}問正解` : ""}`}
    sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
    {Array.from({ length: total }, (_, index) => {
      const first = index < firstAttemptCorrect;
      const remaining = index >= eventual;
      const lit = revealed === undefined || index < revealed;
      return <motion.span key={index} data-score-dot data-dot-state={first ? "first" : remaining ? "remaining" : "retry"}
        initial={false}
        animate={animated
          ? (lit ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 })
          : { scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: first ? 17 : 26 }}
        style={{ display: "inline-flex" }}>
        <Box sx={{ width: dotSize, height: dotSize, borderRadius: "50%", flexShrink: 0,
          bgcolor: first ? playerTokens.focus : "transparent",
          border: `2px solid ${remaining ? "#c3cad4" : playerTokens.focus}` }} />
      </motion.span>;
    })}
  </Box>;
}
