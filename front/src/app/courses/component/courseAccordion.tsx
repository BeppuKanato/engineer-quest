import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import ReplayIcon from "@mui/icons-material/Replay";
import RouteIcon from "@mui/icons-material/Route";
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    Button,
    Chip,
    LinearProgress,
    Stack,
    Typography,
} from "@mui/material";
import { Course } from "../type";
import { CategoryChip } from "../../component/categoryChip";
import { DifficultyLabel } from "../../component/difficultyLabel";
import { StatusChip } from "../../component/statusChip";

type CourseAccordionProps = Course & {
    onCourseClick?: (courseId: string) => void;
};

export const CourseAccordion: React.FC<CourseAccordionProps> = ({
    id,
    title,
    description,
    categories,
    difficulty,
    status,
    progressRate,
    missionCount,
    completedMissionCount,
    totalMissionCount,
    challengeMissionCount,
    completedChallengeMissionCount,
    onCourseClick,
}) => {
    const isCompleted = status === "completed";

    const actionLabel = isCompleted ? "ロードマップを見る" : status === "in_progress" ? "続きから" : "開始する";
    const actionIcon = isCompleted ? <ReplayIcon /> : <PlayArrowIcon />;

    return (
        <Accordion
            defaultExpanded
            disableGutters
            sx={{
                borderRadius: 2,
                overflow: "hidden",
                border: "1px solid",
                borderColor: isCompleted ? "#facc15" : "#e2e8f0",
                boxShadow: isCompleted
                    ? "0 8px 24px rgba(245, 158, 11, 0.18)"
                    : "0 6px 18px rgba(15, 23, 42, 0.08)",
                "&:before": {
                    display: "none",
                },
            }}
        >
            <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls={`${title}-content`}
                id={`${title}-header`}
                sx={{
                    px: 3,
                    py: 2,
                    bgcolor: isCompleted ? "#fffbeb" : "#fff",
                    borderTop: isCompleted ? "5px solid #f59e0b" : "none",
                }}
            >
                <Stack spacing={1.5} sx={{ width: "100%" }}>
                    <Stack
                        direction={{ xs: "column", md: "row" }}
                        justifyContent="space-between"
                        spacing={2}
                    >
                        <Box>
                            <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                                <Typography variant="h6" fontWeight={900}>
                                    {title}
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
                                            "& .MuiChip-icon": {
                                                color: "inherit",
                                            },
                                        }}
                                    />
                                )}
                            </Stack>

                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mt: 0.75, maxWidth: 920, lineHeight: 1.7 }}
                            >
                                {description}
                            </Typography>
                        </Box>

                        <Stack
                            direction="row"
                            alignItems="center"
                            spacing={1}
                            flexWrap="wrap"
                            sx={{ pr: { md: 2 } }}
                        >
                            <StatusChip status={status} />
                            <DifficultyLabel difficulty={difficulty} variant="chip" />
                        </Stack>
                    </Stack>

                    <Stack direction="row" spacing={1} flexWrap="wrap">
                        {categories.map((category) => (
                            <CategoryChip key={category} category={category} />
                        ))}
                    </Stack>

                    <Box>
                        <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.75 }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={700}>
                                進捗
                            </Typography>
                            <Typography variant="caption" color="text.secondary" fontWeight={700}>
                                {completedMissionCount} / {missionCount}
                            </Typography>
                        </Stack>
                        <LinearProgress
                            variant="determinate"
                            value={progressRate}
                            sx={{
                                height: 8,
                                borderRadius: 999,
                                bgcolor: "#e2e8f0",
                                "& .MuiLinearProgress-bar": {
                                    borderRadius: 999,
                                    bgcolor: isCompleted ? "#f59e0b" : "#2563eb",
                                },
                            }}
                        />
                    </Box>
                </Stack>
            </AccordionSummary>

            <AccordionDetails
                sx={{
                    bgcolor: "#f8fafc",
                    borderTop: "1px solid #e2e8f0",
                    p: 2.5,
                }}
            >
                <Stack
                    direction={{ xs: "column", md: "row" }}
                    justifyContent="space-between"
                    spacing={2}
                    alignItems={{ xs: "stretch", md: "center" }}
                >
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                        <Chip
                            icon={<RouteIcon />}
                            label={`本線 ${completedMissionCount}/${missionCount}`}
                            sx={{ fontWeight: 800, bgcolor: "#eff6ff", color: "#1d4ed8" }}
                        />
                        <Chip
                            label={`Challenge ${completedChallengeMissionCount}/${challengeMissionCount}`}
                            sx={{ fontWeight: 800, bgcolor: "#fff7ed", color: "#c2410c" }}
                        />
                        <Chip
                            label={`全${totalMissionCount}ミッション`}
                            sx={{ fontWeight: 800, bgcolor: "#f1f5f9", color: "#475569" }}
                        />
                    </Stack>

                    <Stack spacing={0.75} alignItems={{ xs: "stretch", md: "flex-end" }}>
                        <Button
                            variant="contained"
                            startIcon={actionIcon}
                            onClick={() => onCourseClick?.(id)}
                            sx={{
                                borderRadius: 2,
                                fontWeight: 900,
                                px: 3,
                            }}
                        >
                            {actionLabel}
                        </Button>
                    </Stack>
                </Stack>
            </AccordionDetails>
        </Accordion>
    );
};
