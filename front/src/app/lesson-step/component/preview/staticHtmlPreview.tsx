"use client";

import React from "react";
import { Box, Stack, Typography } from "@mui/material";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import { HtmlIframePreview } from "./htmlIframePreview";

type StaticHtmlPreviewProps = {
  html: string;
  caption?: string;
  minHeight?: number;
};

export const StaticHtmlPreview: React.FC<StaticHtmlPreviewProps> = ({
  html,
  caption,
  minHeight =  140
}) => {
  return (
    <Stack spacing={1.5}>
      {/* <Stack direction="row" alignItems="center" spacing={1}>
        <VisibilityRoundedIcon fontSize="small" color="primary" />
        <Typography variant="body2" fontWeight={700} color="text.secondary">
          表示結果
        </Typography>
      </Stack> */}

      <Box
        sx={{
          borderRadius: 3,
          border: "1px solid #DCE6F2",
          bgcolor: "#F8FBFF",
          p: { xs: 1.5, md: 2},
        }}
      >
        <HtmlIframePreview
          html={html}
          minHeight={minHeight}
          bodyPadding={20}
          showBorder={false}
        />
      </Box>

      {caption && (
        <Typography variant="caption" color="text.secondary">
          {caption}
        </Typography>
      )}
    </Stack>
  );
};