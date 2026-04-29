import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import LockIcon from "@mui/icons-material/Lock";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import ReplayIcon from "@mui/icons-material/Replay";
import {
    Box,
    Button,
    Card,
    CardContent,
    CardMedia,
    IconButton,
    Stack,
    Typography,
} from "@mui/material";
import { Mission } from "../type";
import { StatusChip } from "../../component/statusChip";

type MissionCardProps = Mission & {
    canStart: boolean;
};

export const MissionCard: React.FC<MissionCardProps> = ({
    title,
    description,
    goalImg,
    status,
    tags = [],
    canStart,
}) => {
    const isCompleted = status === "completed";
    const isLocked = !isCompleted && !canStart;

    const buttonLabel = isCompleted ? "復習する" : isLocked ? "未開放" : "開始する";
    const buttonIcon = isCompleted ? (
        <ReplayIcon />
    ) : isLocked ? (
        <LockIcon />
    ) : (
        <PlayArrowIcon />
    );

    return (
        <Card
            sx={{
                width: 260,
                minWidth: 260,
                height: 320, // 前くらいのサイズ感に戻す
                display: "flex",
                flexDirection: "column",
                borderRadius: 3,
                overflow: "hidden",
                position: "relative",
                border: "1px solid",
                borderColor: isCompleted ? "#22c55e" : "#e2e8f0",
                bgcolor: "#fff",
                boxShadow: "0 4px 14px rgba(15, 23, 42, 0.08)",
                "&::before": isCompleted
                    ? {
                          content: '""',
                          position: "absolute",
                          top: 0,
                          left: 0,
                          right: 0,
                          height: 4,
                          bgcolor: "#22c55e",
                      }
                    : undefined,
            }}
        >
            <CardMedia
                sx={{
                    height: 110,
                    bgcolor: "#f8fafc",
                }}
                image={goalImg}
                title={`${title}-goal image`}
            />

            <CardContent
                sx={{
                    flexGrow: 1,
                    display: "flex",
                    flexDirection: "column",
                    p: 1.5,
                }}
            >
                <Box sx={{ alignSelf: "flex-start" }}>
                    <StatusChip status={status} size="small"/>
                </Box>
                <Box sx={{ mt: 1, flexGrow: 1 }}>
                    <Typography
                        variant="subtitle1"
                        fontWeight={800}
                        sx={{
                            lineHeight: 1.35,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                        }}
                    >
                        {title}
                    </Typography>

                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                            mt: 0.5,
                            lineHeight: 1.5,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            minHeight: 42,
                        }}
                    >
                        {description}
                    </Typography>

                    {tags.length > 0 && (
                        <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mt: 1 }}>
                            {tags.slice(0, 2).map((tag) => (
                                <Box
                                    key={tag}
                                    component="span"
                                    sx={{
                                        px: 0.8,
                                        py: 0.25,
                                        borderRadius: 1,
                                        bgcolor: "#f1f5f9",
                                        color: "#475569",
                                        fontSize: 11,
                                        fontWeight: 700,
                                    }}
                                >
                                    {tag}
                                </Box>
                            ))}
                        </Stack>
                    )}
                </Box>

                <Stack direction="row" spacing={1} sx={{ mt: "auto", pt: 1 }}>
                    <Button
                        fullWidth
                        variant={isCompleted ? "outlined" : "contained"}
                        startIcon={buttonIcon}
                        disabled={isLocked}
                        sx={{
                            borderRadius: 2,
                            fontWeight: 800,
                            ...(isCompleted && {
                                color: "#2563eb",
                                borderColor: "#93c5fd",
                                bgcolor: "#fff",
                            }),
                            ...(isLocked && {
                                "&.Mui-disabled": {
                                    bgcolor: "#e2e8f0",
                                    color: "#64748b",
                                },
                            }),
                        }}
                    >
                        {buttonLabel}
                    </Button>

                    <IconButton
                        aria-label={`${title}の詳細`}
                        sx={{
                            borderRadius: 2,
                            bgcolor: "#f1f5f9",
                            "&:hover": {
                                bgcolor: "#e2e8f0",
                            },
                        }}
                    >
                        <InfoOutlinedIcon fontSize="small" />
                    </IconButton>
                </Stack>
            </CardContent>
        </Card>
    );
};