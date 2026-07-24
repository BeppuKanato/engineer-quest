"use client";

import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import { Box, Stack, Typography } from "@mui/material";

import type { ComparePanelVisual } from "./type";
import { visualToneStyle } from "./visualTheme";

type ComparePanelProps = {
  visual: ComparePanelVisual;
};

const ComparisonPanel = ({
  panel,
}: {
  panel: ComparePanelVisual["panels"][number];
}) => {
  const tone = visualToneStyle[panel.tone ?? "blue"];

  return (
    <Box
      sx={{
        flex: "1 1 0",
        minWidth: 0,
        minHeight: 230,
        overflow: "hidden",
        border: `1px solid ${tone.border}`,
        borderRadius: 2,
        bgcolor: "#fff",
      }}
    >
      <Box
        sx={{
          px: 2.25,
          py: 1.75,
          borderBottom: `1px solid ${tone.border}`,
          bgcolor: tone.background,
        }}
      >
        <Typography fontWeight={900} color={tone.color} sx={{ letterSpacing: 0 }}>
          {panel.title}
        </Typography>
        {panel.subtitle && (
          <Typography
            variant="caption"
            sx={{ display: "block", mt: 0.25, color: "#475569", fontWeight: 700 }}
          >
            {panel.subtitle}
          </Typography>
        )}
      </Box>

      <Stack spacing={1.5} sx={{ p: 2.25 }}>
        {panel.items.map((item, index) => (
          <Stack
            key={`${panel.id}-${index}`}
            direction="row"
            spacing={1.25}
            alignItems="flex-start"
          >
            <Box
              aria-hidden
              sx={{
                width: 8,
                height: 8,
                mt: 0.85,
                flex: "0 0 auto",
                borderRadius: 0.75,
                bgcolor: tone.accent,
              }}
            />
            <Typography sx={{ lineHeight: 1.7, color: "#334155", fontWeight: 700 }}>{item}</Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
};

export const ComparePanel = ({ visual }: ComparePanelProps) => {
  if (visual.panels.length === 0) return null;

  if (visual.panels.length === 2) {
    return (
      <Stack
        direction="row"
        alignItems="stretch"
        spacing={1.5}
        role="group"
        aria-label={visual.title ?? "項目の比較"}
      >
        <ComparisonPanel panel={visual.panels[0]} />
        <Box
          aria-hidden
          sx={{
            alignSelf: "center",
            width: 40,
            height: 40,
            flex: "0 0 40px",
            display: "grid",
            placeItems: "center",
            border: "1px solid #dbe3ef",
            borderRadius: "50%",
            bgcolor: "#fff",
            color: "#64748b",
            boxShadow: "0 5px 14px rgba(15, 23, 42, 0.08)",
          }}
        >
          <CompareArrowsIcon fontSize="small" />
        </Box>
        <ComparisonPanel panel={visual.panels[1]} />
      </Stack>
    );
  }

  return (
    <Box
      role="group"
      aria-label={visual.title ?? "項目の比較"}
      sx={{
        display: "grid",
        gridTemplateColumns: `repeat(${visual.panels.length}, minmax(220px, 1fr))`,
        gap: 2,
        overflowX: "auto",
      }}
    >
      {visual.panels.map((panel) => (
        <ComparisonPanel key={panel.id} panel={panel} />
      ))}
    </Box>
  );
};
