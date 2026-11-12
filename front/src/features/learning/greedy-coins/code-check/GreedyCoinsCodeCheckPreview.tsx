"use client";
import { AssessmentLayout } from "../../components/layouts/AssessmentLayout";
import { useAssessmentCompletion } from "../../assessment/useAssessmentCompletion";
import { LearningContentLayout } from "../../components/layouts/LearningContentLayout";
import { assessmentEvidence } from "../../assessment/assessment";

import { Box, Button, Typography } from "@mui/material";
import { useEffect, useRef, useState } from "react";

import { activeQuestion, advanceAssessment, answerQuestion, assessmentComplete, createAssessmentState } from "../../assessment/assessment";
import { AnswerFeedbackNotice, useAssessmentFeedback } from "../../assessment/AnswerFeedback";
import { CodeDisplay } from "../../code/CodeDisplay";
import { useAssessmentObservation } from "../../instrumentation/useAssessmentObservation";
import type { LearningInstrumentation } from "../../instrumentation/useLearningVisit";
import { playerTokens } from "../../player/player.tokens";
import { AssessmentReviewButton } from "../../review/AssessmentReviewButton";
import { LearningReviewDialog } from "../../review/LearningReviewDialog";
import { GreedyCoinsCodeMappingCanvas } from "../code-mapping/GreedyCoinsCodeMappingCanvas";
import { greedyCoinsCodeMappingContent } from "../code-mapping/codeMapping.content";
import { greedyCoinsCodeCheckContent } from "./codeCheck.content";
import type { GreedyCoinsCodeCheckSummary } from "./codeCheck.types";

