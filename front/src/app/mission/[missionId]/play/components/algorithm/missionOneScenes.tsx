"use client";

import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CodeIcon from "@mui/icons-material/Code";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import LoopIcon from "@mui/icons-material/Loop";
import { Box, Chip, Paper, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";

import { ArrayCards } from "./primitives";

const SortState = ({ label, values, tone }: { label: string; values: number[]; tone: "blue" | "green" | "orange" }) => {
  const colors = {
    blue: { border: "#60a5fa", bg: "#eff6ff", text: "#1d4ed8" },
    green: { border: "#6ee7b7", bg: "#ecfdf5", text: "#047857" },
    orange: { border: "#fdba74", bg: "#fff7ed", text: "#c2410c" },
  }[tone];
  return (
    <Stack spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
      <Chip label={label} sx={{ bgcolor: colors.bg, color: colors.text, fontWeight: 900 }} />
      <Box sx={{ "& > div > div > div": { borderColor: colors.border } }}>
        <ArrayCards values={values} compact />
      </Box>
    </Stack>
  );
};

export const SortOverviewScene = ({
  beforeValues,
  ascendingValues,
  descendingValues,
  explanation,
  finalExplanation,
}: {
  beforeValues: number[];
  ascendingValues: number[];
  descendingValues: number[];
  explanation: string;
  finalExplanation: string;
}) => (
  <Stack spacing={2.5}>
    <Typography component="h2" sx={{ fontSize: { xs: 18, sm: 20 }, fontWeight: 950 }}>
      ソートの例を見てみよう
    </Typography>
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "1fr auto 1fr auto 1fr" }, gap: 2, alignItems: "center" }}>
      <SortState label="並べ替え前" values={beforeValues} tone="blue" />
      <ArrowForwardIcon sx={{ display: { xs: "none", xl: "block" }, color: "#94a3b8", fontSize: 38 }} />
      <SortState label="昇順（小さい順）" values={ascendingValues} tone="green" />
      <ArrowForwardIcon sx={{ display: { xs: "none", xl: "block" }, color: "#94a3b8", fontSize: 38 }} />
      <SortState label="降順（大きい順）" values={descendingValues} tone="orange" />
    </Box>
    <Paper elevation={0} sx={{ p: 2, borderRadius: 2, bgcolor: "#eff6ff", border: "1px solid #bfdbfe" }}>
      <Stack direction="row" spacing={1.5} alignItems="flex-start">
        <LightbulbIcon color="primary" />
        <Box>
          <Typography fontWeight={950}>ソートとは？</Typography>
          <Typography sx={{ mt: 0.5, lineHeight: 1.8, color: "#334155" }}>
            {explanation}
          </Typography>
        </Box>
      </Stack>
    </Paper>
    <Typography fontWeight={900} color="#1d4ed8">
      {finalExplanation}
    </Typography>
  </Stack>
);

const roadmapIcons: ReactNode[] = [
  <LightbulbIcon key="idea" />,
  <CompareArrowsIcon key="compare" />,
  <ArrowForwardIcon key="progress" />,
  <LoopIcon key="loop" />,
  <CheckCircleIcon key="check" />,
  <CodeIcon key="code" />,
  <EmojiEventsIcon key="goal" />,
];

export const LearningRoadmapScene = ({ steps, emphasis }: { steps: string[]; emphasis: string }) => (
  <Stack spacing={2.5}>
    <Typography component="h2" sx={{ fontSize: { xs: 18, sm: 20 }, fontWeight: 950 }}>
      学習の流れ
    </Typography>
    <Box sx={{ overflowX: "auto", overflowY: "hidden", pt: 2, pb: 1 }}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: `repeat(${Math.max(steps.length, 1)}, minmax(145px, 1fr))`,
          gap: 1.5,
          minWidth: Math.max(steps.length, 1) * 158,
        }}
      >
        {steps.map((step, index) => (
          <Paper key={step} elevation={0} sx={{ position: "relative", minHeight: 170, p: 2, pt: 3.5, borderRadius: 2, border: "1px solid #93c5fd", textAlign: "center" }}>
            <Chip label={index + 1} color="primary" sx={{ position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)", fontWeight: 950 }} />
            <Box sx={{ width: 52, height: 52, mx: "auto", mb: 1.5, borderRadius: "50%", display: "grid", placeItems: "center", bgcolor: "#eff6ff", color: "#2563eb" }}>
              {roadmapIcons[index % roadmapIcons.length]}
            </Box>
            <Typography fontWeight={900} sx={{ lineHeight: 1.55 }}>{step}</Typography>
          </Paper>
        ))}
      </Box>
    </Box>
    <Paper elevation={0} sx={{ p: 2, borderRadius: 2, bgcolor: "#ecfdf5", border: "1px solid #a7f3d0" }}>
      <Stack direction="row" spacing={1} alignItems="center">
        <CheckCircleIcon color="success" />
        <Typography fontWeight={950}>{emphasis}</Typography>
      </Stack>
    </Paper>
  </Stack>
);
