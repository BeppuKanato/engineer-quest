"use client";
import { assessmentEvidence } from "../../assessment/assessment";

import { Box, Button, Typography } from "@mui/material";
import { useEffect, useRef, useState } from "react";

import {
  activeQuestion, advanceAssessment, answerQuestion, assessmentComplete, createAssessmentState,
  diagnoseAssessment, type AssessmentAnswer,
} from "../../assessment/assessment";
import { AnswerFeedbackNotice, useAssessmentFeedback } from "../../assessment/AnswerFeedback";
import { ParsonsBoard, parsonsQuestionBodySx } from "../../bfs/consolidation/ParsonsBoard";
import { useAssessmentObservation } from "../../instrumentation/useAssessmentObservation";
import type { LearningInstrumentation } from "../../instrumentation/useLearningVisit";
import { playerTokens } from "../../player/player.tokens";
import { DiagnosisResult } from "../../app/DiagnosisResult";
import { PhaseNextButton } from "../../app/PhaseNextButton";
import { AssessmentReviewButton } from "../../review/AssessmentReviewButton";
import { LearningReviewDialog } from "../../review/LearningReviewDialog";
import { BinarySearchCodeMappingCanvas } from "../code-mapping/BinarySearchCodeMappingCanvas";
import { binarySearchCodeMappingContent } from "../code-mapping/codeMapping.content";
import { BinarySearchConsolidationCanvas } from "./BinarySearchConsolidationCanvas";
import { binarySearchConsolidationContent as content } from "./consolidation.content";
import type { BinarySearchConsolidationQuestion, BinarySearchConsolidationSummary } from "./consolidation.types";

/** embedded / onComplete / onNext は単元フロー接続（後続Issue）からの埋め込み用。未指定なら単品ページとして従来どおり動く。
 * このフェーズのリザルトは診断画面そのものなので、完了通知とは別に、診断画面から次へ進む導線（onNext）を足す。 */
