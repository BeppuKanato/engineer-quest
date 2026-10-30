"use client";

import PauseIcon from "@mui/icons-material/Pause";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import ReplayIcon from "@mui/icons-material/Replay";
import SkipNextIcon from "@mui/icons-material/SkipNext";
import SkipPreviousIcon from "@mui/icons-material/SkipPrevious";
import { Button, MenuItem, Select, Stack, Typography } from "@mui/material";

export const StepTraceControls = ({
  stepIndex,
  stepCount,
  playing = false,
  speed,
  showPlayback = true,
  showStepButtons = true,
  nextLabel,
  stepDescription,
  onReset,
  onPrevious,
  onNext,
  onPlayingChange,
  onSpeedChange,
}: {
  stepIndex: number;
  stepCount: number;
  playing?: boolean;
  speed?: number;
  showPlayback?: boolean;
  showStepButtons?: boolean;
  nextLabel?: string;
  stepDescription?: string;
  onReset: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onPlayingChange?: (playing: boolean) => void;
  onSpeedChange?: (speed: number) => void;
}) => {
  const atStart = stepIndex <= 0;
  const atEnd = stepCount === 0 || stepIndex >= stepCount - 1;
  const hasMultipleSteps = stepCount > 1;

  return (
    <Stack direction="row" gap={1} flexWrap="wrap" alignItems="center" aria-label="STEP TRACE操作">
      {hasMultipleSteps && <Button startIcon={<ReplayIcon />} onClick={onReset}>最初から</Button>}
      {hasMultipleSteps && showStepButtons && (
        <Button aria-label="前のステップ" disabled={atStart} onClick={onPrevious}>
          <SkipPreviousIcon />
        </Button>
      )}
      {hasMultipleSteps && showPlayback && onPlayingChange && (
        <Button
          variant="contained"
          startIcon={playing ? <PauseIcon /> : <PlayArrowIcon />}
          disabled={stepCount === 0}
          onClick={() => onPlayingChange(!playing)}
        >
          {playing ? "一時停止" : "再生"}
        </Button>
      )}
      {hasMultipleSteps && showStepButtons && (
        <Button
          aria-label={nextLabel ?? "次のステップ"}
          disabled={atEnd}
          onClick={onNext}
          endIcon={nextLabel ? <SkipNextIcon /> : undefined}
        >
          {nextLabel ?? <SkipNextIcon />}
        </Button>
      )}
      {hasMultipleSteps && speed !== undefined && onSpeedChange && (
        <Select
          size="small"
          value={speed}
          aria-label="再生速度"
          onChange={(event) => onSpeedChange(Number(event.target.value))}
        >
          <MenuItem value={1500}>ゆっくり</MenuItem>
          <MenuItem value={900}>標準</MenuItem>
          <MenuItem value={400}>速い</MenuItem>
        </Select>
      )}
      <Typography variant="body2" aria-live="polite" fontWeight={800}>
        {stepDescription ?? (stepCount === 0 ? "0 / 0" : `${stepIndex + 1} / ${stepCount}`)}
      </Typography>
    </Stack>
  );
};
