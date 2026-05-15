import { Box, Stack, Typography } from "@mui/material";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import FlagIcon from "@mui/icons-material/Flag";
import { NextLesson } from "../type";
import React from "react";

type NextLessonPanelProps = {
  nextLesson: NextLesson | null;
};

export const NextLessonPanel: React.FC<NextLessonPanelProps> = ({
    nextLesson
}) => {
    return (
        <Box
            sx={{
            mt: 4,
            px: 2.5,
            py: 2,
            borderRadius: 3,
            bgcolor: nextLesson ? "#FFF6E3" : "#F3EFFF",
            border: nextLesson ? "1px solid #FFE0A3" : "1px solid #DDD2FF",
            }}
        >
            {nextLesson ? (
            <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                spacing={2}
            >
                <Box>
                    <Typography
                        sx={{
                        mb: 0.5,
                        fontSize: 13,
                        fontWeight: 900,
                        color: "#F57C00",
                        }}
                    >
                        次のレッスン
                    </Typography>

                    <Typography
                        sx={{
                        fontSize: 18,
                        fontWeight: 900,
                        color: "#111827",
                        }}
                    >
                        {nextLesson.title}
                    </Typography>

                    {/* <Typography
                        sx={{
                        mt: 0.5,
                        fontSize: 13,
                        color: "text.secondary",
                        }}
                    >
                        {nextLesson.description ??
                        "次の内容に進んで、学習を続けましょう。"}
                    </Typography> */}
                </Box>

                <ArrowForwardIosIcon
                sx={{
                    color: "#F57C00",
                    fontSize: 20,
                    flexShrink: 0,
                }}
                />
            </Stack>
            ) : (
            <Stack direction="row" alignItems="center" spacing={2}>
                <FlagIcon
                sx={{
                    color: "#7E57C2",
                    fontSize: 34,
                }}
                />

                <Box>
                <Typography
                    sx={{
                    mb: 0.5,
                    fontSize: 13,
                    fontWeight: 900,
                    color: "#7E57C2",
                    }}
                >
                    次は最終チェック
                </Typography>

                <Typography
                    sx={{
                    fontSize: 18,
                    fontWeight: 900,
                    color: "#111827",
                    }}
                >
                    ミッション確認テストに挑戦しよう！
                </Typography>

                <Typography
                    sx={{
                    mt: 0.5,
                    fontSize: 13,
                    color: "text.secondary",
                    }}
                >
                    ここまでの内容を使って、ミッションの理解度を確認します。
                </Typography>
                </Box>
            </Stack>
            )}
        </Box>
    );
}