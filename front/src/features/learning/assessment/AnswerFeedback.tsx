"use client";

import { Box, Typography } from "@mui/material";
import { motion, useReducedMotion } from "framer-motion";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { useSoundEffect } from "@/app/component/soundFeedback";
import { playerTokens } from "../player/player.tokens";
import type { AssessmentContent, AssessmentState } from "./assessment";
import { newAnswerFeedback, type AnswerFeedback } from "./answerFeedbackState";

type FeedbackContextValue = {
  present: (feedback: AnswerFeedback) => void;
  clear: (assessmentId: string) => void;
  messages: Readonly<Record<string, AnswerFeedback>>;
};
const FeedbackContext = createContext<FeedbackContextValue>({ present: () => undefined, clear: () => undefined, messages: {} });
export const answerFeedbackDurationMs = 1500;

/** 画面の進行と独立した短い回答レスポンス。フェーズが閉じても最後の正解を提示できる。 */
export function AnswerFeedbackProvider({ children }: { children: ReactNode }) {
  const { play } = useSoundEffect();
  const [feedback, setFeedback] = useState<(AnswerFeedback & { id: number }) | null>(null);
  const [messages, setMessages] = useState<Readonly<Record<string, AnswerFeedback>>>({});
  const sequence = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const present = useCallback((value: AnswerFeedback) => {
    if (timer.current !== null) clearTimeout(timer.current);
    play(value.correct ? "answerCorrect" : "answerIncorrect");
    const id = ++sequence.current;
    setMessages(current => ({ ...current, [value.assessmentId]: value }));
    setFeedback({ ...value, id });
    timer.current = setTimeout(() => {
      setFeedback(current => current?.id === id ? null : current);
      timer.current = null;
    }, answerFeedbackDurationMs);
  }, [play]);
  const clear = useCallback((assessmentId: string) => {
    setMessages(current => {
      if (!current[assessmentId]) return current;
      const next = { ...current };
      delete next[assessmentId];
      return next;
    });
  }, []);
  const value = useMemo(() => ({ present, clear, messages }), [present, clear, messages]);
  useEffect(() => () => { if (timer.current !== null) clearTimeout(timer.current); }, []);
  return <FeedbackContext.Provider value={value}>
    {children}
    {feedback && <AnswerFeedbackPresentation key={feedback.id} feedback={feedback} />}
  </FeedbackContext.Provider>;
}

/** 新しい試行だけを提示。再描画・StrictMode・復習・非表示からの復帰で音を再生し直さない。 */
export function useAssessmentFeedback(content: AssessmentContent, session: AssessmentState, active = true) {
  const { present, clear } = useContext(FeedbackContext);
  const previous = useRef(session);
  useEffect(() => {
    const before = previous.current;
    previous.current = session;
    if (session.records.every(record => record.attemptCount === 0)) { clear(content.id); return; }
    if (!active) return;
    const feedback = newAnswerFeedback(content, before, session);
    if (feedback) present(feedback);
  }, [content, session, active, present, clear]);
}

/** 文章は演出から独立した通常の画面要素として残す。単元内ではリザルトにも同じ枠を置く。 */
export function AnswerFeedbackNotice({ assessmentId }: { assessmentId?: string }) {
  const { messages } = useContext(FeedbackContext);
  const feedback = assessmentId ? messages[assessmentId] : undefined;
  return <Box role="status" aria-live="polite" aria-atomic="true" sx={{ flexShrink: 0, minWidth: 0 }}>
    {feedback && <Box sx={{ my: 1, px: 2, py: 1.25, bgcolor: playerTokens.layers.layer0,
      borderLeft: `4px solid ${playerTokens.focus}`, color: playerTokens.text }}>
      <Typography component="p" sx={{ fontSize: 14, fontWeight: 700, mb: 0.5 }}>直前の回答</Typography>
      <Typography component="p" sx={{ fontSize: "clamp(18px, 1.4vw, 22px)", fontWeight: 700, lineHeight: 1.6 }}>
        {feedback.message}
      </Typography>
    </Box>}
  </Box>;
}

export function AnswerFeedbackPresentation({ feedback }: { feedback: AnswerFeedback }) {
  const reduced = useReducedMotion();
  return <Box aria-hidden="true" data-answer-feedback={feedback.correct ? "correct" : "incorrect"}
    sx={{ position: "fixed", inset: 0, zIndex: 1400, pointerEvents: "none", display: "grid", placeItems: "center", p: 2 }}>
    <Box component={motion.div}
      initial={reduced ? false : { opacity: 0, scale: feedback.correct ? 0.65 : 1 }}
      animate={reduced ? { opacity: 1, scale: 1 } : { opacity: [0, 1, 1, 0], scale: feedback.correct ? [0.65, 1.12, 1] : 1 }}
      transition={{
        opacity: { duration: reduced ? 0 : answerFeedbackDurationMs / 1000, times: [0, 0.12, 0.88, 1] },
        scale: { duration: reduced ? 0 : playerTokens.transitionMs / 1000, times: [0, 0.5, 1] },
      }}
      sx={{ bgcolor: playerTokens.surface, color: playerTokens.text, borderRadius: 3, p: 2, maxWidth: 560, textAlign: "center" }}>
      <Box component="svg" viewBox="0 0 120 120" aria-hidden="true"
        sx={{ width: "clamp(96px, 12vw, 176px)", height: "clamp(96px, 12vw, 176px)", display: "block", mx: "auto",
          fill: "none", stroke: feedback.correct ? playerTokens.focus : playerTokens.control, strokeWidth: 8, strokeLinecap: "round" }}>
        {feedback.correct ? <circle cx={60} cy={60} r={44} /> : <path d="M30 30L90 90M90 30L30 90" />}
      </Box>
    </Box>
  </Box>;
}
