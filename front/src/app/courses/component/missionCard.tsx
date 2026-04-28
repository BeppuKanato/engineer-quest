import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import ReplayIcon from "@mui/icons-material/Replay";
import { Box, Button, Card, CardContent, CardMedia, IconButton, Stack, Typography } from "@mui/material";
import { Mission } from "../type";
import { StatusChip } from "../../component/statusChip";

export const MissionCard: React.FC<Mission> = ({
    title,
    description,
    goalImg,
    status,
    tags = [],
}) => {
    const isCompleted = status === "completed";

    return (
        <Card
            sx={{
                width: 280,
                minWidth: 280,
                borderRadius: 3,
                overflow: "hidden",
                border: "1px solid",
                borderColor: isCompleted ? "#86efac" : "#e2e8f0",
                boxShadow: "0 4px 14px rgba(15, 23, 42, 0.08)",
                bgcolor: "#fff",
            }}
        >
            <CardMedia
                sx={{
                    height: 132,
                    bgcolor: "#f8fafc",
                }}
                image={goalImg}
                title={`${title}-goal image`}
            />

            <CardContent>
                <Stack spacing={1.25}>
                    <Box>
                        <StatusChip status={status} />

                        <Typography
                            variant="subtitle1"
                            fontWeight={800}
                            sx={{ mt: 1.25, lineHeight: 1.4 }}
                        >
                            {title}
                        </Typography>

                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mt: 0.5, lineHeight: 1.6 }}
                        >
                            {description}
                        </Typography>
                    </Box>

                    {tags.length > 0 && (
                        <Stack direction="row" flexWrap="wrap" gap={0.75}>
                            {tags.slice(0, 3).map((tag) => (
                                <Box
                                    key={tag}
                                    component="span"
                                    sx={{
                                        px: 1,
                                        py: 0.4,
                                        borderRadius: 1,
                                        bgcolor: "#f1f5f9",
                                        color: "#475569",
                                        fontSize: 12,
                                        fontWeight: 700,
                                    }}
                                >
                                    {tag}
                                </Box>
                            ))}
                        </Stack>
                    )}

                    <Stack direction="row" spacing={1}>
                        <Button
                            fullWidth
                            variant={isCompleted ? "outlined" : "contained"}
                            startIcon={isCompleted ? <ReplayIcon /> : <PlayArrowIcon />}
                            sx={{
                                borderRadius: 2,
                                fontWeight: 800,
                            }}
                        >
                            {isCompleted ? "復習する" : "開始する"}
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
                </Stack>
            </CardContent>
        </Card>
    );
};