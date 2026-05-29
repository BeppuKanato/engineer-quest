"use client";

import React from "react";
import {
    Box,
    Button,
    Chip,
    Paper,
    Stack,
    Typography,
} from "@mui/material";
import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import ImageRoundedIcon from "@mui/icons-material/ImageRounded";
import { DifficultyTabs } from "./difficultyTabs";
import { Difficulty, ExamIntroData } from "../type";

type Props = {
    data: ExamIntroData;
    difficulty: Difficulty;
    onChangeDifficulty: (difficulty: Difficulty) => void;
    onStart: () => void;
};

const difficultyDescriptions: Record<Difficulty, string> = {
    easy: "一部のコードだけを入力します。まずは流れを確認したい人向けです。",
    normal: "ミッションの大事なコードを自分で入力します。標準的なチャレンジです。",
    hard: "入力する量が多く、ヒントも少なめです。自力で挑戦したい人向けです。",
};

export const MissionExamIntroCard: React.FC<Props> = ({
    data,
    difficulty,
    onChangeDifficulty,
    onStart,
}) => {
    return (
        <Paper
            elevation={0}
            sx={{
                overflow: "hidden",
                borderRadius: 5,
                bgcolor: "#ffffff",
                border: "1px solid #e2e8f0",
                boxShadow: "0 24px 60px rgba(15, 23, 42, 0.10)",
            }}
        >
            <Box
                sx={{
                    position: "relative",
                    overflow: "hidden",
                    px: { xs: 2.5, md: 4 },
                    pt: { xs: 3.5, md: 4.5 },
                    pb: { xs: 3, md: 4 },
                    // background:
                    //     "radial-gradient(circle at 50% 18%, rgba(255, 210, 64, 0.22), transparent 22%), radial-gradient(circle at 50% 24%, rgba(124, 58, 237, 0.18), transparent 34%), linear-gradient(135deg, #ffffff 0%, #f8fbff 52%, #f4efff 100%)",
                }}
            >
                <DecorativeMark
                    value="✦"
                    sx={{
                        top: 30,
                        left: 48,
                        color: "rgba(124, 58, 237, 0.5)",
                        fontSize: 28,
                    }}
                />

                <DecorativeMark
                    value="✦"
                    sx={{
                        top: 70,
                        right: 62,
                        color: "rgba(37, 99, 235, 0.5)",
                        fontSize: 34,
                    }}
                />

                <DecorativeMark
                    value="★"
                    sx={{
                        right: 130,
                        bottom: 46,
                        color: "rgba(245, 158, 11, 0.5)",
                        fontSize: 24,
                    }}
                />

                <Stack
                    spacing={2.2}
                    alignItems="center"
                    textAlign="center"
                    sx={{
                        position: "relative",
                        zIndex: 1,
                    }}
                >
                    <Chip
                        label="MISSION EXAM"
                        size="small"
                        sx={{
                            bgcolor: "#ede9fe",
                            color: "#6d28d9",
                            border: "1px solid rgba(124, 58, 237, 0.18)",
                            fontWeight: 900,
                            letterSpacing: "0.08em",
                            borderRadius: 999,
                        }}
                    />

                    <Box
                        sx={{
                            position: "relative",
                            width: 88,
                            height: 88,
                            borderRadius: "50%",
                            display: "grid",
                            placeItems: "center",
                            color: "#ffffff",
                            background:
                                "linear-gradient(135deg, #facc15 0%, #f59e0b 100%)",
                            boxShadow:
                                "0 18px 36px rgba(245, 158, 11, 0.34)",
                            "&::before": {
                                content: '""',
                                position: "absolute",
                                inset: -10,
                                borderRadius: "50%",
                                border: "2px solid rgba(250, 204, 21, 0.26)",
                            },
                            "&::after": {
                                content: '""',
                                position: "absolute",
                                inset: -20,
                                borderRadius: "50%",
                                border: "1px solid rgba(245, 158, 11, 0.16)",
                            },
                        }}
                    >
                        <EmojiEventsRoundedIcon sx={{ fontSize: 48 }} />
                    </Box>

                    <Box>
                        <Typography
                            component="h1"
                            sx={{
                                color: "#0f4fa8",
                                fontWeight: 900,
                                fontSize: { xs: "1.75rem", md: "2.35rem" },
                                lineHeight: 1.22,
                                letterSpacing: "0.01em",
                                mb: 1.2,
                            }}
                        >
                            {data.examTitle}
                        </Typography>

                        <Chip
                            label={data.missionTitle}
                            size="small"
                            sx={{
                                bgcolor: "#e3f2fd",
                                color: "#1565c0",
                                fontWeight: 900,
                                borderRadius: 999,
                                mb: 1.8,
                            }}
                        />

                        <Typography
                            sx={{
                                maxWidth: 560,
                                color: "#334155",
                                fontWeight: 800,
                                fontSize: { xs: "0.95rem", md: "1rem" },
                                lineHeight: 1.85,
                                mx: "auto",
                            }}
                        >
                            {data.description}
                        </Typography>
                    </Box>

                    <PreviewThumbnail
                        thumbnailUrl={data.thumbnailUrl}
                        title={data.examTitle}
                    />

                    <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1}
                        alignItems="center"
                        justifyContent="center"
                    >
                        <Chip
                            size="small"
                            label={`目安：${data.estimatedTime}`}
                            sx={{
                                bgcolor: "#f1f5f9",
                                color: "#475569",
                                fontWeight: 800,
                            }}
                        />
                        <Chip
                            size="small"
                            label="お手本コードはいつでも確認できます"
                            sx={{
                                bgcolor: "#f1f5f9",
                                color: "#475569",
                                fontWeight: 800,
                            }}
                        />
                    </Stack>
                </Stack>
            </Box>

            <Box
                sx={{
                    px: { xs: 2.5, md: 4 },
                    py: { xs: 3, md: 3.5 },
                    background:
                        "linear-gradient(180deg, #ffffff 0%, #fbfdff 100%)",
                    borderTop: "1px solid rgba(226, 232, 240, 0.55)",
                }}
            >
                <Stack spacing={2.2}>
                    <Box>
                        <Typography
                            component="h2"
                            sx={{
                                color: "#0f4fa8",
                                fontWeight: 900,
                                fontSize: { xs: "1.15rem", md: "1.3rem" },
                                mb: 0.4,
                            }}
                        >
                            難易度を選択
                        </Typography>
                        <Typography
                            sx={{
                                color: "#64748b",
                                fontWeight: 700,
                                fontSize: "0.86rem",
                            }}
                        >
                            入力量とヒントの量を選んで挑戦しましょう。
                        </Typography>
                    </Box>

                    <DifficultyTabs
                        value={difficulty}
                        onChange={onChangeDifficulty}
                    />

                    <Box
                        sx={{
                            p: 1.8,
                            borderRadius: 3,
                            bgcolor: "#f8fafc",
                            border: "1px solid #e2e8f0",
                        }}
                    >
                        <Typography
                            sx={{
                                color: "#0f172a",
                                fontWeight: 800,
                                fontSize: "0.9rem",
                                lineHeight: 1.75,
                            }}
                        >
                            {difficultyDescriptions[difficulty]}
                        </Typography>
                    </Box>

                    <Stack
                        spacing={1.6}
                        alignItems="center"
                        sx={{ pt: 0.5 }}
                    >
                        <Stack
                            direction="row"
                            spacing={0.8}
                            alignItems="center"
                            justifyContent="center"
                            sx={{
                                color: "#7c3aed",
                                fontWeight: 900,
                            }}
                        >
                            <BoltRoundedIcon sx={{ fontSize: 22 }} />
                            <Typography
                                sx={{
                                    fontWeight: 900,
                                    fontSize: "0.95rem",
                                }}
                            >
                                クリアで +{data.rewardExp} EXP
                            </Typography>
                        </Stack>

                        <Button
                            variant="contained"
                            size="large"
                            onClick={onStart}
                            sx={{
                                width: { xs: "100%", sm: 360 },
                                py: 1.45,
                                borderRadius: 999,
                                fontWeight: 900,
                                fontSize: "1rem",
                                textTransform: "none",
                                background:
                                    "linear-gradient(90deg, #2563eb 0%, #7c3aed 100%)",
                                boxShadow:
                                    "0 14px 26px rgba(37, 99, 235, 0.25)",
                                "&:hover": {
                                    background:
                                        "linear-gradient(90deg, #1d4ed8 0%, #6d28d9 100%)",
                                    boxShadow:
                                        "0 16px 30px rgba(37, 99, 235, 0.32)",
                                },
                            }}
                        >
                            確認テストをはじめる
                        </Button>
                    </Stack>
                </Stack>
            </Box>
        </Paper>
    );
};

