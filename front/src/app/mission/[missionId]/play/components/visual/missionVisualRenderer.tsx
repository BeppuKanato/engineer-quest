"use client";

import { Box, Typography } from "@mui/material";
import type { ReactNode } from "react";

import type { MissionVisual, MissionVisualContent } from "./type";
import { ComparePanel } from "./comparePanel";
import { FlowDiagram } from "./flowDiagram";
import { IllustrationPanel } from "./illustrationPanel";

type MissionVisualRendererProps = {
  visual: MissionVisualContent;
};

const renderVisualData = (visual: MissionVisual): ReactNode => {
  switch (visual.type) {
    case "FLOW_DIAGRAM":
      return <FlowDiagram visual={visual} />;
    case "COMPARE_PANEL":
      return <ComparePanel visual={visual} />;
    case "ILLUSTRATION_PANEL":
      return <IllustrationPanel visual={visual} />;
    case "CODE_EXPLAIN":
    case "CODE_PREVIEW":
    case "FILE_TREE_MAP":
    case "BEFORE_AFTER":
      return null;
  }
};

export const MissionVisualRenderer = ({
  visual,
}: MissionVisualRendererProps) => {
  const content = renderVisualData(visual.data);

  if (!content) return null;

  return (
    <Box
      component="figure"
      sx={{
        m: 0,
        p: 2.5,
        minWidth: 0,
        border: "1px solid #cfe0f5",
        borderRadius: 2,
        bgcolor: "#fbfdff",
      }}
    >
      {visual.data.title && (
        <Typography
          component="h3"
          fontWeight={900}
          sx={{ mb: 2, letterSpacing: 0 }}
        >
          {visual.data.title}
        </Typography>
      )}

      {content}

      {visual.data.caption && (
        <Typography
          component="figcaption"
          variant="body2"
          sx={{ mt: 2, lineHeight: 1.7, color: "#475569", fontWeight: 700 }}
        >
          {visual.data.caption}
        </Typography>
      )}
    </Box>
  );
};
