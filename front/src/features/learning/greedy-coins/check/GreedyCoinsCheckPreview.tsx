"use client";
import { assessmentEvidence } from "../../assessment/assessment";

import { Box, Button, Typography } from "@mui/material";
import { useEffect, useRef, useState } from "react";

import {
  activeQuestion, advanceAssessment, answerQuestion, assessmentComplete, createAssessmentState, type AssessmentAnswer,
} from "../../assessment/assessment";
import { AnswerFeedbackNotice, useAssessmentFeedback } from "../../assessment/AnswerFeedback";
import { useAssessmentObservation } from "../../instrumentation/useAssessmentObservation";
import type { LearningInstrumentation } from "../../instrumentation/useLearningVisit";
import { playerTokens } from "../../player/player.tokens";
import { AssessmentReviewButton } from "../../review/AssessmentReviewButton";
import { LearningReviewDialog } from "../../review/LearningReviewDialog";
import { getLearningStep } from "../../review/reviewContent";
import { GreedyCoinsExecutionCanvas } from "../execution/GreedyCoinsExecutionCanvas";
import { greedyCoinsExecutionContent } from "../execution/execution.content";
import { getGreedyCoinsCheckScene, greedyCoinsCheckContent } from "./check.content";
import type { GreedyCoinsCheckSummary } from "./check.types";
import { GreedyCoinsCheckCanvas } from "./GreedyCoinsCheckCanvas";

