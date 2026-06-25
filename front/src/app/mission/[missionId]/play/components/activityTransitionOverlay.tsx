"use client";

import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CloseIcon from "@mui/icons-material/Close";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import FlagIcon from "@mui/icons-material/Flag";
import { Box, Chip, IconButton, Paper, Stack, Typography } from "@mui/material";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect } from "react";

type ActivityTransitionOverlayProps = {
  open: boolean;
  kind: "section" | "mission_check";
  sectionNumber: number | null;
  sectionCount: number;
  title: string;
  description: string | null;
  activityCount: number;
  onClose: () => void;
};

export const ActivityTransitionOverlay = ({
  open,
  kind,
  sectionNumber,
  sectionCount,
  title,
  description,
  activityCount,
  onClose,
}: ActivityTransitionOverlayProps) => {
  const reduceMotion = useReducedMotion();
  const isMissionCheck = kind === "mission_check";

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(onClose, reduceMotion ? 1800 : 1800
      
    );
    return () => window.clearTimeout(timer);
  }, [onClose, open, reduceMotion]);

  return (
    <AnimatePresence>
      {open && (
        <Box
          component={motion.div}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0.1 : 0.18 }}
          sx={{
            position: "fixed",
            inset: 0,
            zIndex: 1350,
            display: "grid",
            placeItems: "center",
            p: 2,
            bgcolor: "rgba(15, 23, 42, 0.42)",
            backdropFilter: reduceMotion ? "none" : "blur(3px)",
          }}
        >
          <Paper
            component={motion.div}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -10, scale: 1.03 }}
            transition={{ type: "spring", stiffness: 380, damping: 27 }}
            elevation={0}
            sx={{
              width: "100%",
              maxWidth: 560,
              p: { xs: 3, md: 4 },
              borderRadius: 3,
              border: isMissionCheck ? "2px solid #f59e0b" : "2px solid #60a5fa",
              boxShadow: "0 26px 64px rgba(15, 23, 42, 0.28)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                position: "absolute",
                inset: "0 0 auto 0",
                height: 7,
                bgcolor: isMissionCheck ? "#f59e0b" : "#2563eb",
              }}
            />
            <IconButton
              aria-label="演出を閉じる"
              onClick={onClose}
              sx={{ position: "absolute", top: 12, right: 12 }}
            >
              <CloseIcon />
            </IconButton>

            <Stack spacing={1.5} alignItems="center" textAlign="center">
              <Box
                sx={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  bgcolor: isMissionCheck ? "#fff7ed" : "#eff6ff",
                  color: isMissionCheck ? "#d97706" : "#2563eb",
                }}
              >
                {isMissionCheck ? (
                  <FactCheckIcon sx={{ fontSize: 40 }} />
                ) : (
                  <FlagIcon sx={{ fontSize: 40 }} />
                )}
              </Box>
              <Chip
                icon={isMissionCheck ? <AutoAwesomeIcon /> : undefined}
                label={
                  isMissionCheck
                    ? "MISSION CHECK"
                    : `SECTION ${sectionNumber ?? "-"} / ${sectionCount}`
                }
                sx={{
                  bgcolor: isMissionCheck ? "#fff7ed" : "#eff6ff",
                  color: isMissionCheck ? "#c2410c" : "#1d4ed8",
                  fontWeight: 900,
                  "& .MuiChip-icon": { color: "inherit" },
                }}
              />
              <Typography
                component="h2"
                sx={{ fontSize: { xs: 27, md: 34 }, lineHeight: 1.25, fontWeight: 900 }}
              >
                {isMissionCheck ? "確認タイムです" : title}
              </Typography>
              <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>
                {isMissionCheck
                  ? `ここまでの内容を${activityCount}問で確認します。`
                  : description ?? "新しい学習のまとまりに進みます。"}
              </Typography>
              <Typography fontWeight={900} color={isMissionCheck ? "#b45309" : "#1d4ed8"}>
                {isMissionCheck ? "セクション完了！" : `${activityCount}アクティビティ`}
              </Typography>
            </Stack>
          </Paper>
        </Box>
      )}
    </AnimatePresence>
  );
};
