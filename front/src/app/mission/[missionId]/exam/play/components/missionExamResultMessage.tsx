import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import { Box, Card, Typography } from "@mui/material";
import { MissionExamSubmitStatus } from "../type";

type MissionExamResultMessageProps = {
    status: MissionExamSubmitStatus;
};

export const MissionExamResultMessage: React.FC<MissionExamResultMessageProps> = ({
    status,
}) => {
    if (status === "idle") {
        return null;
    }

    const isCorrect = status === "correct";

    return (
        <Card
            elevation={0}
            sx={{
                mt: 2,
                p: 2.2,
                borderRadius: 4,
                border: "1px solid",
                borderColor: isCorrect ? "#86efac" : "#fed7aa",
                bgcolor: isCorrect ? "#ecfdf5" : "#fff7ed",
                boxShadow: "0 12px 28px rgba(15, 23, 42, 0.06)",
            }}
        >
            <Box
                sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 1.6,
                }}
            >
                <Box
                    sx={{
                        width: 38,
                        height: 38,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        bgcolor: isCorrect ? "#dcfce7" : "#ffedd5",
                        color: isCorrect ? "#16a34a" : "#ea580c",
                        flexShrink: 0,
                    }}
                >
                    {isCorrect ? (
                        <CheckCircleIcon />
                    ) : (
                        <ErrorOutlineIcon />
                    )}
                </Box>

                <Box>
                    <Typography
                        sx={{
                            fontWeight: 900,
                            color: isCorrect ? "#14532d" : "#7c2d12",
                            mb: 0.4,
                        }}
                    >
                        {isCorrect ? "完全一致！クリアです。" : "まだ違いがあります。"}
                    </Typography>

                    <Typography
                        sx={{
                            color: isCorrect ? "#166534" : "#9a3412",
                            fontWeight: 600,
                            lineHeight: 1.7,
                        }}
                    >
                        {isCorrect
                            ? "お手本コードと同じ形で完成できました。次へ進みましょう。"
                            : "色が付いた行を、お手本コードと見比べて修正してください。もう一度「違いを確認」を押すと、最新の差分に更新できます。"}
                    </Typography>
                </Box>
            </Box>
        </Card>
    );
};