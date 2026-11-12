"use client";
import { AssessmentLayout } from "../../../components/layouts/AssessmentLayout";
import { LearningContentLayout } from "../../../components/layouts/LearningContentLayout";
import { assessmentEvidence } from "../../../assessment/assessment";

import { Box, Button, Typography } from "@mui/material";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ResultTagRow } from "../../../components/results/ResultTagRow";
import { PhaseNextButton } from "../../../components/results/PhaseNextButton";
import { AnswerFeedbackNotice, useAssessmentFeedback } from "../../../assessment/AnswerFeedback";
import { useAssessmentCompletion } from "../../../assessment/useAssessmentCompletion";
import {
  activeQuestion, advanceAssessment, answerQuestion, assessmentComplete, createAssessmentState, diagnoseAssessment, type AssessmentAnswer,
} from "../../../assessment/assessment";
import { ConsolidationGraph } from "../../bfs/consolidation/ConsolidationGraph";
import { ParsonsBoard, parsonsQuestionBodySx } from "../../../components/assessment/ParsonsBoard";
import { useAssessmentObservation } from "../../../instrumentation/useAssessmentObservation";
import type { LearningInstrumentation } from "../../../instrumentation/useLearningVisit";
import type { UnitPhaseSummary } from "../../../types/unit.types";
import { playerTokens } from "../../../player/player.tokens";
import { AssessmentReviewButton } from "../../../review/AssessmentReviewButton";
import { LearningReviewDialog } from "../../../review/LearningReviewDialog";
import { DfsCodeMappingCanvas } from "../code-mapping/DfsCodeMappingCanvas";
import { dfsCodeMappingContent } from "../code-mapping/codeMapping.content";
import { dfsConsolidationContent as content, type DfsConsolidationQuestion } from "./consolidation.content";

