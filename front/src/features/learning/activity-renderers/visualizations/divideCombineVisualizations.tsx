"use client";

import { Chip, Paper, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";

import { AlgorithmArray, StepTraceControls, type AlgorithmCellState } from "@/features/learning/components";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const numberList = (value: unknown): number[] | null =>
  Array.isArray(value) && value.every((item) => typeof item === "number") ? value : null;

type DivideCombineLevel = {
  label: string;
  phase: "DIVIDE" | "COMBINE";
  groups: number[][];
  message: string;
  nextLabel?: string;
};

const parseDivideCombine = (content: Record<string, unknown>) => {
  if (!Array.isArray(content.levels)) return null;
  const levels = content.levels.flatMap((item): DivideCombineLevel[] => {
    if (!isRecord(item) || typeof item.label !== "string" || typeof item.message !== "string") return [];
    if (item.phase !== "DIVIDE" && item.phase !== "COMBINE") return [];
    if (!Array.isArray(item.groups)) return [];
    const groups = item.groups.map(numberList);
    if (groups.some((group) => group === null)) return [];
    return [{
      label: item.label,
      phase: item.phase,
      groups: groups as number[][],
      message: item.message,
      ...(typeof item.nextLabel === "string" ? { nextLabel: item.nextLabel } : {}),
    }];
  });
  return levels.length > 0 ? {
    levels,
    intervalMs: typeof content.intervalMs === "number" && content.intervalMs > 0 ? content.intervalMs : 1800,
    finalMessage: typeof content.finalMessage === "string" ? content.finalMessage : undefined,
  } : null;
};

export const DivideCombineTraceVisualization = ({ content }: { content: Record<string, unknown> }) => {
  const data = parseDivideCombine(content);
  const [stepIndex, setStepIndex] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    setStepIndex(0);
    setPlaying(false);
  }, [content]);

  useEffect(() => {
    if (!data || !playing || stepIndex >= data.levels.length - 1) {
      if (data && stepIndex >= data.levels.length - 1) setPlaying(false);
      return;
    }
    const timer = window.setTimeout(
      () => setStepIndex((current) => Math.min(data.levels.length - 1, current + 1)),
      data.intervalMs,
    );
    return () => window.clearTimeout(timer);
  }, [data, playing, stepIndex]);

  if (!data) return null;
  const level = data.levels[stepIndex];
  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
        <Chip
          color={level.phase === "DIVIDE" ? "primary" : "success"}
          label={level.phase === "DIVIDE" ? "小さく分ける段階" : "順に結合する段階"}
          sx={{ fontWeight: 900 }}
        />
        <Typography fontWeight={950}>{level.label}</Typography>
      </Stack>
      <Stack
        direction="row"
        gap={2}
        flexWrap="wrap"
        justifyContent="center"
        aria-label={`${level.label}のリスト群`}
      >
        {level.groups.map((group, index) => (
          <Paper
            key={`${stepIndex}-${index}-${group.join("-")}`}
            elevation={0}
            sx={{ p: 1.5, borderRadius: 2.5, border: "1px solid #cbd5e1", maxWidth: "100%", overflowX: "auto" }}
          >
            <Typography textAlign="center" fontSize={12} fontWeight={850} color="text.secondary" sx={{ mb: 1 }}>
              {level.groups.length === 1 ? "リスト" : `部分 ${index + 1}`}
            </Typography>
            <AlgorithmArray values={group} compact showIndices={false} />
          </Paper>
        ))}
      </Stack>
      <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, border: "1px solid #bfdbfe", bgcolor: "#eff6ff" }}>
        <Typography aria-live="polite" fontWeight={900}>{level.message}</Typography>
        {stepIndex === data.levels.length - 1 && data.finalMessage && (
          <Typography sx={{ mt: 0.75, color: "#1d4ed8", fontWeight: 850 }}>{data.finalMessage}</Typography>
        )}
      </Paper>
      <StepTraceControls
        stepIndex={stepIndex}
        stepCount={data.levels.length}
        playing={playing}
        nextLabel={level.nextLabel}
        showPlayback={data.levels.length > 1}
        showStepButtons={data.levels.length > 1}
        onReset={() => { setPlaying(false); setStepIndex(0); }}
        onPrevious={() => { setPlaying(false); setStepIndex((current) => Math.max(0, current - 1)); }}
        onNext={() => { setPlaying(false); setStepIndex((current) => Math.min(data.levels.length - 1, current + 1)); }}
        onPlayingChange={(next) => {
          if (next && stepIndex >= data.levels.length - 1) setStepIndex(0);
          setPlaying(next);
        }}
      />
    </Stack>
  );
};

type MergeStep = {
  leftIndex: number;
  rightIndex: number;
  result: number[];
  message: string;
  nextLabel?: string;
};

const parseTwoListMerge = (content: Record<string, unknown>) => {
  const left = numberList(content.left);
  const right = numberList(content.right);
  if (!left || !right || !Array.isArray(content.steps)) return null;
  const steps = content.steps.flatMap((item): MergeStep[] => {
    if (!isRecord(item) || !Number.isInteger(item.leftIndex) || !Number.isInteger(item.rightIndex)) return [];
    const result = numberList(item.result);
    if (!result || typeof item.message !== "string") return [];
    return [{
      leftIndex: item.leftIndex as number,
      rightIndex: item.rightIndex as number,
      result,
      message: item.message,
      ...(typeof item.nextLabel === "string" ? { nextLabel: item.nextLabel } : {}),
    }];
  });
  return steps.length > 0 ? {
    left,
    right,
    steps,
    intervalMs: typeof content.intervalMs === "number" && content.intervalMs > 0 ? content.intervalMs : 1800,
    finalMessage: typeof content.finalMessage === "string" ? content.finalMessage : undefined,
    showVariableNames: content.showVariableNames === true,
  } : null;
};

