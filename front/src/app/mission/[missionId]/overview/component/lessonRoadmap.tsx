import { Box, Card, CardContent, Stack, Typography, ButtonBase } from "@mui/material";
import { Lesson, MissionExam, ProgressStatus } from "../type";
import { LessonNode } from "./lessonNode";

type LessonRoadmapProps = {
    lessons: Lesson[];
    missionExam: MissionExam;
    onLessonClick?: (lessonId: string) => void;
    onMissionExamClick?: () => void;
};

type RoadmapItem = {
    id: string;
    title: string;
    status: ProgressStatus;
    isLocked: boolean;
    type: "lesson" | "exam";
};

export const LessonRoadmap: React.FC<LessonRoadmapProps> = ({
    lessons,
    missionExam,
    onLessonClick,
    onMissionExamClick
}) => {
    const items: RoadmapItem[] = [
        ...lessons.map((lesson) => ({
            ...lesson,
            type: "lesson" as const,
        })),
        {
            id: missionExam.id,
            title: missionExam.title,
            status: missionExam.status,
            isLocked: missionExam.isLocked,
            type: "exam",
        },
    ];

    const currentIndex = getCurrentItemIndex(items);

    return (
        <Card
            sx={{
                borderRadius: 4,
                boxShadow: "0 6px 18px rgba(15, 23, 42, 0.08)",
                border: "1px solid #e2e8f0",
                overflow: "visible",
            }}
        >
            <CardContent sx={{ p: 4 }}>
                <Stack spacing={0}>
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="h5" fontWeight={900}>
                            レッスンマップ
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            ミッションの流れを確認して、次のレッスンへ進みましょう。
                        </Typography>
                    </Box>

                    <Stack alignItems="center" spacing={0}>
                        {items.map((item, index) => {
                            const isCurrent = index === currentIndex;
                            const side = index % 2 === 0 ? "right" : "left";

                            const handleClick = () => {
                                console.log("クリックされた")
                                if (item.isLocked) {
                                    return;
                                }
                                console.log("クリックされたアイテム:", item);
                                if (item.type === "lesson") {
                                    console.log("lessonでの処理");
                                    onLessonClick?.(item.id);

                                    return;
                                }
                                console.log("表示テスト");
                                onMissionExamClick?.();
                            }
                            return (
                                <Box key={item.id}>
                                    <RoadmapItemView
                                        title={item.title}
                                        status={item.status}
                                        isLocked={item.isLocked}
                                        type={item.type}
                                        isCurrent={isCurrent}
                                        side={side}
                                        onClick={handleClick}
                                    />

                                    {index < items.length - 1 && <RoadmapLine />}
                                </Box>
                            );
                        })}
                    </Stack>
                </Stack>
            </CardContent>
        </Card>
    );
};

const getCurrentItemIndex = (items: RoadmapItem[]) => {
    const index = items.findIndex((item) => item.status !== "completed");
    return index === -1 ? items.length - 1 : index;
};

type RoadmapItemViewProps = {
    title: string;
    status: ProgressStatus;
    isLocked: boolean;
    type: "lesson" | "exam";
    isCurrent: boolean;
    side: "left" | "right";
    onClick?: () => void;
};

const RoadmapItemView: React.FC<RoadmapItemViewProps> = ({
    title, status, isLocked, type, isCurrent, side, onClick
}) => {

    return (
        <Box
            sx={{
                width: { xs: 300, md: 460 },
                minHeight: 104,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
            }}
        >
            <Box
                sx={{
                    transform:
                        side === "right"
                            ? "translateX(-52px)"
                            : "translateX(52px)",
                }}
            >
                <ButtonBase
                    disabled={isLocked}
                    onClick={onClick}
                    aria-label={`${title}を開く`}
                    sx={{
                        borderRadius: "50%",
                        cursor: isLocked ? "not-allowed" : "pointer",
                        transition: "transform 0.18s ease, filter 0.18s ease",
                        "&:hover": {
                            transform: isLocked ? "none" : "translateY(-3px) scale(1.04)",
                            filter: isLocked ? "none" : "brightness(1.04)",
                        },
                        "&:active": {
                            transform: isLocked ? "none" : "translateY(1px) scale(0.98)",
                        },
                        "&.Mui-disabled": {
                            cursor: "not-allowed",
                        },
                    }}
                >
                    <LessonNode status={status} isLocked={isLocked} isCurrent={isCurrent} type={type} />
                </ButtonBase>
            </Box>

            <Box
                sx={{
                    position: "absolute",
                    top: "50%",
                    transform: "translateY(-50%)",
                    maxWidth: 180,
                    ...(side === "right"
                        ? {
                              left: "calc(50% + 36px)",
                              textAlign: "left",
                          }
                        : {
                              right: "calc(50% + 36px)",
                              textAlign: "right",
                          }),
                }}
            >
                <Typography
                    fontWeight={900}
                    sx={{
                        color: isLocked ? "text.disabled" : "text.primary",
                        lineHeight: 1.4,
                    }}
                >
                    {title}
                </Typography>

                {type === "exam" && (
                    <Typography
                        variant="caption"
                        fontWeight={800}
                        sx={{
                            color: isLocked ? "text.disabled" : "#7e22ce",
                        }}
                    >
                        最終チェック
                    </Typography>
                )}
            </Box>
        </Box>
    );
};

const RoadmapLine: React.FC = () => {
    return (
        <Box
            sx={{
                width: 8,
                height: 42,
                bgcolor: "#cbd5e1",
                borderRadius: 999,
                mx: "auto",
                my: 0.5,
            }}
        />
    );
};