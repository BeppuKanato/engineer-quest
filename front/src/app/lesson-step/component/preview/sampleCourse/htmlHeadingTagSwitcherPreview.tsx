"use client";

import React from "react";
import {
  Box,
  Button,
  Stack,
  Typography,
} from "@mui/material";
import CodeRoundedIcon from "@mui/icons-material/CodeRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";

type HeadingTag = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

const headingTags: HeadingTag[] = ["h1", "h2", "h3", "h4", "h5", "h6"];

const headingVariantMap: Record<HeadingTag, "h3" | "h4" | "h5" | "h6" | "subtitle1" | "body1"> = {
  h1: "h3",
  h2: "h4",
  h3: "h5",
  h4: "h6",
  h5: "subtitle1",
  h6: "body1",
};

export const HtmlHeadingTagSwitcherPreview: React.FC = () => {
  const [selectedTag, setSelectedTag] = React.useState<HeadingTag>("h1");

  const headingText = "自己紹介";
  const paragraphText = "こんにちは。プログラミングを勉強中です。";

  return (
    <Box>
      <Stack spacing={2.5}>
        {/* 任意操作ラベル */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems={{ xs: "flex-start", sm: "center" }}
          justifyContent="space-between"
          spacing={1.5}
        >
          <Box>
            <Typography variant="body2" fontWeight={700} color="text.secondary">
              見出しタグを選択
            </Typography>
            <Typography variant="caption" color="text.secondary">
              タグを切り替えて、表示のされ方を見比べてみましょう。
            </Typography>
          </Box>

          <Box
            sx={{
              px: 1.5,
              py: 0.75,
              borderRadius: 999,
              bgcolor: "#EEF6FF",
              color: "primary.main",
              fontSize: 13,
              fontWeight: 700,
              whiteSpace: "nowrap",
            }}
          >
            タグを切り替えてみよう（任意）
          </Box>
        </Stack>

        {/* h1〜h6 切り替えボタン */}
        <Stack
          direction="row"
          spacing={1.25}
          flexWrap="wrap"
          useFlexGap
        >
          {headingTags.map((tag) => {
            const isSelected = selectedTag === tag;

            return (
              <Button
                key={tag}
                variant={isSelected ? "contained" : "outlined"}
                onClick={() => setSelectedTag(tag)}
                sx={{
                  minWidth: 64,
                  borderRadius: 2.5,
                  fontWeight: 800,
                  textTransform: "none",
                }}
              >
                {tag}
              </Button>
            );
          })}
        </Stack>

        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={3}
          alignItems="stretch"
        >
          {/* コード側 */}
          <Box sx={{ flex: 1 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <CodeRoundedIcon fontSize="small" color="primary" />
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
                lineHeight: 1.9,
                overflowX: "auto",
              }}
            >
              <Box component="span" sx={{ color: "#93C5FD" }}>
                {`<${selectedTag}>`}
              </Box>
              <Box component="span" sx={{ color: "#F8FAFC", fontWeight: 700 }}>
                {headingText}
              </Box>
              <Box component="span" sx={{ color: "#93C5FD" }}>
                {`</${selectedTag}>`}
              </Box>

              <Box sx={{ mt: 2 }}>
                <Box component="span" sx={{ color: "#93C5FD" }}>
                  {"<p>"}
                </Box>
                <Box component="span" sx={{ color: "#F8FAFC" }}>
                  {paragraphText}
                </Box>
                <Box component="span" sx={{ color: "#93C5FD" }}>
                  {"</p>"}
                </Box>
              </Box>
            </Box>

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mt: 1 }}
            >
              選んだタグが、コードの見出し部分に反映されます。
            </Typography>
          </Box>

          {/* 表示結果側 */}
          <Box sx={{ flex: 1 }}>
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
              <Typography
                variant={headingVariantMap[selectedTag]}
                fontWeight={800}
                sx={{ mb: 2 }}
              >
                {headingText}
              </Typography>

              <Typography variant="body1" color="text.secondary">
                {paragraphText}
              </Typography>
            </Box>

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mt: 1 }}
            >
              同じ文字でも、タグを変えると見出しの大きさが変わります。
            </Typography>
          </Box>
        </Stack>
      </Stack>
    </Box>
  );
};