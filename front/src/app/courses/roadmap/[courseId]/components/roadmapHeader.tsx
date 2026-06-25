import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import RouteIcon from "@mui/icons-material/Route";
import {
    Box,
    Button,
    Chip,
    LinearProgress,
    Stack,
    Typography,
} from "@mui/material";
import { CategoryChip } from "@/app/component/categoryChip";
import { DifficultyLabel } from "@/app/component/difficultyLabel";
import { StatusChip } from "@/app/component/statusChip";
import type { CourseRoadmap } from "../../type";

type RoadmapHeaderProps = {
    course: CourseRoadmap;
    onNextMissionClick: () => void;
};

export const RoadmapHeader = ({
    course,
    onNextMissionClick,
}: RoadmapHeaderProps) => {
    const isCompleted = course.status === "completed";

    return (
        <Box
            sx={{
                bgcolor: "#fff",
                border: "1px solid #e2e8f0",
                borderTop: isCompleted ? "5px solid #f59e0b" : "1px solid #e2e8f0",
                borderRadius: 2,
                p: { xs: 2.5, md: 3 },
                boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
            }}
        >
            <Stack spacing={2}>
                <Stack
                    direction={{ xs: "column", md: "row" }}
                    justifyContent="space-between"
                    spacing={2}
                >
                    <Box>
                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                            <Typography component="h1" variant="h4" fontWeight={900}>
                                {course.title}
                            </Typography>

                            {isCompleted && (
                                <Chip
                                    icon={<EmojiEventsIcon />}
                                    label="コースクリア"
                                    size="small"
                                    sx={{
                                        bgcolor: "#fef3c7",
                                        color: "#b45309",
                                        fontWeight: 900,
                                        border: "1px solid #f59e0b",
                                        "& .MuiChip-icon": { color: "inherit" },
                                    }}
                                />
                            )}
                        </Stack>

                        <Typography
                            color="text.secondary"
                            sx={{ mt: 1, lineHeight: 1.8, maxWidth: 920 }}
                        >
                            {course.description}
                        </Typography>
                    </Box>

                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                        <StatusChip status={course.status} />
                        <DifficultyLabel difficulty={course.difficulty} variant="chip" />
                    </Stack>
                </Stack>

                <Stack direction="row" spacing={1} flexWrap="wrap">
                    {course.categories.map((category) => (
                        <CategoryChip key={category} category={category} />
                    ))}
                </Stack>

                <Box>
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.75 }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={800}>
                            本線進捗
                        </Typography>
                        <Typography variant="caption" color="text.secondary" fontWeight={800}>
                            {course.completedMissionCount} / {course.missionCount}
                        </Typography>
                    </Stack>
                    <LinearProgress
                        variant="determinate"
                        value={course.progressRate}
                        sx={{
                            height: 9,
                            borderRadius: 999,
                            bgcolor: "#e2e8f0",
                            "& .MuiLinearProgress-bar": {
                                borderRadius: 999,
                                bgcolor: isCompleted ? "#f59e0b" : "#2563eb",
                            },
                        }}
                    />
                </Box>

                <Stack
                    direction={{ xs: "column", md: "row" }}
                    justifyContent="space-between"
                    alignItems={{ xs: "stretch", md: "center" }}
                    spacing={2}
                >
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                        <Chip
                            icon={<RouteIcon />}
                            label={`本線 ${course.completedRequiredMissionCount}/${course.requiredMissionCount}`}
                            sx={{ fontWeight: 800, bgcolor: "#eff6ff", color: "#1d4ed8" }}
                        />
                        <Chip
                            label={`Challenge ${course.completedChallengeMissionCount}/${course.challengeMissionCount}`}
                            sx={{ fontWeight: 800, bgcolor: "#fff7ed", color: "#c2410c" }}
                        />
                        <Chip
                            label={`全${course.totalMissionCount}ミッション`}
                            sx={{ fontWeight: 800, bgcolor: "#f1f5f9", color: "#475569" }}
                        />
                    </Stack>

                    <Button
                        variant="contained"
                        disabled={!course.nextMission}
                        onClick={onNextMissionClick}
                        sx={{
                            borderRadius: 2,
                            fontWeight: 900,
                            px: 3,
                            minHeight: 42,
                        }}
                    >
                        {course.nextMission ? "次のミッションへ" : "本線は完了済み"}
                    </Button>
                </Stack>
            </Stack>
        </Box>
    );
};
