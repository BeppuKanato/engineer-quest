"use client";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";
import { Box, Stack, Typography } from "@mui/material";
import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

import { bubbleSortCode } from "../code-mapping/bubbleSortCode";
import { bubbleSortCodeCheckContent } from "../code-check/codeCheck.content";
import type { BubbleSortUnitPhaseSummary } from "./unit.types";

/**
 * フェーズ5版の「あの場面」（2026-11-24、段階3の形の移植）。
 *
 * 段階3の場面が「図＋回答の変化」だったのに対し、段階5の証拠はコード。
 * 対象行をハイライトしたコード全体を示し、その行の空欄の中で
 * 最初の回答（✗）が正しい回答（✓）に切り替わる再現を付ける。
 * 対象の決め方（直せた問題がちょうど1問のときだけ）・材料（記録のみ、
 * LLMの文章とは照合しない）は段階3と同規則。
 */
export function buildCodeBlankScene(summary: BubbleSortUnitPhaseSummary | undefined): ReactNode | null {
  const records = summary?.assessmentEvidence?.records;
  if (!records) return null;
  const corrected = records.filter(r => r.attempts.length > 1 && !r.attempts[0].correct && r.attempts[r.attempts.length - 1].correct);
  if (corrected.length !== 1) return null;
  const record = corrected[0];
  const questionIndex = bubbleSortCodeCheckContent.questions.findIndex(q => q.id === record.questionId);
  const question = bubbleSortCodeCheckContent.questions[questionIndex];
  if (!question) return null;
  const labelOf = (answer: typeof record.attempts[number]["answer"]) =>
    answer.kind === "choice" ? question.choices.find(c => c.id === answer.choiceId)?.text ?? null : null;
  const firstLabel = labelOf(record.attempts[0].answer);
  const lastLabel = labelOf(record.attempts[record.attempts.length - 1].answer);
  if (!firstLabel || !lastLabel) return null;
  const line = bubbleSortCode.lines.find(l => l.id === question.lineId);
  if (!line) return null;
  return <CodeBlankScene position={questionIndex + 1} prompt={question.prompt}
    lineId={question.lineId} blankStart={question.blank.start} blankLength={question.blank.length}
    firstLabel={firstLabel} lastLabel={lastLabel} />;
}

function CodeBlankScene({ position, prompt, lineId, blankStart, blankLength, firstLabel, lastLabel }: {
  position: number; prompt: string; lineId: string;
  blankStart: number; blankLength: number;
  firstLabel: string; lastLabel: string;
}) {
  const reduce = useReducedMotion();
  return <Box sx={{ mt: 2, pt: 2, borderTop: "1px solid #dbe3ef" }}>
    <Typography sx={{ fontSize: 14, fontWeight: 800, mb: 1.5 }}>あの場面（{position}問目）</Typography>
    <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
      <Box sx={{
        flexShrink: 0, border: "1px solid #dbe3ef", borderRadius: 2, overflow: "hidden",
        bgcolor: "#fbfcfe", px: 2, py: 1.5,
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 15, lineHeight: 1.9,
      }}>
        {bubbleSortCode.lines.map(line => {
          const isTarget = line.id === lineId;
          if (!isTarget) return <Box key={line.id} component="div" sx={{ whiteSpace: "pre", color: "#111827" }}>{line.text}</Box>;
          const prefix = line.text.slice(0, blankStart);
          const suffix = line.text.slice(blankStart + blankLength);
          return <Box key={line.id} component="div" sx={{
            whiteSpace: "pre", color: "#111827", mx: -1, px: 1, borderRadius: 1,
            bgcolor: "rgba(37, 99, 235, 0.08)", boxShadow: "inset 0 0 0 1.5px rgba(37, 99, 235, 0.45)",
          }}>
            {prefix}
            <Box component="span" sx={{ display: "inline-grid", verticalAlign: "baseline" }}>
              {reduce
                ? <BlankChip text={lastLabel} ok />
                : <>
                    <motion.span initial={{ opacity: 1 }} animate={{ opacity: [1, 1, 0] }}
                      transition={{ duration: 2.0, times: [0, 0.55, 0.7], delay: 0.5 }} style={{ gridArea: "1 / 1" }}>
                      <BlankChip text={firstLabel} ok={false} />
                    </motion.span>
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: [0, 0, 1] }}
                      transition={{ duration: 2.0, times: [0, 0.55, 0.7], delay: 0.5 }} style={{ gridArea: "1 / 1" }}>
                      <BlankChip text={lastLabel} ok />
                    </motion.span>
                  </>}
            </Box>
            {suffix}
          </Box>;
        })}
      </Box>
      <Stack spacing={1.25} sx={{ flex: 1, minWidth: 220, justifyContent: "center" }}>
        <Typography sx={{ fontSize: 16, fontWeight: 700, lineHeight: 1.6 }}>{prompt}</Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box sx={{ border: "1.5px solid #64748b", borderRadius: 999, px: 1, py: 0.25, fontSize: 14, fontWeight: 700, flexShrink: 0 }}>最初</Box>
          <Typography sx={{ fontSize: 16 }}>{firstLabel}</Typography>
          <CloseIcon sx={{ fontSize: 19, color: "#64748b" }} />
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box sx={{ border: "1.5px solid #16a34a", borderRadius: 999, px: 1, py: 0.25, fontSize: 14, fontWeight: 700, flexShrink: 0 }}>見直して</Box>
          <Typography sx={{ fontSize: 16 }}>{lastLabel}</Typography>
          <CheckCircleIcon sx={{ fontSize: 19, color: "#16a34a" }} />
        </Box>
      </Stack>
    </Box>
  </Box>;
}

function BlankChip({ text, ok }: { text: string; ok: boolean }) {
  return <Box component="span" sx={{
    display: "inline-flex", alignItems: "center", gap: 0.5, px: 0.75, borderRadius: 1,
    border: `1.5px solid ${ok ? "#16a34a" : "#64748b"}`, bgcolor: "#fff",
    fontFamily: "inherit", fontSize: 15, fontWeight: 700, lineHeight: 1.5, whiteSpace: "nowrap",
  }}>
    {text}
    {ok
      ? <CheckCircleIcon sx={{ fontSize: 16, color: "#16a34a" }} />
      : <CloseIcon sx={{ fontSize: 16, color: "#64748b" }} />}
  </Box>;
}
