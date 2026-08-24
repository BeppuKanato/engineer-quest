"use client";

import { Box, Chip, Paper, Stack, Typography } from "@mui/material";
import { useMemo, useState } from "react";

import { AlgorithmArray, type AlgorithmCellState, type AlgorithmPointer } from "./algorithmArray";
import { CodeLines } from "./codeLines";

export type ArrayRegion = "left" | "center" | "right";

export type ArrayRegionQuestion = {
  id: string;
  target: number;
  values: number[];
  midIndex: number;
  correctRegion: ArrayRegion;
  leftIndex?: number;
  rightIndex?: number;
  stepLabel?: string;
  correctExplanation?: string;
  pythonCondition?: string;
  resultText?: string;
};

const regionLabel: Record<ArrayRegion, string> = {
  left: "左側",
  center: "中央（発見）",
  right: "右側",
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const optionalNumber = (value: unknown) =>
  typeof value === "number" && Number.isInteger(value) ? value : undefined;

const optionalString = (value: unknown) =>
  typeof value === "string" ? value : undefined;

export const parseArrayRegionQuestions = (value: unknown): ArrayRegionQuestion[] =>
  Array.isArray(value)
    ? value.flatMap((item) => {
        if (!isRecord(item)) return [];
        const values = Array.isArray(item.values) && item.values.every((entry) => typeof entry === "number")
          ? item.values
          : [];
        const correctRegion = item.correctRegion;
        const leftIndex = optionalNumber(item.leftIndex);
        const rightIndex = optionalNumber(item.rightIndex);
        if (
          typeof item.id !== "string" ||
          typeof item.target !== "number" ||
          typeof item.midIndex !== "number" ||
          !Number.isInteger(item.midIndex) ||
          item.midIndex < 0 ||
          item.midIndex >= values.length ||
          (leftIndex !== undefined && (leftIndex < 0 || leftIndex > item.midIndex)) ||
          (rightIndex !== undefined && (rightIndex < item.midIndex || rightIndex >= values.length)) ||
          (correctRegion !== "left" && correctRegion !== "center" && correctRegion !== "right")
        ) {
          return [];
        }

        return [{
          id: item.id,
          target: item.target,
          values,
          midIndex: item.midIndex,
          correctRegion,
          leftIndex,
          rightIndex,
          stepLabel: optionalString(item.stepLabel),
          correctExplanation: optionalString(item.correctExplanation),
          pythonCondition: optionalString(item.pythonCondition),
          resultText: optionalString(item.resultText),
        }];
      })
    : [];

export const ArrayRegionSelect = ({
  questions,
  selectedRegions,
  disabled = false,
  showCorrect = false,
  sequenceMode = "QUESTIONS",
  onChange,
}: {
  questions: readonly ArrayRegionQuestion[];
  selectedRegions: Record<string, unknown>;
  disabled?: boolean;
  showCorrect?: boolean;
  sequenceMode?: "QUESTIONS" | "TRACE";
  onChange: (selectedRegions: Record<string, ArrayRegion>) => void;
}) => {
  const firstUnanswered = useMemo(
    () => questions.findIndex((question) => !selectedRegions[question.id]),
    [questions, selectedRegions],
  );
  const [questionIndex, setQuestionIndex] = useState(firstUnanswered >= 0 ? firstUnanswered : Math.max(questions.length - 1, 0));

  const question = questions[questionIndex];
  if (!question) return null;
  const selectedValue = selectedRegions[question.id];
  const selected = selectedValue === "left" || selectedValue === "center" || selectedValue === "right"
    ? selectedValue
    : undefined;
  const leftIndex = question.leftIndex ?? 0;
  const rightIndex = question.rightIndex ?? question.values.length - 1;
  const pointers: AlgorithmPointer[] = [
    { index: leftIndex, label: "left", tone: "primary" },
    { index: question.midIndex, label: "mid", tone: "secondary" },
    { index: rightIndex, label: "right", tone: "primary" },
  ];
  const states: Partial<Record<number, AlgorithmCellState>> = {};
  question.values.forEach((_, index) => {
    const region: ArrayRegion = index < question.midIndex ? "left" : index === question.midIndex ? "center" : "right";
    if (index < leftIndex || index > rightIndex) states[index] = "excluded";
    else if (showCorrect) states[index] = region === question.correctRegion ? "correct" : "excluded";
    else if (selected === region) states[index] = "selected";
    else states[index] = "active";
  });

  const selectIndex = (index: number) => {
    if (disabled || index < leftIndex || index > rightIndex) return;
    const region: ArrayRegion = index < question.midIndex ? "left" : index === question.midIndex ? "center" : "right";
    const next = { ...selectedRegions, [question.id]: region } as Record<string, ArrayRegion>;
    onChange(next);
    if (questionIndex < questions.length - 1) setQuestionIndex(questionIndex + 1);
  };

  return (
    <Stack spacing={2}>
      <Stack direction="row" gap={0.75} flexWrap="wrap" aria-label={sequenceMode === "TRACE" ? "探索ステップの進捗" : "問題の進捗"}>
        {questions.map((item, index) => (
          <Chip
            key={item.id}
            component="button"
            clickable
            color={index === questionIndex ? "primary" : selectedRegions[item.id] ? "success" : "default"}
            variant={index === questionIndex ? "filled" : "outlined"}
            label={`${item.stepLabel ?? `${sequenceMode === "TRACE" ? "ステップ" : "問題"} ${index + 1}`}${selectedRegions[item.id] ? " ✓" : ""}`}
            onClick={() => setQuestionIndex(index)}
            sx={{ fontWeight: 900 }}
          />
        ))}
      </Stack>
      <Paper component="fieldset" elevation={0} sx={{ m: 0, p: { xs: 1.5, sm: 2 }, border: "1px solid #dbeafe", borderRadius: 3 }}>
        <Typography component="legend" sx={{ px: 0.75, fontWeight: 950 }}>
          {question.stepLabel ? `${question.stepLabel}　` : ""}探す値：{question.target}
        </Typography>
        <Typography color="text.secondary" fontWeight={800} sx={{ mb: 1 }}>
          配列カードを選んで、次に残す範囲を答えてください。
        </Typography>
        <AlgorithmArray
          values={question.values}
          states={states}
          pointers={pointers}
          disabled={disabled}
          isIndexDisabled={(index) => index < leftIndex || index > rightIndex}
          onSelectIndex={selectIndex}
          ariaLabel={`探す値${question.target}の探索範囲`}
        />
        {typeof selected === "string" && !showCorrect && (
          <Box sx={{ mt: 1 }}><Chip color="primary" label={`選択：${regionLabel[selected as ArrayRegion]}`} sx={{ fontWeight: 900 }} /></Box>
        )}
        {showCorrect && question.correctExplanation && (
          <Paper elevation={0} sx={{ mt: 1.5, p: 1.5, borderRadius: 2, bgcolor: "#ecfdf5" }}>
            <Typography color="#166534" fontWeight={950} textAlign="center" sx={{ whiteSpace: "pre-line", lineHeight: 1.8 }}>{question.correctExplanation}</Typography>
          </Paper>
        )}
        {showCorrect && question.pythonCondition && (
          <Box sx={{ mt: 1.5 }}>
            <Typography fontWeight={950} sx={{ mb: 0.75 }}>Pythonとの対応</Typography>
            <CodeLines code={question.pythonCondition} />
          </Box>
        )}
        {showCorrect && question.resultText && <Typography color="#166534" fontWeight={950} sx={{ mt: 1.25, whiteSpace: "pre-line" }}>{question.resultText}</Typography>}
      </Paper>
    </Stack>
  );
};
