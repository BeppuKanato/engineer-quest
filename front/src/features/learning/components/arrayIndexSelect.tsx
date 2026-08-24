"use client";

import { Chip, Paper, Stack, Typography } from "@mui/material";
import { useMemo, useState } from "react";

import { AlgorithmArray, type AlgorithmCellState, type AlgorithmPointer } from "./algorithmArray";

export type ArrayIndexQuestion = {
  id: string;
  prompt: string;
  values: number[];
  correctIndex: number;
  leftIndex?: number;
  rightIndex?: number;
  midIndex?: number;
  visiblePointers?: Array<"left" | "mid" | "right">;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const optionalIndex = (value: unknown) =>
  typeof value === "number" && Number.isInteger(value) ? value : undefined;

export const parseArrayIndexQuestions = (value: unknown): ArrayIndexQuestion[] =>
  Array.isArray(value)
    ? value.flatMap((item) => {
        if (!isRecord(item)) return [];
        const values = Array.isArray(item.values) && item.values.every((entry) => typeof entry === "number")
          ? item.values
          : [];
        const correctIndex = optionalIndex(item.correctIndex);
        const leftIndex = optionalIndex(item.leftIndex);
        const rightIndex = optionalIndex(item.rightIndex);
        const midIndex = optionalIndex(item.midIndex);
        const visiblePointers = Array.isArray(item.visiblePointers)
          ? item.visiblePointers.filter((pointer): pointer is "left" | "mid" | "right" =>
              pointer === "left" || pointer === "mid" || pointer === "right")
          : [];
        if (
          typeof item.id !== "string" ||
          typeof item.prompt !== "string" ||
          correctIndex === undefined ||
          values.length === 0 ||
          correctIndex < 0 ||
          correctIndex >= values.length ||
          (leftIndex !== undefined && (leftIndex < 0 || leftIndex >= values.length)) ||
          (rightIndex !== undefined && (rightIndex < 0 || rightIndex >= values.length)) ||
          (leftIndex !== undefined && rightIndex !== undefined && leftIndex > rightIndex) ||
          correctIndex < (leftIndex ?? 0) ||
          correctIndex > (rightIndex ?? values.length - 1) ||
          (midIndex !== undefined && (midIndex < 0 || midIndex >= values.length))
        ) return [];

        return [{
          id: item.id,
          prompt: item.prompt,
          values,
          correctIndex,
          leftIndex,
          rightIndex,
          midIndex,
          visiblePointers,
        }];
      })
    : [];

export const ArrayIndexSelect = ({
  questions,
  selectedIndices,
  disabled = false,
  showCorrect = false,
  onChange,
}: {
  questions: readonly ArrayIndexQuestion[];
  selectedIndices: Record<string, unknown>;
  disabled?: boolean;
  showCorrect?: boolean;
  onChange: (selectedIndices: Record<string, number>) => void;
}) => {
  const firstUnanswered = useMemo(
    () => questions.findIndex((question) => typeof selectedIndices[question.id] !== "number"),
    [questions, selectedIndices],
  );
  const [questionIndex, setQuestionIndex] = useState(
    firstUnanswered >= 0 ? firstUnanswered : Math.max(questions.length - 1, 0),
  );
  const question = questions[questionIndex];
  if (!question) return null;

  const leftIndex = question.leftIndex ?? 0;
  const rightIndex = question.rightIndex ?? question.values.length - 1;
  const selected = typeof selectedIndices[question.id] === "number"
    ? selectedIndices[question.id] as number
    : undefined;
  const pointers = (question.visiblePointers ?? []).flatMap<AlgorithmPointer>((pointer) => {
    if (pointer === "left") return [{ index: leftIndex, label: "left", tone: "primary" as const }];
    if (pointer === "right") return [{ index: rightIndex, label: "right", tone: "primary" as const }];
    return question.midIndex === undefined
      ? []
      : [{ index: question.midIndex, label: "mid", tone: "secondary" as const }];
  });
  const states: Partial<Record<number, AlgorithmCellState>> = {};
  question.values.forEach((_, index) => {
    if (index < leftIndex || index > rightIndex) states[index] = "excluded";
    else if (showCorrect && index === question.correctIndex) states[index] = "correct";
    else if (selected === index) states[index] = "selected";
    else states[index] = "active";
  });

  const selectIndex = (index: number) => {
    if (disabled || index < leftIndex || index > rightIndex) return;
    onChange({ ...selectedIndices, [question.id]: index } as Record<string, number>);
    if (questionIndex < questions.length - 1) setQuestionIndex(questionIndex + 1);
  };

  return (
    <Stack spacing={2}>
      <Stack direction="row" gap={0.75} flexWrap="wrap" aria-label="問題の進捗">
        {questions.map((item, index) => (
          <Chip
            key={item.id}
            component="button"
            clickable
            color={index === questionIndex ? "primary" : typeof selectedIndices[item.id] === "number" ? "success" : "default"}
            variant={index === questionIndex ? "filled" : "outlined"}
            label={`問題 ${index + 1}${typeof selectedIndices[item.id] === "number" ? " ✓" : ""}`}
            onClick={() => setQuestionIndex(index)}
            sx={{ fontWeight: 900 }}
          />
        ))}
      </Stack>
      <Paper component="fieldset" elevation={0} sx={{ m: 0, p: { xs: 1.5, sm: 2 }, border: "1px solid #dbeafe", borderRadius: 3 }}>
        <Typography component="legend" sx={{ px: 0.75, fontWeight: 950 }}>{question.prompt}</Typography>
        <Typography color="text.secondary" fontWeight={800} sx={{ mb: 1 }}>
          配列カードから該当する位置を選んでください。
        </Typography>
        <AlgorithmArray
          values={question.values}
          states={states}
          pointers={pointers}
          disabled={disabled}
          isIndexDisabled={(index) => index < leftIndex || index > rightIndex}
          onSelectIndex={selectIndex}
          ariaLabel={question.prompt}
        />
        {selected !== undefined && !showCorrect && (
          <Chip color="primary" label={`選択：index ${selected}`} sx={{ mt: 1, fontWeight: 900 }} />
        )}
      </Paper>
    </Stack>
  );
};
