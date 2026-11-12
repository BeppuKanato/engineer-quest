"use client";
import { useAssessmentCompletion } from "../../assessment/useAssessmentCompletion";
import { assessmentEvidence } from "../../assessment/assessment";

import { Box, Button, Typography } from "@mui/material";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import {
  activeQuestion, advanceAssessment, answerQuestion, assessmentComplete, createAssessmentState,
  diagnoseAssessment, type AssessmentAnswer,
} from "../../assessment/assessment";
import { AnswerFeedbackNotice, useAssessmentFeedback } from "../../assessment/AnswerFeedback";
import { LearningContentLayout } from "../../components/layouts/LearningContentLayout";
import { AssessmentLayout } from "../../components/layouts/AssessmentLayout";
import { ParsonsBoard, parsonsQuestionBodySx } from "../../components/assessment/ParsonsBoard";
import { useAssessmentObservation } from "../../instrumentation/useAssessmentObservation";
import type { LearningInstrumentation } from "../../instrumentation/useLearningVisit";
import { playerTokens } from "../../player/player.tokens";
import { PhaseNextButton } from "../../app/PhaseNextButton";
import { ResultConfetti } from "../../app/ResultConfetti";
import { ResultTagRow } from "../../app/ResultTagRow";
import { AssessmentReviewButton } from "../../review/AssessmentReviewButton";
import { LearningReviewDialog } from "../../review/LearningReviewDialog";
import { GreedyCoinsCheckCanvas } from "../check/GreedyCoinsCheckCanvas";
import { GreedyCoinsCodeMappingCanvas } from "../code-mapping/GreedyCoinsCodeMappingCanvas";
import { greedyCoinsCodeMappingContent } from "../code-mapping/codeMapping.content";
import { greedyCoinsConsolidationContent as content } from "./consolidation.content";
import type { GreedyCoinsConsolidationParsonsQuestion, GreedyCoinsConsolidationQuestion, GreedyCoinsConsolidationSummary } from "./consolidation.types";

/** 結果のスコア表示（二分探索フェーズ6と同じ）。 */
function DiagnosisScore({ correct, total }: { correct: number; total: number }) {
  const reduced = useReducedMotion();
  const progress = useMotionValue(reduced ? 1 : 0);
  const count = useTransform(progress, value => Math.round(value * correct));
  const width = useTransform(progress, value => `${total > 0 ? (value * correct / total) * 100 : 0}%`);
  useEffect(() => {
    if (reduced) { progress.set(1); return; }
    const controls = animate(progress, 1, { duration: 0.9, delay: 0.25, ease: "easeOut" });
    return () => controls.stop();
  }, [progress, reduced]);
  return <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, mt: 1 }}>
    <Typography component="p" sx={{ fontSize: 15 }}>初回正解</Typography>
    <Typography component="p" sx={{ fontSize: 44, fontWeight: 800, lineHeight: 1, color: playerTokens.focus }}>
      <motion.span>{count}</motion.span> / {total}<Typography component="span" sx={{ fontSize: 20, fontWeight: 700 }}> 問</Typography>
    </Typography>
    <Box aria-hidden sx={{ width: "min(420px, 80%)", height: 10, borderRadius: 999, overflow: "hidden", bgcolor: playerTokens.states.completed.fill }}>
      <Box component={motion.div} style={{ width }} sx={{ height: "100%", bgcolor: playerTokens.focus }} />
    </Box>
  </Box>;
}

const isParsons = (question: GreedyCoinsConsolidationQuestion): question is GreedyCoinsConsolidationParsonsQuestion => "kind" in question && question.kind === "parsons";
const isChoice = (question: GreedyCoinsConsolidationQuestion): question is Extract<GreedyCoinsConsolidationQuestion, { kind: "choice" }> => "kind" in question && question.kind === "choice";

