"use client";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import { Alert, Button, Chip, Paper, Stack, Typography } from "@mui/material";
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
  onChange: (values: Record<string, string>, locallyVerified: boolean) => void;
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
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState<Record<string, string>>({});
  const safeQuestionIndex = Math.min(questionIndex, Math.max(questions.length - 1, 0));
  const question = questions[safeQuestionIndex];
  if (!question) throw new Error("PAIR_DECISION requires at least one question");

  const selected = drafts[question.id] ?? values[question.id];
  const correct = correctAnswers[question.id];
  const allAnswered = questions.every((item) => Boolean(values[item.id]));
  const isChecked = checked[question.id] === selected && Boolean(selected);
  const isCorrect = isChecked && selected === correct;

  const select = (optionId: string) => {
    if (disabled) return;
    setDrafts((current) => ({ ...current, [question.id]: optionId }));
    setChecked((current) => {
      const next = { ...current };
      delete next[question.id];
      return next;
    });
  };

  const checkAnswer = () => {
    if (!selected || disabled) return;
    setChecked((current) => ({ ...current, [question.id]: selected }));
    if (selected !== correct) return;
    const next = { ...values, [question.id]: selected };
    onChange(next, questions.every((item) => Boolean(next[item.id])));
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
            onClick={index <= safeQuestionIndex || Boolean(values[item.id]) ? () => setQuestionIndex(index) : undefined}
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
          {isChecked && !showCorrect && (
            <Alert severity={isCorrect ? "success" : "warning"} sx={{ width: "100%" }}>
              {isCorrect
                ? question.feedback ?? "正解です。左右の値を比べて判断できました。"
                : "左の値が右の値より大きいときだけ交換します。もう一度選び直しましょう。"}
            </Alert>
          )}
          {showCorrect && question.feedback && <Alert severity="success" sx={{ width: "100%" }}>{question.feedback}</Alert>}
        </Stack>
      </Paper>

      {!disabled && !showCorrect && !isCorrect && (
        <Button variant="outlined" disabled={!selected} onClick={checkAnswer} sx={{ minHeight: 46, fontWeight: 900 }}>
          この問題の答えを確認する
        </Button>
      )}
      {isCorrect && safeQuestionIndex < questions.length - 1 && (
        <Button variant="contained" onClick={() => setQuestionIndex(safeQuestionIndex + 1)} sx={{ minHeight: 46, fontWeight: 900 }}>
          次の問題へ
        </Button>
      )}

      {allAnswered && (
        <Typography color="#166534" fontWeight={900}>
          {questions.length}問すべてに正解しました。下の「次へ」から進みましょう。
        </Typography>
      )}
    </Stack>
  );
};
