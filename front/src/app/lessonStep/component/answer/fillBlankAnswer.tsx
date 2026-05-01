"use client";

import React from "react";
import { Box, Button, Grid, Stack, Typography } from "@mui/material";
import { Blank, BlankChoice } from "../../type";

type FillBlankUserAnswer = Record<string, string>;

type FillBlankAnswerProps = {
  codeTemplate: string;
  blanks: Blank[];
  blankChoices: BlankChoice[];
  userAnswer: unknown;
  checked: boolean;
  isCorrect: boolean | null;
  onAnswerChange: (answer: FillBlankUserAnswer) => void;
};

export const FillBlankAnswer: React.FC<FillBlankAnswerProps> = ({
  codeTemplate,
  blanks,
  blankChoices,
  userAnswer,
  checked,
  isCorrect,
  onAnswerChange,
}) => {
  const answers = (userAnswer ?? {}) as FillBlankUserAnswer;
  const shouldLock = checked && isCorrect === true;

  const handleBlankSelect = (blankId: string, value: string) => {
    if (shouldLock) return;

    onAnswerChange({
      ...answers,
      [blankId]: value,
    });
  };

  const renderCodeTemplate = () => {
    const tokens = codeTemplate.split(/(\{\{.+?\}\})/g);

    return (
      <Box
        sx={{
          borderRadius: 3,
          bgcolor: "#0F172A",
          color: "#E5E7EB",
          p: 3,
          fontFamily:
            'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
          fontSize: 15,
          lineHeight: 2,
          whiteSpace: "pre-wrap",
          overflowX: "auto",
        }}
      >
        {tokens.map((token, index) => {
          const match = token.match(/\{\{(.+?)\}\}/);

          if (!match) {
            return (
              <Box
                component="span"
                key={`text-${index}`}
                sx={{
                  color: "#E5E7EB",
                }}
              >
                {token}
              </Box>
            );
          }

          const blankId = match[1];
          const blank = blanks.find((blank) => blank.id === blankId);

          if (!blank) {
            return (
              <Box component="span" key={`unknown-${index}`}>
                {token}
              </Box>
            );
          }

          return (
            <BlankSlot
              key={`${blankId}-${index}`}
              value={answers[blankId]}
              placeholder={blank.placeholder}
              checked={checked}
              isCorrect={isCorrect}
            />
          );
        })}
      </Box>
    );
  };

  return (
    <Box>
      <Stack spacing={2.5}>
        <Box>
          <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1 }}>
            空欄に入るタグを選んでください
          </Typography>

          <Typography variant="body2" color="text.secondary">
            選択肢を押すと、コードの空欄に入ります。
          </Typography>
        </Box>

        {renderCodeTemplate()}

        <Stack spacing={2}>
          {blanks.map((blank, index) => (
            <Box key={blank.id}>
              <Typography
                variant="body2"
                fontWeight={700}
                color="text.secondary"
                sx={{ mb: 1 }}
              >
                空欄 {index + 1}
              </Typography>

              <Grid container spacing={2}>
                {blankChoices.map((choice) => {
                  const isSelected = answers[blank.id] === choice.label;

                  return (
                    <Grid size={{ xs: 12, sm: 6 }} key={choice.id}>
                      <Button
                        fullWidth
                        variant={isSelected ? "contained" : "outlined"}
                        disabled={shouldLock}
                        onClick={() =>
                          handleBlankSelect(blank.id, choice.label)
                        }
                        sx={{
                          py: 1.75,
                          borderRadius: 3,
                          fontWeight: 800,
                          textTransform: "none",
                          bgcolor: isSelected ? undefined : "#FFFFFF",
                        }}
                      >
                        {choice.label}
                      </Button>
                    </Grid>
                  );
                })}
              </Grid>
            </Box>
          ))}
        </Stack>
      </Stack>
    </Box>
  );
};

type BlankSlotProps = {
  value?: string;
  placeholder: string;
  checked: boolean;
  isCorrect: boolean | null;
};

const BlankSlot: React.FC<BlankSlotProps> = ({
  value,
  placeholder,
  checked,
  isCorrect,
}) => {
  const hasValue = Boolean(value);

  const borderColor =
    checked && isCorrect === false
      ? "#F87171"
      : hasValue
        ? "#60A5FA"
        : "#F59E0B";

  const bgcolor =
    checked && isCorrect === false
      ? "#7F1D1D"
      : hasValue
        ? "#1D4ED8"
        : "#92400E";

  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        verticalAlign: "baseline",
        mx: 0.35,
        px: 0.9,
        py: 0.15,
        minWidth: 36,
        borderRadius: 1,
        border: "1px solid",
        borderColor,
        bgcolor,
        color: "#FFFFFF",
        fontSize: 13,
        lineHeight: 1.4,
        fontWeight: 800,
        whiteSpace: "nowrap",
      }}
    >
      {hasValue ? value : placeholder}
    </Box>
  );
};