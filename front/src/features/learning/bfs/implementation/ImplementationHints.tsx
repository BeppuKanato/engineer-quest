"use client";

import { Box, Button, Dialog, DialogContent, DialogTitle, Typography } from "@mui/material";

import { playerTokens } from "../../player/player.tokens";
import { bfsCode } from "../code-mapping/bfsCode";
import { ParsonsBoard } from "../consolidation/ParsonsBoard";
import { bfsImplementationContent as content } from "./implementation.content";
import type { HintLevel } from "./implementation";

export function ImplementationHints({ level, onInsert, onClose }: {
  level: HintLevel; onInsert: (token: string) => void; onClose: () => void;
}) {
  return <Dialog open onClose={onClose} maxWidth={false} aria-labelledby="implementation-hint-title"
    slotProps={{ paper: { sx: { width: "90vw", maxHeight: "90dvh", m: 1, bgcolor: playerTokens.surface, color: playerTokens.text } } }}>
    <DialogTitle id="implementation-hint-title">{content.hints.labels[level - 1]}</DialogTitle>
    <DialogContent>
      {level === 1 && <>
        {content.hints.variables.map(variable => <Typography component="p" key={variable.name} sx={{ mb: 1 }}><code>{variable.name}</code>＝{variable.description}</Typography>)}
        <Typography component="p" sx={{ my: 1 }}>{content.hints.tokenInstruction}</Typography>
        <Box role="group" aria-label={content.hints.tokenGroupLabel} sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
          {content.hints.tokens.map(token => <Button key={token} variant="outlined" onClick={() => onInsert(token)}
            sx={{ fontFamily: "monospace", fontSize: 16, minHeight: 44, px: 1, textTransform: "none", color: playerTokens.text, border: `2px solid ${playerTokens.focus}` }}>{token}</Button>)}
        </Box>
      </>}
      {level === 2 && <Box component="ol" sx={{ pl: 3 }}>{content.hints.flow.map(step => <Typography component="li" key={step} sx={{ mb: 2 }}>{step}</Typography>)}</Box>}
      {level === 3 && <Box component="pre" aria-label={content.hints.labels[2]} sx={{ fontFamily: "monospace", fontSize: 16, lineHeight: 1.8, overflowX: "auto", m: 0 }}>
        {content.hints.skeletonLines.map((line, index) => <Box component="code" key={line.id} data-skeleton-line-id={line.id}>{index > 0 ? "\n" : ""}{line.text}</Box>)}
      </Box>}
      {level === 4 && <>
        <Typography component="p" sx={{ mb: 1 }}>{content.hints.parsonsQuestion.instruction}</Typography>
        <ParsonsBoard question={content.hints.parsonsQuestion} code={bfsCode} />
      </>}
      <Button onClick={onClose} sx={{ mt: 2, minHeight: 44, color: playerTokens.control }}>{content.hints.closeLabel}</Button>
    </DialogContent>
  </Dialog>;
}
