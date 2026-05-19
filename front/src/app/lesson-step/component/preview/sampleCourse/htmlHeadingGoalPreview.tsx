"use client";

import React from "react";
import { Box, Stack, Typography } from "@mui/material";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";

export const HtmlHeadingGoalPreview: React.FC = () => {
  return (
    <Stack spacing={1.5}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <VisibilityRoundedIcon fontSize="small" color="primary" />
        <Typography variant="body2" fontWeight={700} color="text.secondary">
          表示結果
        </Typography>
      </Stack>

      <Box
        sx={{
          borderRadius: 3,
          border: "1px solid #DCE6F2",
          bgcolor: "#F8FBFF",
          p: 2.5,
        }}
      >
        <Box
          sx={{
            borderRadius: 3,
            border: "1px solid #E2E8F0",
            bgcolor: "#FFFFFF",
            minHeight: 180,
            p: 4,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <Typography
            variant="h3"
            fontWeight={800}
            sx={{ mb: 2, color: "#0F172A" }}
          >
            自己紹介
          </Typography>

        </Box>
      </Box>

      <Typography variant="caption" color="text.secondary">
        この表示結果の「一番大きな見出し」に使うタグを選びます。
      </Typography>
    </Stack>
  );
};