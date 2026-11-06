"use client";

import { Box, Button, Typography } from "@mui/material";
import { useEffect, useRef, useState } from "react";

import { activeQuestion, answerQuestion, assessmentComplete, createAssessmentState, type NodeAnswer } from "../../assessment/assessment";
import { useAssessmentObservation } from "../../instrumentation/useAssessmentObservation";
import type { LearningInstrumentation } from "../../instrumentation/useLearningVisit";

import { playerTokens } from "../../player/player.tokens";
import { LearningReviewDialog } from "../../review/LearningReviewDialog";
import { getLearningStep } from "../../review/reviewContent";
import { BfsExecutionCanvas } from "../execution/BfsExecutionCanvas";
import { bfsExecutionContent } from "../execution/execution.content";
import type { BfsUnitPhaseSummary } from "../unit/unit.types";
import { BfsCheckCanvas } from "./BfsCheckCanvas";
import { bfsCheckContent } from "./check.content";

/** embedded / onComplete は単元フロー（#77）からの埋め込み用。未指定なら単品ページとして従来どおり動く。 */
export function BfsCheckPreview({ embedded = false, onLearningEvent, active = true, onComplete }: LearningInstrumentation & { embedded?: boolean; onComplete?: (summary: BfsUnitPhaseSummary) => void }) {
  const [session, setSession] = useState(() => createAssessmentState(bfsCheckContent));
  const [reviewOpen, setReviewOpen] = useState(false);
  const captionRef = useRef<HTMLParagraphElement>(null);
  const completedRef = useRef(false);
  const question = activeQuestion(bfsCheckContent, session);
  const complete = assessmentComplete(bfsCheckContent, session);
  useAssessmentObservation(bfsCheckContent, session, onLearningEvent, active, reviewOpen ? question?.id : undefined);
  const record = session.records.find(record => record.questionId === question?.id);
  const retry = record?.attempts.at(-1)?.correct === false;
  const caption = complete ? bfsCheckContent.completion.caption : `${retry ? "もう一度、" : ""}${question?.prompt ?? ""}`;
  const step = getLearningStep(bfsExecutionContent, question?.stepId ?? bfsCheckContent.completion.stepId);
  const submit = (answer: NodeAnswer) => {
    if (question) setSession(current => answerQuestion(bfsCheckContent, current, question.id, answer));
  };
  useEffect(() => { captionRef.current?.focus(); }, [question?.id, complete, record?.attemptCount]);
  // 完了した瞬間だけ単元フローへ通知する（解き直して再完了した場合も再通知する）。
  useEffect(() => {
    if (complete && !completedRef.current) {
      completedRef.current = true;
      onComplete?.({
        firstAttemptCorrect: session.records.filter(entry => entry.attempts[0]?.correct).length,
        totalQuestions: bfsCheckContent.questions.length,
      });
    }
    if (!complete) completedRef.current = false;
  }, [complete, onComplete, session.records]);

  return <Box component={embedded ? "div" : "main"} sx={{ minHeight: embedded ? 0 : "100dvh", height: embedded ? "100%" : undefined, minWidth: 0, width: "100%", display: "grid", gridTemplateColumns: "minmax(0, 1fr)", placeItems: "center", bgcolor: playerTokens.background, color: playerTokens.text }}>
    <Box component="section" aria-label="BFSの理解度確認" sx={{ width: embedded ? "100%" : { xs: "100%", sm: "84vw" }, maxWidth: "100%", minWidth: 0, height: embedded ? "100%" : "84dvh", minHeight: embedded ? 0 : 500, p: 1, boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
      <Typography ref={captionRef} component="p" tabIndex={-1} aria-live="polite" aria-atomic="true" sx={{
        color: playerTokens.text, fontWeight: 700, textAlign: "center", fontSize: "clamp(18px, 1.5vw, 30px)",
        minHeight: "3em", flexShrink: 0, display: "grid", alignItems: "center", mb: 1, outline: "none",
      }}>{caption}</Typography>
      {question && <Typography component="p" sx={{ textAlign: "center", fontSize: 15, flexShrink: 0, mb: 1 }}>
        図の丸いボタン{question.allowNone ? "、または「どれも入らない」" : ""}をタップして答えよう
      </Typography>}
      <BfsCheckCanvas canvas={step.canvas} questionId={question?.id} nodeIds={question?.nodeIds}
        allowNone={question?.allowNone} onAnswer={submit} />
      <Box sx={{ minHeight: 44, mt: 1, flexShrink: 0, display: "flex", flexWrap: "wrap", gap: 1, justifyContent: "center", alignItems: "center" }}>
        {retry && <Button variant="outlined" onClick={() => setReviewOpen(true)}
          sx={{ color: playerTokens.text, borderColor: playerTokens.control }}>該当ステップの動きを確認する</Button>}
        {embedded && complete && <Button variant="outlined" onClick={() => setSession(createAssessmentState(bfsCheckContent))}
          sx={{ color: playerTokens.text, borderColor: playerTokens.control, minHeight: 44 }}>もう一度解く</Button>}
      </Box>
    </Box>
    {reviewOpen && question && <LearningReviewDialog onLearningEvent={onLearningEvent} active={active} content={bfsExecutionContent} stepIds={question.reviewStepIds}
      renderCanvas={canvas => <BfsExecutionCanvas canvas={canvas} />} onClose={() => setReviewOpen(false)} />}
  </Box>;
}
