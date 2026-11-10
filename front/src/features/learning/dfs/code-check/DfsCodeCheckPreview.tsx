"use client";

import { Box, Button, Typography } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { activeQuestion, advanceAssessment, answerQuestion, assessmentComplete, createAssessmentState } from "../../assessment/assessment";
import { AnswerFeedbackNotice, useAssessmentFeedback } from "../../assessment/AnswerFeedback";
import { useAssessmentCompletion } from "../../assessment/useAssessmentCompletion";
import { useAssessmentObservation } from "../../instrumentation/useAssessmentObservation";
import type { LearningInstrumentation } from "../../instrumentation/useLearningVisit";
import type { UnitPhaseSummary } from "../../unit/unit.types";
import { CodeDisplay } from "../../code/CodeDisplay";
import { playerTokens } from "../../player/player.tokens";
import { AssessmentReviewButton } from "../../review/AssessmentReviewButton";
import { LearningReviewDialog } from "../../review/LearningReviewDialog";
import { DfsCodeMappingCanvas } from "../code-mapping/DfsCodeMappingCanvas";
import { dfsCodeMappingContent } from "../code-mapping/codeMapping.content";
import { dfsCodeCheckContent as content } from "./codeCheck.content";

export function DfsCodeCheckPreview({ embedded = false, active = true, onLearningEvent, onComplete }: LearningInstrumentation & {
  embedded?: boolean; onComplete?: (summary: UnitPhaseSummary) => void;
} = {}) {
  const [session, setSession] = useState(() => createAssessmentState(content));
  const [reviewOpen, setReviewOpen] = useState(false);
  const captionRef = useRef<HTMLParagraphElement>(null);
  const codeRef = useRef<HTMLDivElement>(null);
  const question = activeQuestion(content, session);
  const complete = assessmentComplete(content, session);
  const record = session.records.find(entry => entry.questionId === question?.id);
  const attempt = record?.attempts.at(-1);
  const retry = attempt?.correct === false;
  const firstCorrect = session.records.filter(entry => entry.firstCorrect).length;
  useAssessmentObservation(content, session, onLearningEvent, active, reviewOpen ? question?.id : undefined);
  useAssessmentFeedback(content, session, active && !reviewOpen);
  useAssessmentCompletion(complete, firstCorrect, content.questions.length, onComplete);

  useEffect(() => {
    captionRef.current?.focus();
  }, [question?.id, complete, record?.attemptCount]);

  useEffect(() => {
    const host = codeRef.current;
    if (!host) return;
    const showBlank = () => {
      const blank = host.querySelector<HTMLElement>('[aria-label="空欄"]');
      if (!blank || host.scrollWidth <= host.clientWidth) return;
      const viewport = host.getBoundingClientRect();
      const hole = blank.getBoundingClientRect();
      host.scrollLeft += hole.left - viewport.left - (host.clientWidth - hole.width) / 2;
    };
    showBlank();
    const observer = new ResizeObserver(showBlank);
    observer.observe(host);
    return () => observer.disconnect();
  }, [question?.id]);

  function submit(choiceId: string) {
    if (!question) return;
    setSession(current => {
      if (current.records.find(entry => entry.questionId === question.id)?.solved) return current;
      return answerQuestion(content, current, question.id, { kind: "choice", choiceId });
    });
  }

  return <Box component={embedded ? "div" : "main"} aria-label={content.stageName}
    sx={{ minHeight: embedded ? 0 : "100dvh", height: embedded ? "100%" : undefined, minWidth: 0, display: "grid", placeItems: "center", bgcolor: playerTokens.background, color: playerTokens.text }}>
    <Box component="section" aria-label={complete ? "コードの確認問題の結果" : "DFSのコードの確認問題"}
      sx={{ width: embedded ? "100%" : "84vw", minWidth: 0, minHeight: embedded ? 0 : "84dvh", p: 1, boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <Typography ref={captionRef} component="p" tabIndex={-1} aria-live="polite" aria-atomic="true"
        sx={{ fontWeight: 700, textAlign: "center", fontSize: "clamp(18px, 1.5vw, 30px)", mb: 2, outline: "none" }}>
        {complete ? `初回の正解は${content.questions.length}問中${firstCorrect}問でした。` : question?.prompt}
      </Typography>
      {!embedded && <AnswerFeedbackNotice assessmentId={content.id} />}
      {question && <>
        <Box ref={codeRef} tabIndex={0} role="region" aria-label="穴埋めコード"
          sx={{ width: "100%", overflowX: "auto", py: 1 }}>
          <Box sx={{ width: "max-content", minWidth: "100%", display: "flex", justifyContent: "center" }}>
            <CodeDisplay code={content.code} label="dfs_orderのコード" blank={{ lineId: question.lineId, ...question.blank }} />
          </Box>
        </Box>
        <Typography component="p" sx={{ textAlign: "center", fontSize: 16, mt: 2, mb: 1 }}>空欄に入るものを選ぶ</Typography>
        <Box role="group" aria-label="空欄に入るコードの選択肢"
          sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", justifyContent: "center" }}>
          {question.choices.map(choice => <Button key={choice.id} type="button" variant="outlined" disableRipple disabled={record?.solved}
            aria-label={`${choice.text}を選ぶ`} onClick={() => submit(choice.id)}
            sx={{ border: `2px solid ${playerTokens.focus}`, borderRadius: 999, color: playerTokens.text, bgcolor: playerTokens.surface,
              minWidth: 120, minHeight: 48, px: 2, fontSize: 18, fontFamily: "monospace", textTransform: "none",
              "&:hover": { bgcolor: playerTokens.layers.layer0, border: `2px solid ${playerTokens.focus}` },
              "&:focus-visible": { outline: `3px solid ${playerTokens.control}`, outlineOffset: 2 } }}>{choice.text}</Button>)}
        </Box>
      </>}
      {retry && <Typography component="p" sx={{ textAlign: "center", mt: 1 }}>
        再回答するか、正解していなくても次へ進めます。結果には初回の回答を使います。
      </Typography>}
      {(attempt || complete) && <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, justifyContent: "center", mt: 1 }}>
        {retry && <AssessmentReviewButton label="この処理の動きをもう一度見る" onClick={() => setReviewOpen(true)} />}
        {attempt && question && <Button variant="contained" onClick={() => setSession(current => advanceAssessment(content, current, question.id))}
          sx={{ minHeight: 48, px: 3, fontSize: 16, fontWeight: 700, bgcolor: playerTokens.focus, color: playerTokens.surface,
            "&:hover": { bgcolor: playerTokens.states.processing.stroke } }}>
          {session.position === content.questions.length - 1 ? "結果を見る" : "次の問題へ"}
        </Button>}
        {complete && <Button variant="outlined" onClick={() => setSession(createAssessmentState(content))}
          sx={{ color: playerTokens.text, borderColor: playerTokens.control, minHeight: 48 }}>もう一度解く</Button>}
      </Box>}
    </Box>
    {active && reviewOpen && question && <LearningReviewDialog content={dfsCodeMappingContent} stepIds={question.reviewStepIds} onLearningEvent={onLearningEvent}
      renderCanvas={canvas => <DfsCodeMappingCanvas canvas={canvas} />} onClose={() => setReviewOpen(false)} />}
  </Box>;
}
