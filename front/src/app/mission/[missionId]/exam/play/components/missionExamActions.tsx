import DifferenceIcon from "@mui/icons-material/Difference";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import SendIcon from "@mui/icons-material/Send";
import VisibilityIcon from "@mui/icons-material/Visibility";
import {
    Box,
    Button,
    Card,
    Stack,
} from "@mui/material";
import { MissionExamSubmitStatus } from "../type";

type MissionExamActionsProps = {
    submitStatus: MissionExamSubmitStatus;
    onShowReference: () => void;
    onCheckDiff: () => void;
    onUpdatePreview: () => void;
    onSubmit: () => void;
};

export const MissionExamActions: React.FC<MissionExamActionsProps> = ({
    submitStatus,
    onShowReference,
    onCheckDiff,
    onUpdatePreview,
    onSubmit,
}) => {
    return (
        <Card
            elevation={0}
            sx={{
                mt: 2,
                p: { xs: 1.5, md: 2 },
                borderRadius: 4,
                border: "1px solid #dbeafe",
                bgcolor: "#ffffff",
                boxShadow: "0 12px 28px rgba(15, 23, 42, 0.08)",
            }}
        >
            <Box
                sx={{
                    display: "flex",
                    flexDirection: { xs: "column", md: "row" },
                    justifyContent: "space-between",
                    alignItems: { xs: "stretch", md: "center" },
                    gap: 1.5,
                }}
            >
                <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1.2}
                    sx={{ width: { xs: "100%", md: "auto" } }}
                >
                    <Button
                        variant="outlined"
                        startIcon={<VisibilityIcon />}
                        onClick={onShowReference}
                        sx={{
                            minWidth: 150,
                            borderRadius: 3,
                            fontWeight: 900,
                            color: "#334155",
                            borderColor: "#cbd5e1",
                            bgcolor: "#fff",
                            "&:hover": {
                                borderColor: "#94a3b8",
                                bgcolor: "#f8fafc",
                            },
                        }}
                    >
                        お手本を見る
                    </Button>

                    <Button
                        variant="contained"
                        startIcon={<DifferenceIcon />}
                        onClick={onCheckDiff}
                        sx={{
                            minWidth: 150,
                            borderRadius: 3,
                            fontWeight: 900,
                            bgcolor: "#b7791f",
                            color: "#ffffff",
                            boxShadow: "0 6px 14px rgba(183, 121, 31, 0.24)",
                            "&:hover": {
                                bgcolor: "#975a16",
                                boxShadow: "0 7px 16px rgba(183, 121, 31, 0.28)",
                            },
                        }}
                    >
                        違いを確認
                    </Button>
                </Stack>

                <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1.2}
                    sx={{ width: { xs: "100%", md: "auto" } }}
                >
                    <Button
                        variant="outlined"
                        startIcon={<PlayArrowIcon />}
                        onClick={onUpdatePreview}
                        sx={{
                            minWidth: 170,
                            borderRadius: 3,
                            fontWeight: 900,
                            color: "#1976d2",
                            borderColor: "#93c5fd",
                            bgcolor: "#eff6ff",
                            "&:hover": {
                                borderColor: "#60a5fa",
                                bgcolor: "#dbeafe",
                            },
                        }}
                    >
                        プレビュー更新
                    </Button>

                    <Button
                        variant="contained"
                        endIcon={<SendIcon />}
                        onClick={onSubmit}
                        sx={{
                            minWidth: 170,
                            borderRadius: 3,
                            fontWeight: 900,
                            px: 3,
                            bgcolor: "#1565c0",
                            boxShadow: "0 10px 20px rgba(21, 101, 192, 0.28)",
                            "&:hover": {
                                bgcolor: "#0d47a1",
                                boxShadow: "0 10px 20px rgba(21, 101, 192, 0.34)",
                            },
                        }}
                    >
                        {submitStatus === "correct" ? "次へ" : "提出する"}
                    </Button>
                </Stack>
            </Box>
        </Card>
    );
};