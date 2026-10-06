/** 比較手順、複数判断、穴埋め、コードブロック配置に共通する回答UI。 */
"use client";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import { Alert, Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";
import { useState } from "react";
import { CodeBlockWorkspace } from "@/features/learning/components";

import type { MissionActivity } from "@/features/learning/mission-activity-play/missionActivityPlay.types";

type DecisionPair = { id: string; left: number; right: number; feedback?: string };
type FillOption = { id: string; label: string };
type CodeBlockItem = { id: string; label: string };
type BuilderSlot = { label?: string; indent?: number };
type SequenceOption = { id: string; label: string };
type SequenceQuestion = {
  currentPair?: [number, number];
  question?: string;
  options?: SequenceOption[];
  correctFeedback?: string;
  incorrectFeedback?: string;
  leftValues?: number[];
  rightValues?: number[];
  leftIndex?: number;
  rightIndex?: number;
  resultValues?: number[];
};

const recordAnswer = (answer: unknown) =>
  answer && typeof answer === "object" && !Array.isArray(answer)
    ? answer as { values?: Record<string, string> | string[]; currentStep?: number; unlockedStep?: number }
    : {};

export const MultiDecisionInput = ({
  activity,
  answer,
  disabled,
  showExplanation,
  onAnswerChange,
}: {
  activity: MissionActivity;
  answer: unknown;
  disabled: boolean;
  showExplanation: boolean;
  onAnswerChange: (answer: unknown) => void;
}) => {
  const pairs = Array.isArray(activity.content.data.decisionPairs) ? activity.content.data.decisionPairs as DecisionPair[] : [];
  const current = recordAnswer(answer).values;
  const values = current && !Array.isArray(current) ? current : {};
  const correctAnswers = activity.content.data.correctAnswers && typeof activity.content.data.correctAnswers === "object" && !Array.isArray(activity.content.data.correctAnswers)
    ? activity.content.data.correctAnswers as Record<string, string>
    : {};
  const firstUnanswered = pairs.findIndex((pair) => !values[pair.id]);
  const [questionIndex, setQuestionIndex] = useState(firstUnanswered >= 0 ? firstUnanswered : 0);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState<Record<string, string>>({});
  const safeIndex = Math.min(questionIndex, Math.max(pairs.length - 1, 0));
  const pair = pairs[safeIndex];
  if (!pair) return <Typography color="error">問題データを読み込めませんでした。</Typography>;
  const selected = drafts[pair.id] ?? values[pair.id];
  const isChecked = checked[pair.id] === selected && Boolean(selected);
  const isCorrect = isChecked && selected === correctAnswers[pair.id];
  const allCorrect = pairs.every((item) => values[item.id] === correctAnswers[item.id]);

  const select = (optionId: string) => {
    setDrafts((state) => ({ ...state, [pair.id]: optionId }));
    setChecked((state) => {
      const next = { ...state };
      delete next[pair.id];
      return next;
    });
  };
  const check = () => {
    if (!selected || disabled) return;
    setChecked((state) => ({ ...state, [pair.id]: selected }));
    if (selected !== correctAnswers[pair.id]) return;
    const nextValues = { ...values, [pair.id]: selected };
    onAnswerChange({
      values: nextValues,
      localVerificationPassed: pairs.every((item) => nextValues[item.id] === correctAnswers[item.id]),
    });
  };

  return (
    <Stack spacing={1.5}>
      <Stack direction="row" gap={0.75} flexWrap="wrap">
        {pairs.map((item, index) => <Chip key={item.id} label={`問題 ${index + 1}${values[item.id] ? " ✓" : ""}`} color={index === safeIndex ? "primary" : values[item.id] ? "success" : "default"} variant={index === safeIndex ? "filled" : "outlined"} onClick={index <= safeIndex || Boolean(values[item.id]) ? () => setQuestionIndex(index) : undefined} sx={{ fontWeight: 900 }} />)}
      </Stack>
      <Paper elevation={0} sx={{ p: 1.5, border: "1px solid #bfdbfe", borderRadius: 2.5, bgcolor: "#fff" }}>
          <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "stretch", sm: "center" }} spacing={2}>
            <Chip label={safeIndex + 1} color="primary" sx={{ alignSelf: { xs: "flex-start", sm: "center" }, fontWeight: 950 }} />
            <Stack direction="row" spacing={1}>
              {[pair.left, pair.right].map((value, valueIndex) => (
                <Paper key={valueIndex} elevation={0} sx={{ width: 68, height: 68, display: "grid", placeItems: "center", border: "2px solid #cbd5e1", borderRadius: 2, fontSize: 32, fontWeight: 950 }}>{value}</Paper>
              ))}
            </Stack>
            <Stack direction={{ xs: "column", md: "row" }} spacing={1} sx={{ flex: 1 }}>
              {[{ id: "swap", label: "交換する" }, { id: "keep", label: "交換しない" }].map((option) => {
                const optionSelected = selected === option.id;
                return (
                  <Button
                    key={option.id}
                    variant={optionSelected ? "contained" : "outlined"}
                    disabled={disabled}
                    startIcon={optionSelected ? <CheckCircleIcon /> : <RadioButtonUncheckedIcon />}
                    onClick={() => select(option.id)}
                    sx={{ minHeight: 48, flex: 1, fontWeight: 900 }}
                  >
                    {option.label}
                  </Button>
                );
              })}
            </Stack>
          </Stack>
          {(showExplanation || isChecked) && (
            <Alert severity={isCorrect || showExplanation ? "success" : "warning"} sx={{ mt: 1.25 }}>
              {isCorrect || showExplanation
                ? `${pair.feedback ?? "正しく判断できました。"}${correctAnswers[pair.id] === "swap" ? ` 交換後は[${pair.right}, ${pair.left}]です。` : ""}`
                : "左の値と右の値の大小関係をもう一度確認しましょう。"}
            </Alert>
          )}
      </Paper>
      {!disabled && !showExplanation && !isCorrect && <Button variant="outlined" disabled={!selected} onClick={check}>この問題の答えを確認する</Button>}
      {isCorrect && safeIndex < pairs.length - 1 && <Button variant="contained" onClick={() => setQuestionIndex(safeIndex + 1)}>次の問題へ</Button>}
      {allCorrect && <Typography color="#166534" fontWeight={900}>{pairs.length}問すべてに正解しました。下の「次へ」から進みましょう。</Typography>}
    </Stack>
  );
};

