"use client";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import FlagIcon from "@mui/icons-material/Flag";
import {
  Box,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";

import {
  getBigGoalHistory,
  getCurrentBigGoal,
  type BigGoal,
} from "@/api/bigGoal.api";
import { useUserSession } from "@/app/component/userSession";
import { bigGoalProgressFact, bigGoalStatusLabel } from "./bigGoalPresentation";
import { BigGoalRequirements } from "./BigGoalRequirements";

const cardSx = {
  borderRadius: 3,
  border: "1px solid #e2e8f0",
  boxShadow: "0 12px 30px rgba(15,23,42,0.06)",
} as const;

/**
 * ホームの大目標表示（Issue #367）。
 * アクティブな大目標は1件だけバナー表示する。進捗の数値は API が返した
 * コード計算の割合と評価の内訳をそのまま使い、フロントで再計算しない。
 * 目標の表示に所要日数・期限などの時間指定は付けない。
 * 取得に失敗した場合はホームを壊さず、何も出さない。
 */
export function BigGoalBanner() {
  const { status, token } = useUserSession();
  const [current, setCurrent] = useState<BigGoal | null>(null);
  const [past, setPast] = useState<BigGoal[]>([]);

  useEffect(() => {
    if (status !== "authenticated" || !token) return;
    let isMounted = true;
    void (async () => {
      try {
        const [currentResult, historyResult] = await Promise.all([
          getCurrentBigGoal(token),
          getBigGoalHistory(token),
        ]);
        if (!isMounted) return;
        setCurrent(currentResult.goal);
        setPast(
          historyResult.goals.filter(
            (goal) => goal.status === "ACHIEVED" || goal.status === "CLOSED_UNMET" || goal.status === "REVISED"
          )
        );
      } catch {
        // 大目標の取得に失敗してもホーム自体は表示する。
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [status, token]);

  if (!current && past.length === 0) return null;

  const fact = current ? bigGoalProgressFact(current) : null;
  const percent =
    current?.progress !== null && current?.progress !== undefined
      ? Math.round(current.progress * 100)
      : null;

  return (
    <Stack spacing={3} sx={{ mb: 3 }}>
      {current && (
        <Card sx={cardSx}>
          <CardContent sx={{ p: 3 }}>
            <Stack spacing={2}>
              <Stack direction="row" spacing={1.25} alignItems="center">
                <FlagIcon sx={{ color: "#0057e7" }} />
                <Typography variant="h6" fontWeight={950}>
                  いまの目標
                </Typography>
              </Stack>
              <Typography sx={{ fontSize: 22, fontWeight: 950, lineHeight: 1.35 }}>
                {current.displayText}
              </Typography>
              {percent !== null && (
                <Box>
                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                    <Typography fontWeight={900}>進み具合</Typography>
                    <Typography color="text.secondary" fontWeight={800}>
                      {percent}%
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={percent}
                    aria-label="大目標の進み具合"
                    sx={{
                      height: 10,
                      borderRadius: 999,
                      bgcolor: "#e5e7eb",
                      "& .MuiLinearProgress-bar": { borderRadius: 999, bgcolor: "#0057e7" },
                    }}
                  />
                </Box>
              )}
              {fact && (
                <Typography color="text.secondary" fontWeight={700}>
                  {fact}
                </Typography>
              )}
              <BigGoalRequirements requirements={current.evaluation?.requirements} />
            </Stack>
          </CardContent>
        </Card>
      )}

      {past.length > 0 && (
        <Card sx={cardSx}>
          <CardContent sx={{ p: 3 }}>
            <Stack spacing={1.5}>
              <Typography variant="h6" fontWeight={950}>
                これまでの目標
              </Typography>
              {past.slice(0, 5).map((goal) => (
                <Stack key={goal.id} direction="row" spacing={1.5} alignItems="center">
                  {goal.status === "ACHIEVED" ? (
                    <CheckCircleIcon sx={{ color: "#0057e7", fontSize: 20 }} />
                  ) : (
                    <FlagIcon sx={{ color: "#94a3b8", fontSize: 20 }} />
                  )}
                  <Typography sx={{ flex: 1, fontWeight: 700 }}>{goal.displayText}</Typography>
                  <Chip
                    label={bigGoalStatusLabel(goal.status)}
                    size="small"
                    sx={
                      goal.status === "ACHIEVED"
                        ? { fontWeight: 900, bgcolor: "#dbeafe", color: "#0b4ac8" }
                        : { fontWeight: 800, bgcolor: "#f1f5f9", color: "#475569" }
                    }
                  />
                </Stack>
              ))}
            </Stack>
          </CardContent>
        </Card>
      )}
    </Stack>
  );
}
