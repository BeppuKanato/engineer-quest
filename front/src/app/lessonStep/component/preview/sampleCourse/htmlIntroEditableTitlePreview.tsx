"use client";

import { Box, Stack, TextField, Typography } from "@mui/material";
import CodeRoundedIcon from "@mui/icons-material/CodeRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import React, { useState } from "react";

export const HtmlIntroEditableTitlePreview: React.FC = () => {
    const [headingText, setHeadingText] = useState("自己紹介");

    const paragraghText = "こんにちは。プログラミングを勉強中です。";

    return (
        <Box>
            <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={3}
                alignItems="stretch"
            >
                {/* コード側 */}
                <Box sx={{ flex: 1}}>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                        <CodeRoundedIcon fontSize="small" color="primary"/>
                        <Typography variant="body2" fontWeight={700} color="text.secondary">
                            コード
                        </Typography>
                    </Stack>

                    <Box
                        sx={{
                            minHeight: 180,
                            borderRadius: 3,
                            bgcolor: "#0F172A",
                            color: "#E5E7EB",
                            p: 3,
                            fontFamily:
                                'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                            fontSize: 15,
                            lineHeight: 1.8,
                            overflowX: "auto",
                        }}
                    >
                        <Box component="span" sx={{ color: "#93C5FD"}}>
                            {"<h1>"}
                        </Box>
                        <TextField
                            value={headingText}
                            onChange={(event) => setHeadingText(event.target.value)}
                            variant="outlined"
                            size="small"
                            inputProps={{
                                maxLength: 20,
                            }}
                            sx={{
                                mx: 1,
                                width: 180,
                                verticalAlign: "middle",
                                "& .MuiOutlinedInput-root": {
                                height: 34,
                                bgcolor: "#1E293B",
                                color: "#E5E7EB",
                                borderRadius: 1.5,
                                fontFamily:
                                    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                                "& fieldset": {
                                    borderColor: "#334155",
                                },
                                "&:hover fieldset": {
                                    borderColor: "#60A5FA",
                                },
                                "&.Mui-focused fieldset": {
                                    borderColor: "#60A5FA",
                                },
                                },
                                "& input": {
                                    px: 1.25,
                                    py: 0.5,
                                    fontWeight: 700,
                                },
                            }}
                        />
                        <Box component="span" sx={{ color: "#93C5FD"}}>
                            {"</h1>"}
                        </Box>

                        <Box sx={{ mt: 2}}>
                            <Box component="span" sx={{ color: "#93C5FD"}}>
                                {"<p>"}
                            </Box>
                            <Box component="span" sx={{ color: "#F8FAFC"}}>
                                {paragraghText}
                            </Box>
                            <Box component="span" sx={{ color: "#93C5FD"}}>
                                {"</p>"}
                            </Box>
                        </Box>
                    </Box>

                    <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block", mt: 1}}
                    >
                        「自己紹介」の部分を書き換えて、表示結果が変わることを確認できます。
                    </Typography>
                </Box>

                {/* 表示結果側 */}
                <Box sx={{ flex: 1}}>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                        <VisibilityRoundedIcon fontSize="small" color="primary" />
                        <Typography variant="body2" fontWeight={700} color="text.secondary">
                            表示結果
                        </Typography>
                    </Stack>

                    <Box
                        sx={{
                            minHeight: 180,
                            borderRadius: 3,
                            border: "1px solid #E0E7F0",
                            bgcolor: "#FFFFFF",
                            p: 4,
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                        }}
                    >
                        <Typography variant="h4" fontWeight={800} sx={{ mb: 2}}>
                            {headingText.trim() || "自己紹介"}
                        </Typography>

                        <Typography variant="body1" color="text.secondary">
                            {paragraghText}
                        </Typography>
                    </Box>

                    <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block", mt: 1}}
                    >
                        HTMLコードの内容が、右側の画面表示に反映されます。
                    </Typography>
                </Box>
            </Stack>
        </Box>
    )
}