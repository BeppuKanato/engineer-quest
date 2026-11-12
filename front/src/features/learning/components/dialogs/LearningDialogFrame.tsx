"use client";

import CloseIcon from "@mui/icons-material/Close";
import { Box, Dialog, IconButton, type SxProps, type Theme } from "@mui/material";
import type { ReactNode } from "react";
import { playerTokens } from "../../player/player.tokens";

/** 復習・トレース共通の外枠。教材選択、再生、トレースの意味は呼び出し側に残す。 */
export function LearningDialogFrame({ label, dialogLabel, closeLabel, onClose, paperSx = [], children }: {
  label: string;
  dialogLabel?: string;
  closeLabel: string;
  onClose: () => void;
  paperSx?: SxProps<Theme>;
  children: ReactNode;
}) {
  return <Dialog open onClose={onClose} maxWidth={false} aria-label={dialogLabel}
    slotProps={{ paper: { "aria-label": label, sx: [
      { width: "84vw", height: "84dvh", maxHeight: "calc(100dvh - 16px)", m: 1, borderRadius: 0, boxShadow: "none", bgcolor: playerTokens.surface },
      ...(Array.isArray(paperSx) ? paperSx : [paperSx]),
    ] } }}>
    <Box sx={{ display: "flex", justifyContent: "flex-end", flexShrink: 0 }}>
      <IconButton aria-label={closeLabel} onClick={onClose} sx={{ color: playerTokens.control }}><CloseIcon /></IconButton>
    </Box>
    {children}
  </Dialog>;
}
