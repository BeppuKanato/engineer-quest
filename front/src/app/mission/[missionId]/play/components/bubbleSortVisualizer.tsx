"use client";

import { Box, Button, Chip, MenuItem, Paper, Select, Stack, Typography } from "@mui/material";
import { Pause, PlayArrow, Replay, SkipNext, SkipPrevious } from "@mui/icons-material";
import { useEffect, useMemo, useState } from "react";
import { generateBubbleSortSteps } from "@/lib/bubbleSort";

const codeLines = [
  "def bubble_sort(array):",
  "    n = len(array)",
  "",
  "    for i in range(n - 1):",
  "        for j in range(n - i - 1):",
  "            if array[j] > array[j + 1]:",
  "                array[j], array[j + 1] = array[j + 1], array[j]",
  "",
  "    return array",
];

export function BubbleSortVisualizer({
  initialValues,
  autoPlay = false,
}: {
  initialValues: number[];
  autoPlay?: boolean;
}) {
  const steps = useMemo(() => generateBubbleSortSteps(initialValues), [initialValues]);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(autoPlay);
  const [speed, setSpeed] = useState(900);
  const step = steps[index];

  useEffect(() => {
    if (!playing || index >= steps.length - 1) {
      if (index >= steps.length - 1) setPlaying(false);
      return;
    }
    const timer = window.setTimeout(() => setIndex((current) => current + 1), speed);
    return () => window.clearTimeout(timer);
  }, [index, playing, speed, steps.length]);

  if (!step) return <Paper sx={{ p: 2 }}>可視化データを読み込めませんでした。</Paper>;

  return (
    <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2.5 }, border: "1px solid #bfdbfe", borderRadius: 3, overflow: "hidden" }}>
      <Stack spacing={2}>
        <Stack direction="row" gap={1} flexWrap="wrap">
          <Chip label={`外側 i: ${step.outerIndex ?? "—"}`} />
          <Chip label={`内側 j: ${step.innerIndex ?? "—"}`} />
          <Chip label={`比較 ${step.comparisonCount}回`} />
          <Chip label={`交換 ${step.swapCount}回`} />
        </Stack>
        <Box sx={{ overflowX: "auto", pb: 1 }}>
          <Stack direction="row" spacing={1} sx={{ minWidth: "max-content" }}>
            {step.values.map((value, valueIndex) => {
              const compared = step.comparedIndices?.includes(valueIndex);
              const swapped = step.swappedIndices?.includes(valueIndex);
              const sorted = step.sortedIndices.includes(valueIndex);
              return (
                <Box
                  key={`${valueIndex}-${value}`}
                  aria-label={`${value}${compared ? " 比較中" : ""}${swapped ? " 交換" : ""}${sorted ? " 確定済み" : ""}`}
                  sx={{
                    width: 58, height: 68, display: "grid", placeItems: "center", borderRadius: 2,
                    fontWeight: 900, fontSize: 22, position: "relative",
                    border: swapped ? "3px dashed #c2410c" : compared ? "3px solid #2563eb" : sorted ? "3px double #15803d" : "2px solid #cbd5e1",
                    bgcolor: swapped ? "#fff7ed" : compared ? "#eff6ff" : sorted ? "#ecfdf5" : "#fff",
                    transition: "all 260ms ease",
                  }}
                >
                  {value}
                  <Typography sx={{ position: "absolute", bottom: -22, fontSize: 10, fontWeight: 800 }}>
                    {swapped ? "交換" : compared ? "比較" : sorted ? "確定" : ""}
                  </Typography>
                </Box>
              );
            })}
          </Stack>
        </Box>
        <Typography aria-live="polite" fontWeight={800} sx={{ pt: 1.5 }}>{step.message}</Typography>
        <Box sx={{ bgcolor: "#0f172a", color: "#e2e8f0", borderRadius: 2, p: 1.5, overflowX: "auto" }}>
          {codeLines.map((line, lineIndex) => (
            <Box key={lineIndex} sx={{ display: "flex", minWidth: 570, bgcolor: step.highlightedCodeLines.includes(lineIndex + 1) ? "#1d4ed8" : "transparent" }}>
              <Typography component="span" sx={{ width: 28, color: "#94a3b8", fontFamily: "monospace" }}>{lineIndex + 1}</Typography>
              <Typography component="code" sx={{ whiteSpace: "pre", fontFamily: "monospace", fontSize: 13 }}>{line || " "}</Typography>
            </Box>
          ))}
        </Box>
        <Stack direction="row" gap={1} flexWrap="wrap" alignItems="center">
          <Button aria-label="最初から" onClick={() => { setPlaying(false); setIndex(0); }}><Replay /></Button>
          <Button aria-label="前のステップ" disabled={index === 0} onClick={() => { setPlaying(false); setIndex(index - 1); }}><SkipPrevious /></Button>
          <Button variant="contained" aria-label={playing ? "一時停止" : "再生"} onClick={() => setPlaying(!playing)}>
            {playing ? <Pause /> : <PlayArrow />}{playing ? "一時停止" : "再生"}
          </Button>
          <Button aria-label="次のステップ" disabled={index === steps.length - 1} onClick={() => { setPlaying(false); setIndex(index + 1); }}><SkipNext /></Button>
          <Select size="small" value={speed} aria-label="再生速度" onChange={(event) => setSpeed(Number(event.target.value))}>
            <MenuItem value={1500}>ゆっくり</MenuItem><MenuItem value={900}>標準</MenuItem><MenuItem value={400}>速い</MenuItem>
          </Select>
          <Typography variant="body2">{index + 1} / {steps.length}</Typography>
        </Stack>
      </Stack>
    </Paper>
  );
}
