import ClearIcon from "@mui/icons-material/Clear";
import {
    Box,
    Button,
    Card,
    Typography,
} from "@mui/material";
import { useMemo, useRef } from "react";
import { UserDiffLine } from "../type";

type MissionExamEditorProps = {
    code: string;
    onChange: (code: string) => void;
    diffLines: UserDiffLine[];
    showDiff: boolean;
    onClearDiff: () => void;
};

const editorFontFamily =
    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace';

const getLineBgColor = (status?: UserDiffLine["status"]) => {
    if (status === "changed") {
        return "#fef3c7";
    }

    if (status === "extra") {
        return "#dbeafe";
    }

    return "transparent";
};

const getLineBorderColor = (status?: UserDiffLine["status"]) => {
    if (status === "changed") {
        return "#f59e0b";
    }

    if (status === "extra") {
        return "#3b82f6";
    }

    return "transparent";
};

const getLineTextColor = (status?: UserDiffLine["status"]) => {
    if (status === "changed") {
        return "#78350f";
    }

    if (status === "extra") {
        return "#1e3a8a";
    }

    return "#e5e7eb";
};

export const MissionExamEditor: React.FC<MissionExamEditorProps> = ({
    code,
    onChange,
    diffLines,
    showDiff,
    onClearDiff,
}) => {
    const overlayRef = useRef<HTMLDivElement | null>(null);
    const lineNumberRef = useRef<HTMLDivElement | null>(null);

    const codeLines = useMemo(() => {
        const lines = code.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
        return lines.length > 0 ? lines : [""];
    }, [code]);

    const diffStatusByLineNumber = useMemo(() => {
        const map = new Map<number, UserDiffLine["status"]>();

        diffLines.forEach((line) => {
            if (line.status !== "same") {
                map.set(line.lineNumber, line.status);
            }
        });

        return map;
    }, [diffLines]);

    const handleScroll = (event: React.UIEvent<HTMLTextAreaElement>) => {
        const target = event.currentTarget;

        if (overlayRef.current) {
            overlayRef.current.scrollTop = target.scrollTop;
            overlayRef.current.scrollLeft = target.scrollLeft;
        }

        if (lineNumberRef.current) {
            lineNumberRef.current.scrollTop = target.scrollTop;
        }
    };

    return (
        <Card
            elevation={0}
            sx={{
                height: "100%",
                borderRadius: 4,
                border: "1px solid #dbeafe",
                overflow: "hidden",
                boxShadow: "0 16px 36px rgba(15, 23, 42, 0.08)",
            }}
        >
            <Box
                sx={{
                    px: 2,
                    py: 1.4,
                    bgcolor: "#f8fafc",
                    borderBottom: "1px solid #e2e8f0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 1,
                }}
            >
                <Typography
                    sx={{
                        fontWeight: 900,
                        color: "#1e293b",
                    }}
                >
                    あなたのコード
                </Typography>

                {showDiff && (
                    <Button
                        size="small"
                        startIcon={<ClearIcon />}
                        onClick={onClearDiff}
                        sx={{
                            borderRadius: 999,
                            fontWeight: 900,
                            color: "#64748b",
                        }}
                    >
                        マーカーを消す
                    </Button>
                )}
            </Box>

            <Box
                sx={{
                    position: "relative",
                    display: "grid",
                    gridTemplateColumns: "56px 1fr",
                    minHeight: 430,
                    maxHeight: 520,
                    bgcolor: "#0f172a",
                    overflow: "hidden",
                    fontFamily: editorFontFamily,
                    fontSize: 13,
                    lineHeight: "24px",
                }}
            >
                <Box
                    ref={lineNumberRef}
                    sx={{
                        overflow: "hidden",
                        bgcolor: "rgba(15, 23, 42, 0.72)",
                        color: "#64748b",
                        py: 2,
                        userSelect: "none",
                    }}
                >
                    {codeLines.map((_, index) => (
                        <Box
                            key={`line-number-${index}`}
                            sx={{
                                height: 24,
                                px: 1,
                                textAlign: "right",
                            }}
                        >
                            {index + 1}
                        </Box>
                    ))}
                </Box>

                <Box sx={{ position: "relative", overflow: "hidden" }}>
                    {showDiff && (
                        <Box
                            ref={overlayRef}
                            aria-hidden="true"
                            sx={{
                                position: "absolute",
                                inset: 0,
                                overflow: "hidden",
                                py: 2,
                                pr: 2,
                                pl: 0,
                                pointerEvents: "none",
                                whiteSpace: "pre",
                            }}
                        >
                            {codeLines.map((line, index) => {
                                const lineNumber = index + 1;
                                const status = diffStatusByLineNumber.get(lineNumber);

                                return (
                                    <Box
                                        key={`overlay-${lineNumber}`}
                                        sx={{
                                            height: 24,
                                            display: "flex",
                                            alignItems: "center",
                                            bgcolor: getLineBgColor(status),
                                            color: getLineTextColor(status),
                                            borderLeft: "4px solid",
                                            borderLeftColor: getLineBorderColor(status),
                                            px: 1.2,
                                            whiteSpace: "pre",
                                            minWidth: "max-content",
                                        }}
                                    >
                                        {line || " "}
                                    </Box>
                                );
                            })}
                        </Box>
                    )}

                    <Box
                        component="textarea"
                        value={code}
                        onChange={(event) => onChange(event.target.value)}
                        onScroll={handleScroll}
                        spellCheck={false}
                        sx={{
                            position: "absolute",
                            inset: 0,
                            width: "100%",
                            height: "100%",
                            resize: "none",
                            border: "none",
                            outline: "none",
                            py: 2,
                            px: 1.2,
                            m: 0,
                            fontFamily: editorFontFamily,
                            fontSize: 13,
                            lineHeight: "24px",
                            whiteSpace: "pre",
                            overflow: "auto",
                            tabSize: 2,
                            bgcolor: showDiff ? "transparent" : "#0f172a",
                            color: showDiff ? "transparent" : "#e5e7eb",
                            caretColor: "#e5e7eb",
                            WebkitTextFillColor: showDiff ? "transparent" : "#e5e7eb",
                            "&::selection": {
                                bgcolor: "rgba(96, 165, 250, 0.35)",
                            },
                        }}
                    />
                </Box>
            </Box>
        </Card>
    );
};