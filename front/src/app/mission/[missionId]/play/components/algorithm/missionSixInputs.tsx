"use client";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import { Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";

import type { MissionActivity } from "../../type";

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
  return (
    <Stack spacing={1.5}>
      {questions.map((question, index) => (
        <Paper key={question.id} elevation={0} sx={{ p: 1.5, border: "1px solid #bfdbfe", borderRadius: 2.5, bgcolor: "#fff" }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.25 }}>
            <Chip label={index + 1} color="primary" sx={{ fontWeight: 950 }} />
            <Typography fontWeight={950}>{question.question}</Typography>
          </Stack>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))", xl: "repeat(4, minmax(0, 1fr))" }, gap: 1 }}>
            {(question.options ?? []).map((option) => {
              const selected = values[question.id] === option.id;
              const correct = showExplanation && correctAnswers[question.id] === option.id;
              return (
                <Button key={option.id} variant={selected || correct ? "contained" : "outlined"} color={correct ? "success" : "primary"} disabled={disabled} onClick={() => onAnswerChange({ values: { ...values, [question.id]: option.id } })} startIcon={selected || correct ? <CheckCircleIcon /> : <RadioButtonUncheckedIcon />} sx={{ minHeight: 52, justifyContent: "flex-start", fontWeight: 900 }}>
                  {option.label}
                </Button>
              );
            })}
          </Box>
          {showExplanation && question.explanation && <Typography color="#166534" fontWeight={900} sx={{ mt: 1.25 }}>{question.explanation}</Typography>}
        </Paper>
      ))}
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
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "repeat(2, minmax(0, 1fr))" }, gap: 1.5 }}>
      {questions.map((question, index) => (
        <Paper key={question.id} elevation={0} sx={{ p: 1.5, border: "1px solid #bfdbfe", borderRadius: 2.5, bgcolor: "#fff" }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.25 }}><Chip label={index + 1} color="primary" /><Typography fontWeight={950}>{question.label}</Typography></Stack>
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 1 }}>
            {(question.options ?? []).map((option) => (
              <Button key={option} variant={values[question.id] === option || (showCorrect && correctAnswers[question.id] === option) ? "contained" : "outlined"} color={showCorrect && correctAnswers[question.id] === option ? "success" : "primary"} disabled={disabled} onClick={() => onAnswerChange({ values: { ...values, [question.id]: option } })} sx={{ minHeight: 50, fontFamily: "ui-monospace, monospace", fontWeight: 900, textTransform: "none" }}>
                {option}
              </Button>
            ))}
          </Box>
        </Paper>
      ))}
    </Box>
  );
};
