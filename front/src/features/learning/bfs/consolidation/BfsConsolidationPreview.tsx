"use client";

import { Box, Button, Typography } from "@mui/material";
import { useEffect, useRef, useState } from "react";

import { activeQuestion, advanceAssessment, answerQuestion, assessmentComplete, createAssessmentState, diagnoseAssessment, type AssessmentAnswer } from "../../assessment/assessment";
import { AnswerFeedbackNotice, useAssessmentFeedback } from "../../assessment/AnswerFeedback";
import { useAssessmentObservation } from "../../instrumentation/useAssessmentObservation";
import type { LearningInstrumentation } from "../../instrumentation/useLearningVisit";

import { playerTokens } from "../../player/player.tokens";
import { LearningReviewDialog } from "../../review/LearningReviewDialog";
import { PhaseNextButton } from "../../app/PhaseNextButton";
import { AssessmentReviewButton } from "../../review/AssessmentReviewButton";
import { BfsCodeMappingCanvas } from "../code-mapping/BfsCodeMappingCanvas";
import { bfsCodeMappingContent } from "../code-mapping/codeMapping.content";
import type { BfsUnitPhaseSummary } from "../unit/unit.types";
import { ConsolidationGraph } from "./ConsolidationGraph";
import { ParsonsBoard } from "./ParsonsBoard";
import { bfsConsolidationContent as content, type ConsolidationQuestion } from "./consolidation.content";

/** embedded / onComplete / onNext は単元フロー（#77）からの埋め込み用。未指定なら単品ページとして従来どおり動く。
 * このフェーズのリザルトは診断画面そのものなので、完了通知とは別に、診断画面から次へ進む導線（onNext）を足す。 */
