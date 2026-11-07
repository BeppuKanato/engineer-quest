"use client";

import { Box, Button, Typography } from "@mui/material";
import { useEffect, useRef, useState } from "react";

import { activeQuestion, advanceAssessment, answerQuestion, assessmentComplete, createAssessmentState, type NodeAnswer } from "../../assessment/assessment";
import { AnswerFeedbackNotice, useAssessmentFeedback } from "../../assessment/AnswerFeedback";
import { useAssessmentObservation } from "../../instrumentation/useAssessmentObservation";
import type { LearningInstrumentation } from "../../instrumentation/useLearningVisit";
import { playerTokens } from "../../player/player.tokens";
import { AssessmentReviewButton } from "../../review/AssessmentReviewButton";
import { LearningReviewDialog } from "../../review/LearningReviewDialog";
import { getLearningStep } from "../../review/reviewContent";
import { MazeDiggingExecutionCanvas } from "../execution/MazeDiggingExecutionCanvas";
import { mazeDiggingExecutionContent } from "../execution/execution.content";
import { getMazeDiggingCheckScene, mazeDiggingCheckContent } from "./check.content";
import type { MazeDiggingCheckSummary } from "./check.types";
import { MazeDiggingCheckCanvas } from "./MazeDiggingCheckCanvas";

/** embedded / onComplete は単元フロー接続（後続Issue）からの埋め込み用。未指定なら単品ページとして従来どおり動く。 */
export function MazeDiggingCheckPreview({ embedded = false, onLearningEvent, active = true, onComplete }: LearningInstrumentation & { embedded?: boolean; onComplete?: (summary: MazeDiggingCheckSummary) => void }) {
  const [session, setSession] = useState(() => createAssessmentState(mazeDiggingCheckContent));
  const [reviewOpen, setReviewOpen] = useState(false);
  const captionRef = useRef<HTMLParagraphElement>(null);
  const completedRef = useRef(false);
  const question = activeQuestion(mazeDiggingCheckContent, session);
  const complete = assessmentComplete(mazeDiggingCheckContent, session);
  useAssessmentObservation(mazeDiggingCheckContent, session, onLearningEvent, active, reviewOpen ? question?.id : undefined);
  useAssessmentFeedback(mazeDiggingCheckContent, session, active && !reviewOpen);
  const record = session.records.find(record => record.questionId === question?.id);
  const retry = record?.attempts.at(-1)?.correct === false;
  const attempt = record?.attempts.at(-1);
  const caption = complete ? mazeDiggingCheckContent.completion.caption : `${retry ? "もう一度、" : ""}${question?.prompt ?? ""}`;
  const completionStep = getLearningStep(mazeDiggingExecutionContent, mazeDiggingCheckContent.completion.stepId);
  const scene = question ? getMazeDiggingCheckScene() : completionStep.canvas;
  const submit = (answer: NodeAnswer) => {
    if (!question) return;
    // 正解済みの設問には、古い画面の連打でも試行を足さない（入力ロックと対にする）。
    setSession(current => current.records.find(entry => entry.questionId === question.id)?.solved
      ? current : answerQuestion(mazeDiggingCheckContent, current, question.id, answer));
  };
  useEffect(() => { captionRef.current?.focus(); }, [question?.id, complete, record?.attemptCount]);
  // 完了した瞬間だけ単元フローへ通知する（解き直して再完了した場合も再通知する）。
  useEffect(() => {
    if (complete && !completedRef.current) {
      completedRef.current = true;
      onComplete?.({
        firstAttemptCorrect: session.records.filter(entry => entry.attempts[0]?.correct).length,
        totalQuestions: mazeDiggingCheckContent.questions.length,
      });
    }
    if (!complete) completedRef.current = false;
  }, [complete, onComplete, session.records]);

  return <Box component={embedded ? "div" : "main"} sx={{ minHeight: embedded ? 0 : "100dvh", height: embedded ? "100%" : undefined, minWidth: 0, width: "100%", display: "grid", gridTemplateColumns: "minmax(0, 1fr)", placeItems: "center", bgcolor: playerTokens.background, color: playerTokens.text }}>
    <Box component="section" aria-label="穴掘り法の動きの確認問題" sx={{ width: embedded ? "100%" : { xs: "100%", sm: "84vw" }, maxWidth: "100%", minWidth: 0, height: embedded ? "100%" : "84dvh", minHeight: embedded ? 0 : 500, p: 1, boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
      <Typography ref={captionRef} component="p" tabIndex={-1} aria-live="polite" aria-atomic="true" sx={{
        color: playerTokens.text, fontWeight: 700, textAlign: "center", fontSize: "clamp(18px, 1.5vw, 30px)",
        minHeight: "3em", flexShrink: 0, display: "grid", alignItems: "center", mb: 1, outline: "none",
      }}>{caption}</Typography>
      {!embedded && <AnswerFeedbackNotice assessmentId={mazeDiggingCheckContent.id} />}
      {question && <Typography component="p" sx={{ textAlign: "center", fontSize: 15, flexShrink: 0, mb: 1 }}>
        盤面のマスをタップして答えよう
      </Typography>}
      <MazeDiggingCheckCanvas canvas={scene} questionId={question?.id} cellIds={question?.nodeIds}
        onAnswer={submit} disabled={attempt?.correct === true} />
      {attempt && !attempt.correct && <Typography component="p" sx={{ textAlign: "center", mt: 1, flexShrink: 0 }}>再回答するか、正解していなくても次へ進めます。結果には初回の回答を使います。</Typography>}
      <Box sx={{ minHeight: 44, mt: 1, flexShrink: 0, display: "flex", flexWrap: "wrap", gap: 1, justifyContent: "center", alignItems: "center" }}>
        {retry && <AssessmentReviewButton onClick={() => setReviewOpen(true)} label="該当ステップの動きを確認する" />}
        {attempt && question && <Button variant="contained" onClick={() => setSession(current => advanceAssessment(mazeDiggingCheckContent, current, question.id))}
          sx={{ minHeight: 48, px: 3, fontSize: 16, fontWeight: 700, bgcolor: playerTokens.focus, color: playerTokens.surface,
            "&:hover": { bgcolor: playerTokens.states.processing.stroke } }}>{session.position === mazeDiggingCheckContent.questions.length - 1 ? "結果を見る" : "次の問題へ"}</Button>}
        {embedded && complete && <Button variant="outlined" onClick={() => setSession(createAssessmentState(mazeDiggingCheckContent))}
          sx={{ color: playerTokens.text, borderColor: playerTokens.control, minHeight: 44 }}>もう一度解く</Button>}
      </Box>
    </Box>
    {reviewOpen && question && <LearningReviewDialog onLearningEvent={onLearningEvent} active={active} content={mazeDiggingExecutionContent} stepIds={question.reviewStepIds}
      renderCanvas={canvas => <MazeDiggingExecutionCanvas canvas={canvas} />} onClose={() => setReviewOpen(false)} />}
  </Box>;
}