export function BinarySearchConsolidationPreview({ embedded = false, onLearningEvent, active = true, onComplete, onNext, nextLabel }: LearningInstrumentation & {
  embedded?: boolean;
  onComplete?: (summary: BinarySearchConsolidationSummary) => void;
  onNext?: () => void;
  nextLabel?: string;
}) {
  const [session, setSession] = useState(() => createAssessmentState(content));
  const [review, setReview] = useState<BinarySearchConsolidationQuestion | null>(null);
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
    if (!question) return;
    // 正解済みの設問には、古い画面の連打でも試行を足さない（入力ロックと対にする）。
    setSession(current => current.records.find(entry => entry.questionId === question.id)?.solved
      ? current : answerQuestion(content, current, question.id, answer));
  };
  useEffect(() => {
    captionRef.current?.focus({ preventScroll: question?.kind === "parsons" && (record?.attemptCount ?? 0) > 0 });
  }, [question?.id, question?.kind, complete, record?.attemptCount]);
  // 診断が出た瞬間だけ単元フローへ通知する。
  useEffect(() => {
    if (diagnosis && !completedRef.current) {
      completedRef.current = true;
      onComplete?.({ assessmentEvidence: assessmentEvidence(content, session), firstAttemptCorrect: diagnosis.correct, totalQuestions: diagnosis.total });
    }
    if (!diagnosis) completedRef.current = false;
  }, [diagnosis, onComplete, session]);

  return <Box component={embedded ? "div" : "main"} sx={{ minHeight: embedded ? 0 : "100dvh", height: embedded ? "100%" : undefined, display: "grid", placeItems: "center", bgcolor: playerTokens.background, color: playerTokens.text }}>
    {/* 画面は3段組（Issue #298）: 中央のスクロール領域に問題文・図・指示・選択肢を上から流し、
        再回答の注記と進行ボタンは下部の固定ゾーンに置く。図の高さは設問と viewport だけで決まり、
        テキスト量では変わらない。旧来の marginTop: "auto" による中央寄せ（#327）は廃止した。 */}
    <Box component="section" aria-label={complete ? "応用問題の結果" : "二分探索の応用問題"}
      sx={{ width: embedded ? "100%" : "84vw", height: embedded ? "100%" : "84dvh",
        minHeight: embedded ? 0 : 500, p: 1, display: "flex", flexDirection: "column" }}>
      <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column",
        ...(question?.kind === "parsons" ? parsonsQuestionBodySx : {}) }}>
        <Typography ref={captionRef} component="p" tabIndex={-1} aria-live="polite" aria-atomic="true" sx={{
          color: playerTokens.text, fontWeight: 700, textAlign: "center", fontSize: "clamp(18px, 1.5vw, 30px)",
          minHeight: "3em", flexShrink: 0, display: "grid", alignItems: "center", mb: 1, outline: "none",
          ...(question?.kind === "parsons" ? { minHeight: 0 } : {}),
        }}>{diagnosis ? "応用問題の結果" : question?.prompt}</Typography>
        {!embedded && <AnswerFeedbackNotice assessmentId={content.id} />}
        {question && <>
          {question.kind !== "parsons" && <Box sx={{ width: "100%", height: "min(54dvh, 600px)", flexShrink: 0, display: "flex" }}>
            {question.kind === "node"
              ? <BinarySearchConsolidationCanvas canvas={question.scene} label={question.prompt} questionId={question.id} cellIds={question.nodeIds}
                  onAnswer={submit} disabled={attempt?.correct === true} />
              : <BinarySearchConsolidationCanvas canvas={question.scene} label={question.prompt} onAnswer={() => {}} />}
          </Box>}
          {question.kind !== "parsons" && <Typography component="p" sx={{ textAlign: "center", fontSize: 16, fontWeight: 700, flexShrink: 0, mt: 1, mb: 1 }}>{question.instruction}</Typography>}
          {question.definitions && <Typography component="p" sx={{ textAlign: "center", fontSize: 15, fontWeight: 700, flexShrink: 0, mb: 1 }}>{question.definitions}</Typography>}
          {question.kind === "choice" && <Box role="group" aria-label="解答の選択肢" sx={{ display: "flex", flexShrink: 0, flexWrap: "wrap", gap: 1, justifyContent: "center" }}>
            {question.choices.map(choice => <Button key={choice.id} type="button" disableRipple variant="outlined" data-choice-id={choice.id}
              disabled={attempt?.correct === true}
              onClick={() => submit({ kind: "choice", choiceId: choice.id })} sx={{ border: `2px solid ${playerTokens.focus}`, borderRadius: 999,
                color: playerTokens.text, bgcolor: playerTokens.surface, fontSize: 16, fontWeight: 700, minHeight: 48, px: 2, textTransform: "none",
                "&:hover": { bgcolor: playerTokens.layers.layer0, border: `2px solid ${playerTokens.focus}` } }}>{choice.text}</Button>)}
          </Box>}
          {question.kind === "parsons" && <ParsonsBoard key={question.id} question={question} code={content.code} onAnswer={submit} scrollable disabled={attempt?.correct === true}
            instruction={question.instruction} attemptActions={attempt && {
              correct: attempt.correct, message: attempt.correct ? question.correctFeedback : question.incorrectFeedback,
              advanceLabel: session.position === content.questions.length - 1 ? "結果を見る" : "次の問題へ",
              onReview: () => setReview(question),
              onAdvance: () => setSession(current => advanceAssessment(content, current, question.id)),
            }}
            orderFeedback={{ solutionLineIds: question.correctAnswer.lineIds, interchangeableLineGroups: question.interchangeableLineGroups, active: (record?.attemptCount ?? 0) > 0, submittedLineIds: attempt?.answer.kind === "order" ? attempt.answer.lineIds : undefined }} />}
        </>}
        {diagnosis && <DiagnosisResult diagnosis={diagnosis} reviewLabel={content.reviewLabel} completion={content.completion}
          onReviewTag={tag => setReview(content.questions.find(question => question.tags.includes(tag))!)} />}
      </Box>
      {question && question.kind !== "parsons" && attempt && <Box sx={{ flexShrink: 0, borderTop: `1px solid ${playerTokens.layers.layer1}`, mt: 1 }}>
        {!attempt.correct && <Typography component="p" sx={{ textAlign: "center", mt: 1, flexShrink: 0 }}>再回答するか、正解していなくても次へ進めます。結果には初回の回答を使います。</Typography>}
        <Box sx={{ mt: 1, flexShrink: 0, display: "flex", flexWrap: "wrap", gap: 1, justifyContent: "center" }}>
          {!attempt.correct && <AssessmentReviewButton onClick={() => setReview(question)} label={content.reviewLabel} />}
          <Button variant="contained" onClick={() => setSession(current => advanceAssessment(content, current, question.id))}
            sx={{ minHeight: 48, px: 3, fontSize: 16, fontWeight: 700, bgcolor: playerTokens.focus, color: playerTokens.surface,
              "&:hover": { bgcolor: playerTokens.states.processing.stroke } }}>{session.position === content.questions.length - 1 ? "結果を見る" : "次の問題へ"}</Button>
        </Box>
      </Box>}
      {diagnosis && onNext && <Box sx={{ flexShrink: 0, borderTop: `1px solid ${playerTokens.layers.layer1}`, mt: 1, pt: 1, display: "flex", justifyContent: "center" }}>
        <PhaseNextButton label={nextLabel ?? "次へ進む"} onClick={onNext} />
      </Box>}
    </Box>
    {review && <LearningReviewDialog onLearningEvent={onLearningEvent} active={active} content={binarySearchCodeMappingContent} stepIds={review.reviewStepIds}
      renderCanvas={canvas => <BinarySearchCodeMappingCanvas canvas={canvas} />} onClose={() => setReview(null)} />}
  </Box>;
}
