import CheckIcon from "@mui/icons-material/Check";
import LockIcon from "@mui/icons-material/Lock";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import { Box } from "@mui/material";
import { ProgressStatus } from "../type";

type LessonNodeProps = {
    status: ProgressStatus;
    isCurrent?: boolean;
    type?: "lesson" | "exam";
};

export const LessonNode: React.FC<LessonNodeProps> = ({
    status, isCurrent = false, type = "lesson",
}) => {
    const isCompleted = status === "completed";
    const isLocked = status === "not_started" && !isCurrent;

    const Icon = isCompleted
    ? CheckIcon
    : type === "exam"
      ? WorkspacePremiumIcon
      : isLocked
        ? LockIcon
        : MenuBookIcon;

    const nodeColor = isCompleted
    ? "#22c55e"
    : type === "exam"
        ? isLocked
        ? "#a78bfa"
        : "#7c3aed"
        : isCurrent
        ? "#1976d2"
        : "#cbd5e1";

    const shadowColor = isCompleted
        ? "rgba(34, 197, 94, 0.35)"
        : isCurrent
          ? "rgba(25, 118, 210, 0.35)"
          : "rgba(100, 116, 139, 0.18)";

    return (
        <Box
            sx={{
                width: type === "exam" ? 78 : 70,
                height: type === "exam" ? 78 : 70,
                borderRadius: "50%",
                bgcolor: nodeColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                border: "6px solid",
                borderColor: isCurrent ? "#bfdbfe" : "rgba(255,255,255,0.8)",
                boxShadow: `0 9px 0 rgba(15, 23, 42, 0.2), 0 0 24px ${shadowColor}`,
                opacity: isLocked ? 0.62 : 1,
            }}
        >
            <Icon
                sx={{
                    fontSize: type === "exam" ? 36 : 32,
                    color: "#fff",
                }}
            />

            {isLocked && type === "exam" && (
            <Box
                sx={{
                position: "absolute",
                right: -4,
                bottom: -4,
                width: 24,
                height: 24,
                borderRadius: "50%",
                bgcolor: "#e2e8f0",
                border: "3px solid #fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 8px rgba(15, 23, 42, 0.18)",
                }}
            >
                <LockIcon
                sx={{
                    fontSize: 14,
                    color: "#64748b",
                }}
                />
            </Box>
            )}

            {isCurrent && (
                <Box
                    sx={{
                        position: "absolute",
                        top: -42,
                        px: 2,
                        py: 0.7,
                        borderRadius: 2,
                        bgcolor: "#1e293b",
                        color: "#fff",
                        fontSize: 13,
                        fontWeight: 900,
                        whiteSpace: "nowrap",
                        boxShadow: "0 6px 14px rgba(15, 23, 42, 0.25)",
                        "&::after": {
                            content: '""',
                            position: "absolute",
                            left: "50%",
                            bottom: -8,
                            transform: "translateX(-50%)",
                            borderLeft: "8px solid transparent",
                            borderRight: "8px solid transparent",
                            borderTop: "8px solid #1e293b",
                        },
                    }}
                >
                    スタート
                </Box>
            )}
        </Box>
    );
};