/** embedded / onComplete / onNext は単元フロー接続（後続Issue）からの埋め込み用。未指定なら単品ページとして従来どおり動く。 */
export function GreedyCoinsConsolidationPreview({ embedded = false, onLearningEvent, active = true, onComplete, onNext, nextLabel }: LearningInstrumentation & {
  embedded?: boolean;
  onComplete?: (summary: GreedyCoinsConsolidationSummary) => void;
  onNext?: () => void;
  nextLabel?: string;
}) {
  const [session, setSession] = useState(() => createAssessmentState(content));
  const [review, setReview] = useState<GreedyCoinsConsolidationQuestion | null>(null);
  const captionRef = useRef<HTMLParagraphElement>(null);

  const question = activeQuestion(content, session);
  const complete = assessmentComplete(content, session);
  useAssessmentObservation(content, session, onLearningEvent, active, review?.id);
  useAssessmentFeedback(content, session, active && !review);
  const record = session.records.find(record => record.questionId === question?.id);
  const attempt = record?.attempts.at(-1);
  const diagnosis = complete ? diagnoseAssessment(content, session) : null;
  const submit = (answer: AssessmentAnswer) => {
    if (!question) return;
    setSession(current => current.records.find(entry => entry.questionId === question.id)?.solved
      ? current : answerQuestion(content, current, question.id, answer));
  };
  useEffect(() => {
    captionRef.current?.focus({ preventScroll: question !== null && isParsons(question) && (record?.attemptCount ?? 0) > 0 });
  }, [question, complete, record?.attemptCount]);
  useAssessmentCompletion(diagnosis !== null, diagnosis?.correct ?? 0, diagnosis?.total ?? 0, onComplete, assessmentEvidence(content, session));

  return <LearningContentLayout embedded={embedded} presentation={question && isParsons(question) ? "code-order" : "visual"} label={complete ? "応用問題の結果" : "貪欲法の応用問題"}
    overlay={review && <LearningReviewDialog onLearningEvent={onLearningEvent} active={active} content={greedyCoinsCodeMappingContent} stepIds={review.reviewStepIds}
      renderCanvas={canvas => <GreedyCoinsCodeMappingCanvas canvas={canvas} />} onClose={() => setReview(null)} />}>
    <AssessmentLayout bodySx={question && isParsons(question) ? { ...parsonsQuestionBodySx, overflowY: "hidden", "@media (max-height: 640px), (max-width: 799.95px)": { overflowY: "auto" } } : undefined}
      footer={<>
      {question && !isParsons(question) && attempt && <Box sx={{ flexShrink: 0, borderTop: `1px solid ${playerTokens.layers.layer1}`, mt: 1 }}>
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
      </>}>
        <Typography ref={captionRef} component="p" tabIndex={-1} aria-live="polite" aria-atomic="true" sx={{
          color: playerTokens.text, fontWeight: 700, textAlign: "center", fontSize: "clamp(18px, 1.5vw, 30px)",
          minHeight: "3em", flexShrink: 0, display: "grid", alignItems: "center", mb: 1, outline: "none",
          ...(question && isParsons(question) ? { minHeight: 0 } : {}),
        }}>{diagnosis ? "応用問題の結果" : question?.prompt}</Typography>
        {!embedded && <AnswerFeedbackNotice assessmentId={content.id} />}
        {question && <>
          {!isParsons(question) && "scene" in question && <Box sx={{ width: "100%", height: "min(54dvh, 600px)", flexShrink: 0, display: "flex" }}>
            {!isChoice(question)
              ? <GreedyCoinsCheckCanvas canvas={question.scene} questionId={question.id} cellIds={question.nodeIds}
                  onAnswer={submit} disabled={attempt?.correct === true} />
              : <GreedyCoinsCheckCanvas canvas={question.scene} onAnswer={() => {}} />}
          </Box>}
          {!isParsons(question) && <Typography component="p" sx={{ textAlign: "center", fontSize: 16, fontWeight: 700, flexShrink: 0, mt: 1, mb: 1 }}>{question.instruction}</Typography>}
          {question.definitions && <Typography component="p" sx={{ textAlign: "center", fontSize: 15, fontWeight: 700, flexShrink: 0, mb: 1 }}>{question.definitions}</Typography>}
          {isChoice(question) && <Box role="group" aria-label="解答の選択肢" sx={{ display: "flex", flexShrink: 0, flexWrap: "wrap", gap: 1, justifyContent: "center" }}>
            {question.choices.map(choice => <Button key={choice.id} type="button" disableRipple variant="outlined" data-choice-id={choice.id}
              disabled={attempt?.correct === true}
              onClick={() => submit({ kind: "choice", choiceId: choice.id })} sx={{ border: `2px solid ${playerTokens.focus}`, borderRadius: 999,
                color: playerTokens.text, bgcolor: playerTokens.surface, fontSize: 16, fontWeight: 700, minHeight: 48, px: 2, textTransform: "none",
                "&:hover": { bgcolor: playerTokens.layers.layer0, border: `2px solid ${playerTokens.focus}` } }}>{choice.text}</Button>)}
          </Box>}
          {isParsons(question) && <ParsonsBoard key={question.id} question={question} code={content.code} onAnswer={submit} scrollable fillAvailableSpace disabled={attempt?.correct === true}
            instruction={question.instruction} attemptActions={attempt && {
              correct: attempt.correct, message: attempt.correct ? question.correctFeedback : question.incorrectFeedback,
              advanceLabel: session.position === content.questions.length - 1 ? "結果を見る" : "次の問題へ",
              onReview: () => setReview(question),
              onAdvance: () => setSession(current => advanceAssessment(content, current, question.id)),
            }}
            orderFeedback={{ solutionLineIds: question.correctAnswer.lineIds, interchangeableLineGroups: question.interchangeableLineGroups, active: (record?.attemptCount ?? 0) > 0, submittedLineIds: attempt?.answer.kind === "order" ? attempt.answer.lineIds : undefined }} />}
        </>}
        {diagnosis && <>
          <ResultConfetti />
          <DiagnosisScore correct={diagnosis.correct} total={diagnosis.total} />
          <Box component="ul" aria-label="論点ごとの結果" sx={{ listStyle: "none", m: 0, p: 0, display: "grid", gap: 1, width: "100%", maxWidth: 720, mx: "auto", mt: 2 }}>
            {diagnosis.tags.map((result, index) => <ResultTagRow key={result.tag} dataTag={result.tag} label={result.tag} index={index}
              passed={result.passed} correct={result.correct} total={result.total}
              reviewAction={!result.passed ? <AssessmentReviewButton ariaLabel={`${result.tag}を復習する`}
                onClick={() => setReview(content.questions.find(q => q.tags.includes(result.tag))!)} label={content.reviewLabel} /> : undefined} />)}
          </Box>
          <Typography component="p" sx={{ textAlign: "center", fontWeight: 700 }}>{content.completion}</Typography>
        </>}

    </AssessmentLayout>
  </LearningContentLayout>;
}
