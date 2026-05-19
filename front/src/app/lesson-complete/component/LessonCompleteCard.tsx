import {
  Box,
  Button,
  Card,
  Chip,
  LinearProgress,
  Stack,
  Typography,
  keyframes,
} from "@mui/material";
import { useRef, useState, useCallback } from "react";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import MapIcon from "@mui/icons-material/Map";
import ReplayIcon from "@mui/icons-material/Replay";

import { Lesson, NextLesson } from "../type";
import { CountUpExp } from "./CountUpExp";
import { LearnedItemList } from "./LearnedItemList";
import { NextLessonPanel } from "./NextLessonPanel";
import React from "react";
import { CompletionConfetti } from "./CompletionConfetti";

const float = keyframes`
  0% {
    transform: translateY(0px) scale(1);
  }
  50% {
    transform: translateY(-8px) scale(1.04);
  }
  100% {
    transform: translateY(0px) scale(1);
  }
`;

type LessonCompleteCardProps = {
  lesson: Lesson;
  nextLesson: NextLesson | null;
  completedLessonCount: number;
  totalLessonCount: number;
  onClickNextLesson?: () => void;
  onClickLessonMap?: () => void;
  onClickReview?: () => void;
};

export const LessonCompleteCard: React.FC<LessonCompleteCardProps> = ({
    lesson, nextLesson, completedLessonCount, totalLessonCount, onClickNextLesson, onClickLessonMap, onClickReview
}) => {
    const progress =
    totalLessonCount === 0
      ? 0
      : Math.round((completedLessonCount / totalLessonCount) * 100);
    const cardRef = useRef<HTMLDivElement | null>(null);
    const [confettiKey, setConfettiKey] = useState(0);
    const handleExpCountComplete = useCallback(() => {
        setConfettiKey((prev) => prev + 1);
    }, []);
    return (
        <Card
            ref={cardRef}
            sx={{
                width: "100%",
                maxWidth: 760,
                mx: "auto",
                px: { xs: 3, md: 5 },
                py: { xs: 4, md: 5 },
                borderRadius: 5,
                bgcolor: "rgba(255, 255, 255, 0.97)",
                boxShadow: "0 18px 48px rgba(15, 23, 42, 0.12)",
                border: "1px solid rgba(25, 118, 210, 0.08)",
            }}
        >
            <Stack alignItems="center">
                <Chip
                    icon={<AutoAwesomeIcon />}
                    label="Great work!"
                    variant="outlined"
                    color="primary"
                    sx={{
                        mb: 1.5,
                        borderRadius: 999,
                        bgcolor: "#F0F7FF",
                        fontWeight: 800,
                    }}
                />

                <Box
                    sx={{
                        width: 132,
                        height: 132,
                        borderRadius: "50%",
                        display: "grid",
                        placeItems: "center",
                        background:
                        "radial-gradient(circle, rgba(255,213,79,0.38) 0%, rgba(255,213,79,0.14) 50%, rgba(255,255,255,0) 72%)",
                        animation: `${float} 2.8s ease-in-out infinite`,
                    }}
                >
                    <EmojiEventsIcon
                        sx={{
                            fontSize: 94,
                            color: "#FFD600",
                            filter: "drop-shadow(0 10px 18px rgba(255, 193, 7, 0.34))",
                        }}
                    />
                </Box>

                <Typography
                    component="h1"
                    sx={{
                        mt: 1,
                        fontSize: { xs: 34, md: 48 },
                        fontWeight: 900,
                        color: "#1976D2",
                        letterSpacing: "0.02em",
                        textAlign: "center",
                    }}
                >
                    レッスン完了！
                </Typography>

                <Typography
                    sx={{
                        mt: 0.5,
                        fontSize: { xs: 20, md: 24 },
                        fontWeight: 900,
                        color: "#111827",
                        textAlign: "center",
                    }}
                >
                    {lesson.title}を確認できました
                </Typography>

                <Typography
                    sx={{
                        mt: 1,
                        fontSize: 15,
                        color: "text.secondary",
                        textAlign: "center",
                        lineHeight: 1.8,
                    }}
                >
                    見出し・文章・HTMLの表示をひと通り練習できました。
                </Typography>
            </Stack>

            <CompletionConfetti targetRef={cardRef} fireKey={confettiKey}/>
            <CountUpExp exp={lesson.exp} onCountComplete={handleExpCountComplete}/>

            <LearnedItemList items={lesson.learnedItems} />

            <NextLessonPanel nextLesson={nextLesson} />

            <Box sx={{ mt: 3 }}>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                    <Typography
                        sx={{
                        fontSize: 13,
                        color: "text.secondary",
                        fontWeight: 700,
                        }}
                    >
                        コース進捗
                    </Typography>

                    <Typography
                        sx={{
                        fontSize: 13,
                        color: "#1976D2",
                        fontWeight: 900,
                        }}
                    >
                        {completedLessonCount} / {totalLessonCount} Lessons completed
                    </Typography>
                </Stack>

                <LinearProgress
                    variant="determinate"
                    value={progress}
                    sx={{
                        height: 8,
                        borderRadius: 999,
                        bgcolor: "#DDE7F3",
                        "& .MuiLinearProgress-bar": {
                        borderRadius: 999,
                        bgcolor: "#1976D2",
                        },
                    }}
                />
            </Box>

            <Stack spacing={1.5} sx={{ mt: 3 }}>
                {nextLesson ? (
                <Button
                    variant="contained"
                    size="large"
                    endIcon={<ArrowForwardIcon />}
                    onClick={onClickNextLesson}
                    sx={{
                    py: 1.6,
                    borderRadius: 2,
                    fontWeight: 900,
                    fontSize: 17,
                    boxShadow: "0 8px 18px rgba(25, 118, 210, 0.28)",
                    }}
                >
                    次のレッスンへ進む
                </Button>
                ) : (
                <Button
                    variant="contained"
                    size="large"
                    endIcon={<ArrowForwardIcon />}
                    onClick={onClickNextLesson}
                    sx={{
                    py: 1.6,
                    borderRadius: 2,
                    fontWeight: 900,
                    fontSize: 17,
                    boxShadow: "0 8px 18px rgba(25, 118, 210, 0.28)",
                    }}
                >
                    ミッション確認テストへ進む
                </Button>
                )}

                <Button
                    variant="outlined"
                    size="large"
                    startIcon={<MapIcon />}
                    onClick={onClickLessonMap}
                    sx={{
                        py: 1.5,
                        borderRadius: 2,
                        fontWeight: 800,
                        fontSize: 16,
                        bgcolor: "#fff",
                    }}
                >
                    レッスンマップへ戻る
                </Button>

                <Button
                    variant="text"
                    startIcon={<ReplayIcon />}
                    onClick={onClickReview}
                    sx={{
                        alignSelf: "center",
                        fontWeight: 700,
                        color: "text.secondary",
                    }}
                >
                    このレッスンを復習する
                </Button>
            </Stack>
        </Card>
    );
}