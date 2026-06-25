"use client";

import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import confetti from "canvas-confetti";
import { Box, Typography } from "@mui/material";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

export const ActivitySuccessCelebration = ({ fireKey }: { fireKey: number }) => {
  const [visibleKey, setVisibleKey] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (fireKey === 0) return;

    setVisibleKey(fireKey);
    if (!reduceMotion) {
      confetti({
        particleCount: 42,
        spread: 72,
        startVelocity: 28,
        ticks: 110,
        scalar: 0.85,
        origin: { x: 0.5, y: 0.48 },
        colors: ["#1976d2", "#38bdf8", "#22c55e", "#facc15"],
        disableForReducedMotion: true,
      });
    }

    const timer = window.setTimeout(() => setVisibleKey(0), reduceMotion ? 650 : 1050);
    return () => window.clearTimeout(timer);
  }, [fireKey, reduceMotion]);

  return (
    <AnimatePresence>
      {visibleKey > 0 && (
        <Box
          component={motion.div}
          key={visibleKey}
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.72, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 1.08, y: -16 }}
          transition={{ type: "spring", stiffness: 420, damping: 22 }}
          sx={{
            position: "fixed",
            inset: 0,
            zIndex: 1400,
            display: "grid",
            placeItems: "center",
            pointerEvents: "none",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              px: 3,
              py: 1.5,
              borderRadius: 999,
              border: "2px solid #86efac",
              bgcolor: "rgba(240, 253, 244, 0.96)",
              color: "#15803d",
              boxShadow: "0 18px 42px rgba(22, 163, 74, 0.24)",
            }}
          >
            <AutoAwesomeIcon />
            <Typography sx={{ fontSize: { xs: 24, md: 30 }, fontWeight: 900 }}>
              正解！
            </Typography>
          </Box>
        </Box>
      )}
    </AnimatePresence>
  );
};
