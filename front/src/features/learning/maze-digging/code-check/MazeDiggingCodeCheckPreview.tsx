"use client";

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
import { MazeDiggingCodeMappingCanvas } from "../code-mapping/MazeDiggingCodeMappingCanvas";
import { mazeDiggingCodeMappingContent } from "../code-mapping/codeMapping.content";
import { mazeDiggingCodeCheckContent } from "./codeCheck.content";
import type { MazeDiggingCodeCheckSummary } from "./codeCheck.types";

/** embedded / onComplete は単元フロー接続（後続Issue）からの埋め込み用。未指定なら単品ページとして従来どおり動く。 */
export function MazeDiggingCodeCheckPreview({ embedded = false, onLearningEvent, active = true, onComplete }: LearningInstrumentation & { embedded?: boolean; onComplete?: (summary: MazeDiggingCodeCheckSummary) => void }) {
  const [session, setSession] = useState(() => createAssessmentState(mazeDiggingCodeCheckContent));
  const [reviewOpen, setReviewOpen] = useState(false);
  const captionRef = useRef<HTMLParagraphElement>(null);
  const completedRef = useRef(false);
  const codeRef = useRef<HTMLDivElement>(null);
  const question = activeQuestion(mazeDiggingCodeCheckContent, session);
  const complete = assessmentComplete(mazeDiggingCodeCheckContent, session);
  useAssessmentObservation(mazeDiggingCodeCheckContent, session, onLearningEvent, active, reviewOpen ? question?.id : undefined);
  useAssessmentFeedback(mazeDiggingCodeCheckContent, session, active && !reviewOpen);
  const record = session.records.find(record => record.questionId === question?.id);
  const retry = record?.attempts.at(-1)?.correct === false;
  const attempt = record?.attempts.at(-1);
  useEffect(() => { captionRef.current?.focus(); }, [question?.id, complete, record?.attemptCount]);
  // 完了した瞬間だけ単元フローへ通知する（解き直して再完了した場合も再通知する）。
  useEffect(() => {
    if (complete && !completedRef.current) {
      completedRef.current = true;
      onComplete?.({
        firstAttemptCorrect: session.records.filter(entry => entry.attempts[0]?.correct).length,
        totalQuestions: mazeDiggingCodeCheckContent.questions.length,
      });
    }
    if (!complete) completedRef.current = false;
  }, [complete, onComplete, session.records]);
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

  return <Box component={embedded ? "div" : "main"} sx={{ minHeight: embedded ? 0 : "100dvh", height: embedded ? "100%" : undefined, display: "grid", placeItems: "center", bgcolor: playerTokens.background, color: playerTokens.text }}>
    <Box component="section" aria-label={complete ? "コードの確認問題の結果" : "穴掘り法のコードの確認問題"}
      sx={{ width: embedded ? "100%" : "84vw", height: embedded ? "100%" : "84dvh", minHeight: 0, p: 1, display: "flex", flexDirection: "column" }}>
      <Typography ref={captionRef} component="p" tabIndex={-1} aria-live="polite" aria-atomic="true" sx={{
        color: playerTokens.text, fontWeight: 700, textAlign: "center", fontSize: "clamp(18px, 1.5vw, 30px)", mb: 2, outline: "none", flexShrink: 0,
      }}>{complete ? mazeDiggingCodeCheckContent.completion.caption : `${retry ? "もう一度、" : ""}${question?.prompt ?? ""}`}</Typography>
      {!embedded && <AnswerFeedbackNotice assessmentId={mazeDiggingCodeCheckContent.id} />}
      {question ? <Box ref={codeRef} sx={{ width: "100%", flex: 1, minHeight: 0, overflow: "auto", py: 1 }}>
          <Box sx={{ width: "max-content", minWidth: "100%", minHeight: "100%", display: "flex" }}>
            <Box sx={{ margin: "auto" }}>
              <CodeDisplay code={mazeDiggingCodeCheckContent.code} label="dig_mazeのコード" blank={{ lineId: question.lineId, ...question.blank }} />
            </Box>
          </Box>
        </Box> : <Box sx={{ flex: 1, minHeight: 0 }} />}
      <Box sx={{ flexShrink: 0, display: "flex", flexDirection: "column" }}>
        {question && <>
          <Typography component="p" sx={{ textAlign: "center", fontSize: 16, mt: 1, mb: 1 }}>{mazeDiggingCodeCheckContent.instruction}</Typography>
          <Box role="group" aria-label="空欄に入るコードの選択肢" sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", justifyContent: "center" }}>
            {question.choices.map(choice => <Button key={choice.id} type="button" variant="outlined" disableRipple disabled={attempt?.correct === true}
              aria-label={`${choice.text}を選ぶ`} onClick={() => setSession(current => answerQuestion(mazeDiggingCodeCheckContent, current, question.id, { kind: "choice", choiceId: choice.id }))}
              sx={{ border: `2px solid ${playerTokens.focus}`, borderRadius: 999, color: playerTokens.text, bgcolor: playerTokens.surface,
                minWidth: 120, minHeight: 48, px: 2, fontSize: 18, fontFamily: "monospace", textTransform: "none",
                "&:hover": { bgcolor: playerTokens.layers.layer0, border: `2px solid ${playerTokens.focus}` },
                "&:focus-visible": { outline: `3px solid ${playerTokens.control}`, outlineOffset: 2 } }}>{choice.text}</Button>)}
          </Box>
        </>}
        {attempt && !attempt.correct && <Typography component="p" sx={{ textAlign: "center", mt: 1 }}>再回答するか、正解していなくても次へ進めます。結果には初回の回答を使います。</Typography>}
        <Box sx={{ minHeight: 44, display: "flex", flexWrap: "wrap", gap: 1, justifyContent: "center", alignItems: "center", mt: 1 }}>
          {attempt && !attempt.correct && <AssessmentReviewButton onClick={() => setReviewOpen(true)} label={mazeDiggingCodeCheckContent.reviewLabel} />}
          {attempt && question && <Button variant="contained" onClick={() => setSession(current => advanceAssessment(mazeDiggingCodeCheckContent, current, question.id))}
            sx={{ minHeight: 48, px: 3, fontSize: 16, fontWeight: 700, bgcolor: playerTokens.focus, color: playerTokens.surface,
              "&:hover": { bgcolor: playerTokens.states.processing.stroke } }}>{session.position === mazeDiggingCodeCheckContent.questions.length - 1 ? "結果を見る" : "次の問題へ"}</Button>}
          {embedded && complete && <Button variant="outlined" onClick={() => setSession(createAssessmentState(mazeDiggingCodeCheckContent))}
            sx={{ color: playerTokens.text, borderColor: playerTokens.control, minHeight: 44 }}>もう一度解く</Button>}
        </Box>
      </Box>
    </Box>
    {reviewOpen && question && <LearningReviewDialog onLearningEvent={onLearningEvent} active={active} content={mazeDiggingCodeMappingContent} stepIds={question.reviewStepIds}
      renderCanvas={canvas => <MazeDiggingCodeMappingCanvas canvas={canvas} />} onClose={() => setReviewOpen(false)} />}
  </Box>;
}
