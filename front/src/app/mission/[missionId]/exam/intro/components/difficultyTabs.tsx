"use client";

import React from "react";
import { Box, Stack, Typography } from "@mui/material";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import RadioButtonUncheckedRoundedIcon from "@mui/icons-material/RadioButtonUncheckedRounded";

import { difficultyMeta, difficultyOrder } from "../difficulty";
import type { Difficulty } from "../type";

type DifficultyVisualStyle = {
  color: string;
  lightColor: string;
  selectedBgColor: string;
};

const difficultyVisualStyle: Record<Difficulty, DifficultyVisualStyle> = {
  easy: {
    color: "#22a447",
    lightColor: "#dcfce7",
    selectedBgColor: "#f0fdf4",
  },
  normal: {
    color: "#1976d2",
    lightColor: "#dbeafe",
    selectedBgColor: "#eff6ff",
  },
  hard: {
    color: "#dc2626",
    lightColor: "#fee2e2",
    selectedBgColor: "#fef2f2",
  },
};

type Props = {
  value: Difficulty;
  onChange: (difficulty: Difficulty) => void;
};

export const DifficultyTabs: React.FC<Props> = ({ value, onChange }) => {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          sm: "repeat(3, 1fr)",
        },
        gap: 1.4,
      }}
    >
      {difficultyOrder.map((difficulty) => {
        const meta = difficultyMeta[difficulty];
        const style = difficultyVisualStyle[difficulty];
        const isSelected = difficulty === value;

        return (
          <Box
            key={difficulty}
            component="button"
            type="button"
            onClick={() => onChange(difficulty)}
            aria-pressed={isSelected}
            sx={{
              appearance: "none",
              position: "relative",
              overflow: "hidden",
              textAlign: "left",
              cursor: "pointer",
              border: "2px solid",
              borderColor: isSelected
                ? style.color
                : "rgba(203, 213, 225, 0.95)",
              bgcolor: isSelected ? style.selectedBgColor : "#ffffff",
              borderRadius: 3.5,
              p: 0,
              minHeight: 164,
              transition:
                "transform 0.16s ease, box-shadow 0.16s ease, border-color 0.16s ease, background-color 0.16s ease",
              boxShadow: isSelected
                ? `0 14px 28px ${toRgba(style.color, 0.16)}`
                : "0 4px 10px rgba(15, 23, 42, 0.035)",
              "&:hover": {
                borderColor: style.color,
                transform: "translateY(-3px)",
                boxShadow: `0 16px 30px ${toRgba(style.color, 0.16)}`,
              },
              "&:focus-visible": {
                outline: `3px solid ${toRgba(style.color, 0.24)}`,
                outlineOffset: 2,
              },
            }}
          >
            <Box
              sx={{
                height: 8,
                bgcolor: style.color,
              }}
            />

            <Box
              sx={{
                position: "absolute",
                top: 18,
                right: 14,
                display: "grid",
                placeItems: "center",
                zIndex: 1,
              }}
            >
              {isSelected ? (
                <CheckCircleRoundedIcon
                  sx={{
                    color: style.color,
                    fontSize: 23,
                  }}
                />
              ) : (
                <RadioButtonUncheckedRoundedIcon
                  sx={{
                    color: "#cbd5e1",
                    fontSize: 23,
                  }}
                />
              )}
            </Box>

            <Stack
              spacing={1.35}
              sx={{
                height: "calc(100% - 8px)",
                p: 1.8,
                background: isSelected
                  ? `linear-gradient(180deg, ${style.selectedBgColor} 0%, #ffffff 100%)`
                  : `linear-gradient(180deg, ${style.lightColor} 0%, #ffffff 42%)`,
              }}
            >
              <Box sx={{ textAlign: "center", px: 2.5 }}>
                <Typography
                  sx={{
                    color: style.color,
                    fontWeight: 900,
                    fontSize: "0.74rem",
                    lineHeight: 1,
                    letterSpacing: "0.08em",
                    mb: 0.8,
                  }}
                >
                  {meta.label}
                </Typography>

                <Typography
                  sx={{
                    color: "#0f172a",
                    fontWeight: 900,
                    fontSize: {
                      xs: "1.15rem",
                      md: "1.25rem",
                    },
                    lineHeight: 1.25,
                  }}
                >
                  {meta.title}
                </Typography>
              </Box>

              <Box
                sx={{
                  pt: 0.8,
                  borderTop: `1px solid ${toRgba(style.color, 0.18)}`,
                }}
              >
                <Typography
                  sx={{
                    color: "#334155",
                    fontWeight: 800,
                    fontSize: "0.78rem",
                    lineHeight: 1.75,
                  }}
                >
                  入力量：{meta.inputAmount}
                  <br />
                  ヒント：{meta.hintAmount}
                </Typography>

                <Typography
                  sx={{
                    color: "#64748b",
                    fontWeight: 700,
                    fontSize: "0.74rem",
                    lineHeight: 1.6,
                    mt: 0.8,
                  }}
                >
                  {meta.description}
                </Typography>
              </Box>

              <Typography
                sx={{
                  color: isSelected ? style.color : "#94a3b8",
                  fontWeight: 900,
                  fontSize: "0.76rem",
                  mt: "auto",
                }}
              >
                {isSelected ? "選択中" : "選択する"}
              </Typography>
            </Stack>
          </Box>
        );
      })}
    </Box>
  );
};

const toRgba = (hex: string, alpha: number) => {
  const normalized = hex.replace("#", "");
  const bigint = parseInt(normalized, 16);

  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};