export function BfsConsolidationPreview({ embedded = false, onLearningEvent, active = true, onComplete, onNext, nextLabel }: LearningInstrumentation & {
  embedded?: boolean;
  onComplete?: (summary: BfsUnitPhaseSummary) => void;
  onNext?: () => void;
  nextLabel?: string;
}) {
  const [session, setSession] = useState(() => createAssessmentState(content));
  const [review, setReview] = useState<ConsolidationQuestion | null>(null);
  const captionRef = useRef<HTMLParagraphElement>(null);
  const completedRef = useRef(false);
  const question = activeQuestion(content, session);
  const complete = assessmentComplete(content, session);
  useAssessmentObservation(content, session, onLearningEvent, active, review?.id);
  useAssessmentFeedback(content, session, active && !review);
  const record = session.records.find(record => record.questionId === question?.id);
  const attempt = record?.attempts.at(-1);
  const diagnosis = complete ? diagnoseAssessment(content, session) : null;
  const submit = (answer: AssessmentAnswer) => {
    if (question) setSession(current => answerQuestion(content, current, question.id, answer));
  };
  useEffect(() => { captionRef.current?.focus(); }, [question?.id, complete, record?.attemptCount]);
  // 診断が出た瞬間だけ単元フローへ通知する。
  useEffect(() => {
    if (diagnosis && !completedRef.current) {
      completedRef.current = true;
      onComplete?.({ firstAttemptCorrect: diagnosis.correct, totalQuestions: diagnosis.total });
    }
    if (!diagnosis) completedRef.current = false;
  }, [diagnosis, onComplete]);

  return <Box component={embedded ? "div" : "main"} sx={{ minHeight: embedded ? 0 : "100dvh", height: embedded ? "100%" : undefined, display: "grid", placeItems: "center", bgcolor: playerTokens.background, color: playerTokens.text }}>
    <Box component="section" aria-label={complete ? "応用問題の診断結果" : "BFSの応用問題"}
      sx={{ width: embedded ? "100%" : "84vw", height: question && question.kind !== "parsons" ? (embedded ? "100%" : "84dvh") : "auto",
        minHeight: question && question.kind !== "parsons" ? (embedded ? 0 : 500) : (embedded ? "100%" : "84dvh"), p: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <Typography ref={captionRef} component="p" tabIndex={-1} aria-live="polite" aria-atomic="true" sx={{
        color: playerTokens.text, fontWeight: 700, textAlign: "center", fontSize: "clamp(18px, 1.5vw, 30px)",
        minHeight: "3em", flexShrink: 0, display: "grid", alignItems: "center", mb: 1, outline: "none",
      }}>{diagnosis ? `初回正解 ${diagnosis.correct}/${diagnosis.total}問` : question?.prompt}</Typography>
      {!embedded && <AnswerFeedbackNotice assessmentId={content.id} />}
      {question && <>
        {question.kind !== "parsons" && <Box sx={{ width: "100%", height: "min(54dvh, 600px)", minHeight: 320, display: "flex", flexShrink: 1 }}>
          <ConsolidationGraph {...question.scene} onSelect={question.kind === "node" ? id => submit({ kind: "node", nodeId: id }) : undefined} />
        </Box>}
        <Typography component="p" sx={{ textAlign: "center", fontSize: 16, fontWeight: 700, flexShrink: 0, mt: 1, mb: 1 }}>{question.instruction}</Typography>
        {question.kind === "choice" && <Box role="group" aria-label="解答の選択肢" sx={{ display: "flex", flexShrink: 0, flexWrap: "wrap", gap: 1, justifyContent: "center" }}>
          {question.choices.map(choice => <Button key={choice.id} type="button" disableRipple variant="outlined" data-choice-id={choice.id}
            onClick={() => submit({ kind: "choice", choiceId: choice.id })} sx={{ border: `2px solid ${playerTokens.focus}`, borderRadius: 999,
              color: playerTokens.text, bgcolor: playerTokens.surface, fontSize: 16, fontWeight: 700, minHeight: 48, px: 2, textTransform: "none",
              "&:hover": { bgcolor: playerTokens.layers.layer0, border: `2px solid ${playerTokens.focus}` } }}>{choice.text}</Button>)}
        </Box>}
        {question.kind === "parsons" && <ParsonsBoard key={question.id} question={question} code={content.code} onAnswer={submit} />}
        {attempt && <>
          <Typography component="p" sx={{ textAlign: "center", mt: 1 }}>再回答するか、正解していなくても次へ進めます。診断には初回の回答を使います。</Typography>
          <Box sx={{ mt: 1, display: "flex", flexWrap: "wrap", gap: 1, justifyContent: "center" }}>
            {!attempt.correct && <AssessmentReviewButton onClick={() => setReview(question)} label={content.reviewLabel} />}
            <Button variant="contained" onClick={() => setSession(current => advanceAssessment(content, current, question.id))}
              sx={{ minHeight: 48, px: 3, fontSize: 16, fontWeight: 700, bgcolor: playerTokens.focus, color: playerTokens.surface,
                "&:hover": { bgcolor: playerTokens.states.processing.stroke } }}>{session.position === content.questions.length - 1 ? "診断結果を見る" : "次の問題へ"}</Button>
          </Box>
        </>}
      </>}
      {diagnosis && <>
        <Box component="ul" aria-label="論点タグごとの初回結果" sx={{ pl: 3 }}>
          {diagnosis.tags.map(result => <Box component="li" key={result.tag} data-diagnostic-tag={result.tag} sx={{ mb: 2 }}>
            <Typography component="p">{result.tag}：{result.passed ? "初回正解" : "初回不正解"}</Typography>
            {!result.passed && <AssessmentReviewButton ariaLabel={`${result.tag}を復習する`}
              onClick={() => setReview(content.questions.find(question => question.tags.includes(result.tag))!)} label={content.reviewLabel} />}
          </Box>)}
        </Box>
        <Typography component="p" sx={{ textAlign: "center", fontWeight: 700 }}>{content.completion}</Typography>
        {onNext && <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
          <PhaseNextButton label={nextLabel ?? "次へ進む"} onClick={onNext} />
        </Box>}
      </>}
    </Box>
    {review && <LearningReviewDialog onLearningEvent={onLearningEvent} active={active} content={bfsCodeMappingContent} stepIds={review.reviewStepIds}
      renderCanvas={canvas => <BfsCodeMappingCanvas canvas={canvas} />} onClose={() => setReview(null)} />}
  </Box>;
}
