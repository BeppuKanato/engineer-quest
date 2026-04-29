import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    Chip,
    LinearProgress,
    Stack,
    Typography,
} from "@mui/material";
import { Course, CourseStatus } from "../type";
import { CategoryChip } from "../../component/categoryChip";
import { DifficultyLabel } from "../../component/difficultyLabel";
import { MissionCard } from "./missionCard";
import { StatusChip } from "../../component/statusChip";

export const CourseAccordion: React.FC<Course> = ({
    title,
    description,
    categories,
    difficulty,
    missions,
}) => {
    const completedCount = missions.filter((mission) => mission.status === "completed").length;
    const progressRate = missions.length === 0 ? 0 : (completedCount / missions.length) * 100;
    const status = getCourseStatus(missions);

    const isCompleted = status === "completed";
    console.log(title)
    return (
        <Accordion
            defaultExpanded
            disableGutters
            sx={{
                borderRadius: 3,
                overflow: "hidden",
                border: "1px solid",
                borderColor: isCompleted ? "#facc15" : "#e2e8f0",
                boxShadow: isCompleted ? "0 8px 24px rgba(245, 158, 11, 0.18)" : "0 6px 18px rgba(15, 23, 42, 0.08)",
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
                                sx={{ mt: 0.75 }}
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
                            <DifficultyLabel difficulty={difficulty} variant="chip"/>
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
                                {completedCount} / {missions.length}
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
                    direction="row"
                    spacing={2}
                    sx={{
                        overflowX: "auto",
                        pb: 1,
                    }}
                >
                    {missions.map((mission, index) => {
                        const canStart = index === 0 || mission.status === "completed" || mission.status === "in_progress" || missions[index - 1]?.status === "completed";

                        return (
                            <MissionCard
                                key={mission.id}
                                {...mission}
                                canStart={canStart}
                            />
                        )
                    })}
                </Stack>
            </AccordionDetails>
        </Accordion>
    );
};

const getCourseStatus = (missions: Course["missions"]): CourseStatus => {
    const completedCount = missions.filter((mission) => mission.status === "completed").length;

    if (completedCount === missions.length) {
        return "completed";
    }

    if (
        completedCount > 0 ||
        missions.some((mission) => mission.status === "in_progress")
    ) {
        return "in_progress";
    }

    return "not_started";
};