/** バブルソート完成段階の変数役割確認とコード修正に使う回答UI。 */
"use client";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import { Alert, Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";
import { useState } from "react";

import type { MissionActivity } from "@/features/learning/mission-activity-play/missionActivityPlay.types";

type RoleOption = { id: string; label: string };
type RoleQuestion = { id: string; variable?: string; question?: string; options?: RoleOption[]; explanation?: string };
type RepairQuestion = { id: string; label?: string; options?: string[] };

const answerValues = (answer: unknown) => {
  if (!answer || typeof answer !== "object" || Array.isArray(answer)) return {};
  const values = (answer as { values?: unknown }).values;
  return values && typeof values === "object" && !Array.isArray(values) ? values as Record<string, string> : {};
};

export const LoopRoleInput = ({ activity, answer, disabled, showExplanation, onAnswerChange }: {
  activity: MissionActivity;
  answer: unknown;
  disabled: boolean;
  showExplanation: boolean;
  onAnswerChange: (answer: unknown) => void;
}) => {
  const questions = Array.isArray(activity.content.data.roleQuestions) ? activity.content.data.roleQuestions as RoleQuestion[] : [];
  const values = answerValues(answer);
  const correctAnswers = activity.content.data.correctAnswers && typeof activity.content.data.correctAnswers === "object" && !Array.isArray(activity.content.data.correctAnswers)
    ? activity.content.data.correctAnswers as Record<string, string>
    : {};
  const firstUnanswered = questions.findIndex((question) => !values[question.id]);
  const [questionIndex, setQuestionIndex] = useState(firstUnanswered >= 0 ? firstUnanswered : 0);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState<Record<string, string>>({});
  const safeIndex = Math.min(questionIndex, Math.max(questions.length - 1, 0));
  const question = questions[safeIndex];
  if (!question) return <Typography color="error">問題データを読み込めませんでした。</Typography>;
  const selected = drafts[question.id] ?? values[question.id];
  const isChecked = checked[question.id] === selected && Boolean(selected);
  const isCorrect = isChecked && selected === correctAnswers[question.id];
  const allCorrect = questions.every((item) => values[item.id] === correctAnswers[item.id]);
  const choose = (optionId: string) => {
    setDrafts((current) => ({ ...current, [question.id]: optionId }));
    setChecked((current) => { const next = { ...current }; delete next[question.id]; return next; });
  };
  const check = () => {
    if (!selected || disabled) return;
    setChecked((current) => ({ ...current, [question.id]: selected }));
    if (selected !== correctAnswers[question.id]) return;
    const nextValues = { ...values, [question.id]: selected };
    onAnswerChange({ values: nextValues, localVerificationPassed: questions.every((item) => nextValues[item.id] === correctAnswers[item.id]) });
  };
  return (
    <Stack spacing={1.5}>
      <Stack direction="row" gap={0.75} flexWrap="wrap">
        {questions.map((item, index) => <Chip key={item.id} label={`問題 ${index + 1}${values[item.id] ? " ✓" : ""}`} color={index === safeIndex ? "primary" : values[item.id] ? "success" : "default"} variant={index === safeIndex ? "filled" : "outlined"} onClick={index <= safeIndex || Boolean(values[item.id]) ? () => setQuestionIndex(index) : undefined} sx={{ fontWeight: 900 }} />)}
      </Stack>
        <Paper elevation={0} sx={{ p: 1.5, border: "1px solid #bfdbfe", borderRadius: 2.5, bgcolor: "#fff" }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.25 }}>
            <Chip label={safeIndex + 1} color="primary" sx={{ fontWeight: 950 }} />
            <Typography fontWeight={950}>{question.question}</Typography>
          </Stack>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))", xl: "repeat(4, minmax(0, 1fr))" }, gap: 1 }}>
            {(question.options ?? []).map((option) => {
              const optionSelected = selected === option.id;
              const correct = showExplanation && correctAnswers[question.id] === option.id;
              return (
                <Button key={option.id} variant={optionSelected || correct ? "contained" : "outlined"} color={correct ? "success" : "primary"} disabled={disabled} onClick={() => choose(option.id)} startIcon={optionSelected || correct ? <CheckCircleIcon /> : <RadioButtonUncheckedIcon />} sx={{ minHeight: 52, justifyContent: "flex-start", fontWeight: 900 }}>
                  {option.label}
                </Button>
              );
            })}
          </Box>
          {(showExplanation || isChecked) && <Alert severity={isCorrect || showExplanation ? "success" : "warning"} sx={{ mt: 1.25 }}>{isCorrect || showExplanation ? question.explanation ?? "正解です。" : "変数が担当する繰り返しの単位をもう一度確認しましょう。"}</Alert>}
        </Paper>
      {!disabled && !showExplanation && !isCorrect && <Button variant="outlined" disabled={!selected} onClick={check}>この問題の答えを確認する</Button>}
      {isCorrect && safeIndex < questions.length - 1 && <Button variant="contained" onClick={() => setQuestionIndex(safeIndex + 1)}>次の問題へ</Button>}
      {allCorrect && <Typography color="#166534" fontWeight={900}>{questions.length}問すべてに正解しました。下の「次へ」から進みましょう。</Typography>}
    </Stack>
  );
};

