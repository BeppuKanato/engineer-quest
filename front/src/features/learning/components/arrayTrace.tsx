"use client";

import { Paper, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";

import { AlgorithmArray, type AlgorithmCellState, type AlgorithmPointer } from "./algorithmArray";
import { CodeLines } from "./codeLines";
import { StepTraceControls } from "./stepTraceControls";

export type ArrayTraceStep = {
  values?: number[];
  comparingIndices?: number[];
  swappingIndices?: number[];
  confirmedIndices?: number[];
  excludedIndices?: number[];
  pointers?: AlgorithmPointer[];
  message: string;
  activeCodeLines?: number[];
};

export type ArrayTraceData = {
  values: number[];
  steps: ArrayTraceStep[];
  code?: string;
  finalMessage?: string;
  intervalMs?: number;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const numberList = (value: unknown) =>
  Array.isArray(value) && value.every((item) => typeof item === "number")
    ? value
    : undefined;

const indexList = (value: unknown) => {
  const values = numberList(value);
  return values?.every(Number.isInteger) ? values : undefined;
};

export const parseArrayTraceData = (value: unknown): ArrayTraceData | null => {
  if (!isRecord(value)) return null;
  const values = numberList(value.values);
  if (!values || !Array.isArray(value.steps)) return null;
  const steps = value.steps.flatMap((item): ArrayTraceStep[] => {
    if (!isRecord(item) || typeof item.message !== "string") return [];
    const pointers = Array.isArray(item.pointers)
      ? item.pointers.flatMap((pointer): AlgorithmPointer[] => {
          if (!isRecord(pointer) || typeof pointer.index !== "number" || typeof pointer.label !== "string") return [];
          const tone = pointer.tone;
          if (tone !== undefined && tone !== "primary" && tone !== "secondary" && tone !== "success" && tone !== "warning") return [];
          return [{ index: pointer.index, label: pointer.label, ...(tone ? { tone } : {}) }];
        })
      : undefined;
    return [{
      message: item.message,
      ...(numberList(item.values) ? { values: numberList(item.values) } : {}),
      ...(indexList(item.comparingIndices) ? { comparingIndices: indexList(item.comparingIndices) } : {}),
      ...(indexList(item.swappingIndices) ? { swappingIndices: indexList(item.swappingIndices) } : {}),
      ...(indexList(item.confirmedIndices) ? { confirmedIndices: indexList(item.confirmedIndices) } : {}),
      ...(indexList(item.excludedIndices) ? { excludedIndices: indexList(item.excludedIndices) } : {}),
      ...(pointers ? { pointers } : {}),
      ...(indexList(item.activeCodeLines) ? { activeCodeLines: indexList(item.activeCodeLines) } : {}),
    }];
  });
  if (steps.length === 0) return null;
  return {
    values,
    steps,
    ...(typeof value.code === "string" ? { code: value.code } : {}),
    ...(typeof value.finalMessage === "string" ? { finalMessage: value.finalMessage } : {}),
    ...(typeof value.intervalMs === "number" && value.intervalMs > 0 ? { intervalMs: value.intervalMs } : {}),
  };
};

export const ArrayTrace = ({ data }: { data: ArrayTraceData }) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const step = data.steps[stepIndex];

  useEffect(() => {
    if (!playing || stepIndex >= data.steps.length - 1) {
      if (stepIndex >= data.steps.length - 1) setPlaying(false);
      return;
    }
    const timer = window.setTimeout(
      () => setStepIndex((current) => Math.min(data.steps.length - 1, current + 1)),
      data.intervalMs ?? 900,
    );
    return () => window.clearTimeout(timer);
  }, [data.intervalMs, data.steps.length, playing, stepIndex]);

  if (!step) return null;

  const values = step.values ?? data.values;
  const states: Partial<Record<number, AlgorithmCellState>> = {};
  step.excludedIndices?.forEach((index) => { states[index] = "excluded"; });
  step.confirmedIndices?.forEach((index) => { states[index] = "confirmed"; });
  step.comparingIndices?.forEach((index) => { states[index] = "comparing"; });
  step.swappingIndices?.forEach((index) => { states[index] = "swapping"; });

  return (
    <Stack spacing={2}>
      <AlgorithmArray values={values} states={states} pointers={step.pointers ?? []} />
      <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, border: "1px solid #bfdbfe", bgcolor: "#eff6ff" }}>
        <Typography aria-live="polite" fontWeight={900}>{step.message}</Typography>
        {stepIndex === data.steps.length - 1 && data.finalMessage && (
          <Typography sx={{ mt: 0.75, color: "#1d4ed8", fontWeight: 850 }}>{data.finalMessage}</Typography>
        )}
      </Paper>
      {data.code && <CodeLines code={data.code} activeLines={step.activeCodeLines ?? []} showLineNumbers />}
      <StepTraceControls
        stepIndex={stepIndex}
        stepCount={data.steps.length}
        playing={playing}
        onReset={() => { setPlaying(false); setStepIndex(0); }}
        onPrevious={() => { setPlaying(false); setStepIndex((current) => Math.max(0, current - 1)); }}
        onNext={() => { setPlaying(false); setStepIndex((current) => Math.min(data.steps.length - 1, current + 1)); }}
        onPlayingChange={setPlaying}
      />
    </Stack>
  );
};
