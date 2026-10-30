"use client";

import { Box, CircularProgress, Stack, Typography } from "@mui/material";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * 旧URLをブックマーク・履歴から開いた場合の互換ルート。
 * 実績通知はリザルト画面側で一度だけ表示する。
 */
export default function LegacyMissionRewardAchievementsPage() {
  const params = useParams<{ rewardRunId: string }>();
  const router = useRouter();

  useEffect(() => {
    router.replace(
      `/mission-rewards/${encodeURIComponent(params.rewardRunId)}/result`
    );
  }, [params.rewardRunId, router]);

  return (
    <Box component="main" sx={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
      <Stack spacing={2} alignItems="center">
        <CircularProgress aria-label="リザルト画面を読み込んでいます" />
        <Typography color="text.secondary" fontWeight={800}>
          リザルト画面へ移動しています…
        </Typography>
      </Stack>
    </Box>
  );
}