export function DfsConsolidationPreview({ embedded = false, active = true, onLearningEvent, onComplete, onNext, nextLabel, advancePending = false, achievements }: LearningInstrumentation & {
  embedded?: boolean; onComplete?: (summary: UnitPhaseSummary) => void; onNext?: () => void; nextLabel?: string;
  advancePending?: boolean; achievements?: ReactNode;
} = {}) {
  const [session, setSession] = useState(() => createAssessmentState(content));
  const [review, setReview] = useState<DfsConsolidationQuestion | null>(null);
  const captionRef = useRef<HTMLParagraphElement>(null);
  const question = activeQuestion(content, session);
  const complete = assessmentComplete(content, session);
  const record = session.records.find(entry => entry.questionId === question?.id);
  const attempt = record?.attempts.at(-1);
  const diagnosis = complete ? diagnoseAssessment(content, session) : null;
  const advanceLabel = session.position === content.questions.length - 1 ? "結果を見る" : "次の問題へ";

  useAssessmentObservation(content, session, onLearningEvent, active, review?.id);
  useAssessmentFeedback(content, session, active && !review);
  useAssessmentCompletion(complete, diagnosis?.correct ?? 0, content.questions.length, onComplete, assessmentEvidence(content, session));

  useEffect(() => {
    captionRef.current?.focus({ preventScroll: question?.kind === "parsons" && (record?.attemptCount ?? 0) > 0 });
  }, [question?.id, question?.kind, complete, record?.attemptCount]);

  function submit(answer: AssessmentAnswer) {
    if (!question) return;
    setSession(current => current.records.find(entry => entry.questionId === question.id)?.solved
      ? current : answerQuestion(content, current, question.id, answer));
  }

  function advance() {
    if (question) setSession(current => advanceAssessment(content, current, question.id));
  }

  return <LearningContentLayout embedded={embedded} frame="diagnostic-flow" label={complete ? "応用問題の結果" : "DFSの応用問題"} rootLabel={content.stageName} overlay={<>{active && review && <LearningReviewDialog content={dfsCodeMappingContent} stepIds={review.reviewStepIds} onLearningEvent={onLearningEvent}
      renderCanvas={canvas => <DfsCodeMappingCanvas canvas={canvas} />} onClose={() => setReview(null)} />}</>}>
      <AssessmentLayout bodySx={{...(question?.kind === "parsons" ? parsonsQuestionBodySx : {})}}>
        <Typography ref={captionRef} component="p" tabIndex={-1} aria-live="polite" aria-atomic="true"
          sx={{ fontWeight: 700, textAlign: "center", fontSize: "clamp(18px, 1.5vw, 30px)", flexShrink: 0,
            minHeight: question?.kind === "parsons" ? 0 : "3em", display: "grid", alignItems: "center", mb: 1, outline: "none" }}>
          {diagnosis ? "応用問題の結果" : question?.prompt}
        </Typography>
        {!embedded && <AnswerFeedbackNotice assessmentId={content.id} />}
        {question && question.kind !== "parsons" && <>
          <Box sx={{ width: "100%", height: "min(54dvh, 600px)", flexShrink: 0, display: "flex" }}>
            <ConsolidationGraph {...question.scene} minHeight={0}
              onSelect={question.kind === "node" && !record?.solved ? nodeId => submit({ kind: "node", nodeId }) : undefined} />
          </Box>
          <Typography component="p" sx={{ textAlign: "center", fontSize: 16, fontWeight: 700, flexShrink: 0, my: 1 }}>{question.instruction}</Typography>
          {question.kind === "choice" && <Box role="group" aria-label="解答の選択肢"
            sx={{ display: "flex", flexShrink: 0, flexWrap: "wrap", gap: 1, justifyContent: "center" }}>
            {question.choices.map(choice => <Button key={choice.id} type="button" variant="outlined" disableRipple disabled={record?.solved}
              onClick={() => submit({ kind: "choice", choiceId: choice.id })}
              sx={{ border: `2px solid ${playerTokens.focus}`, borderRadius: 999, color: playerTokens.text, bgcolor: playerTokens.surface,
                fontSize: 16, fontWeight: 700, minHeight: 48, px: 2,
                "&:hover": { bgcolor: playerTokens.layers.layer0, border: `2px solid ${playerTokens.focus}` } }}>
              {choice.text}
            </Button>)}
          </Box>}
        </>}
        {question?.kind === "parsons" && <ParsonsBoard key={question.id} question={question} code={content.code} onAnswer={submit}
          scrollable disabled={record?.solved} instruction={question.instruction}
          attemptActions={attempt && {
            correct: attempt.correct, message: attempt.correct ? question.correctFeedback : question.incorrectFeedback,
            advanceLabel, onReview: () => setReview(question), onAdvance: advance,
          }}
          orderFeedback={{
            solutionLineIds: question.correctAnswer.lineIds, interchangeableLineGroups: question.interchangeableLineGroups,
            active: !!attempt, submittedLineIds: attempt?.answer.kind === "order" ? attempt.answer.lineIds : undefined,
          }} />}
        {diagnosis && <>
          <Typography component="p" sx={{ textAlign: "center", fontSize: "clamp(20px, 2.4vw, 32px)", fontWeight: 800 }}>
            初回正解 {diagnosis.correct} / {diagnosis.total} 問
          </Typography>
          <Box component="ul" aria-label="論点ごとの結果"
            sx={{ listStyle: "none", m: 0, p: 0, display: "grid", gap: 1, width: "100%", maxWidth: 720, mx: "auto", mt: 2 }}>
            {diagnosis.tags.map((result, index) => <ResultTagRow key={result.tag} dataTag={result.tag} label={result.tag} index={index}
              passed={result.passed} correct={result.correct} total={result.total}
              reviewAction={!result.passed && <AssessmentReviewButton ariaLabel={`${result.tag}を復習する`} label={content.reviewLabel}
                onClick={() => setReview(content.questions.find(item => item.tags.includes(result.tag)) ?? null)} />} />)}
          </Box>
          {achievements}
        </>}
      </AssessmentLayout>
      {(diagnosis || (question && question.kind !== "parsons" && attempt)) &&
        <Box sx={{ flexShrink: 0, borderTop: `1px solid ${playerTokens.layers.layer1}`, mt: 1 }}>
          {question && attempt?.correct === false && <Typography component="p" sx={{ textAlign: "center", mt: 1 }}>
            再回答するか、正解していなくても次へ進めます。結果には初回の回答を使います。
          </Typography>}
          <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 1, mt: 1 }}>
            {question && attempt?.correct === false && <AssessmentReviewButton label={content.reviewLabel} onClick={() => setReview(question)} />}
            {diagnosis
              ? <>
                <Button variant="outlined" onClick={() => setSession(createAssessmentState(content))} sx={{ minHeight: 48 }}>もう一度解く</Button>
                {onNext && <PhaseNextButton label={nextLabel ?? "次へ進む"} disabled={advancePending} onClick={onNext} />}
              </>
              : <Button variant="contained" onClick={advance} sx={{ minHeight: 48, px: 3, fontSize: 16, fontWeight: 700,
                bgcolor: playerTokens.focus, color: playerTokens.surface, "&:hover": { bgcolor: playerTokens.states.processing.stroke } }}>
                {advanceLabel}
              </Button>}
          </Box>
        </Box>}
    </LearningContentLayout>;
}