/** embedded / onComplete は単元フロー接続（後続Issue）からの埋め込み用。未指定なら単品ページとして従来どおり動く。 */
export function GreedyCoinsCodeCheckPreview({ embedded = false, onLearningEvent, active = true, onComplete }: LearningInstrumentation & { embedded?: boolean; onComplete?: (summary: GreedyCoinsCodeCheckSummary) => void }) {
  const [session, setSession] = useState(() => createAssessmentState(greedyCoinsCodeCheckContent));
  const [reviewOpen, setReviewOpen] = useState(false);
  const captionRef = useRef<HTMLParagraphElement>(null);

  const codeRef = useRef<HTMLDivElement>(null);
  const question = activeQuestion(greedyCoinsCodeCheckContent, session);
  const complete = assessmentComplete(greedyCoinsCodeCheckContent, session);
  useAssessmentObservation(greedyCoinsCodeCheckContent, session, onLearningEvent, active, reviewOpen ? question?.id : undefined);
  useAssessmentFeedback(greedyCoinsCodeCheckContent, session, active && !reviewOpen);
  const record = session.records.find(record => record.questionId === question?.id);
  const retry = record?.attempts.at(-1)?.correct === false;
  const attempt = record?.attempts.at(-1);
  useEffect(() => { captionRef.current?.focus(); }, [question?.id, complete, record?.attemptCount]);
  // 完了した瞬間だけ単元フローへ通知する（解き直して再完了した場合も再通知する）。
  useAssessmentCompletion(complete, session.records.filter(entry => entry.attempts[0]?.correct).length, greedyCoinsCodeCheckContent.questions.length, onComplete, assessmentEvidence(greedyCoinsCodeCheckContent, session));
  useEffect(() => {
    const host = codeRef.current;
    if (!host) return;
    const showBlank = () => {
      const blank = host.querySelector<HTMLElement>('[aria-label="空欄"]');
      if (!blank) return;
      const box = host.getBoundingClientRect(), hole = blank.getBoundingClientRect();
      // 空欄が視界の外にあるときだけ、縦横それぞれ空欄が中央に来るよう寄せる（#317）。
      if (host.scrollWidth > host.clientWidth) {
        host.scrollLeft += hole.left - box.left - (host.clientWidth - hole.width) / 2;
      }
      if (host.scrollHeight > host.clientHeight) {
        host.scrollTop += hole.top - box.top - (host.clientHeight - hole.height) / 2;
      }
    };
    showBlank();
    const observer = new ResizeObserver(showBlank);
    observer.observe(host);
    return () => observer.disconnect();
  }, [question?.id]);

  return <LearningContentLayout embedded={embedded} frame="code-check" label={complete ? "コードの確認問題の結果" : "貪欲法のコードの確認問題"} overlay={<>{reviewOpen && question && <LearningReviewDialog onLearningEvent={onLearningEvent} active={active} content={greedyCoinsCodeMappingContent} stepIds={question.reviewStepIds}
      renderCanvas={canvas => <GreedyCoinsCodeMappingCanvas canvas={canvas} />} onClose={() => setReviewOpen(false)} />}</>}>
      {/* 3段組（#298）: 中央はスクロール領域。問題文とコード窓はここに置き、
          コード窓の高さは 320px の固定（#321 の残り高さ方式から変更）。窓の内側スクロールと空欄への寄せは維持する。 */}
      <AssessmentLayout>
        <Typography ref={captionRef} component="p" tabIndex={-1} aria-live="polite" aria-atomic="true" sx={{
          color: playerTokens.text, fontWeight: 700, textAlign: "center", fontSize: "clamp(18px, 1.5vw, 30px)", mb: 2, outline: "none", flexShrink: 0,
        }}>{complete ? greedyCoinsCodeCheckContent.completion.caption : `${retry ? "もう一度、" : ""}${question?.prompt ?? ""}`}</Typography>
        {!embedded && <AnswerFeedbackNotice assessmentId={greedyCoinsCodeCheckContent.id} />}
        {question ? <Box ref={codeRef} sx={{ width: "100%", height: 320, flexShrink: 0, overflow: "auto", py: 1 }}>
            <Box sx={{ width: "max-content", minWidth: "100%", minHeight: "100%", display: "flex" }}>
              <Box sx={{ margin: "auto" }}>
                <CodeDisplay code={greedyCoinsCodeCheckContent.code} label="greedy_coinsのコード" blank={{ lineId: question.lineId, ...question.blank }} />
              </Box>
            </Box>
          </Box> : <Box sx={{ height: 320, flexShrink: 0 }} />}
      </AssessmentLayout>
      {/* 下部の固定ゾーン（#298）: 指示・選択肢・注記・進行操作は常時表示する。 */}
      <Box sx={{ flexShrink: 0, display: "flex", flexDirection: "column", borderTop: `1px solid ${playerTokens.layers.layer1}`, mt: 1, pt: 1 }}>
        {question && <>
          <Typography component="p" sx={{ textAlign: "center", fontSize: 16, mt: 1, mb: 1 }}>{greedyCoinsCodeCheckContent.instruction}</Typography>
          <Box role="group" aria-label="空欄に入るコードの選択肢" sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", justifyContent: "center" }}>
            {question.choices.map(choice => <Button key={choice.id} type="button" variant="outlined" disableRipple disabled={attempt?.correct === true}
              aria-label={`${choice.text}を選ぶ`} onClick={() => setSession(current => answerQuestion(greedyCoinsCodeCheckContent, current, question.id, { kind: "choice", choiceId: choice.id }))}
              sx={{ border: `2px solid ${playerTokens.focus}`, borderRadius: 999, color: playerTokens.text, bgcolor: playerTokens.surface,
                minWidth: 120, minHeight: 48, px: 2, fontSize: 18, fontFamily: "monospace", textTransform: "none",
                "&:hover": { bgcolor: playerTokens.layers.layer0, border: `2px solid ${playerTokens.focus}` },
                "&:focus-visible": { outline: `3px solid ${playerTokens.control}`, outlineOffset: 2 } }}>{choice.text}</Button>)}
          </Box>
        </>}
        {attempt && !attempt.correct && <Typography component="p" sx={{ textAlign: "center", mt: 1 }}>再回答するか、正解していなくても次へ進めます。結果には初回の回答を使います。</Typography>}
        <Box sx={{ minHeight: 44, display: "flex", flexWrap: "wrap", gap: 1, justifyContent: "center", alignItems: "center", mt: 1 }}>
          {attempt && !attempt.correct && <AssessmentReviewButton onClick={() => setReviewOpen(true)} label={greedyCoinsCodeCheckContent.reviewLabel} />}
          {attempt && question && <Button variant="contained" onClick={() => setSession(current => advanceAssessment(greedyCoinsCodeCheckContent, current, question.id))}
            sx={{ minHeight: 48, px: 3, fontSize: 16, fontWeight: 700, bgcolor: playerTokens.focus, color: playerTokens.surface,
              "&:hover": { bgcolor: playerTokens.states.processing.stroke } }}>{session.position === greedyCoinsCodeCheckContent.questions.length - 1 ? "結果を見る" : "次の問題へ"}</Button>}
          {embedded && complete && <Button variant="outlined" onClick={() => setSession(createAssessmentState(greedyCoinsCodeCheckContent))}
            sx={{ color: playerTokens.text, borderColor: playerTokens.control, minHeight: 44 }}>もう一度解く</Button>}
        </Box>
      </Box>
    </LearningContentLayout>;
}
