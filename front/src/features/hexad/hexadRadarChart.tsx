"use client";

import { Box, Chip, Paper, Stack, Typography } from "@mui/material";

import type { HexadScores } from "@/api/hexad.api";

const axes: { key: keyof HexadScores; label: string; color: string }[] = [
  { key: "philanthropist", label: "Philanthropist", color: "#2563eb" },
  { key: "socialiser", label: "Socialiser", color: "#0891b2" },
  { key: "freeSpirit", label: "Free Spirit", color: "#7c3aed" },
  { key: "achiever", label: "Achiever", color: "#16a34a" },
  { key: "disruptor", label: "Disruptor", color: "#ea580c" },
  { key: "player", label: "Player", color: "#db2777" },
];

const center = 180;
const radius = 112;
const angleFor = (index: number) => -Math.PI / 2 + (Math.PI * 2 * index) / axes.length;
const pointAt = (index: number, ratio: number) => {
  const angle = angleFor(index);
  return `${center + Math.cos(angle) * radius * ratio},${center + Math.sin(angle) * radius * ratio}`;
};

export const HexadRadarChart = ({ scores }: { scores: HexadScores }) => {
  const scorePoints = axes
    .map((axis, index) => pointAt(index, (scores[axis.key] - 4) / 24))
    .join(" ");

  return (
    <Paper
      elevation={0}
      sx={{ p: { xs: 2.5, md: 3.5 }, borderRadius: 3, border: "1px solid #dbe3ef", bgcolor: "#fff" }}
    >
      <Typography variant="h5" fontWeight={900}>HEXADプロフィール</Typography>
      <Typography color="text.secondary" sx={{ mt: 0.75 }}>
        6つの動機づけ傾向を、各4設問の合計得点（4〜28点）で表示しています。
      </Typography>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(360px, 1fr) minmax(280px, 0.8fr)" }, gap: 3, alignItems: "center", mt: 2 }}>
        <Box sx={{ width: "100%", maxWidth: 480, mx: "auto" }}>
          <svg viewBox="0 0 360 360" role="img" aria-label="HEXADの6タイプの得点レーダーチャート" style={{ width: "100%", display: "block" }}>
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
              <polygon
                key={ratio}
                points={axes.map((_, index) => pointAt(index, ratio)).join(" ")}
                fill="none"
                stroke={ratio === 1 ? "#94a3b8" : "#dbe3ef"}
                strokeWidth={ratio === 1 ? 1.5 : 1}
              />
            ))}
            {[4, 10, 16, 22, 28].map((tick, index) => (
              <text
                key={tick}
                x={center + 5}
                y={center - radius * (index / 4) - 4}
                fontSize="9"
                fill="#64748b"
              >
                {tick}
              </text>
            ))}
            {axes.map((_, index) => (
              <line key={index} x1={center} y1={center} x2={pointAt(index, 1).split(",")[0]} y2={pointAt(index, 1).split(",")[1]} stroke="#cbd5e1" />
            ))}
            <polygon points={scorePoints} fill="rgba(37, 99, 235, 0.22)" stroke="#2563eb" strokeWidth="3" />
            {axes.map((axis, index) => {
              const [x, y] = pointAt(index, (scores[axis.key] - 4) / 24).split(",");
              return <circle key={axis.key} cx={x} cy={y} r="4.5" fill="#fff" stroke="#2563eb" strokeWidth="3" />;
            })}
            {axes.map((axis, index) => {
              const angle = angleFor(index);
              const x = center + Math.cos(angle) * (radius + 37);
              const y = center + Math.sin(angle) * (radius + 24);
              return (
                <text key={axis.key} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize="12" fontWeight="700" fill="#334155">
                  {axis.label}
                </text>
              );
            })}
          </svg>
        </Box>

        <Stack spacing={1.2}>
          {axes.map((axis) => (
            <Paper key={axis.key} elevation={0} sx={{ p: 1.5, border: "1px solid #e2e8f0", borderRadius: 2 }}>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Box sx={{ width: 10, height: 36, borderRadius: 999, bgcolor: axis.color }} />
                <Typography fontWeight={800} sx={{ flex: 1 }}>{axis.label}</Typography>
                <Chip label={`${scores[axis.key]} 点`} sx={{ minWidth: 72, fontWeight: 900, bgcolor: `${axis.color}16`, color: axis.color }} />
              </Stack>
            </Paper>
          ))}
        </Stack>
      </Box>
    </Paper>
  );
};
