"use client";

import PauseIcon from "@mui/icons-material/Pause";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import ReplayIcon from "@mui/icons-material/Replay";
import SkipNextIcon from "@mui/icons-material/SkipNext";
import SkipPreviousIcon from "@mui/icons-material/SkipPrevious";
import { Box, IconButton, Slider, Stack, Typography } from "@mui/material";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { useLearningVisit, type LearningInstrumentation } from "../instrumentation/useLearningVisit";
import { PhaseNextButton } from "../app/PhaseNextButton";

import type { CanvasSnapshot, LearningContent } from "./content.types";
import { advancePredictionPlayback, initialPredictionPlayback, type PredictionPlaybackAction } from "./predictionPlayback";
import { PredictionChoices } from "./PredictionChoices";
import { playerTokens } from "./player.tokens";

export type LearningPlayerProps<TCanvas extends CanvasSnapshot> = LearningInstrumentation & {
  content: LearningContent<TCanvas>;
  renderCanvas: (canvas: TCanvas) => ReactNode;
  /** 最終ステップでのみ操作バーに出す接続用アクション（単元フローでの次フェーズへの遷移など）。未指定なら従来どおり出さない。 */
  endAction?: { label: string; onClick: () => void };
};

/** コンテンツの差し替えは再生セッションを作り直す。再生制御は図の形式を知らない。 */
export function LearningPlayer<TCanvas extends CanvasSnapshot>(props: LearningPlayerProps<TCanvas>) {
  return <PlaybackSession key={`${props.content.id}:${props.content.version}`} {...props} />;
}

