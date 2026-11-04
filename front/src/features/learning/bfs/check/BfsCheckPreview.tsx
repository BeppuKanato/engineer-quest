"use client";

import { Box, Button, Typography } from "@mui/material";
import { useEffect, useRef, useState } from "react";

import { activeQuestion, answerQuestion, assessmentComplete, createAssessmentState, type NodeAnswer } from "../../assessment/assessment";
import { playerTokens } from "../../player/player.tokens";
import { LearningReviewDialog } from "../../review/LearningReviewDialog";
import { getLearningStep } from "../../review/reviewContent";
import { BfsExecutionCanvas } from "../execution/BfsExecutionCanvas";
import { bfsExecutionContent } from "../execution/execution.content";
import { bfsCheckContent } from "./check.content";

export function BfsCheckPreview() {
  const [session, setSession] = useState(() => createAssessmentState(bfsCheckContent));
  const [reviewOpen, setReviewOpen] = useState(false);
  const captionRef = useRef<HTMLParagraphElement>(null);
  const question = activeQuestion(bfsCheckContent, session);
  const complete = assessmentComplete(bfsCheckContent, session);
  const record = session.records.find(record => record.questionId === question?.id);
  const retry = record?.attempts.at(-1)?.correct === false;
  const caption = complete ? bfsCheckContent.completion.caption : `${retry ? "もう一度、" : ""}${question?.prompt ?? ""}`;
  const step = getLearningStep(bfsExecutionContent, question?.stepId ?? bfsCheckContent.completion.stepId);
  const submit = (answer: NodeAnswer) => {
    if (question) setSession(current => answerQuestion(bfsCheckContent, current, question.id, answer));
  };
  useEffect(() => { captionRef.current?.focus(); }, [question?.id, complete, record?.attemptCount]);

  return <Box component="main" sx={{ minHeight: "100dvh", display: "grid", placeItems: "center", bgcolor: playerTokens.background, color: playerTokens.text }}>
    <Box component="section" aria-label="BFSの理解度確認" sx={{ width: "84vw", height: "84dvh", minHeight: 500, p: 1, display: "flex", flexDirection: "column" }}>
      <Typography ref={captionRef} component="p" tabIndex={-1} aria-live="polite" aria-atomic="true" sx={{
        color: playerTokens.text, fontWeight: 700, textAlign: "center", fontSize: "clamp(18px, 1.5vw, 30px)",
        minHeight: "3em", flexShrink: 0, display: "grid", alignItems: "center", mb: 1, outline: "none",
      }}>{caption}</Typography>
      <Box sx={{ flex: 1, minHeight: 320 }}>
        <BfsExecutionCanvas canvas={step.canvas} renderNodeOverlay={question ? (nodeId, radius) => {
          const size = Math.max(44, radius * 2);
          return <foreignObject x={-size / 2} y={-size / 2} width={size} height={size}>
            <Box component="button" type="button" aria-label={`${nodeId}を選ぶ`} onClick={() => submit({ kind: "node", nodeId })}
              sx={{ width: "100%", height: "100%", display: "block", p: 0, border: 0, borderRadius: "50%", background: "transparent", cursor: "pointer",
                "&:hover, &:focus-visible": { outline: `3px dashed ${playerTokens.focus}`, outlineOffset: "-3px" } }} />
          </foreignObject>;
        } : undefined} />
      </Box>
      <Box sx={{ minHeight: 44, mt: 1, flexShrink: 0, display: "flex", flexWrap: "wrap", gap: 1, justifyContent: "center", alignItems: "center" }}>
        {question?.allowNone && <Button variant="outlined" onClick={() => submit({ kind: "none" })}
          sx={{ color: playerTokens.text, borderColor: playerTokens.control }}>どれも入らない</Button>}
        {retry && <Button onClick={() => setReviewOpen(true)} sx={{ color: playerTokens.text }}>該当ステップの動きを確認する</Button>}
      </Box>
    </Box>
    {reviewOpen && question && <LearningReviewDialog content={bfsExecutionContent} stepIds={question.reviewStepIds}
      renderCanvas={canvas => <BfsExecutionCanvas canvas={canvas} />} onClose={() => setReviewOpen(false)} />}
  </Box>;
}
