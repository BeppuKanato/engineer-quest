"use client";

import { Box, Stack, Typography } from "@mui/material";
import { Blank, BlankArea, BlankChoice } from "../../type";
import { BlankChoiceList } from "./selectFill/blankChoiceList";
import { CodeBlankArea } from "./selectFill/codeBlankArea";
import { OrderedStepsBlankArea } from "./selectFill/orderStepsBlankArea";

type SelectFillUserAnswer = Record<string, string>;

type SelectFillAnswerProps = {
  blankArea: BlankArea;
  blanks: Blank[];
  blankChoices: BlankChoice[];
  userAnswer: unknown;
  checked: boolean;
  isCorrect: boolean | null;
  onAnswerChange: (answer: SelectFillUserAnswer) => void;
};

export const SelectFillAnswer: React.FC<SelectFillAnswerProps> = ({
  blankArea,
  blanks,
  blankChoices,
  userAnswer,
  checked,
  isCorrect,
  onAnswerChange,
}) => {
  const answers = (userAnswer ?? {}) as SelectFillUserAnswer;
  const shouldLock = checked && isCorrect === true;
  const answeredCount = blanks.filter((blank) => Boolean(answers[blank.id])).length;
  const totalBlankCount = blanks.length;
  const helperText =
  shouldLock
    ? "正解済みです。選んだ内容を確認できます。"
    : "選択肢を押すと、コードの空欄に入ります。";
  const answerStatusColor = checked && isCorrect === true //確認済み and 正解
  ? { bgcolor: "#ECFDF5", color: "#16A34A"} 
  : checked && isCorrect === false
  ? { bgcolor: "#FFF1F2", color: "#E11D48" }  //確認済み and 不正解
  : answeredCount === totalBlankCount
  ? { bgcolor: "#EFF6FF", color: "#1976D2" }  //全部選択済み
  : { bgcolor: "#F8FAFC", color: "#64748B" }; //未入力 or blank未満の数選択

  const handleBlankSelect = (blankId: string, choiceId: string) => {
    if (shouldLock) return;

    onAnswerChange({
      ...answers,
      [blankId]: choiceId,
    });
  };

  return (
    <Box>
      <Stack spacing={2.5}>
        <Box>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            alignItems={{ xs: "flex-start", sm: "center" }}
            justifyContent="space-between"
            sx={{ mb: 1 }}
          >
            <Typography variant="subtitle1" fontWeight={800}>
              空欄に入るものを選んでください
            </Typography>

            <Typography
              variant="caption"
              sx={{
                px: 1.5,
                py: 0.5,
                borderRadius: 999,
                bgcolor: answerStatusColor.bgcolor,
                color: answerStatusColor.color,
                fontWeight: 800,
              }}
            >
              {answeredCount} / {totalBlankCount} 個入力済み
            </Typography>
          </Stack>

          <Typography variant="body2" color="text.secondary">
            {helperText}
          </Typography>
        </Box>

        {blankArea.type === "CODE" && (
          <CodeBlankArea
            template={blankArea.template ?? ""}
            blanks={blanks}
            blankChoices={blankChoices}
            answers={answers}
            checked={checked}
          />
        )}

        {blankArea.type === "ORDERED_STEPS" && (
          <OrderedStepsBlankArea
            blanks={blanks}
            blankChoices={blankChoices}
            answers={answers}
            checked={checked}
            isCorrect={isCorrect}
          />
        )}

        <BlankChoiceList
          blanks={blanks}
          blankChoices={blankChoices}
          answers={answers}
          shouldLock={shouldLock}
          checked={checked}
          onSelect={handleBlankSelect}
        />
      </Stack>
    </Box>
  );
};