/** embedded / onComplete は単元フロー接続（後続Issue）からの埋め込み用。未指定なら単品ページとして従来どおり動く。 */
export function GreedyCoinsCheckPreview({ embedded = false, onLearningEvent, active = true, onComplete }: LearningInstrumentation & { embedded?: boolean; onComplete?: (summary: GreedyCoinsCheckSummary) => void }) {
  const [session, setSession] = useState(() => createAssessmentState(greedyCoinsCheckContent));
  const [reviewOpen, setReviewOpen] = useState(false);
  const captionRef = useRef<HTMLParagraphElement>(null);
  const completedRef = useRef(false);
  const question = activeQuestion(greedyCoinsCheckContent, session);
  const complete = assessmentComplete(greedyCoinsCheckContent, session);
  useAssessmentObservation(greedyCoinsCheckContent, session, onLearningEvent, active, reviewOpen ? question?.id : undefined);
  useAssessmentFeedback(greedyCoinsCheckContent, session, active && !reviewOpen);
  const record = session.records.find(record => record.questionId === question?.id);
  const retry = record?.attempts.at(-1)?.correct === false;
  const attempt = record?.attempts.at(-1);
  const caption = complete ? greedyCoinsCheckContent.completion.caption : `${retry ? "もう一度、" : ""}${question?.prompt ?? ""}`;
  const completionStep = getLearningStep(greedyCoinsExecutionContent, greedyCoinsCheckContent.completion.stepId);
  const scene = question ? getGreedyCoinsCheckScene(question) : completionStep.canvas;
  // Q1 は額面チップのタップ、Q2 は文章の選択肢ボタンで答える（基準データ §3）。
  const choiceQuestion = question && "kind" in question ? question : null;
  const nodeQuestion = question && !("kind" in question) ? question : null;
  const submit = (answer: AssessmentAnswer) => {
    if (!question) return;
    // 正解済みの設問には、古い画面の連打でも試行を足さない（入力ロックと対にする）。
    setSession(current => current.records.find(entry => entry.questionId === question.id)?.solved
      ? current : answerQuestion(greedyCoinsCheckContent, current, question.id, answer));
  };
  useEffect(() => { captionRef.current?.focus(); }, [question?.id, complete, record?.attemptCount]);
  // 完了した瞬間だけ単元フローへ通知する（解き直して再完了した場合も再通知する）。
  useEffect(() => {
    if (complete && !completedRef.current) {
      completedRef.current = true;
      onComplete?.({ assessmentEvidence: assessmentEvidence(greedyCoinsCheckContent, session),
        firstAttemptCorrect: session.records.filter(entry => entry.attempts[0]?.correct).length,
        totalQuestions: greedyCoinsCheckContent.questions.length,
      });
    }
    if (!complete) completedRef.current = false;
  }, [complete, onComplete, session]);

  return <Box component={embedded ? "div" : "main"} sx={{ minHeight: embedded ? 0 : "100dvh", height: embedded ? "100%" : undefined, minWidth: 0, width: "100%", display: "grid", gridTemplateColumns: "minmax(0, 1fr)", placeItems: "center", bgcolor: playerTokens.background, color: playerTokens.text }}>
    <Box component="section" aria-label="貪欲法の動きの確認問題" sx={{ width: embedded ? "100%" : { xs: "100%", sm: "84vw" }, maxWidth: "100%", minWidth: 0, height: embedded ? "100%" : "84dvh", minHeight: embedded ? 0 : 500, p: 1, boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
      {/* 3段組（#298）: 中央はスクロール領域。本文（問題文・図・指示・選択肢）はここに上から流れ、
          図の高さは min(54dvh, 600px) の固定で、テキスト量や通知では変わらない。 */}
      <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column" }}>
        <Typography ref={captionRef} component="p" tabIndex={-1} aria-live="polite" aria-atomic="true" sx={{
          color: playerTokens.text, fontWeight: 700, textAlign: "center", fontSize: "clamp(18px, 1.5vw, 30px)",
          minHeight: "3em", flexShrink: 0, display: "grid", alignItems: "center", mb: 1, outline: "none",
        }}>{caption}</Typography>
        {!embedded && <AnswerFeedbackNotice assessmentId={greedyCoinsCheckContent.id} />}
        {question && <Typography component="p" sx={{ textAlign: "center", fontSize: 15, flexShrink: 0, mb: 1 }}>
          {choiceQuestion ? "当てはまるボタンをタップして答えよう" : "額面の硬貨をタップして答えよう"}
        </Typography>}
        <Box sx={{ display: "flex", flexDirection: "column", height: "min(54dvh, 600px)", flexShrink: 0 }}>
          <GreedyCoinsCheckCanvas canvas={scene} questionId={nodeQuestion?.id}
            cellIds={nodeQuestion?.nodeIds}
            onAnswer={submit} disabled={attempt?.correct === true} />
        </Box>
        {choiceQuestion && <Box role="group" aria-label="解答の選択肢" sx={{ display: "flex", flexShrink: 0, flexWrap: "wrap", gap: 1, justifyContent: "center", mt: 1 }}>
          {choiceQuestion.choices.map(choice => <Button key={choice.id} type="button" disableRipple variant="outlined" data-choice-id={choice.id}
            disabled={attempt?.correct === true}
            onClick={() => submit({ kind: "choice", choiceId: choice.id })} sx={{ border: `2px solid ${playerTokens.focus}`, borderRadius: 999,
              color: playerTokens.text, bgcolor: playerTokens.surface, fontSize: 16, fontWeight: 700, minHeight: 48, px: 2, textTransform: "none",
              "&:hover": { bgcolor: playerTokens.layers.layer0, border: `2px solid ${playerTokens.focus}` } }}>{choice.text}</Button>)}
        </Box>}
      </Box>
      {/* 下部の固定ゾーン: 再回答の注記と進行操作は常時表示し、スクロールなしで押せる。 */}
      <Box sx={{ flexShrink: 0, borderTop: `1px solid ${playerTokens.layers.layer1}`, mt: 1, pt: 1 }}>
        {attempt && !attempt.correct && <Typography component="p" sx={{ textAlign: "center", mt: 1, flexShrink: 0 }}>再回答するか、正解していなくても次へ進めます。結果には初回の回答を使います。</Typography>}
        <Box sx={{ minHeight: 44, mt: 1, flexShrink: 0, display: "flex", flexWrap: "wrap", gap: 1, justifyContent: "center", alignItems: "center" }}>
          {retry && <AssessmentReviewButton onClick={() => setReviewOpen(true)} label="該当ステップの動きを確認する" />}
          {attempt && question && <Button variant="contained" onClick={() => setSession(current => advanceAssessment(greedyCoinsCheckContent, current, question.id))}
            sx={{ minHeight: 48, px: 3, fontSize: 16, fontWeight: 700, bgcolor: playerTokens.focus, color: playerTokens.surface,
              "&:hover": { bgcolor: playerTokens.states.processing.stroke } }}>{session.position === greedyCoinsCheckContent.questions.length - 1 ? "結果を見る" : "次の問題へ"}</Button>}
          {embedded && complete && <Button variant="outlined" onClick={() => setSession(createAssessmentState(greedyCoinsCheckContent))}
            sx={{ color: playerTokens.text, borderColor: playerTokens.control, minHeight: 44 }}>もう一度解く</Button>}
        </Box>
      </Box>
    </Box>
    {reviewOpen && question && <LearningReviewDialog onLearningEvent={onLearningEvent} active={active} content={greedyCoinsExecutionContent} stepIds={question.reviewStepIds}
      renderCanvas={canvas => <GreedyCoinsExecutionCanvas canvas={canvas} />} onClose={() => setReviewOpen(false)} />}
  </Box>;
}
