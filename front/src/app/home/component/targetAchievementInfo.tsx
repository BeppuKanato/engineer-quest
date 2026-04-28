import { Box, LinearProgress, Stack, Typography } from "@mui/material";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";

type TargetAchievementFactor = {
    name: string;
    goal: number;
    progress: number;
};

type TargetAchievementInfoProps = {
    title: string;
    factor: TargetAchievementFactor[];
};

const ACCENT_COLOR = "#8B5CF6";
const ACCENT_BG = "#F3E8FF";
const PROGRESS_BG = "#E9D5FF";

const FactorProgress = ({name, goal, progress}: TargetAchievementFactor) => {
    const progressRate = Math.min((progress / goal) * 100, 100);

    return (
        <Stack spacing={0.8}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" fontWeight={600}>
                    {name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {progress}/{goal}
                </Typography>
            </Stack>

            <LinearProgress
                variant="determinate"
                value={progressRate}
                sx={{
                    height: 10,
                    borderRadius: 999,
                    bgcolor: PROGRESS_BG,
                    "& .MuiLinearProgress-bar": {
                        borderRadius: 999,
                        bgcolor: ACCENT_COLOR,
                    },
                }}
            />

            <Typography variant="caption" sx={{ color: "text.secondary", lineHeight: 1.2}}>
                {Math.round(progressRate)}% 完了
            </Typography>
        </Stack>
    );
};

export const TargetAchievementInfo: React.FC<TargetAchievementInfoProps> = ({title, factor}) => {
    const totalGoal = factor.reduce((sum, item) => sum + item.goal, 0);
    const totalProgress = factor.reduce((sum, item) => sum + Math.min(item.progress, item.goal), 0);
    const totalProgressRate = totalGoal === 0 ? 0 : Math.round((totalProgress / totalGoal) * 100);

    return (
        <Stack spacing={3}>
            <Stack spacing={2.5}>
                <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                >
                    <Stack direction="row" spacing={1.25} alignItems="center">
                        <Box
                            sx={{
                                width: 40,
                                height: 40,
                                borderRadius: 2,
                                bgcolor: ACCENT_BG,
                                color: ACCENT_COLOR,
                                display: "grid",
                                placeItems: "center",
                                flexShrink: 0,
                            }}
                        >
                            <WorkspacePremiumIcon fontSize="small" />
                        </Box>

                        <Typography variant="h5" fontWeight={800}>
                            目標実績
                        </Typography>
                    </Stack>
                </Stack>

                <Stack spacing={0.4}>
                    <Typography
                        variant="body1"
                        sx={{ color: ACCENT_COLOR, fontWeight: 800 }}
                    >
                        {title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        条件を満たすと達成できます。
                    </Typography>
                </Stack>
            </Stack>

            <Stack spacing={1.25} sx={{ pb: 0.5}}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" fontWeight={700} color="text.secondary">
                        PROGRESS
                    </Typography>
                    <Typography
                        variant="body2"
                        fontWeight={800}
                        sx={{ color: ACCENT_COLOR }}
                    >
                        {totalProgressRate}%
                    </Typography>
                </Stack>

                <LinearProgress
                    variant="determinate"
                    value={totalProgressRate}
                    sx={{
                        height: 10,
                        borderRadius: 999,
                        bgcolor: PROGRESS_BG,
                        "& .MuiLinearProgress-bar": {
                        borderRadius: 999,
                        bgcolor: ACCENT_COLOR,
                        },
                    }}
                />
            </Stack>

            <Stack spacing={2.25}>
                {factor.map((f) => <FactorProgress key={f.name} name={f.name} goal={f.goal} progress={f.progress} />)}
            </Stack>
        </Stack>
    );
};