export const TwoListMergeTraceVisualization = ({ content }: { content: Record<string, unknown> }) => {
  const data = parseTwoListMerge(content);
  const [stepIndex, setStepIndex] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    setStepIndex(0);
    setPlaying(false);
  }, [content]);

  useEffect(() => {
    if (!data || !playing || stepIndex >= data.steps.length - 1) {
      if (data && stepIndex >= data.steps.length - 1) setPlaying(false);
      return;
    }
    const timer = window.setTimeout(
      () => setStepIndex((current) => Math.min(data.steps.length - 1, current + 1)),
      data.intervalMs,
    );
    return () => window.clearTimeout(timer);
  }, [data, playing, stepIndex]);

  if (!data) return null;
  const step = data.steps[stepIndex];
  const states = (length: number, used: number): Partial<Record<number, AlgorithmCellState>> =>
    Object.fromEntries(Array.from({ length }, (_, index) => [index, index < used ? "confirmed" : index === used ? "comparing" : "idle"]));
  const pointer = (index: number, length: number, label: string) =>
    index < length ? [{ index, label, tone: "primary" as const }] : [];
  const exhaustedLabel = (index: number, length: number, variableName: string) =>
    index >= length ? (data.showVariableNames ? `${variableName} = ${length}（未使用の値なし）` : "未使用の値なし") : null;

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: "column", md: "row" }} gap={2} alignItems="stretch">
        <Paper elevation={0} sx={{ p: 1.5, flex: 1, borderRadius: 2.5, border: "1px solid #cbd5e1", overflowX: "auto" }}>
          <Typography fontWeight={950} sx={{ mb: 1 }}>{data.showVariableNames ? "左の整列済みリスト left" : "左の整列済みリスト"}</Typography>
          <AlgorithmArray values={data.left} states={states(data.left.length, step.leftIndex)} pointers={pointer(step.leftIndex, data.left.length, data.showVariableNames ? "i" : "未使用の先頭")} compact showIndices={data.showVariableNames} />
          {exhaustedLabel(step.leftIndex, data.left.length, "i") && (
            <Typography sx={{ mt: 1, color: "#15803d", fontWeight: 900 }}>{exhaustedLabel(step.leftIndex, data.left.length, "i")}</Typography>
          )}
        </Paper>
        <Paper elevation={0} sx={{ p: 1.5, flex: 1, borderRadius: 2.5, border: "1px solid #cbd5e1", overflowX: "auto" }}>
          <Typography fontWeight={950} sx={{ mb: 1 }}>{data.showVariableNames ? "右の整列済みリスト right" : "右の整列済みリスト"}</Typography>
          <AlgorithmArray values={data.right} states={states(data.right.length, step.rightIndex)} pointers={pointer(step.rightIndex, data.right.length, data.showVariableNames ? "j" : "未使用の先頭")} compact showIndices={data.showVariableNames} />
          {exhaustedLabel(step.rightIndex, data.right.length, "j") && (
            <Typography sx={{ mt: 1, color: "#15803d", fontWeight: 900 }}>{exhaustedLabel(step.rightIndex, data.right.length, "j")}</Typography>
          )}
        </Paper>
      </Stack>
      <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2.5, border: "2px solid #86efac", bgcolor: "#f0fdf4", overflowX: "auto" }}>
        <Typography fontWeight={950} sx={{ mb: 1 }}>{data.showVariableNames ? "結合結果 merged" : "結合結果"}</Typography>
        {step.result.length > 0
          ? <AlgorithmArray values={step.result} states={Object.fromEntries(step.result.map((_, index) => [index, "confirmed"]))} compact showIndices={false} />
          : <Typography color="text.secondary" fontWeight={800}>まだ空です</Typography>}
      </Paper>
      <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, border: "1px solid #bfdbfe", bgcolor: "#eff6ff" }}>
        <Typography aria-live="polite" fontWeight={900}>{step.message}</Typography>
        {stepIndex === data.steps.length - 1 && data.finalMessage && (
          <Typography sx={{ mt: 0.75, color: "#1d4ed8", fontWeight: 850 }}>{data.finalMessage}</Typography>
        )}
      </Paper>
      <StepTraceControls
        stepIndex={stepIndex}
        stepCount={data.steps.length}
        playing={playing}
        nextLabel={step.nextLabel}
        showPlayback={data.steps.length > 1}
        showStepButtons={data.steps.length > 1}
        onReset={() => { setPlaying(false); setStepIndex(0); }}
        onPrevious={() => { setPlaying(false); setStepIndex((current) => Math.max(0, current - 1)); }}
        onNext={() => { setPlaying(false); setStepIndex((current) => Math.min(data.steps.length - 1, current + 1)); }}
        onPlayingChange={(next) => {
          if (next && stepIndex >= data.steps.length - 1) setStepIndex(0);
          setPlaying(next);
        }}
      />
    </Stack>
  );
};
