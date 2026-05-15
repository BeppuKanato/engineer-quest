"use client";

import { Box, Button, Grid, Stack, Typography } from "@mui/material";
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
          <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1 }}>
            空欄に入るものを選んでください
          </Typography>

          <Typography variant="body2" color="text.secondary">
            選択肢を押すと、空欄に入ります。
          </Typography>
        </Box>

        {blankArea.type === "CODE" && (
          <CodeBlankArea
            template={blankArea.template ?? ""}
            blanks={blanks}
            blankChoices={blankChoices}
            answers={answers}
            checked={checked}
            isCorrect={isCorrect}
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
          onSelect={handleBlankSelect}
        />
      </Stack>
    </Box>
  );
};