export const OptionFillInput = ({
  activity,
  answer,
  disabled,
  onAnswerChange,
}: {
  activity: MissionActivity;
  answer: unknown;
  disabled: boolean;
  onAnswerChange: (answer: unknown) => void;
}) => {
  const options = Array.isArray(activity.content.data.fillOptions) ? activity.content.data.fillOptions as FillOption[] : [];
  const selected = typeof answer === "string" ? answer : "";
  return (
    <Stack spacing={1.5}>
      <Typography fontWeight={950}>選択肢から1つ選んでください</Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: `repeat(${Math.min(4, options.length)}, 1fr)` }, gap: 1.25 }}>
        {options.map((option) => (
          <Button
            key={option.id}
            variant={selected === option.id ? "contained" : "outlined"}
            disabled={disabled}
            onClick={() => onAnswerChange(option.id)}
            sx={{ minHeight: 64, fontFamily: "ui-monospace, monospace", fontSize: 18, fontWeight: 900, textTransform: "none" }}
          >
            {option.label}
          </Button>
        ))}
      </Box>
    </Stack>
  );
};

export const ComparisonSequenceInput = ({
  activity,
  answer,
  disabled,
  onAnswerChange,
}: {
  activity: MissionActivity;
  answer: unknown;
  disabled: boolean;
  onAnswerChange: (answer: unknown) => void;
}) => {
  const questions = Array.isArray(activity.content.data.sequenceQuestions)
    ? activity.content.data.sequenceQuestions as SequenceQuestion[]
    : [];
  const answerRecord = recordAnswer(answer);
  const rawValues = answerRecord.values;
  const values = Array.isArray(rawValues)
    ? rawValues.filter((value): value is string => typeof value === "string")
    : [];
  const currentIndex = Math.min(
    typeof answerRecord.currentStep === "number" ? answerRecord.currentStep : values.length,
    Math.max(questions.length - 1, 0)
  );
  const unlockedIndex = Math.min(
    typeof answerRecord.unlockedStep === "number"
      ? answerRecord.unlockedStep
      : currentIndex,
    Math.max(questions.length - 1, 0),
  );
  const current = questions[currentIndex];
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [checked, setChecked] = useState<Record<number, string>>({});
  const correctAnswers = Array.isArray(activity.content.data.correctAnswers)
    ? activity.content.data.correctAnswers.filter((value): value is string => typeof value === "string")
    : [];

  if (!current) return <Typography color="error">比較問題のデータを読み込めませんでした。</Typography>;

  const choose = (optionId: string) => {
    if (disabled) return;
    setDrafts((state) => ({ ...state, [currentIndex]: optionId }));
    setChecked((state) => {
      const next = { ...state };
      delete next[currentIndex];
      return next;
    });
  };
  const selected = drafts[currentIndex] ?? values[currentIndex];
  const isChecked = checked[currentIndex] === selected && Boolean(selected);
  const isCurrentCorrect = isChecked && selected === correctAnswers[currentIndex];
  const checkCurrent = () => {
    if (!selected || disabled) return;
    setChecked((state) => ({ ...state, [currentIndex]: selected }));
    if (selected !== correctAnswers[currentIndex]) return;
    const next = Array.from({ length: questions.length }, (_, index) => values[index] ?? "");
    next[currentIndex] = selected;
    const allCorrectAfterSelection = questions.every((_, index) => next[index] === correctAnswers[index]);
    onAnswerChange({
      values: next,
      currentStep: currentIndex,
      unlockedStep: unlockedIndex,
      localVerificationPassed: allCorrectAfterSelection,
    });
  };
  const allCorrect = questions.length > 0 && questions.every((_, index) => values[index] === correctAnswers[index]);
  const correctFeedback = current.correctFeedback
    ?? (typeof activity.content.data.correctFeedback === "string"
      ? activity.content.data.correctFeedback
      : "判断できました。次の問題へ進みましょう。");
  const incorrectFeedback = current.incorrectFeedback
    ?? (typeof activity.content.data.incorrectFeedback === "string"
      ? activity.content.data.incorrectFeedback
      : "示された値と現在位置をもう一度確認してみましょう。");

  return (
    <Stack spacing={1.5}>
      <Stack direction="row" gap={1} flexWrap="wrap" alignItems="center">
        {questions.map((_, index) => (
          <Chip
            key={index}
            size="small"
            label={`問題 ${index + 1}`}
            color={index === currentIndex ? "primary" : values[index] === correctAnswers[index] ? "success" : "default"}
            variant={index === currentIndex ? "filled" : "outlined"}
            onClick={disabled || index > unlockedIndex
              ? undefined
              : () => onAnswerChange({ values, currentStep: index, unlockedStep: unlockedIndex })}
            sx={{ fontWeight: 900 }}
          />
        ))}
      </Stack>
      {(current.leftValues || current.rightValues || current.resultValues) && (
        <Paper elevation={0} sx={{ p: 2, border: "1px solid #bfdbfe", borderRadius: 2.5, bgcolor: "#fff" }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "stretch", md: "center" }} justifyContent="center">
            {current.leftValues && (
              <Stack spacing={0.75} alignItems="center">
                <Typography fontWeight={950}>左の列</Typography>
                <Stack direction="row" spacing={0.75}>
                  {current.leftValues.map((value, index) => (
                    <Paper key={`${value}-${index}`} elevation={0} sx={{ width: 52, height: 52, display: "grid", placeItems: "center", borderRadius: 2, border: index < (current.leftIndex ?? 0) ? "1px solid #cbd5e1" : "2px solid #2563eb", bgcolor: index < (current.leftIndex ?? 0) ? "#f1f5f9" : "#eff6ff", color: "#0f172a", fontWeight: 950 }}>{value}</Paper>
                  ))}
                </Stack>
              </Stack>
            )}
            {current.rightValues && (
              <Stack spacing={0.75} alignItems="center">
                <Typography fontWeight={950}>右の列</Typography>
                <Stack direction="row" spacing={0.75}>
                  {current.rightValues.map((value, index) => (
                    <Paper key={`${value}-${index}`} elevation={0} sx={{ width: 52, height: 52, display: "grid", placeItems: "center", borderRadius: 2, border: index < (current.rightIndex ?? 0) ? "1px solid #cbd5e1" : "2px solid #7c3aed", bgcolor: index < (current.rightIndex ?? 0) ? "#f1f5f9" : "#f5f3ff", color: "#0f172a", fontWeight: 950 }}>{value}</Paper>
                  ))}
                </Stack>
              </Stack>
            )}
            {current.resultValues && (
              <Stack spacing={0.75} alignItems="center">
                <Typography fontWeight={950}>結合結果</Typography>
                <Stack direction="row" spacing={0.75}>
                  {current.resultValues.length > 0 ? current.resultValues.map((value, index) => (
                    <Paper key={`${value}-${index}`} elevation={0} sx={{ width: 52, height: 52, display: "grid", placeItems: "center", borderRadius: 2, border: "2px solid #16a34a", bgcolor: "#f0fdf4", color: "#0f172a", fontWeight: 950 }}>{value}</Paper>
                  )) : <Chip label="まだ空" variant="outlined" />}
                </Stack>
              </Stack>
            )}
          </Stack>
        </Paper>
      )}
      <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, bgcolor: "#f8fafc", border: "1px solid #dbe3ef" }}>
        <Typography color="#0f172a" fontWeight={950}>{current.question}</Typography>
      </Paper>
      <Stack spacing={1}>
        {(current.options ?? []).map((option) => (
          <Button
            key={option.id}
            variant={selected === option.id ? "contained" : "outlined"}
            disabled={disabled}
            onClick={() => choose(option.id)}
            startIcon={selected === option.id ? <CheckCircleIcon /> : <RadioButtonUncheckedIcon />}
            sx={{ minHeight: 52, justifyContent: "flex-start", fontWeight: 900 }}
          >
            {option.label}
          </Button>
        ))}
      </Stack>
      {isChecked && (
        <Alert severity={isCurrentCorrect ? "success" : "info"} aria-live="polite">
          {isCurrentCorrect ? correctFeedback : incorrectFeedback}
        </Alert>
      )}
      {!disabled && !isCurrentCorrect && (
        <Button variant="outlined" disabled={!selected} onClick={checkCurrent} sx={{ minHeight: 44, fontWeight: 900 }}>
          この問題の答えを確認する
        </Button>
      )}
      {isCurrentCorrect && currentIndex < questions.length - 1 && (
        <Button
          variant="outlined"
          disabled={disabled}
          onClick={() => onAnswerChange({
            values,
            currentStep: currentIndex + 1,
            unlockedStep: Math.max(unlockedIndex, currentIndex + 1),
            localVerificationPassed: allCorrect,
          })}
          sx={{ alignSelf: "flex-end", minHeight: 44, fontWeight: 900 }}
        >
          次の問題へ
        </Button>
      )}
      {allCorrect && currentIndex === questions.length - 1 && (
        <Typography color="#166534" fontWeight={900}>
          {questions.length}問すべてに正解しました。下の「次へ」から進みましょう。
        </Typography>
      )}
    </Stack>
  );
};

