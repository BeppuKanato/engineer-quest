"use client";
import { assessmentEvidence } from "../../assessment/assessment";

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
  useAssessmentCompletion(complete, firstCorrect, content.questions.length, onComplete, assessmentEvidence(content, session));

  useEffect(() => {
    captionRef.current?.focus();
  }, [question?.id, complete, record?.attemptCount]);

  useEffect(() => {
    const host = codeRef.current;
    if (!host) return;
    const showBlank = () => {
      const blank = host.querySelector<HTMLElement>('[aria-label="空欄"]');
      if (!blank) return;
      const box = host.getBoundingClientRect(), hole = blank.getBoundingClientRect();
      // 空欄が視界の外にあるときだけ、縦横それぞれ空欄が中央に来るよう寄せる（#317、他単元と共通）。
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
      sx={{ width: embedded ? "100%" : "84vw", height: embedded ? "100%" : "84dvh", minHeight: 0, p: 1, display: "flex", flexDirection: "column" }}>
      {/* 3段組（#298、他単元と共通）: 中央はスクロール領域。問題文とコード窓はここに置き、
          コード窓の高さは 320px の固定。窓の内側スクロールと空欄への寄せは維持する。 */}
      <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column" }}>
        <Typography ref={captionRef} component="p" tabIndex={-1} aria-live="polite" aria-atomic="true"
          sx={{ fontWeight: 700, textAlign: "center", fontSize: "clamp(18px, 1.5vw, 30px)", mb: 2, outline: "none", flexShrink: 0 }}>
          {complete ? `初回の正解は${content.questions.length}問中${firstCorrect}問でした。` : `${retry ? "もう一度、" : ""}${question?.prompt ?? ""}`}
        </Typography>
        {!embedded && <AnswerFeedbackNotice assessmentId={content.id} />}
        {question ? <Box ref={codeRef} sx={{ width: "100%", height: 320, flexShrink: 0, overflow: "auto", py: 1 }}>
            <Box sx={{ width: "max-content", minWidth: "100%", minHeight: "100%", display: "flex" }}>
              <Box sx={{ margin: "auto" }}>
                <CodeDisplay code={content.code} label="dfs_orderのコード" blank={{ lineId: question.lineId, ...question.blank }} />
              </Box>
            </Box>
          </Box> : <Box sx={{ height: 320, flexShrink: 0 }} />}
      </Box>
      {/* 下部の固定ゾーン（#298）: 指示・選択肢・注記・進行操作は常時表示する。 */}
      <Box sx={{ flexShrink: 0, display: "flex", flexDirection: "column", borderTop: `1px solid ${playerTokens.layers.layer1}`, mt: 1, pt: 1 }}>
        {question && <>
          <Typography component="p" sx={{ textAlign: "center", fontSize: 16, mt: 1, mb: 1 }}>空欄に入るものを選ぶ</Typography>
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
        <Box sx={{ minHeight: 44, display: "flex", flexWrap: "wrap", gap: 1, justifyContent: "center", alignItems: "center", mt: 1 }}>
          {retry && <AssessmentReviewButton label="この処理の動きをもう一度見る" onClick={() => setReviewOpen(true)} />}
          {attempt && question && <Button variant="contained" onClick={() => setSession(current => advanceAssessment(content, current, question.id))}
            sx={{ minHeight: 48, px: 3, fontSize: 16, fontWeight: 700, bgcolor: playerTokens.focus, color: playerTokens.surface,
              "&:hover": { bgcolor: playerTokens.states.processing.stroke } }}>
            {session.position === content.questions.length - 1 ? "結果を見る" : "次の問題へ"}
          </Button>}
          {complete && <Button variant="outlined" onClick={() => setSession(createAssessmentState(content))}
            sx={{ color: playerTokens.text, borderColor: playerTokens.control, minHeight: 44 }}>もう一度解く</Button>}
        </Box>
      </Box>
    </Box>
    {active && reviewOpen && question && <LearningReviewDialog content={dfsCodeMappingContent} stepIds={question.reviewStepIds} onLearningEvent={onLearningEvent}
      renderCanvas={canvas => <DfsCodeMappingCanvas canvas={canvas} />} onClose={() => setReviewOpen(false)} />}
  </Box>;
}
