"use client";

import { Box, Button, Typography } from "@mui/material";
import { useEffect, useRef, useState } from "react";

import { activeQuestion, answerQuestion, assessmentComplete, createAssessmentState } from "../../assessment/assessment";
import { AnswerFeedbackMessage, useAssessmentFeedback } from "../../assessment/AnswerFeedback";
import { useAssessmentObservation } from "../../instrumentation/useAssessmentObservation";
import type { LearningInstrumentation } from "../../instrumentation/useLearningVisit";

import { playerTokens } from "../../player/player.tokens";
import { LearningReviewDialog } from "../../review/LearningReviewDialog";
import { BfsCodeDisplay } from "../code-mapping/BfsCodeDisplay";
import { BfsCodeMappingCanvas } from "../code-mapping/BfsCodeMappingCanvas";
import { bfsCodeMappingContent } from "../code-mapping/codeMapping.content";
import type { BfsUnitPhaseSummary } from "../unit/unit.types";
import { bfsCodeCheckContent as content } from "./codeCheck.content";

/** embedded / onComplete は単元フロー（#77）からの埋め込み用。未指定なら単品ページとして従来どおり動く。 */
export function BfsCodeCheckPreview({ embedded = false, onLearningEvent, active = true, onComplete }: LearningInstrumentation & { embedded?: boolean; onComplete?: (summary: BfsUnitPhaseSummary) => void }) {
  const [session, setSession] = useState(() => createAssessmentState(content));
  const [reviewOpen, setReviewOpen] = useState(false);
  const captionRef = useRef<HTMLParagraphElement>(null);
  const completedRef = useRef(false);
  const codeRef = useRef<HTMLDivElement>(null);
  const question = activeQuestion(content, session);
  const complete = assessmentComplete(content, session);
  useAssessmentObservation(content, session, onLearningEvent, active, reviewOpen ? question?.id : undefined);
  useAssessmentFeedback(content, session, active && !reviewOpen);
  const record = session.records.find(record => record.questionId === question?.id);
  const retry = record?.attempts.at(-1)?.correct === false;
  const latest = [...session.records].reverse().find(record => record.attemptCount > 0);
  const answeredQuestion = content.questions.find(question => question.id === latest?.questionId);
  const feedback = latest ? latest.attempts.at(-1)?.correct ? answeredQuestion?.correctFeedback : content.retryFeedback : null;
  useEffect(() => { captionRef.current?.focus(); }, [question?.id, complete, record?.attemptCount]);
  // 完了した瞬間だけ単元フローへ通知する（解き直して再完了した場合も再通知する）。
  useEffect(() => {
    if (complete && !completedRef.current) {
      completedRef.current = true;
      onComplete?.({
        firstAttemptCorrect: session.records.filter(entry => entry.attempts[0]?.correct).length,
        totalQuestions: content.questions.length,
      });
    }
    if (!complete) completedRef.current = false;
  }, [complete, onComplete, session.records]);
  useEffect(() => {
    const host = codeRef.current;
    if (!host) return;
    const showBlank = () => {
      const blank = host.querySelector<HTMLElement>('[aria-label="空欄"]');
      if (!blank || host.scrollWidth <= host.clientWidth) return;
      const box = host.getBoundingClientRect(), hole = blank.getBoundingClientRect();
      host.scrollLeft += hole.left - box.left - (host.clientWidth - hole.width) / 2;
    };
    showBlank();
    const observer = new ResizeObserver(showBlank);
    observer.observe(host);
    return () => observer.disconnect();
  }, [question?.id]);

  return <Box component={embedded ? "div" : "main"} sx={{ minHeight: embedded ? 0 : "100dvh", height: embedded ? "100%" : undefined, display: "grid", placeItems: "center", bgcolor: playerTokens.background, color: playerTokens.text }}>
    <Box component="section" aria-label={complete ? "コード基本確認の結果" : "BFSのコード基本確認"}
      sx={{ width: embedded ? "100%" : "84vw", minHeight: embedded ? "100%" : "84dvh", p: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <Typography ref={captionRef} component="p" tabIndex={-1} aria-live="polite" aria-atomic="true" sx={{
        color: playerTokens.text, fontWeight: 700, textAlign: "center", fontSize: "clamp(18px, 1.5vw, 30px)", mb: 2, outline: "none",
      }}>{complete ? content.completion.caption : question?.prompt}</Typography>
      {question && <>
        <Box ref={codeRef} sx={{ width: "100%", overflowX: "auto", py: 1 }}>
          <Box sx={{ width: "max-content", minWidth: "100%", display: "flex", justifyContent: "center" }}>
            <BfsCodeDisplay code={content.code} blank={{ lineId: question.lineId, ...question.blank }} />
          </Box>
        </Box>
        <Typography component="p" sx={{ textAlign: "center", fontSize: 16, mt: 2, mb: 1 }}>{content.instruction}</Typography>
        <Box role="group" aria-label="空欄に入るコードの選択肢" sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", justifyContent: "center" }}>
          {question.choices.map(choice => <Button key={choice.id} type="button" variant="outlined" disableRipple
            aria-label={`${choice.text}を選ぶ`} onClick={() => setSession(current => answerQuestion(content, current, question.id, { kind: "choice", choiceId: choice.id }))}
            sx={{ border: `2px solid ${playerTokens.focus}`, borderRadius: 999, color: playerTokens.text, bgcolor: playerTokens.surface,
              minWidth: 120, minHeight: 48, px: 2, fontSize: 18, fontFamily: "monospace", textTransform: "none",
              "&:hover": { bgcolor: playerTokens.layers.layer0, border: `2px solid ${playerTokens.focus}` },
              "&:focus-visible": { outline: `3px solid ${playerTokens.control}`, outlineOffset: 2 } }}>{choice.text}</Button>)}
        </Box>
      </>}
      {feedback && <AnswerFeedbackMessage message={feedback} />}
      {retry && <Box sx={{ display: "flex", justifyContent: "center", mt: 1 }}>
        <Button variant="outlined" onClick={() => setReviewOpen(true)}
          sx={{ color: playerTokens.text, borderColor: playerTokens.control, minHeight: 44 }}>{content.reviewLabel}</Button>
      </Box>}
      {embedded && complete && <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
        <Button variant="outlined" onClick={() => setSession(createAssessmentState(content))}
          sx={{ color: playerTokens.text, borderColor: playerTokens.control, minHeight: 44 }}>もう一度解く</Button>
      </Box>}
    </Box>
    {reviewOpen && question && <LearningReviewDialog onLearningEvent={onLearningEvent} active={active} content={bfsCodeMappingContent} stepIds={question.reviewStepIds}
      renderCanvas={canvas => <BfsCodeMappingCanvas canvas={canvas} />} onClose={() => setReviewOpen(false)} />}
  </Box>;
}
