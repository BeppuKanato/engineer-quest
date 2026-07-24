"use client";

import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import { Box, LinearProgress, Paper, Typography, keyframes } from "@mui/material";
import { useEffect, useState } from "react";

import { getMascotImagePath, useUserMascot } from "./mascot";

type PageTransitionOverlayProps = {
  open: boolean;
  title?: string;
  description?: string;
  message?: string;
  mascotState?: "normal" | "happy" | "cheer" | "thinking" | "surprise" | "celebrate";
  delayMs?: number;
};

const float = keyframes`
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-6px) scale(1.03); }
`;

const sparkle = keyframes`
  0%, 100% { opacity: 0.45; transform: scale(0.9); }
  50% { opacity: 1; transform: scale(1.16); }
`;

export const PageTransitionOverlay = ({
  open,
  title = "次の画面を準備しています",
  description,
  message,
  mascotState = "thinking",
  delayMs = 450,
}: PageTransitionOverlayProps) => {
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
        zIndex: 2200,
        bgcolor: "rgba(15, 23, 42, 0.28)",
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
          p: { xs: 2.5, sm: 3 },
          borderRadius: 4,
          border: "1px solid #bfdbfe",
          bgcolor: "rgba(255, 255, 255, 0.96)",
          boxShadow: "0 24px 70px rgba(15, 23, 42, 0.24)",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(circle at 22% 18%, rgba(96,165,250,0.18), transparent 34%), radial-gradient(circle at 84% 20%, rgba(250,204,21,0.16), transparent 28%)",
            pointerEvents: "none",
          }}
        />
        <Box sx={{ position: "relative", display: "grid", gridTemplateColumns: "96px 1fr", gap: 2.5, alignItems: "center" }}>
          <Box sx={{ position: "relative", display: "grid", placeItems: "center" }}>
            <Box
              component="img"
              src={getMascotImagePath(mascotId, mascotState)}
              alt="相棒マスコット"
              sx={{
                width: 88,
                height: 88,
                objectFit: "contain",
                animation: `${float} 1300ms ease-in-out infinite`,
                "@media (prefers-reduced-motion: reduce)": { animation: "none" },
              }}
            />
            {[0, 1, 2].map((index) => (
              <AutoAwesomeRoundedIcon
                key={index}
                sx={{
                  position: "absolute",
                  color: index === 1 ? "#f59e0b" : "#2563eb",
                  fontSize: index === 1 ? 16 : 13,
                  top: index === 0 ? 8 : index === 1 ? 20 : 64,
                  left: index === 0 ? 6 : index === 1 ? 76 : 16,
                  animation: `${sparkle} ${900 + index * 180}ms ease-in-out infinite`,
                  "@media (prefers-reduced-motion: reduce)": { animation: "none" },
                }}
              />
            ))}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography fontWeight={900} color="#0f172a" sx={{ fontSize: { xs: 18, sm: 20 } }}>
              {message ?? title}
            </Typography>
            <Typography color="#475569" sx={{ mt: 0.75, lineHeight: 1.7, fontWeight: 700 }}>
              {description ?? "操作を受け付けました。画面を切り替えています。"}
            </Typography>
            <LinearProgress
              sx={{
                mt: 2,
                height: 8,
                borderRadius: 999,
                bgcolor: "#dbeafe",
                "& .MuiLinearProgress-bar": {
                  borderRadius: 999,
                  background: "linear-gradient(90deg, #2563eb, #38bdf8)",
                },
              }}
            />
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};
