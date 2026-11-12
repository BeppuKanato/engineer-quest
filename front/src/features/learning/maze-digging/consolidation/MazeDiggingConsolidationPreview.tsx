"use client";
import { AssessmentLayout } from "../../components/layouts/AssessmentLayout";
import { useAssessmentCompletion } from "../../assessment/useAssessmentCompletion";
import { LearningContentLayout } from "../../components/layouts/LearningContentLayout";
import { assessmentEvidence } from "../../assessment/assessment";

import { Box, Button, Typography } from "@mui/material";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import {
  activeQuestion, advanceAssessment, answerQuestion, assessmentComplete, createAssessmentState,
  diagnoseAssessment, type AssessmentAnswer,
} from "../../assessment/assessment";
import { AnswerFeedbackNotice, useAssessmentFeedback } from "../../assessment/AnswerFeedback";
import { ParsonsBoard, parsonsQuestionBodySx } from "../../components/assessment/ParsonsBoard";
import { useAssessmentObservation } from "../../instrumentation/useAssessmentObservation";
import type { LearningInstrumentation } from "../../instrumentation/useLearningVisit";
import { playerTokens } from "../../player/player.tokens";
import { PhaseNextButton } from "../../app/PhaseNextButton";
import { ResultConfetti } from "../../app/ResultConfetti";
import { ResultTagRow } from "../../app/ResultTagRow";
import { AssessmentReviewButton } from "../../review/AssessmentReviewButton";
import { LearningReviewDialog } from "../../review/LearningReviewDialog";
import { MazeDiggingCheckCanvas } from "../check/MazeDiggingCheckCanvas";
import { MazeDiggingCodeMappingCanvas } from "../code-mapping/MazeDiggingCodeMappingCanvas";
import { mazeDiggingCodeMappingContent } from "../code-mapping/codeMapping.content";
import { mazeDiggingConsolidationContent as content } from "./consolidation.content";
import type { MazeDiggingConsolidationQuestion, MazeDiggingConsolidationSummary } from "./consolidation.types";

/** 結果のスコア表示。正解数とゲージがアニメーションで増えて最終値に届く。動きを減らす設定では即座に最終値を出す。 */
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

/** embedded / onComplete / onNext は単元フロー接続（後続Issue）からの埋め込み用。未指定なら単品ページとして従来どおり動く。
 * このフェーズのリザルトは診断画面そのものなので、完了通知とは別に、診断画面から次へ進む導線（onNext）を足す。 */
export function MazeDiggingConsolidationPreview({ embedded = false, onLearningEvent, active = true, onComplete, onNext, nextLabel }: LearningInstrumentation & {
  embedded?: boolean;
  onComplete?: (summary: MazeDiggingConsolidationSummary) => void;
  onNext?: () => void;
  nextLabel?: string;
}) {
  const [session, setSession] = useState(() => createAssessmentState(content));
  const [review, setReview] = useState<MazeDiggingConsolidationQuestion | null>(null);
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
    // 正解済みの設問には、古い画面の連打でも試行を足さない（入力ロックと対にする）。
    setSession(current => current.records.find(entry => entry.questionId === question.id)?.solved
      ? current : answerQuestion(content, current, question.id, answer));
  };
  useEffect(() => {
    captionRef.current?.focus({ preventScroll: question?.kind === "parsons" && (record?.attemptCount ?? 0) > 0 });
  }, [question?.id, question?.kind, complete, record?.attemptCount]);
  // 診断が出た瞬間だけ単元フローへ通知する。
  useAssessmentCompletion(diagnosis !== null, diagnosis?.correct ?? 0, diagnosis?.total ?? 0, onComplete, assessmentEvidence(content, session));

  return <LearningContentLayout embedded={embedded} frame="standard" label={complete ? "応用問題の結果" : "穴掘り法の応用問題"} overlay={<>{review && <LearningReviewDialog onLearningEvent={onLearningEvent} active={active} content={mazeDiggingCodeMappingContent} stepIds={review.reviewStepIds}
      renderCanvas={canvas => <MazeDiggingCodeMappingCanvas canvas={canvas} />} onClose={() => setReview(null)} />}</>}>
      <AssessmentLayout bodySx={{...(question?.kind === "parsons" ? parsonsQuestionBodySx : {})}}>
        <Typography ref={captionRef} component="p" tabIndex={-1} aria-live="polite" aria-atomic="true" sx={{
          color: playerTokens.text, fontWeight: 700, textAlign: "center", fontSize: "clamp(18px, 1.5vw, 30px)",
          minHeight: "3em", flexShrink: 0, display: "grid", alignItems: "center", mb: 1, outline: "none",
          ...(question?.kind === "parsons" ? { minHeight: 0 } : {}),
        }}>{diagnosis ? "応用問題の結果" : question?.prompt}</Typography>
        {!embedded && <AnswerFeedbackNotice assessmentId={content.id} />}
        {question && <>
          {question.kind !== "parsons" && <Box sx={{ width: "100%", height: "min(54dvh, 600px)", flexShrink: 0, display: "flex" }}>
            {question.kind === "node"
              ? <MazeDiggingCheckCanvas canvas={question.scene} questionId={question.id} cellIds={question.nodeIds}
                  onAnswer={submit} disabled={attempt?.correct === true} />
              : <MazeDiggingCheckCanvas canvas={question.scene} onAnswer={() => {}} />}
          </Box>}
          {question.kind !== "parsons" && <Typography component="p" sx={{ textAlign: "center", fontSize: 16, fontWeight: 700, flexShrink: 0, mt: 1, mb: 1 }}>{question.instruction}</Typography>}
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
        {diagnosis && <>
          <ResultConfetti />
          <DiagnosisScore correct={diagnosis.correct} total={diagnosis.total} />
          <Box component="ul" aria-label="論点ごとの結果" sx={{ listStyle: "none", m: 0, p: 0, display: "grid", gap: 1, width: "100%", maxWidth: 720, mx: "auto", mt: 2 }}>
            {diagnosis.tags.map((result, index) => <ResultTagRow key={result.tag} dataTag={result.tag} label={result.tag} index={index}
              passed={result.passed} correct={result.correct} total={result.total}
              reviewAction={!result.passed ? <AssessmentReviewButton ariaLabel={`${result.tag}を復習する`}
                onClick={() => setReview(content.questions.find(question => question.tags.includes(result.tag))!)} label={content.reviewLabel} /> : undefined} />)}
          </Box>
          <Typography component="p" sx={{ textAlign: "center", fontWeight: 700 }}>{content.completion}</Typography>
        </>}
      </AssessmentLayout>
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
    </LearningContentLayout>;
}
