import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import {
    Box,
    Card,
    Chip,
    Stack,
    Typography,
} from "@mui/material";
import { MissionExamDifficulty, MissionExamProblem } from "../type";

type MissionExamHeaderCardProps = {
    problem: MissionExamProblem;
};

const difficultyLabel: Record<MissionExamDifficulty, string> = {
    easy: "Easy",
    normal: "Normal",
    hard: "Hard",
};

const difficultyColor: Record<MissionExamDifficulty, string> = {
    easy: "#22c55e",
    normal: "#2563eb",
    hard: "#ef4444",
};

export const MissionExamHeaderCard: React.FC<MissionExamHeaderCardProps> = ({
    problem,
}) => {
    return (
        <Card
            elevation={0}
            sx={{
                p: { xs: 2.5, md: 3 },
                borderRadius: 4,
                border: "1px solid #dbeafe",
                bgcolor: "#fff",
                boxShadow: "0 16px 36px rgba(15, 23, 42, 0.08)",
            }}
        >
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) 220px" },
                    gap: { xs: 2.5, md: 4 },
                    alignItems: "center",
                }}
            >
                <Box sx={{ maxWidth: 760 }}>
                    <Stack direction="row" spacing={1.2} alignItems="center" mb={1}>
                        <Box
                            sx={{
                                width: 38,
                                height: 38,
                                borderRadius: "50%",
                                bgcolor: "#7c3aed",
                                color: "#fff",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                boxShadow: "0 8px 18px rgba(124, 58, 237, 0.28)",
                            }}
                        >
                            <WorkspacePremiumIcon fontSize="small" />
                        </Box>

                        <Typography
                            sx={{
                                fontSize: 13,
                                fontWeight: 900,
                                letterSpacing: 1.4,
                                color: "#7c3aed",
                            }}
                        >
                            MISSION EXAM
                        </Typography>

                        <Chip
                            size="small"
                            label={difficultyLabel[problem.difficulty]}
                            sx={{
                                ml: 0.5,
                                bgcolor: difficultyColor[problem.difficulty],
                                color: "#fff",
                                fontWeight: 900,
                            }}
                        />
                    </Stack>

                    <Typography
                        component="h1"
                        sx={{
                            fontSize: { xs: 25, md: 32 },
                            fontWeight: 900,
                            color: "#172554",
                            lineHeight: 1.25,
                            mb: 1.2,
                        }}
                    >
                        {problem.title}
                    </Typography>

                    <Typography
                        sx={{
                            color: "#475569",
                            lineHeight: 1.8,
                            maxWidth: 780,
                            fontWeight: 600,
                            mb: 2,
                        }}
                    >
                        {problem.description}
                    </Typography>

                    <Box
                        sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            px: 1.6,
                            py: 1,
                            borderRadius: 3,
                            bgcolor: "#fff7ed",
                            border: "1px solid #fed7aa",
                            color: "#9a3412",
                            fontWeight: 800,
                            fontSize: 14,
                        }}
                    >
                        クリア条件：お手本コードとの差分がなくなればクリアです。
                    </Box>
                </Box>

                <Box
                    sx={{
                        justifySelf: { xs: "stretch", md: "center" },
                        width: { xs: "100%", md: 180 },
                        p: 1.3,
                        borderRadius: 3,
                        bgcolor: "#ffffff",
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 10px 24px rgba(15, 23, 42, 0.08)",
                    }}
                >
                    <Typography
                        sx={{
                            fontSize: 12,
                            fontWeight: 900,
                            color: "#2563eb",
                            mb: 1,
                        }}
                    >
                        完成見本
                    </Typography>

                    <Box
                        component="img"
                        src={problem.thumbnailUrl}
                        alt="完成見本"
                        onError={(event) => {
                            event.currentTarget.style.display = "none";
                        }}
                        sx={{
                            width: "100%",
                            height: 104,
                            objectFit: "cover",
                            borderRadius: 3,
                            bgcolor: "#eff6ff",
                            border: "1px solid #dbeafe",
                            display: "block",
                        }}
                    />

                    <Typography
                        sx={{
                            mt: 1,
                            fontSize: 12,
                            fontWeight: 700,
                            color: "#64748b",
                            textAlign: "center",
                        }}
                    >
                        この見た目を目指します
                    </Typography>
                </Box>
            </Box>
        </Card>
    );
};