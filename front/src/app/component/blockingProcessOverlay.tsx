"use client";

import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
import { Box, CircularProgress, Paper, Typography, keyframes } from "@mui/material";
import { useEffect, useState } from "react";

import { getMascotImagePath, useUserMascot } from "./mascot";

type BlockingProcessOverlayProps = {
  open: boolean;
  title: string;
  description?: string;
  delayMs?: number;
  mascotState?: "normal" | "happy" | "cheer" | "thinking" | "surprise" | "celebrate";
};

const mascotBounce = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
`;

const sparkle = keyframes`
  0%, 100% { opacity: 0.4; transform: scale(0.9); }
  50% { opacity: 1; transform: scale(1.14); }
`;

export const BlockingProcessOverlay = ({
  open,
  title,
  description,
  delayMs = 450,
  mascotState = "cheer",
}: BlockingProcessOverlayProps) => {
  const [visible, setVisible] = useState(false);
  const mascotId = useUserMascot();

  useEffect(() => {
    if (!open) {
      setVisible(false);
      return;
    }

    const timer = window.setTimeout(() => setVisible(true), delayMs);
    return () => window.clearTimeout(timer);
  }, [delayMs, open]);

  if (!visible) return null;

  return (
    <Box
      role="status"
      aria-live="polite"
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 2100,
        bgcolor: "rgba(15, 23, 42, 0.42)",
        backdropFilter: "blur(2px)",
        display: "grid",
        placeItems: "center",
        pointerEvents: "all",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: "min(500px, calc(100vw - 32px))",
          p: 3,
          borderRadius: 4,
          border: "1px solid #bfdbfe",
          boxShadow: "0 24px 70px rgba(15, 23, 42, 0.26)",
        }}
      >
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "72px 1fr 32px", sm: "92px 1fr 32px" }, gap: 2, alignItems: "center" }}>
          <Box
            sx={{
              position: "relative",
              display: "grid",
              placeItems: "center",
            }}
          >
            <Box
              component="img"
              src={getMascotImagePath(mascotId, mascotState)}
              alt="相棒マスコット"
              sx={{
                width: { xs: 68, sm: 84 },
                height: { xs: 68, sm: 84 },
                objectFit: "contain",
                animation: `${mascotBounce} 1200ms ease-in-out infinite`,
                "@media (prefers-reduced-motion: reduce)": { animation: "none" },
              }}
            />
            <AutoAwesomeRoundedIcon
              sx={{
                position: "absolute",
                top: 4,
                right: 4,
                fontSize: 16,
                color: "#f59e0b",
                animation: `${sparkle} 900ms ease-in-out infinite`,
                "@media (prefers-reduced-motion: reduce)": { animation: "none" },
              }}
            />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.75 }}>
              <Box
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  bgcolor: "#eff6ff",
                  color: "#0052d9",
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                }}
              >
                <TaskAltRoundedIcon fontSize="small" />
              </Box>
              <Typography fontWeight={900} color="#0f172a">
                {title}
              </Typography>
            </Box>
            {description && (
              <Typography variant="body2" color="#475569" sx={{ mt: 0.5, lineHeight: 1.7 }}>
                {description}
              </Typography>
            )}
          </Box>
          <CircularProgress size={26} thickness={5} />
        </Box>
      </Paper>
    </Box>
  );
};
