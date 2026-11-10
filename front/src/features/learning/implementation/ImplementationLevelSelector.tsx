"use client";

import { Box, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";

import {
  implementationInputLevels, implementationInputLevelText, type ImplementationInputLevel,
} from "./inputLevel";

/** フェーズ7の入力量レベルを選ぶ共通セレクタ（Issue #328）。全単元で同じ文言・同じ並びを使う。 */
export function ImplementationLevelSelector({ level, onChange, disabled = false }: {
  level: ImplementationInputLevel;
  onChange: (level: ImplementationInputLevel) => void;
  disabled?: boolean;
}) {
  return <Box data-input-level-selector sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5 }}>
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap", justifyContent: "center" }}>
      <Typography component="p" sx={{ fontWeight: 700, fontSize: 15 }}>{implementationInputLevelText.groupLabel}</Typography>
      <ToggleButtonGroup exclusive size="small" value={level} disabled={disabled}
        onChange={(_, next: ImplementationInputLevel | null) => { if (next) onChange(next); }}
        aria-label={implementationInputLevelText.groupLabel}>
        {implementationInputLevels.map(candidate => (
          <ToggleButton key={candidate} value={candidate} data-input-level-option={candidate}
            sx={{ minHeight: 38, textTransform: "none", fontSize: 14.5, px: 1.75, fontWeight: level === candidate ? 700 : 400 }}>
            {implementationInputLevelText.levels[candidate].label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Box>
    <Typography component="p" sx={{ fontSize: 13.5, textAlign: "center" }}>{implementationInputLevelText.levels[level].description}</Typography>
    <Typography component="p" sx={{ fontSize: 12.5, textAlign: "center", opacity: 0.75 }}>{implementationInputLevelText.note}</Typography>
  </Box>;
}