export const CodeBlockBuilderInput = ({
  activity,
  answer,
  isCorrect,
  disabled,
  onAnswerChange,
}: {
  activity: MissionActivity;
  answer: unknown;
  isCorrect: boolean;
  disabled: boolean;
  onAnswerChange: (answer: unknown) => void;
}) => {
  const blocks = Array.isArray(activity.content.data.codeBlocks) ? activity.content.data.codeBlocks as CodeBlockItem[] : [];
  const expected = Array.isArray(activity.content.data.correctAnswers)
    ? activity.content.data.correctAnswers.filter((item): item is string => typeof item === "string")
    : [];
  const configuredSlots = Array.isArray(activity.content.data.builderSlots)
    ? activity.content.data.builderSlots as BuilderSlot[]
    : [];
  const slotCount = Math.max(configuredSlots.length, expected.length, 1);
  const slots = Array.from({ length: slotCount }, (_, index) => configuredSlots[index] ?? {
    label: index === 0 ? "条件" : "ifの内側",
    indent: index,
  });
  const rawValues = recordAnswer(answer).values;
  const selected = Array.from({ length: slotCount }, (_, index) =>
    Array.isArray(rawValues) && typeof rawValues[index] === "string" ? rawValues[index] : ""
  );
  const previewResult = typeof activity.content.data.executionResult === "string" ? activity.content.data.executionResult : "[3, 6, 5, 2]";
  const waitingMessage = typeof activity.content.data.previewWaitingMessage === "string"
    ? activity.content.data.previewWaitingMessage
    : `${slotCount}つの正しいブロックを配置すると結果を確認できます。`;
  const prefix = typeof activity.content.data.codePreviewPrefix === "string"
    ? activity.content.data.codePreviewPrefix
    : "numbers = [6, 3, 5, 2]";
  const instruction = typeof activity.content.data.builderInstruction === "string"
    ? activity.content.data.builderInstruction
    : "ブロックをドラッグまたはクリックして、if文を組み立ててください";

  return (
    <CodeBlockWorkspace
      blocks={blocks}
      slots={slots.map((slot, index) => ({ label: slot.label ?? `処理 ${index + 1}`, indent: slot.indent }))}
      selectedBlockIds={selected}
      prefix={prefix}
      instruction={instruction}
      previewMessage={isCorrect ? previewResult : `${selected.filter(Boolean).length} / ${slotCount}ブロックを配置済み。${waitingMessage}`}
      previewSuccess={isCorrect}
      disabled={disabled}
      onChange={(values) => onAnswerChange({ values })}
    />
  );
};