export const CodeRepairInput = ({ activity, answer, disabled, showCorrect, onAnswerChange }: {
  activity: MissionActivity;
  answer: unknown;
  disabled: boolean;
  showCorrect: boolean;
  onAnswerChange: (answer: unknown) => void;
}) => {
  const questions = Array.isArray(activity.content.data.repairQuestions) ? activity.content.data.repairQuestions as RepairQuestion[] : [];
  const values = answerValues(answer);
  const correctAnswers = activity.content.data.correctAnswers && typeof activity.content.data.correctAnswers === "object" && !Array.isArray(activity.content.data.correctAnswers)
    ? activity.content.data.correctAnswers as Record<string, string>
    : {};
  const firstUnanswered = questions.findIndex((question) => !values[question.id]);
  const [questionIndex, setQuestionIndex] = useState(firstUnanswered >= 0 ? firstUnanswered : 0);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState<Record<string, string>>({});
  const safeIndex = Math.min(questionIndex, Math.max(questions.length - 1, 0));
  const question = questions[safeIndex];
  if (!question) return <Typography color="error">問題データを読み込めませんでした。</Typography>;
  const selected = drafts[question.id] ?? values[question.id];
  const isChecked = checked[question.id] === selected && Boolean(selected);
  const isCorrect = isChecked && selected === correctAnswers[question.id];
  const allCorrect = questions.every((item) => values[item.id] === correctAnswers[item.id]);
  const choose = (option: string) => {
    setDrafts((current) => ({ ...current, [question.id]: option }));
    setChecked((current) => { const next = { ...current }; delete next[question.id]; return next; });
  };
  const check = () => {
    if (!selected || disabled) return;
    setChecked((current) => ({ ...current, [question.id]: selected }));
    if (selected !== correctAnswers[question.id]) return;
    const nextValues = { ...values, [question.id]: selected };
    onAnswerChange({ values: nextValues, localVerificationPassed: questions.every((item) => nextValues[item.id] === correctAnswers[item.id]) });
  };
  return (
    <Stack spacing={1.5}>
      <Stack direction="row" gap={0.75} flexWrap="wrap">
        {questions.map((item, index) => <Chip key={item.id} label={`問題 ${index + 1}${values[item.id] ? " ✓" : ""}`} color={index === safeIndex ? "primary" : values[item.id] ? "success" : "default"} variant={index === safeIndex ? "filled" : "outlined"} onClick={index <= safeIndex || Boolean(values[item.id]) ? () => setQuestionIndex(index) : undefined} sx={{ fontWeight: 900 }} />)}
      </Stack>
        <Paper elevation={0} sx={{ p: 1.5, border: "1px solid #bfdbfe", borderRadius: 2.5, bgcolor: "#fff" }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.25 }}><Chip label={safeIndex + 1} color="primary" /><Typography fontWeight={950}>{question.label}</Typography></Stack>
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 1 }}>
            {(question.options ?? []).map((option) => (
              <Button key={option} variant={selected === option || (showCorrect && correctAnswers[question.id] === option) ? "contained" : "outlined"} color={showCorrect && correctAnswers[question.id] === option ? "success" : "primary"} disabled={disabled} onClick={() => choose(option)} sx={{ minHeight: 50, fontFamily: "ui-monospace, monospace", fontWeight: 900, textTransform: "none" }}>
                {option}
              </Button>
            ))}
          </Box>
          {(showCorrect || isChecked) && <Alert severity={isCorrect || showCorrect ? "success" : "warning"} sx={{ mt: 1.25 }}>{isCorrect || showCorrect ? "正しい修正を選べました。" : "比較条件と繰り返す範囲を、完成コードと見比べましょう。"}</Alert>}
        </Paper>
      {!disabled && !showCorrect && !isCorrect && <Button variant="outlined" disabled={!selected} onClick={check}>この問題の答えを確認する</Button>}
      {isCorrect && safeIndex < questions.length - 1 && <Button variant="contained" onClick={() => setQuestionIndex(safeIndex + 1)}>次の問題へ</Button>}
      {allCorrect && <Typography color="#166534" fontWeight={900}>{questions.length}問すべてに正解しました。下の「次へ」から進みましょう。</Typography>}
    </Stack>
  );
};
