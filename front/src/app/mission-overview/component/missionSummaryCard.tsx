import AutoAwesomeMotionIcon from "@mui/icons-material/AutoAwesomeMotion";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import ReplayIcon from "@mui/icons-material/Replay";
import {
    Box,
    Button,
    Card,
    CardContent,
    CardMedia,
    LinearProgress,
    Stack,
    Typography,
} from "@mui/material";
import { Mission } from "../type";

type MissionSummaryCardProps = {
    mission: Mission;
};

export const MissionSummaryCard: React.FC<MissionSummaryCardProps> = ({ mission }) => {
    const completedLessons = mission.lessons.filter((lesson) => lesson.status === "completed").length;
    const totalLessons = mission.lessons.length;
    const progressValue = totalLessons === 0 ? 0 : (completedLessons / totalLessons) * 100;

    const currentLesson = mission.lessons.find((lesson) => lesson.status !== "completed") ?? mission.lessons[mission.lessons.length - 1];

    const isMissionCompleted = completedLessons === totalLessons && mission.missionExam.status === "completed";

    const buttonLabel = isMissionCompleted
        ? "復習する"
        : completedLessons > 0
          ? "続きから学習"
          : "レッスンを始める";

    const ButtonIcon = isMissionCompleted ? ReplayIcon : PlayArrowIcon;

    return (
        <Card
            sx={{
                borderRadius: 4,
                boxShadow: "0 6px 18px rgba(15, 23, 42, 0.08)",
                border: "1px solid #e2e8f0",
            }}
        >
            <CardContent sx={{ p: 4 }}>
                <Stack spacing={3}>
                    <Box>
                        <Typography variant="h4" fontWeight={900} lineHeight={1.25}>
                            {mission.title}
                        </Typography>

                        <Typography
                            color="text.secondary"
                            sx={{ mt: 1, lineHeight: 1.7 }}
                        >
                            {mission.description}
                        </Typography>
                    </Box>

                    <CardMedia
                        component="img"
                        image={mission.goalImg}
                        alt={`${mission.title} goal image`}
                        sx={{
                            width: "100%",
                            height: 160,
                            borderRadius: 3,
                            objectFit: "cover",
                            bgcolor: "#f8fafc",
                        }}
                    />

                    <Stack direction="row" spacing={2} flexWrap="wrap">
                        <Stack direction="row" alignItems="center" spacing={0.75}>
                            <AutoAwesomeMotionIcon fontSize="small" />
                            <Typography fontWeight={800}>
                                {totalLessons} Lessons
                            </Typography>
                        </Stack>

                        <Typography fontWeight={800} color="text.secondary">
                            約 {mission.estimatedMinutes} 分
                        </Typography>
                    </Stack>

                    <Box>
                        <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.75 }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={800}>
                                進捗
                            </Typography>
                            <Typography variant="caption" color="text.secondary" fontWeight={800}>
                                {completedLessons} / {totalLessons}
                            </Typography>
                        </Stack>

                        <LinearProgress
                            variant="determinate"
                            value={progressValue}
                            sx={{
                                height: 9,
                                borderRadius: 999,
                                bgcolor: "#e2e8f0",
                                "& .MuiLinearProgress-bar": {
                                    borderRadius: 999,
                                    bgcolor: "#1976d2",
                                },
                            }}
                        />
                    </Box>

                    <Box
                        sx={{
                            p: 2,
                            borderRadius: 3,
                            bgcolor: "#eff6ff",
                            border: "1px solid #bfdbfe",
                        }}
                    >
                        <Typography variant="caption" color="text.secondary" fontWeight={800}>
                            次にやること
                        </Typography>
                        <Typography fontWeight={900} sx={{ mt: 0.5 }}>
                            {isMissionCompleted
                                ? "ミッションは完了済みです"
                                : currentLesson?.title}
                        </Typography>
                    </Box>

                    <Button
                        variant="contained"
                        size="large"
                        startIcon={<ButtonIcon />}
                        sx={{
                            borderRadius: 2.5,
                            py: 1.3,
                            fontWeight: 900,
                        }}
                    >
                        {buttonLabel}
                    </Button>
                </Stack>
            </CardContent>
        </Card>
    );
};