"use client";

import { Box, Button, Dialog, DialogContent, DialogTitle, Typography } from "@mui/material";

import { playerTokens } from "../../player/player.tokens";
import { bfsCode } from "../code-mapping/bfsCode";
import { ParsonsBoard } from "../consolidation/ParsonsBoard";
import { bfsImplementationContent as content } from "./implementation.content";
import { codeDiff, hintMessage, type HintLevel, type TestOutcome } from "./implementation";

export function ImplementationHints({ level, code, outcomes, onClose }: {
  level: HintLevel; code: string; outcomes: readonly TestOutcome[]; onClose: () => void;
}) {
  return <Dialog open onClose={onClose} maxWidth={false} aria-labelledby="implementation-hint-title"
    slotProps={{ paper: { sx: { width: "90vw", maxHeight: "90dvh", m: 1, bgcolor: playerTokens.surface, color: playerTokens.text } } }}>
    <DialogTitle id="implementation-hint-title">{level === 1 ? content.hints.labels[0] : level === 2 ? content.hints.parsonsTitle : content.hints.diffTitle}</DialogTitle>
    <DialogContent>
      {level === 1 && <Typography role="status">{hintMessage(outcomes)}</Typography>}
      {level === 2 && <>
        <Typography component="p" sx={{ mb: 1 }}>{content.hints.parsonsQuestion.instruction}</Typography>
        <ParsonsBoard question={content.hints.parsonsQuestion} code={bfsCode} />
      </>}
      {level === 3 && <Box onCopy={event => event.preventDefault()} onCut={event => event.preventDefault()}
        onContextMenu={event => event.preventDefault()} onDragStart={event => event.preventDefault()}
        sx={{ overflowX: "auto", userSelect: "none", WebkitUserSelect: "none" }}>
        <Box component="table" aria-label="行単位のコード差分（閲覧専用）" sx={{ width: "100%", borderCollapse: "collapse", fontFamily: "monospace", fontSize: 16, lineHeight: 1.8,
          "th, td": { textAlign: "left", px: 1, verticalAlign: "top" }, "td": { whiteSpace: "pre" } }}>
          <thead><tr><th>現在のコード</th><th>正解コード（閲覧専用）</th></tr></thead>
          <tbody>{codeDiff(code).map((row, index) => <tr key={index} data-diff-changed={row.changed}>
            <Box component="td" sx={{ bgcolor: row.changed ? playerTokens.layers.layer0 : "transparent" }}>{row.current === undefined ? "" : `${row.changed ? "−" : " "} ${row.current}`}</Box>
            <Box component="td" sx={{ bgcolor: row.changed ? playerTokens.states.queued.fill : "transparent" }}>{row.reference === undefined ? "" : `${row.changed ? "+" : " "} ${row.reference}`}</Box>
          </tr>)}</tbody>
        </Box>
      </Box>}
      <Button onClick={onClose} sx={{ mt: 2, minHeight: 44, color: playerTokens.control }}>ヒントを閉じる</Button>
    </DialogContent>
  </Dialog>;
}
