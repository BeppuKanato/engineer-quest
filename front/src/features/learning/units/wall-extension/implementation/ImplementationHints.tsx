"use client";

import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import { Box, Button, Chip, Dialog, DialogContent, DialogTitle, Typography } from "@mui/material";

import { playerTokens } from "../../../player/player.tokens";

import { ParsonsBoard } from "../../../components/assessment/ParsonsBoard";
import { wallExtensionCode } from "../code-mapping/wallExtensionCode";
import { wallExtensionImplementationContent as content } from "./implementation.content";
import type { HintLevel } from "./implementation";

/** ヒント2「処理の流れ」の1ステップ。番号の丸と文を横に並べ、矢印でつないで流れとして見せる。 */
function FlowStep({ index, text }: { index: number; text: string }) {
  return <Box role="listitem" sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
    <Box aria-hidden sx={{ flexShrink: 0, width: 30, height: 30, borderRadius: "50%", bgcolor: playerTokens.focus, color: playerTokens.surface, display: "grid", placeItems: "center", fontWeight: 800, fontSize: 16 }}>{index + 1}</Box>
    <Typography component="p" sx={{ fontSize: 16, lineHeight: 1.7, pt: 0.4 }}>{text}</Typography>
  </Box>;
}
function FlowArrow() {
  return <Box aria-hidden sx={{ width: 30, display: "grid", placeItems: "center" }}>
    <ArrowDownwardIcon sx={{ fontSize: 20, color: "#9ca3af", my: 0.5 }} />
  </Box>;
}

export function ImplementationHints({ level, onInsert, onClose }: {
  level: HintLevel; onInsert: (token: string) => void; onClose: () => void;
}) {
  const textColor = playerTokens.text;
  return <Dialog open onClose={onClose} maxWidth={false} aria-labelledby="implementation-hint-title"
    slotProps={{ paper: { sx: { width: "min(92vw, 760px)", maxHeight: "90dvh", m: 1, bgcolor: playerTokens.surface, color: textColor } } }}>
    <DialogTitle id="implementation-hint-title">{content.hints.labels[level - 1]}</DialogTitle>
    <DialogContent>
      {level === 1 && <>
        {content.hints.variables.map(variable => <Typography component="p" key={variable.name} sx={{ mb: 1, fontSize: 16 }}><code>{variable.name}</code>＝{variable.description}</Typography>)}
        <Typography component="p" sx={{ my: 1 }}>{content.hints.tokenInstruction}</Typography>
        <Box role="group" aria-label={content.hints.tokenGroupLabel} sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
          {content.hints.tokens.map(token => <Button key={token} variant="outlined" onClick={() => onInsert(token)}
            sx={{ fontFamily: "monospace", fontSize: 16, minHeight: 44, px: 1, textTransform: "none", color: textColor, border: `2px solid ${playerTokens.focus}` }}>{token}</Button>)}
        </Box>
      </>}
      {level === 2 && <Box role="list" aria-label={content.hints.labels[1]}>
        <FlowStep index={0} text={content.hints.flow[0]} />
        <FlowArrow />
        <FlowStep index={1} text={content.hints.flow[1]} />
        <FlowArrow />
        <Box sx={{ border: "2px dashed #9ca3af", borderRadius: 2, px: 1.5, pb: 1.5, pt: 2, mt: 1.5, position: "relative" }}>
          <Chip label={content.hints.loopLabel} size="small" sx={{ position: "absolute", top: -13, left: 12, bgcolor: playerTokens.surface, border: "1px solid #9ca3af", fontWeight: 700, fontSize: 13 }} />
          <FlowStep index={2} text={content.hints.flow[2]} />
        </Box>
      </Box>}
      {level === 3 && <Box component="pre" aria-label={content.hints.labels[2]} sx={{ fontFamily: "monospace", fontSize: 16, lineHeight: 1.8, overflowX: "auto", m: 0 }}>
        {content.hints.skeletonLines.map((line, index) => <Box component="code" key={line.id} data-skeleton-line-id={line.id}>{index > 0 ? "\n" : ""}{line.text}</Box>)}
      </Box>}
      {level === 4 && <>
        <Typography component="p" sx={{ mb: 1 }}>{content.hints.parsonsQuestion.instruction}</Typography>
        <Box sx={{ bgcolor: playerTokens.surface, color: playerTokens.text }}><ParsonsBoard question={content.hints.parsonsQuestion} code={wallExtensionCode} /></Box>
      </>}
      <Button onClick={onClose} sx={{ mt: 2, minHeight: 44, color: playerTokens.control }}>{content.hints.closeLabel}</Button>
    </DialogContent>
  </Dialog>;
}
