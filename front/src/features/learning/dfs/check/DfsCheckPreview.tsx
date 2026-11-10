"use client";

import { Box, Button, Typography } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { activeQuestion, advanceAssessment, answerQuestion, assessmentComplete, createAssessmentState, type NodeAnswer } from "../../assessment/assessment";
import { AnswerFeedbackNotice, useAssessmentFeedback } from "../../assessment/AnswerFeedback";
import { useAssessmentCompletion } from "../../assessment/useAssessmentCompletion";
import type { LearningInstrumentation } from "../../instrumentation/useLearningVisit";
import type { UnitPhaseSummary } from "../../unit/unit.types";
import { playerTokens } from "../../player/player.tokens";
import { AssessmentReviewButton } from "../../review/AssessmentReviewButton";
import { LearningReviewDialog } from "../../review/LearningReviewDialog";
import { getLearningStep } from "../../review/reviewContent";
import { DfsExecutionCanvas } from "../execution/DfsExecutionCanvas";
import { dfsExecutionContent } from "../execution/execution.content";
import { DfsCheckCanvas } from "./DfsCheckCanvas";
import { dfsCheckContent } from "./check.content";

export function DfsCheckPreview({ embedded = false, active = true, onLearningEvent, onComplete }: LearningInstrumentation & {
  embedded?: boolean; onComplete?: (summary: UnitPhaseSummary) => void;
} = {}) {
  const [session, setSession] = useState(() => createAssessmentState(dfsCheckContent));
  const [reviewOpen, setReviewOpen] = useState(false);
  const captionRef = useRef<HTMLParagraphElement>(null);
  const question = activeQuestion(dfsCheckContent, session);
  const complete = assessmentComplete(dfsCheckContent, session);
  const record = session.records.find(record => record.questionId === question?.id);
  const attempt = record?.attempts.at(-1);
  const retry = attempt?.correct === false;
  useAssessmentFeedback(dfsCheckContent, session, active && !reviewOpen);
  const firstCorrect = session.records.filter(record => record.firstCorrect === true).length;
  useAssessmentCompletion(complete, firstCorrect, dfsCheckContent.questions.length, onComplete);
  const caption = complete ? `初回の正解は2問中${firstCorrect}問でした。` : `${retry ? "もう一度、" : ""}${question?.prompt ?? ""}`;
  const step = getLearningStep(dfsExecutionContent, question?.stepId ?? dfsCheckContent.completion.stepId);
  const submit = (answer: NodeAnswer) => {
    if (!question) return;
    setSession(current => current.records.find(record => record.questionId === question.id)?.solved
      ? current : answerQuestion(dfsCheckContent, current, question.id, answer));
  };
  useEffect(() => { captionRef.current?.focus(); }, [question?.id, complete, record?.attemptCount]);
  return <Box component={embedded ? "div" : "main"} aria-label={dfsCheckContent.stageName}
    sx={{ minHeight: embedded ? 0 : "100dvh", height: embedded ? "100%" : undefined, minWidth: 0, display: "grid", placeItems: "center", bgcolor: playerTokens.background, color: playerTokens.text }}>
    <Box component="section" aria-label="DFSの動きの確認問題"
      sx={{ width: embedded ? "100%" : { xs: "100%", sm: "84vw" }, maxWidth: "100%", minWidth: 0, height: embedded ? "100%" : "84dvh", minHeight: embedded ? 0 : 500,
        p: 1, boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
      <Typography ref={captionRef} component="p" tabIndex={-1} aria-live="polite" aria-atomic="true"
        sx={{ color: playerTokens.text, fontWeight: 700, textAlign: "center", fontSize: "clamp(18px, 1.5vw, 30px)",
          minHeight: "3em", flexShrink: 0, display: "grid", alignItems: "center", mb: 1, outline: "none" }}>{caption}</Typography>
      {!embedded && <AnswerFeedbackNotice assessmentId={dfsCheckContent.id} />}
      {question && <Typography component="p" sx={{ textAlign: "center", fontSize: 15, flexShrink: 0, mb: 1 }}>
        図の丸いボタンをタップして答えよう
      </Typography>}
      <DfsCheckCanvas canvas={step.canvas} questionId={question?.id} nodeIds={question?.nodeIds}
        onAnswer={submit} disabled={attempt?.correct === true} />
      {retry && <Typography component="p" sx={{ textAlign: "center", mt: 1, flexShrink: 0 }}>
        再回答するか、正解していなくても次へ進めます。結果には初回の回答を使います。
      </Typography>}
      <Box sx={{ minHeight: 48, mt: 1, flexShrink: 0, display: "flex", flexWrap: "wrap", gap: 1, justifyContent: "center", alignItems: "center" }}>
        {retry && <AssessmentReviewButton onClick={() => setReviewOpen(true)} label="該当ステップの動きを確認する" />}
        {attempt && question && <Button variant="contained" onClick={() => setSession(current => advanceAssessment(dfsCheckContent, current, question.id))}
          sx={{ minHeight: 48, px: 3, fontSize: 16, fontWeight: 700, bgcolor: playerTokens.focus, color: playerTokens.surface,
            "&:hover": { bgcolor: playerTokens.states.processing.stroke } }}>{session.position === 1 ? "結果を見る" : "次の問題へ"}</Button>}
        {complete && <Button variant="outlined" onClick={() => setSession(createAssessmentState(dfsCheckContent))}
          sx={{ color: playerTokens.text, borderColor: playerTokens.control, minHeight: 48 }}>もう一度解く</Button>}
      </Box>
    </Box>
    {active && reviewOpen && question && <LearningReviewDialog content={dfsExecutionContent} stepIds={question.reviewStepIds} onLearningEvent={onLearningEvent}
      renderCanvas={canvas => <DfsExecutionCanvas canvas={canvas} />} onClose={() => setReviewOpen(false)} />}
  </Box>;
}
