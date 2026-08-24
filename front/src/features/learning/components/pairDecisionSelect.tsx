"use client";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import { Button, Chip, Paper, Stack, Typography } from "@mui/material";
import { useState } from "react";

import { AlgorithmArray } from "./algorithmArray";

export type PairDecisionQuestion = {
  id: string;
  left: number;
  right: number;
  feedback?: string;
};

type PairDecisionSelectProps = {
  questions: PairDecisionQuestion[];
  values: Record<string, string>;
  correctAnswers: Record<string, string>;
  disabled?: boolean;
  showCorrect?: boolean;
  onChange: (values: Record<string, string>) => void;
};

const options = [
  { id: "swap", label: "交換する" },
  { id: "keep", label: "交換しない" },
] as const;

export const PairDecisionSelect = ({
  questions,
  values,
  correctAnswers,
  disabled = false,
  showCorrect = false,
  onChange,
}: PairDecisionSelectProps) => {
  const firstUnanswered = questions.findIndex((question) => !values[question.id]);
  const [questionIndex, setQuestionIndex] = useState(firstUnanswered >= 0 ? firstUnanswered : 0);
  const safeQuestionIndex = Math.min(questionIndex, Math.max(questions.length - 1, 0));
  const question = questions[safeQuestionIndex];
  if (!question) throw new Error("PAIR_DECISION requires at least one question");

  const selected = values[question.id];
  const correct = correctAnswers[question.id];
  const allAnswered = questions.every((item) => Boolean(values[item.id]));

  const select = (optionId: string) => {
    if (disabled) return;
    onChange({ ...values, [question.id]: optionId });
    if (safeQuestionIndex < questions.length - 1) setQuestionIndex(safeQuestionIndex + 1);
  };

  return (
    <Stack spacing={2}>
      <Stack direction="row" gap={1} flexWrap="wrap" useFlexGap>
        {questions.map((item, index) => (
          <Chip
            key={item.id}
            label={`問題 ${index + 1}`}
            color={index === safeQuestionIndex ? "primary" : values[item.id] ? "success" : "default"}
            variant={index === safeQuestionIndex ? "filled" : "outlined"}
            onClick={() => setQuestionIndex(index)}
            sx={{ fontWeight: 900, cursor: "pointer" }}
          />
        ))}
      </Stack>

      <Paper elevation={0} sx={{ p: { xs: 2, sm: 2.5 }, border: "1px solid #bfdbfe", borderRadius: 2.5, bgcolor: "#f8fbff" }}>
        <Stack spacing={2} alignItems="center">
          <Typography fontWeight={950}>この2つを昇順にするには交換が必要ですか？</Typography>
          <AlgorithmArray
            values={[question.left, question.right]}
            states={{ 0: "comparing", 1: "comparing" }}
            pointers={[
              { index: 0, label: "左", tone: "primary" },
              { index: 1, label: "右", tone: "secondary" },
            ]}
          />
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} sx={{ width: "100%" }}>
            {options.map((option) => {
              const isSelected = selected === option.id;
              const isCorrectOption = showCorrect && correct === option.id;
              return (
                <Button
                  key={option.id}
                  variant={isSelected || isCorrectOption ? "contained" : "outlined"}
                  color={isCorrectOption ? "success" : "primary"}
                  disabled={disabled}
                  startIcon={isSelected || isCorrectOption ? <CheckCircleIcon /> : <RadioButtonUncheckedIcon />}
                  onClick={() => select(option.id)}
                  sx={{ minHeight: 52, flex: 1, fontWeight: 900 }}
                >
                  {option.label}
                </Button>
              );
            })}
          </Stack>
          {showCorrect && question.feedback && (
            <Typography color="#166534" fontWeight={850} aria-live="polite">
              {question.feedback}
            </Typography>
          )}
        </Stack>
      </Paper>

      {allAnswered && (
        <Typography color="#166534" fontWeight={900}>
          {questions.length}問の回答がそろいました。「答えを確認する」を押してください。
        </Typography>
      )}
    </Stack>
  );
};
