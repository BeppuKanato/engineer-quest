"use client";

import { Paper, Stack, Typography } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { generateBubbleSortSteps } from "@/lib/bubbleSort";
import { CodeLines, StepTraceControls } from "@/features/learning/components";
import { AlgorithmLegend, ArrayCards, PassIndicator, VariablePanel } from "./algorithm/primitives";

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

export function BubbleSortScene({
  initialValues,
  autoPlay = false,
  showCode = false,
  onePassOnly = false,
  introMode = false,
}: {
  initialValues: number[];
  autoPlay?: boolean;
  showCode?: boolean;
  onePassOnly?: boolean;
  introMode?: boolean;
}) {
  const steps = useMemo(() => {
    const generated = generateBubbleSortSteps(initialValues);
    if (!onePassOnly) return generated;
    const passCompleteIndex = generated.findIndex((item) => item.phase === "pass-complete");
    return passCompleteIndex >= 0 ? generated.slice(0, passCompleteIndex + 1) : generated;
  }, [initialValues, onePassOnly]);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(autoPlay);
  const [speed, setSpeed] = useState(900);
  const step = steps[index];
  const isOnePassComplete = onePassOnly && step?.phase === "pass-complete";
  const message = isOnePassComplete
    ? `一周分の比較と交換が終わり、最も大きい${step.values.at(-1)}が右端へ移動しました。`
    : step?.message;

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
        <Stack direction={{ xs: "column", sm: "row" }} gap={1} justifyContent="space-between">
          <Stack direction="row" gap={1} flexWrap="wrap">
            {!introMode && <PassIndicator passIndex={step.outerIndex} />}
            <VariablePanel variables={{
              ...(introMode ? {} : { i: step.outerIndex ?? "—", j: step.innerIndex ?? "—" }),
              比較: step.comparisonCount,
              交換: step.swapCount,
            }} />
          </Stack>
        </Stack>
        <ArrayCards
          values={step.values}
          compareIndices={step.comparedIndices}
          swappedIndices={step.swappedIndices}
          confirmedIndices={step.sortedIndices}
          activeRange={[0, Math.max(0, step.values.length - 1 - (step.outerIndex ?? 0))]}
        />
        {introMode ? (
          <Stack direction="row" gap={1} flexWrap="wrap" aria-label="表示の凡例">
            <Typography component="span" sx={{ px: 1.25, py: 0.5, borderRadius: 99, bgcolor: "#eff6ff", fontWeight: 800 }}>青枠：比較中</Typography>
            <Typography component="span" sx={{ px: 1.25, py: 0.5, borderRadius: 99, bgcolor: "#fff7ed", fontWeight: 800 }}>橙破線：交換</Typography>
            <Typography component="span" sx={{ px: 1.25, py: 0.5, borderRadius: 99, bgcolor: "#ecfdf5", fontWeight: 800 }}>緑枠：1周で右端へ移動</Typography>
          </Stack>
        ) : <AlgorithmLegend />}
        <Typography aria-live="polite" fontWeight={800} sx={{ pt: 1.5 }}>{message}</Typography>
        {isOnePassComplete && (
          <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, bgcolor: "#eff6ff", border: "1px solid #bfdbfe" }}>
            <Typography sx={{ lineHeight: 1.8 }}>
              一周しただけでは、配列全体の並べ替えはまだ完了していません。同じ処理を繰り返すことで、配列全体を少しずつ並べ替えていきます。
            </Typography>
          </Paper>
        )}
        {showCode && <CodeLines code={codeLines.join("\n")} activeLines={step.highlightedCodeLines} showLineNumbers />}
        <StepTraceControls
          stepIndex={index}
          stepCount={steps.length}
          playing={playing}
          speed={introMode ? undefined : speed}
          showStepButtons={!introMode}
          onReset={() => { setPlaying(false); setIndex(0); }}
          onPrevious={() => { setPlaying(false); setIndex((current) => Math.max(0, current - 1)); }}
          onNext={() => { setPlaying(false); setIndex((current) => Math.min(steps.length - 1, current + 1)); }}
          onPlayingChange={setPlaying}
          onSpeedChange={introMode ? undefined : setSpeed}
        />
      </Stack>
    </Paper>
  );
}

// Existing Activity rendering keeps this name as a compatibility alias.
export const BubbleSortVisualizer = BubbleSortScene;
