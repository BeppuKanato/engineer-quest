"use client";

import React from "react";
import { Box, Stack, Typography } from "@mui/material";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import RadioButtonUncheckedRoundedIcon from "@mui/icons-material/RadioButtonUncheckedRounded";
import { Difficulty } from "../type";

type DifficultyItem = {
    key: Difficulty;
    label: string;
    subLabel: string;
    input: string;
    hint: string;
    description: string;
    color: string;
    lightColor: string;
    selectedBgColor: string;
};

const difficulties: DifficultyItem[] = [
    {
        key: "easy",
        label: "やさしい",
        subLabel: "Easy",
        input: "少なめ",
        hint: "多め",
        description: "少ない入力で流れを確認できます。",
        color: "#22a447",
        lightColor: "#dcfce7",
        selectedBgColor: "#f0fdf4",
    },
    {
        key: "normal",
        label: "ふつう",
        subLabel: "Normal",
        input: "ふつう",
        hint: "ふつう",
        description: "重要なコードを自分で入力します。",
        color: "#1976d2",
        lightColor: "#dbeafe",
        selectedBgColor: "#eff6ff",
    },
    {
        key: "hard",
        label: "むずかしい",
        subLabel: "Hard",
        input: "多め",
        hint: "少なめ",
        description: "多めのコードを自力で再現します。",
        color: "#dc2626",
        lightColor: "#fee2e2",
        selectedBgColor: "#fef2f2",
    },
];

type Props = {
    value: Difficulty;
    onChange: (difficulty: Difficulty) => void;
};

export const DifficultyTabs: React.FC<Props> = ({
    value,
    onChange,
}) => {
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
            {difficulties.map((item) => {
                const isSelected = item.key === value;

                return (
                    <Box
                        key={item.key}
                        component="button"
                        type="button"
                        onClick={() => onChange(item.key)}
                        aria-pressed={isSelected}
                        sx={{
                            appearance: "none",
                            position: "relative",
                            overflow: "hidden",
                            textAlign: "left",
                            cursor: "pointer",
                            border: "2px solid",
                            borderColor: isSelected
                                ? item.color
                                : "rgba(203, 213, 225, 0.95)",
                            bgcolor: isSelected
                                ? item.selectedBgColor
                                : "#ffffff",
                            borderRadius: 3.5,
                            p: 0,
                            minHeight: 164,
                            transition:
                                "transform 0.16s ease, box-shadow 0.16s ease, border-color 0.16s ease, background-color 0.16s ease",
                            boxShadow: isSelected
                                ? `0 14px 28px ${toRgba(item.color, 0.16)}`
                                : "0 4px 10px rgba(15, 23, 42, 0.035)",
                            "&:hover": {
                                borderColor: item.color,
                                transform: "translateY(-3px)",
                                boxShadow: `0 16px 30px ${toRgba(item.color, 0.16)}`,
                            },
                            "&:focus-visible": {
                                outline: `3px solid ${toRgba(item.color, 0.24)}`,
                                outlineOffset: 2,
                            },
                        }}
                    >
                        <Box
                            sx={{
                                height: 8,
                                bgcolor: item.color,
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
                                        color: item.color,
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
                                    ? `linear-gradient(180deg, ${item.selectedBgColor} 0%, #ffffff 100%)`
                                    : `linear-gradient(180deg, ${item.lightColor} 0%, #ffffff 42%)`,
                            }}
                        >
                            <Box sx={{ textAlign: "center", px: 2.5 }}>
                                <Typography
                                    sx={{
                                        color: item.color,
                                        fontWeight: 900,
                                        fontSize: "0.74rem",
                                        lineHeight: 1,
                                        letterSpacing: "0.08em",
                                        mb: 0.8,
                                    }}
                                >
                                    {item.subLabel}
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
                                    {item.label}
                                </Typography>
                            </Box>

                            <Box
                                sx={{
                                    pt: 0.8,
                                    borderTop: `1px solid ${toRgba(item.color, 0.18)}`,
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
                                    入力量：{item.input}
                                    <br />
                                    ヒント：{item.hint}
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
                                    {item.description}
                                </Typography>
                            </Box>

                            <Typography
                                sx={{
                                    color: isSelected ? item.color : "#94a3b8",
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