import React from "react";
import {
  Box,
  Button,
  Grid,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CodeRoundedIcon from "@mui/icons-material/CodeRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import { HtmlIframePreview } from "../preview/HtmlIframePreview";

type TryCodeAnswerProps = {
  starterCode?: string;
  sampleCode?: string;
  userAnswer: unknown;
  onAnswerChange: (answer: string) => void;
};

export const TryCodeAnswer: React.FC<TryCodeAnswerProps> = ({
  starterCode = "",
  sampleCode = "",
  userAnswer,
  onAnswerChange,
}) => {
  const code = typeof userAnswer === "string" ? userAnswer : starterCode;

  const handleUseSample = () => {
    onAnswerChange(sampleCode);
  };

  const handleClear = () => {
    onAnswerChange("");
  };

  return (
    <Box>
      <Stack spacing={2.5}>
        <Box>
          <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1 }}>
            HTMLを書いて表示してみましょう
          </Typography>

          <Typography variant="body2" color="text.secondary">
            左のエディタにHTMLを書くと、右側に表示結果が出ます。これはテストではないので、自由に試してOKです。
          </Typography>
        </Box>

        {sampleCode && (
          <Box
            sx={{
              borderRadius: 3,
              bgcolor: "#F8FBFF",
              border: "1px solid #D9E5F7",
              p: 2,
            }}
          >
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.5}
              alignItems={{ xs: "flex-start", sm: "center" }}
              justifyContent="space-between"
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" fontWeight={800}>
                  お手本コード
                </Typography>

                <Typography
                  component="pre"
                  variant="body2"
                  sx={{
                    mt: 1,
                    mb: 0,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    fontFamily:
                      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                    color: "text.secondary",
                  }}
                >
                  {sampleCode}
                </Typography>
              </Box>

              <Button
                variant="outlined"
                onClick={handleUseSample}
                sx={{
                  borderRadius: 2.5,
                  fontWeight: 800,
                  whiteSpace: "nowrap",
                  bgcolor: "#FFFFFF",
                  flexShrink: 0,
                }}
              >
                お手本を入力
              </Button>
            </Stack>
          </Box>
        )}

        <Grid container spacing={3} alignItems="stretch">
          <Grid size={{ xs: 12, md: 6 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <CodeRoundedIcon fontSize="small" color="primary" />
              <Typography variant="body2" fontWeight={800} color="text.secondary">
                コードエディタ
              </Typography>
            </Stack>

            <TextField
              multiline
              minRows={12}
              value={code}
              onChange={(event) => onAnswerChange(event.target.value)}
              placeholder={`<h1>自己紹介</h1>
<p>こんにちは。</p>`}
              fullWidth
              sx={{
                "& .MuiOutlinedInput-root": {
                  minHeight: 280,
                  alignItems: "flex-start",
                  borderRadius: 3,
                  bgcolor: "#0F172A",
                  color: "#E5E7EB",
                  fontFamily:
                    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                  fontSize: 14,
                  lineHeight: 1.8,
                  "& fieldset": {
                    borderColor: "#1E293B",
                  },
                  "&:hover fieldset": {
                    borderColor: "#60A5FA",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#60A5FA",
                  },
                },
                "& textarea": {
                  color: "#E5E7EB",
                },
              }}
            />

            <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 1 }}>
              <Button
                variant="text"
                color="inherit"
                onClick={handleClear}
                disabled={!code}
                sx={{ fontSize: 12 }}
              >
                クリア
              </Button>
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <VisibilityRoundedIcon fontSize="small" color="primary" />
              <Typography variant="body2" fontWeight={800} color="text.secondary">
                実行結果
              </Typography>
            </Stack>

            <HtmlIframePreview html={code} minHeight={280} />

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mt: 1 }}
            >
              入力したHTMLがここに表示されます。
            </Typography>
          </Grid>
        </Grid>
      </Stack>
    </Box>
  );
};