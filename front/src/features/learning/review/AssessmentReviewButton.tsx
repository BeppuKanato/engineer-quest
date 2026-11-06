"use client";

import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";
import { Button } from "@mui/material";
import { playerTokens } from "../player/player.tokens";

/** 不正解から動きを見直すための、回答画面共通の主導線。 */
export function AssessmentReviewButton({ label, onClick, ariaLabel }: { label: string; onClick: () => void; ariaLabel?: string }) {
  return <Button type="button" variant="contained" onClick={onClick} aria-label={ariaLabel}
    startIcon={<LightbulbOutlinedIcon />} endIcon={<ArrowForwardIcon />}
    sx={{ minHeight: 48, px: 2.5, py: 1.25, maxWidth: "100%", fontSize: "clamp(16px, 1.1vw, 18px)", fontWeight: 700,
      textAlign: "left", bgcolor: playerTokens.focus, color: playerTokens.surface,
      "&:hover": { bgcolor: playerTokens.states.processing.stroke },
      "&:focus-visible": { outline: `3px solid ${playerTokens.control}`, outlineOffset: 3 } }}>
    {label.replace(/^💡\s*/u, "")}
  </Button>;
}
