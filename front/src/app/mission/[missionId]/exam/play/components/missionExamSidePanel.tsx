import {
    Box,
    Card,
    Tab,
    Tabs,
    Typography,
} from "@mui/material";
import {
    MissionExamProblem,
    MissionExamTab,
} from "../type";
import { createPreviewSrcDoc } from "../missionExamDiff";

type MissionExamSidePanelProps = {
    activeTab: MissionExamTab;
    onTabChange: (tab: MissionExamTab) => void;
    problem: MissionExamProblem;
    userCode: string;
};

export const MissionExamSidePanel: React.FC<MissionExamSidePanelProps> = ({
    activeTab,
    onTabChange,
    problem,
    userCode,
}) => {
    return (
        <Card
            elevation={0}
            sx={{
                height: "100%",
                borderRadius: 4,
                border: "1px solid #dbeafe",
                overflow: "hidden",
                boxShadow: "0 16px 36px rgba(15, 23, 42, 0.08)",
                display: "flex",
                flexDirection: "column",
            }}
        >
            <Box sx={{ borderBottom: "1px solid #e2e8f0", bgcolor: "#f8fafc" }}>
                <Tabs
                    value={activeTab}
                    onChange={(_, value) => onTabChange(value)}
                    variant="fullWidth"
                    sx={{
                        "& .MuiTab-root": {
                            fontWeight: 900,
                        },
                    }}
                >
                    <Tab value="preview" label="プレビュー" />
                    <Tab value="reference" label="お手本コード" />
                </Tabs>
            </Box>

            {activeTab === "preview" && (
                <Box sx={{ p: 2, flex: 1 }}>
                    <Typography
                        sx={{
                            fontWeight: 900,
                            color: "#1e293b",
                            mb: 1.5,
                        }}
                    >
                        あなたのプレビュー
                    </Typography>

                    <Box
                        component="iframe"
                        title="preview"
                        sandbox=""
                        srcDoc={createPreviewSrcDoc(userCode, problem.previewCss)}
                        sx={{
                            width: "100%",
                            minHeight: 390,
                            border: "1px solid #e2e8f0",
                            borderRadius: 4,
                            bgcolor: "#fff",
                        }}
                    />
                </Box>
            )}

            {activeTab === "reference" && (
                <Box sx={{ p: 2, flex: 1 }}>
                    <Typography
                        sx={{
                            fontWeight: 900,
                            color: "#1e293b",
                            mb: 1,
                        }}
                    >
                        お手本コード
                    </Typography>

                    <Box
                        sx={{
                            bgcolor: "#0f172a",
                            borderRadius: 4,
                            overflow: "auto",
                            border: "1px solid #1e293b",
                            maxHeight: 430,
                        }}
                    >
                        {problem.answerCode.split("\n").map((line, index) => (
                            <Box
                                key={`${line}-${index}`}
                                sx={{
                                    display: "grid",
                                    gridTemplateColumns: "48px 1fr",
                                    fontFamily:
                                        'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
                                    fontSize: 13,
                                    lineHeight: 1.7,
                                    color: "#e5e7eb",
                                }}
                            >
                                <Box
                                    sx={{
                                        px: 1,
                                        py: 0.35,
                                        color: "#94a3b8",
                                        textAlign: "right",
                                        userSelect: "none",
                                        bgcolor: "rgba(15, 23, 42, 0.45)",
                                    }}
                                >
                                    {index + 1}
                                </Box>

                                <Box
                                    component="pre"
                                    sx={{
                                        m: 0,
                                        px: 1.2,
                                        py: 0.35,
                                        whiteSpace: "pre-wrap",
                                        wordBreak: "break-word",
                                    }}
                                >
                                    {line || " "}
                                </Box>
                            </Box>
                        ))}
                    </Box>
                </Box>
            )}
        </Card>
    );
};