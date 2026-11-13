"use client";

import { Box, Chip, Stack, Typography } from "@mui/material";
import type { BigGoalRequirement } from "@/api/bigGoal.api";

const statusLabel: Record<BigGoalRequirement["status"], string> = {
  met: "確認済み",
  ongoing: "進行中",
  unobserved: "未確認",
  not_met: "条件未達",
  unavailable: "計測不可",
};

/**
 * 目標の判定条件を進捗率と分離して表示する。
 * 特に単元完了＋挑戦条件では「フェーズ7/7 = 大目標達成」と誤認させない。
 */
export function BigGoalRequirements({ requirements }: {
  requirements?: readonly BigGoalRequirement[] | null;
}) {
  if (!requirements?.length) return null;
  return (
    <Stack role="group" aria-label="大目標の達成条件" spacing={1} sx={{ mt: 1.5 }}>
      {requirements.map((item) => (
        <Box key={item.id}
          sx={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            gap: 1.5, border: "1px solid #e2e8f0", borderRadius: 2, p: 1.25,
          }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" fontWeight={700}>{item.label}</Typography>
            {item.current !== undefined && item.target !== undefined && (
              <Typography variant="caption" color="text.secondary">
                {item.current}/{item.target} {item.unit ?? ""}
              </Typography>
            )}
          </Box>
          <Chip label={statusLabel[item.status]} size="small"
            color={item.status === "met" ? "success" : "default"}
            variant="outlined" sx={{ flexShrink: 0, fontWeight: 700 }} />
        </Box>
      ))}
    </Stack>
  );
}
