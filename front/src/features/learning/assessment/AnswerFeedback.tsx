"use client";

import { Box, Typography } from "@mui/material";
import { motion, useReducedMotion } from "framer-motion";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

import { useSoundEffect } from "@/app/component/soundFeedback";
import { playerTokens } from "../player/player.tokens";
import type { AssessmentContent, AssessmentState } from "./assessment";
import { newAnswerFeedback, type AnswerFeedback } from "./answerFeedbackState";

const PresentFeedback = createContext<(feedback: AnswerFeedback) => void>(() => undefined);
export const answerFeedbackDurationMs = playerTokens.transitionMs;

/** 画面の進行と独立した短い回答レスポンス。フェーズが閉じても最後の正解を提示できる。 */
export function AnswerFeedbackProvider({ children }: { children: ReactNode }) {
  const { play } = useSoundEffect();
  const [feedback, setFeedback] = useState<(AnswerFeedback & { id: number }) | null>(null);
  const sequence = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const present = useCallback((value: AnswerFeedback) => {
    if (timer.current !== null) clearTimeout(timer.current);
    play(value.correct ? "answerCorrect" : "answerIncorrect");
    const id = ++sequence.current;
    setFeedback({ ...value, id });
    timer.current = setTimeout(() => {
      setFeedback(current => current?.id === id ? null : current);
      timer.current = null;
    }, answerFeedbackDurationMs);
  }, [play]);
  useEffect(() => () => { if (timer.current !== null) clearTimeout(timer.current); }, []);
  return <PresentFeedback.Provider value={present}>
    {children}
    {feedback && <AnswerFeedbackPresentation key={feedback.id} feedback={feedback} />}
  </PresentFeedback.Provider>;
}

/** 新しい試行だけを提示。再描画・StrictMode・復習・非表示からの復帰で音を再生し直さない。 */
export function useAssessmentFeedback(content: AssessmentContent, session: AssessmentState, active = true) {
  const present = useContext(PresentFeedback);
  const previous = useRef(session);
  useEffect(() => {
    const before = previous.current;
    previous.current = session;
    if (!active) return;
    const feedback = newAnswerFeedback(content, before, session);
    if (feedback) present(feedback);
  }, [content, session, active, present]);
}

/** 教材に既にある説明は回答欄にも残す。短いモーション中に読み切ることを求めない。 */
export function AnswerFeedbackMessage({ message, prominent = false }: { message: string; prominent?: boolean }) {
  return <Typography component="p" sx={{ color: playerTokens.text, textAlign: "center", mt: 2,
    fontSize: prominent ? "clamp(20px, 1.8vw, 26px)" : 16, fontWeight: prominent ? 700 : 400 }}>{message}</Typography>;
}

export function AnswerFeedbackPresentation({ feedback }: { feedback: AnswerFeedback }) {
  const reduced = useReducedMotion();
  return <Box role="status" aria-live="polite" aria-atomic="true" data-answer-feedback={feedback.correct ? "correct" : "incorrect"}
    sx={{ position: "fixed", inset: 0, zIndex: 1400, pointerEvents: "none", display: "grid", placeItems: "center", p: 2 }}>
    <Box component={motion.div}
      initial={reduced ? false : { opacity: 0, scale: feedback.correct ? 0.65 : 1 }}
      animate={reduced ? { opacity: 1, scale: 1 } : { opacity: [0, 1, 1, 0], scale: feedback.correct ? [0.65, 1.12, 1, 1] : 1 }}
      transition={{ duration: reduced ? 0 : answerFeedbackDurationMs / 1000, times: [0, 0.3, 0.8, 1] }}
      sx={{ bgcolor: playerTokens.surface, color: playerTokens.text, borderRadius: 3, p: 2, maxWidth: 560, textAlign: "center" }}>
      <Box component="svg" viewBox="0 0 120 120" aria-hidden="true"
        sx={{ width: "clamp(96px, 12vw, 176px)", height: "clamp(96px, 12vw, 176px)", display: "block", mx: "auto",
          fill: "none", stroke: feedback.correct ? playerTokens.focus : playerTokens.control, strokeWidth: 8, strokeLinecap: "round" }}>
        {feedback.correct ? <circle cx={60} cy={60} r={44} /> : <path d="M30 30L90 90M90 30L30 90" />}
      </Box>
      <AnswerFeedbackMessage message={feedback.message} prominent />
    </Box>
  </Box>;
}
