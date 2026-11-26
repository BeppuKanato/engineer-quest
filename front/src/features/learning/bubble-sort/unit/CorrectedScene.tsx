"use client";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";
import { Box, Stack, Typography } from "@mui/material";
import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

import type { AssessmentAnswer } from "../../assessment/assessment";
import { arrayBarsLayout } from "../../player/arrayBarsGeometry";
import { getLearningStep } from "../../review/reviewContent";
import { bubbleSortCheckContent } from "../check/check.content";
import type { BubbleSortCheckQuestion } from "../check/check.types";
import { BubbleSortExecutionCanvas } from "../execution/BubbleSortExecutionCanvas";
import { bubbleSortExecutionContent } from "../execution/execution.content";
import type { BubbleSortUnitPhaseSummary } from "./unit.types";

/**
 * ログと結び付けた「あの場面」（2026-11-24 試作。GPT レビュー #3/#6 の最優先指摘）。
 *
 * 称賛の根拠になった学習行動を、文章ではなく場面そのもので見せる。
 * 材料はすべて記録（完了保存の根拠 evidence）からコードが組み立てる：
 * - 対象の問題：初回は不正解で、最後は正解した問題が「ちょうど1問」だけのときだけ出す。
 *   複数あると、どの問題の話か文章と結び付けられないため出さない（無理に結び付けない）。
 * - 場面の図：その問題の stepId が指すフェーズ2の盤面（復習ダイアログと同じ再利用）。
 * - 最初／見直しての答え：試行の記録にある実際の回答。
 * LLM の文章とは一切照合しない（役割分離：文章の意味には触れず、記録の事実だけを出す）。
 */
export function buildCorrectedScene(summary: BubbleSortUnitPhaseSummary | undefined): ReactNode | null {
  const records = summary?.assessmentEvidence?.records;
  if (!records) return null;
  const corrected = records.filter(r => r.attempts.length > 1 && !r.attempts[0].correct && r.attempts[r.attempts.length - 1].correct);
  if (corrected.length !== 1) return null;
  const record = corrected[0];
  const questionIndex = bubbleSortCheckContent.questions.findIndex(q => q.id === record.questionId);
  const question = bubbleSortCheckContent.questions[questionIndex];
  if (!question) return null;
  const firstLabel = answerLabel(question, record.attempts[0].answer);
  const lastLabel = answerLabel(question, record.attempts[record.attempts.length - 1].answer);
  if (!firstLabel || !lastLabel) return null;
  const step = getLearningStep(bubbleSortExecutionContent, question.stepId);
  // リプレイ（図の上で回答の変化を再現する）は、マスを選ぶ回答どうしの
  // ときだけ。選択肢の回答には図上の位置がないので付けない。
  const firstAnswer = record.attempts[0].answer;
  const lastAnswer = record.attempts[record.attempts.length - 1].answer;
  const replay = firstAnswer.kind === "node" && lastAnswer.kind === "node" && firstAnswer.nodeId !== lastAnswer.nodeId
    ? { first: Number(firstAnswer.nodeId), last: Number(lastAnswer.nodeId) }
    : null;
  return <LogScene position={questionIndex + 1} prompt={question.prompt} canvas={step.canvas} firstLabel={firstLabel} lastLabel={lastLabel} replay={replay} />;
}

function answerLabel(question: BubbleSortCheckQuestion, answer: AssessmentAnswer): string | null {
  if (answer.kind === "node") return `左から${Number(answer.nodeId) + 1}番目のマス`;
  if (answer.kind === "choice" && "choices" in question) return question.choices.find(c => c.id === answer.choiceId)?.text ?? null;
  return null;
}

export function LogScene({ position, prompt, canvas, firstLabel, lastLabel, replay }: {
  position: number; prompt: string;
  canvas: Parameters<typeof BubbleSortExecutionCanvas>[0]["canvas"];
  firstLabel: string; lastLabel: string;
  replay: { first: number; last: number } | null;
}) {
  return <Box sx={{ mt: 2, pt: 2, borderTop: "1px solid #dbe3ef" }}>
    <Typography sx={{ fontSize: 14, fontWeight: 800, mb: 1.5 }}>あの場面（{position}問目）</Typography>
    <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
      <Box sx={{ width: 440, height: 300, flexShrink: 0, border: "1px solid #dbe3ef", borderRadius: 2, overflow: "hidden", position: "relative" }}>
        <BubbleSortExecutionCanvas canvas={canvas} />
        {replay && <SceneReplay values={canvas.state.values} first={replay.first} last={replay.last} />}
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

/**
 * 回答の変化の再現（2026-11-24、GPT レビュー #9 の③）。
 * 最初に選んだマスの上に「✗」の印が出て、正しく選んだマスへ移動して
 * 「✓」に変わる。位置は教材の図と同じ幾何（arrayBarsLayout）から計算する
 * ので、棒の真上に正確に合う。文章とは無関係に、記録の2つの回答だけで描く。
 * 動きを減らす設定では、最初と見直しての印を両方とも静止表示する。
 */
function SceneReplay({ values, first, last }: { values: readonly number[]; first: number; last: number }) {
  const reduce = useReducedMotion();
  const layout = arrayBarsLayout(values);
  const a = layout.bar(first);
  const b = layout.bar(last);
  const ax = a.centerX, ay = a.y - 56, bx = b.centerX, by = b.y - 56;
  const badge = (ok: boolean) => <>
    <circle r={19} fill={ok ? "#16a34a" : "#64748b"} stroke="#fff" strokeWidth={3} />
    {ok
      ? <path d="M -8 0 L -2.5 6.5 L 9 -6" fill="none" stroke="#fff" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
      : <path d="M -6 -6 L 6 6 M 6 -6 L -6 6" stroke="#fff" strokeWidth={3.5} strokeLinecap="round" />}
  </>;
  return <Box component="svg" viewBox="0 0 600 450" preserveAspectRatio="xMidYMid meet" aria-hidden
    sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
    {reduce
      ? <>
          <g transform={`translate(${ax} ${ay})`}>{badge(false)}</g>
          <g transform={`translate(${bx} ${by})`}>{badge(true)}</g>
        </>
      : <motion.g
          initial={{ x: ax, y: ay, opacity: 0 }}
          animate={{ x: [ax, ax, bx], y: [ay, ay, by], opacity: [0, 1, 1] }}
          transition={{ duration: 1.9, times: [0, 0.5, 1], delay: 0.35, ease: "easeInOut" }}>
          <motion.g animate={{ opacity: [1, 1, 0] }} transition={{ duration: 1.9, times: [0, 0.9, 1], delay: 0.35 }}>
            {badge(false)}
          </motion.g>
          <motion.g initial={{ opacity: 0 }} animate={{ opacity: [0, 0, 1] }} transition={{ duration: 1.9, times: [0, 0.9, 1], delay: 0.35 }}>
            {badge(true)}
          </motion.g>
        </motion.g>}
  </Box>;
}
