"use client";

import { LinearProgress } from "@mui/material";

type NavigationProgressProps = {
  open: boolean;
};

export const NavigationProgress = ({ open }: NavigationProgressProps) => {
  if (!open) return null;

  return (
    <LinearProgress
      aria-label="ページを移動しています"
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 2200,
        height: 3,
        bgcolor: "rgba(191, 219, 254, 0.7)",
        "& .MuiLinearProgress-bar": {
          bgcolor: "#60a5fa",
        },
      }}
    />
  );
};
