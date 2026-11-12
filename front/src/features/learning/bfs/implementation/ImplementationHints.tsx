"use client";

import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import { Box, Button, Chip, Dialog, DialogContent, DialogTitle, Typography } from "@mui/material";

import { playerTokens } from "../../player/player.tokens";
import type { ParsonsQuestion } from "../../assessment/assessment";

import { bfsCode } from "../code-mapping/bfsCode";
import { ParsonsBoard, type ParsonsCode } from "../../components/assessment/ParsonsBoard";
import { bfsImplementationContent as content } from "./implementation.content";
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

export type ImplementationHintContent = {
  readonly labels: readonly string[];
  readonly compactLabels: readonly string[];
  readonly variables: readonly { readonly name: string; readonly description: string }[];
  readonly tokens: readonly string[];
  readonly tokenInstruction: string;
  readonly tokenGroupLabel: string;
  readonly flow: readonly [string, string, string, string];
  readonly skeletonLines: ParsonsCode["lines"];
  readonly parsonsQuestion: ParsonsQuestion & { readonly instruction: string };
  readonly closeLabel: string;
  readonly groupLabel: string;
};

export function ImplementationHints({ level, onInsert, onClose, hints = content.hints, code = bfsCode, repeatLabel = "キューが空になるまでくり返し" }: {
  level: HintLevel; onInsert: (token: string) => void; onClose: () => void;
  hints?: ImplementationHintContent; code?: ParsonsCode; repeatLabel?: string;
}) {
  const textColor = playerTokens.text;
  return <Dialog open onClose={onClose} maxWidth={false} aria-labelledby="implementation-hint-title"
    slotProps={{ paper: { sx: { width: "min(92vw, 760px)", maxHeight: "90dvh", m: 1, bgcolor: playerTokens.surface, color: textColor } } }}>
    <DialogTitle id="implementation-hint-title">{hints.labels[level - 1]}</DialogTitle>
    <DialogContent>
      {level === 1 && <>
        {hints.variables.map(variable => <Typography component="p" key={variable.name} sx={{ mb: 1, fontSize: 16 }}><code>{variable.name}</code>＝{variable.description}</Typography>)}
        <Typography component="p" sx={{ my: 1 }}>{hints.tokenInstruction}</Typography>
        <Box role="group" aria-label={hints.tokenGroupLabel} sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
          {hints.tokens.map(token => <Button key={token} variant="outlined" onClick={() => onInsert(token)}
            sx={{ fontFamily: "monospace", fontSize: 16, minHeight: 44, px: 1, textTransform: "none", color: textColor, border: `2px solid ${playerTokens.focus}` }}>{token}</Button>)}
        </Box>
      </>}
      {level === 2 && <Box role="list" aria-label={hints.labels[1]}>
        <FlowStep index={0} text={hints.flow[0]} />
        <FlowArrow />
        <Box sx={{ border: "2px dashed #9ca3af", borderRadius: 2, px: 1.5, pb: 1.5, pt: 2, mt: 1.5, position: "relative" }}>
          <Chip label={repeatLabel} size="small" sx={{ position: "absolute", top: -13, left: 12, bgcolor: playerTokens.surface, border: "1px solid #9ca3af", fontWeight: 700, fontSize: 13 }} />
          <FlowStep index={1} text={hints.flow[1]} />
          <FlowArrow />
          <FlowStep index={2} text={hints.flow[2]} />
        </Box>
        <FlowArrow />
        <FlowStep index={3} text={hints.flow[3]} />
      </Box>}
      {level === 3 && <Box component="pre" aria-label={hints.labels[2]} sx={{ fontFamily: "monospace", fontSize: 16, lineHeight: 1.8, overflowX: "auto", m: 0 }}>
        {hints.skeletonLines.map((line, index) => <Box component="code" key={line.id} data-skeleton-line-id={line.id}>{index > 0 ? "\n" : ""}{line.text}</Box>)}
      </Box>}
      {level === 4 && <>
        <Typography component="p" sx={{ mb: 1 }}>{hints.parsonsQuestion.instruction}</Typography>
        <Box sx={{ bgcolor: playerTokens.surface, color: playerTokens.text }}><ParsonsBoard question={hints.parsonsQuestion} code={code} /></Box>
      </>}
      <Button onClick={onClose} sx={{ mt: 2, minHeight: 44, color: playerTokens.control }}>{hints.closeLabel}</Button>
    </DialogContent>
  </Dialog>;
}
