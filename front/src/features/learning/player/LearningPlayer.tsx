"use client";

import PauseIcon from "@mui/icons-material/Pause";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import ReplayIcon from "@mui/icons-material/Replay";
import SkipNextIcon from "@mui/icons-material/SkipNext";
import SkipPreviousIcon from "@mui/icons-material/SkipPrevious";
import { Box, IconButton, Stack, Typography } from "@mui/material";
import { useEffect, useState, type ReactNode } from "react";

import type { CanvasSnapshot, LearningContent } from "./content.types";
import { advancePlayback, type PlaybackAction, type PlaybackState } from "./playback";
import { playerTokens } from "./player.tokens";

export type LearningPlayerProps<TCanvas extends CanvasSnapshot> = {
  content: LearningContent<TCanvas>;
  renderCanvas: (canvas: TCanvas) => ReactNode;
};

/** コンテンツの差し替えは再生セッションを作り直す。再生制御は図の形式を知らない。 */
export function LearningPlayer<TCanvas extends CanvasSnapshot>(props: LearningPlayerProps<TCanvas>) {
  return <PlaybackSession key={`${props.content.id}:${props.content.version}`} {...props} />;
}

function PlaybackSession<TCanvas extends CanvasSnapshot>({ content, renderCanvas }: LearningPlayerProps<TCanvas>) {
  const [playback, setPlayback] = useState<PlaybackState>({ index: 0, playing: false });
  const count = content.steps.length;
  const step = content.steps[Math.min(playback.index, count - 1)];
  const dispatch = (action: PlaybackAction) => setPlayback((current) => advancePlayback(current, action, count));

  useEffect(() => {
    setPlayback({ index: 0, playing: false });
  }, [content]);

  useEffect(() => {
    if (!playback.playing) return;
    const timer = window.setTimeout(() => {
      setPlayback((current) => advancePlayback(current, { type: "tick" }, count));
    }, content.intervalMs);
    return () => window.clearTimeout(timer);
  }, [content, count, playback]);

  return (
    <Box component="section" aria-label="学習プレイヤー" sx={{
      width: "100%", maxWidth: 880, mx: "auto", bgcolor: playerTokens.surface,
      color: playerTokens.text, borderRadius: 3, px: { xs: 1.5, sm: 4 }, py: { xs: 2, sm: 4 },
    }}>
      <Box aria-live="polite" aria-atomic="true">
        <Typography component="p" sx={{
          color: playerTokens.text, fontWeight: 700, textAlign: "center", fontSize: { xs: 18, sm: 22 },
          minHeight: "3.2em", display: "grid", alignItems: "center", mb: 2,
        }}>{step.caption}</Typography>
        {renderCanvas(step.canvas)}
      </Box>
      <Stack direction="row" alignItems="center" gap={{ xs: 0.5, sm: 1.5 }} role="group" aria-label="再生操作"
        sx={{ mt: 3, color: playerTokens.control, "& .MuiIconButton-root:focus-visible": { outline: `2px solid ${playerTokens.control}` } }}>
        <IconButton aria-label="前のステップ" disabled={playback.index === 0}
          onClick={() => dispatch({ type: "seek", index: playback.index - 1 })}><SkipPreviousIcon /></IconButton>
        <IconButton aria-label={playback.playing ? "一時停止" : playback.index === count - 1 ? "最初から再生" : "再生"}
          disabled={count < 2} onClick={() => dispatch({ type: "toggle" })}>
          {playback.playing ? <PauseIcon /> : playback.index === count - 1 ? <ReplayIcon /> : <PlayArrowIcon />}
        </IconButton>
        <Box component="input" type="range" aria-label="ステップ位置" min={1} max={count} step={1}
          value={playback.index + 1} aria-valuetext={`${playback.index + 1} / ${count}`} disabled={count < 2}
          onChange={(event) => dispatch({ type: "seek", index: Number(event.target.value) - 1 })}
          sx={{ flex: 1, minWidth: 40, height: 32, accentColor: playerTokens.control, cursor: "pointer" }} />
        <Typography component="span" sx={{ fontSize: 14, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
          {playback.index + 1} / {count}
        </Typography>
        <IconButton aria-label="次のステップ" disabled={playback.index === count - 1}
          onClick={() => dispatch({ type: "seek", index: playback.index + 1 })}><SkipNextIcon /></IconButton>
      </Stack>
    </Box>
  );
}