function PlaybackSession<TCanvas extends CanvasSnapshot>({ content, renderCanvas, endAction, onLearningEvent, active = true }: LearningPlayerProps<TCanvas>) {
  const reduced = useReducedMotion();
  const playerRef = useRef<HTMLElement>(null);
  const [session, setSession] = useState(initialPredictionPlayback);
  const { playback } = session;
  const count = content.steps.length;
  const step = content.steps[Math.min(playback.index, count - 1)];
  const pendingStep = session.pendingIndex === null ? null : content.steps[session.pendingIndex];
  const prediction = pendingStep?.prediction;
  const hasPredictions = content.steps.some(item => item.prediction);
  useLearningVisit(onLearningEvent, active, "player_step_view", step.id, { contentId: content.id, position: playback.index });
  useLearningVisit(onLearningEvent, active && !!prediction, "player_prediction_view", pendingStep?.id, { contentId: content.id });
  const dispatch = (action: PredictionPlaybackAction) => {
    if (!active) return;
    const next = advancePredictionPlayback(session, action, content);
    if (next === session) return;
    if (action.type === "answer" || action.type === "skip") {
      onLearningEvent?.({ eventType: action.type === "answer" ? "player_prediction_answer" : "player_prediction_skip",
        targetId: pendingStep?.id, payload: { contentId: content.id,
          ...(action.type === "answer" ? { choiceId: action.choiceId, correct: next.feedback?.correct } : {}) } });
      playerRef.current?.focus({ preventScroll: true });
    } else {
      onLearningEvent?.({ eventType: "player_action", targetId: step.id, payload: { contentId: content.id,
        action: action.type === "toggle" ? next.playback.playing ? "play" : "pause" : action.type, from: step.id, to: content.steps[next.playback.index].id } });
    }
    setSession(current => advancePredictionPlayback(current, action, content));
  };
  useEffect(() => { if (active && playback.index === count - 1) onLearningEvent?.({ eventType: "player_end_reached", targetId: step.id, payload: { contentId: content.id } }); }, [active, playback.index, count, step.id, content.id, onLearningEvent]);

  useEffect(() => {
    setSession(initialPredictionPlayback());
  }, [content]);

  useEffect(() => {
    if (!playback.playing || !active) return;
    const timer = window.setTimeout(() => {
      setSession(current => advancePredictionPlayback(current, { type: "tick" }, content));
    }, Math.max(content.intervalMs, playerTokens.autoplayFloorMs, playerTokens.transitionMs + 50));
    return () => window.clearTimeout(timer);
  }, [content, count, playback, active]);

  return (
    <Box component="section" ref={playerRef} aria-label="学習プレイヤー" tabIndex={0}
      onKeyDown={(event) => {
        // スライダー等の入力部品は自身のキー操作を優先する。
        if (prediction || event.altKey || event.ctrlKey || event.metaKey ||
          (event.target instanceof Element && event.target.closest('input, textarea, select, [contenteditable="true"], [role="slider"]'))) return;
        const positions: Partial<Record<string, number>> = {
          ArrowLeft: playback.index - 1, ArrowRight: playback.index + 1, Home: 0, End: count - 1,
        };
        const index = positions[event.key];
        if (index === undefined) return;
        event.preventDefault();
        dispatch({ type: "seek", index });
      }} sx={{
      width: "100%", flex: 1, minWidth: 0, minHeight: 0, bgcolor: playerTokens.surface,
      color: playerTokens.text, p: { xs: 1, sm: 2 }, display: "flex", flexDirection: "column",
    }}>
      <Box aria-live="polite" aria-atomic="true" sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
        <Typography component="p" sx={{
          color: playerTokens.text, fontWeight: 700, textAlign: "center", fontSize: "clamp(18px, 1.5vw, 30px)",
          minHeight: "2.8em", flexShrink: 0, display: "grid", alignItems: "center", mb: 1,
        }}>{prediction ? `次にどうなる？ ${prediction.prompt}` : step.caption}</Typography>
        {hasPredictions && <Typography role="status" sx={{ color: playerTokens.text, textAlign: "center", minHeight: "1.6em", flexShrink: 0 }}>
          {session.feedback ? session.feedback.correct === null ? "予想を飛ばして、続きの動きを見てみましょう。"
            : session.feedback.correct ? "予想が当たりました。" : "予想とは違いました。続きの動きを見てみましょう。" : ""}
        </Typography>}
        <Box sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: { xs: "column", sm: "row" }, overflow: "auto" }}>
          <Box sx={{ flex: 1, minWidth: 0, minHeight: { xs: prediction ? 220 : 0, sm: 0 } }}>{renderCanvas(step.canvas)}</Box>
          {prediction && <Box sx={{ width: { xs: "100%", sm: "30%" }, flexShrink: 0, overflowY: "auto" }}>
            <PredictionChoices prediction={prediction} disabled={!active}
              onAnswer={choiceId => dispatch({ type: "answer", choiceId })} onSkip={() => dispatch({ type: "skip" })} />
          </Box>}
        </Box>
      </Box>
      <Stack direction="row" alignItems="center" justifyContent="center" gap={{ xs: 0.5, sm: 1.5 }} role="group" aria-label="再生操作"
        sx={{ mt: 1, flexShrink: 0, color: playerTokens.control, "& .MuiIconButton-root": { color: "inherit" }, "& .MuiIconButton-root:focus-visible": { outline: `2px solid ${playerTokens.control}` } }}>
        <IconButton aria-label={playback.playing ? "一時停止" : playback.index === count - 1 ? "最初から再生" : "再生"}
          disabled={count < 2 || !!prediction} onClick={() => dispatch({ type: "toggle" })}
          sx={{ width: 56, height: 56, "& .MuiSvgIcon-root": { fontSize: 40 } }}>
          {playback.playing ? <PauseIcon /> : playback.index === count - 1 ? <ReplayIcon /> : <PlayArrowIcon />}
        </IconButton>
        <IconButton aria-label="前のステップ" disabled={playback.index === 0 || !!prediction}
          onClick={() => dispatch({ type: "seek", index: playback.index - 1 })} sx={{ width: 48, height: 48, "& .MuiSvgIcon-root": { fontSize: 30 } }}><SkipPreviousIcon /></IconButton>
        <IconButton aria-label="次のステップ" disabled={playback.index === count - 1 || !!prediction}
          onClick={() => dispatch({ type: "seek", index: playback.index + 1 })} sx={{ width: 48, height: 48, "& .MuiSvgIcon-root": { fontSize: 30 } }}><SkipNextIcon /></IconButton>
        <Slider aria-label="ステップ位置" data-seek-slider value={playback.index}
          min={0} max={Math.max(count - 1, 0)} step={1} disabled={count < 2 || !!prediction}
          getAriaValueText={(value) => `${value + 1} / ${count}`}
          onChange={(_, value) => dispatch({ type: "seek", index: Array.isArray(value) ? value[0] : value })}
          sx={{ flex: "1 1 auto", maxWidth: 320, minWidth: 40, mx: 0.5, color: playerTokens.control,
            "& .MuiSlider-rail": { bgcolor: "#d1d5db", opacity: 1, height: 6 },
            "& .MuiSlider-track": { height: 6 },
            "& .MuiSlider-thumb": { width: 22, height: 22 },
            "&:focus-visible": { outline: `2px solid ${playerTokens.control}`, outlineOffset: 2 } }} />
        <Typography component="span" sx={{ fontSize: 15, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
          {playback.index + 1} / {count}
        </Typography>
        {endAction && playback.index === count - 1 && (
          <Box component={motion.div}
            initial={reduced ? false : { opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: reduced ? 0 : 0.3, ease: "easeOut" }}
            sx={{ ml: 1.5, flexShrink: 0 }}>
            <PhaseNextButton label={endAction.label}
              onClick={() => { onLearningEvent?.({ eventType: "player_end_action", targetId: step.id, payload: { contentId: content.id } }); endAction.onClick(); }} />
          </Box>
        )}
      </Stack>
    </Box>
  );
}
