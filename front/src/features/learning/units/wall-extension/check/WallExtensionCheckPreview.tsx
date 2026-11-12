"use client";
import { AssessmentLayout } from "../../../components/layouts/AssessmentLayout";
import { useAssessmentCompletion } from "../../../assessment/useAssessmentCompletion";
import { LearningContentLayout } from "../../../components/layouts/LearningContentLayout";
import { assessmentEvidence } from "../../../assessment/assessment";

import { Box, Button, Typography } from "@mui/material";
import { useEffect, useRef, useState } from "react";

import { activeQuestion, advanceAssessment, answerQuestion, assessmentComplete, createAssessmentState, type NodeAnswer } from "../../../assessment/assessment";
import { AnswerFeedbackNotice, useAssessmentFeedback } from "../../../assessment/AnswerFeedback";
import { useAssessmentObservation } from "../../../instrumentation/useAssessmentObservation";
import type { LearningInstrumentation } from "../../../instrumentation/useLearningVisit";
import { playerTokens } from "../../../player/player.tokens";
import { AssessmentReviewButton } from "../../../review/AssessmentReviewButton";
import { LearningReviewDialog } from "../../../review/LearningReviewDialog";
import { getLearningStep } from "../../../review/reviewContent";
import { WallExtensionExecutionCanvas } from "../execution/WallExtensionExecutionCanvas";
import { wallExtensionExecutionContent } from "../execution/execution.content";
import type { WallExtensionDirection } from "../wallExtensionMaze";
import { getWallExtensionCheckScene, wallExtensionCheckContent } from "./check.content";
import type { WallExtensionCheckSummary } from "./check.types";
import { WallExtensionCheckCanvas } from "./WallExtensionCheckCanvas";

const directionLabels: Record<WallExtensionDirection, string> = { up: "上", down: "下", left: "左", right: "右" };