type PreviewThumbnailProps = {
    thumbnailUrl?: string;
    title: string;
};

const PreviewThumbnail: React.FC<PreviewThumbnailProps> = ({
    thumbnailUrl,
    title,
}) => {
    return (
        <Paper
            elevation={0}
            sx={{
                width: "100%",
                maxWidth: { xs: 360, sm: 430 },
                p: 1.3,
                borderRadius: 4,
                bgcolor: "rgba(255, 255, 255, 0.9)",
                border: "1px solid rgba(148, 163, 184, 0.26)",
                boxShadow: "0 16px 34px rgba(15, 23, 42, 0.08)",
            }}
        >
            <Box
                sx={{
                    position: "relative",
                    overflow: "hidden",
                    width: "100%",
                    aspectRatio: "16 / 9",
                    borderRadius: 3,
                    bgcolor: "#eef2ff",
                    border: "1px solid #e2e8f0",
                }}
            >
                {thumbnailUrl ? (
                    <Box
                        component="img"
                        src={thumbnailUrl}
                        alt={`${title}の完成イメージ`}
                        sx={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                        }}
                    />
                ) : (
                    <Stack
                        spacing={1}
                        alignItems="center"
                        justifyContent="center"
                        sx={{
                            width: "100%",
                            height: "100%",
                            color: "#64748b",
                        }}
                    >
                        <ImageRoundedIcon sx={{ fontSize: 40 }} />
                        <Typography
                            sx={{
                                fontWeight: 800,
                                fontSize: "0.82rem",
                            }}
                        >
                            完成イメージ
                        </Typography>
                    </Stack>
                )}

                <Box
                    sx={{
                        position: "absolute",
                        left: 10,
                        bottom: 10,
                        px: 1.2,
                        py: 0.55,
                        borderRadius: 999,
                        bgcolor: "rgba(15, 23, 42, 0.72)",
                        color: "#ffffff",
                        fontWeight: 900,
                        fontSize: "0.74rem",
                    }}
                >
                    完成イメージ
                </Box>
            </Box>
        </Paper>
    );
};

type DecorativeMarkProps = {
    value: string;
    sx: object;
};

const DecorativeMark: React.FC<DecorativeMarkProps> = ({
    value,
    sx,
}) => {
    return (
        <Box
            sx={{
                position: "absolute",
                fontWeight: 900,
                lineHeight: 1,
                userSelect: "none",
                ...sx,
            }}
        >
            {value}
        </Box>
    );
};