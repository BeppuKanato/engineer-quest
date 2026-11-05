"use client";

import { Box, Button, Typography } from "@mui/material";
import { useState } from "react";

import type { OrderAnswer, ParsonsQuestion } from "../../assessment/assessment";
import { playerTokens } from "../../player/player.tokens";
import { bfsCode } from "../code-mapping/bfsCode";

/** 下書きだけを保持する。提出後の判定・試行記録は共通assessmentへ渡す。 */
export function ParsonsBoard({ question, code, onAnswer }: { question: ParsonsQuestion; code: typeof bfsCode; onAnswer: (answer: OrderAnswer) => void }) {
  const [ordered, setOrdered] = useState<readonly string[]>([]);
  const text = (id: string) => code.lines.find(line => line.id === id)!.text;
  const rowStyle = {
    minHeight: 44, width: "max-content", minWidth: "100%", justifyContent: "flex-start", textTransform: "none", whiteSpace: "pre", fontFamily: "monospace", fontSize: 16,
    color: playerTokens.text, bgcolor: playerTokens.surface, border: `2px solid ${playerTokens.focus}`,
    "&:hover": { bgcolor: playerTokens.layers.layer0, border: `2px solid ${playerTokens.focus}` },
    "&:focus-visible": { outline: `3px solid ${playerTokens.control}`, outlineOffset: -3 },
  } as const;
  return <Box>
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", lg: "minmax(0, 1fr) minmax(0, 1fr)" }, gap: 2 }}>
      <Box sx={{ minWidth: 0 }}>
        <Typography component="p" sx={{ mb: 1 }}>選べるコード行</Typography>
        <Box role="group" aria-label="選べるコード行" sx={{ overflowX: "auto", display: "flex", flexDirection: "column", gap: 0.5 }}>
          {question.lineIds.filter(id => !ordered.includes(id)).map(id => <Button key={id} disableRipple type="button" data-parsons-line-id={id}
            aria-label={`追加：${text(id).trim()}`} onClick={() => setOrdered(current => current.includes(id) ? current : [...current, id])} sx={rowStyle}>{text(id)}</Button>)}
          {ordered.length === question.lineIds.length && <Typography component="p">すべての行を並べました。</Typography>}
        </Box>
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography component="p" sx={{ mb: 1 }}>並べたコード行</Typography>
        <Box role="group" aria-label="並べたコード行" sx={{ overflowX: "auto", display: "flex", flexDirection: "column", gap: 0.5 }}>
          {ordered.map(id => <Button key={id} disableRipple type="button" data-parsons-line-id={id} aria-label={`戻す：${text(id).trim()}`}
            onClick={() => setOrdered(current => current.filter(line => line !== id))} sx={rowStyle}>{text(id)}</Button>)}
          {ordered.length === 0 && <Typography component="p">選んだ行がここに並びます。</Typography>}
        </Box>
      </Box>
    </Box>
    <Box sx={{ mt: 2, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 1 }}>
      <Button onClick={() => setOrdered([])} disabled={!ordered.length} sx={{ color: playerTokens.control, minHeight: 44 }}>並びをリセット</Button>
      <Button variant="outlined" disabled={ordered.length !== question.lineIds.length} onClick={() => onAnswer({ kind: "order", lineIds: ordered })}
        sx={{ color: playerTokens.text, borderColor: playerTokens.control, minHeight: 44 }}>この順序で回答する</Button>
    </Box>
  </Box>;
}