/** embedded / onComplete は単元フロー接続（後続Issue）からの埋め込み用。未指定なら単品ページとして従来どおり動く。 */
export function WallExtensionCheckPreview({ embedded = false, onLearningEvent, active = true, onComplete }: LearningInstrumentation & { embedded?: boolean; onComplete?: (summary: WallExtensionCheckSummary) => void }) {
  const [session, setSession] = useState(() => createAssessmentState(wallExtensionCheckContent));
  const [reviewOpen, setReviewOpen] = useState(false);
  const captionRef = useRef<HTMLParagraphElement>(null);

  const question = activeQuestion(wallExtensionCheckContent, session);
  const complete = assessmentComplete(wallExtensionCheckContent, session);
  useAssessmentObservation(wallExtensionCheckContent, session, onLearningEvent, active, reviewOpen ? question?.id : undefined);
  useAssessmentFeedback(wallExtensionCheckContent, session, active && !reviewOpen);
  const record = session.records.find(record => record.questionId === question?.id);
  const retry = record?.attempts.at(-1)?.correct === false;
  const attempt = record?.attempts.at(-1);
  const caption = complete ? wallExtensionCheckContent.completion.caption : `${retry ? "もう一度、" : ""}${question?.prompt ?? ""}`;
  const completionStep = getLearningStep(wallExtensionExecutionContent, wallExtensionCheckContent.completion.stepId);
  const scene = question ? getWallExtensionCheckScene(question) : completionStep.canvas;
  const submit = (answer: NodeAnswer) => {
    if (!question) return;
    // 正解済みの設問には、古い画面の連打でも試行を足さない（入力ロックと対にする）。
    setSession(current => current.records.find(entry => entry.questionId === question.id)?.solved
      ? current : answerQuestion(wallExtensionCheckContent, current, question.id, answer));
  };
  useEffect(() => { captionRef.current?.focus(); }, [question?.id, complete, record?.attemptCount]);
  // 完了した瞬間だけ単元フローへ通知する（解き直して再完了した場合も再通知する）。
  useAssessmentCompletion(complete, session.records.filter(entry => entry.attempts[0]?.correct).length, wallExtensionCheckContent.questions.length, onComplete, assessmentEvidence(wallExtensionCheckContent, session));

  return <LearningContentLayout embedded={embedded} frame="check" label="棒倒し法の動きの確認問題" overlay={<>{reviewOpen && question && <LearningReviewDialog onLearningEvent={onLearningEvent} active={active} content={wallExtensionExecutionContent} stepIds={question.reviewStepIds}
      renderCanvas={canvas => <WallExtensionExecutionCanvas canvas={canvas} />} onClose={() => setReviewOpen(false)} />}</>}>
      {/* 3段組（#298）: 中央はスクロール領域。本文（問題文・図・指示・選択肢）はここに上から流れ、
          図の高さは min(54dvh, 600px) の固定で、テキスト量や通知では変わらない。 */}
      <AssessmentLayout>
        <Typography ref={captionRef} component="p" tabIndex={-1} aria-live="polite" aria-atomic="true" sx={{
          color: playerTokens.text, fontWeight: 700, textAlign: "center", fontSize: "clamp(18px, 1.5vw, 30px)",
          minHeight: "3em", flexShrink: 0, display: "grid", alignItems: "center", mb: 1, outline: "none",
        }}>{caption}</Typography>
        {question && <Typography component="p" sx={{ textAlign: "center", fontSize: 15, fontWeight: 700, flexShrink: 0, mb: 1 }}>
          {question.situation}
        </Typography>}
        {!embedded && <AnswerFeedbackNotice assessmentId={wallExtensionCheckContent.id} />}
        {question && <Typography component="p" sx={{ textAlign: "center", fontSize: 15, flexShrink: 0, mb: 1 }}>
          盤面のマスをタップして答えよう
        </Typography>}
        {question?.direction && <Typography component="p" sx={{ textAlign: "center", fontSize: 17, fontWeight: 700, flexShrink: 0, mb: 1 }}>
          方向の指示：{directionLabels[question.direction]}
        </Typography>}
        <Box sx={{ display: "flex", flexDirection: "column", height: "min(54dvh, 600px)", flexShrink: 0 }}>
          <WallExtensionCheckCanvas canvas={scene} questionId={question?.id} cellIds={question?.nodeIds}
            onAnswer={submit} disabled={attempt?.correct === true} />
        </Box>
      </AssessmentLayout>
      {/* 下部の固定ゾーン: 再回答の注記と進行操作は常時表示し、スクロールなしで押せる。 */}
      <Box sx={{ flexShrink: 0, borderTop: `1px solid ${playerTokens.layers.layer1}`, mt: 1, pt: 1 }}>
        {attempt && !attempt.correct && <Typography component="p" sx={{ textAlign: "center", mt: 1, flexShrink: 0 }}>再回答するか、正解していなくても次へ進めます。結果には初回の回答を使います。</Typography>}
        <Box sx={{ minHeight: 44, mt: 1, flexShrink: 0, display: "flex", flexWrap: "wrap", gap: 1, justifyContent: "center", alignItems: "center" }}>
          {retry && <AssessmentReviewButton onClick={() => setReviewOpen(true)} label="該当ステップの動きを確認する" />}
          {attempt && question && <Button variant="contained" onClick={() => setSession(current => advanceAssessment(wallExtensionCheckContent, current, question.id))}
            sx={{ minHeight: 48, px: 3, fontSize: 16, fontWeight: 700, bgcolor: playerTokens.focus, color: playerTokens.surface,
              "&:hover": { bgcolor: playerTokens.states.processing.stroke } }}>{session.position === wallExtensionCheckContent.questions.length - 1 ? "結果を見る" : "次の問題へ"}</Button>}
          {embedded && complete && <Button variant="outlined" onClick={() => setSession(createAssessmentState(wallExtensionCheckContent))}
            sx={{ color: playerTokens.text, borderColor: playerTokens.control, minHeight: 44 }}>もう一度解く</Button>}
        </Box>
      </Box>
    </LearningContentLayout>;
}
