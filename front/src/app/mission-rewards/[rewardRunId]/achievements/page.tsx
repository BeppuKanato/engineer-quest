"use client";

import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import { Alert, Button, Paper, Skeleton, Stack, Typography } from "@mui/material";
import { onAuthStateChanged } from "firebase/auth";
import { AnimatePresence, motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { getMissionRewardRun, type MissionRewardRunResponse } from "@/api/missionRewards.api";
import { AppHeader } from "@/app/component/appHeader";
import { useSoundEffect } from "@/app/component/soundFeedback";
import { auth } from "@/lib/firebase";

import {
  AchievementUnlockCard,
  RewardHero,
  RewardPageShell,
} from "../../_components/rewardVisuals";

export default function MissionRewardAchievementsPage() {
  const params = useParams<{ rewardRunId: string }>();
  const rewardRunId = params.rewardRunId;
  const router = useRouter();
  const { play } = useSoundEffect();
  const [rewardRun, setRewardRun] = useState<MissionRewardRunResponse | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        if (!isMounted) return;
        setErrorMessage("ログインが必要です。");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage(null);
        const token = await user.getIdToken();
        const data = await getMissionRewardRun(token, rewardRunId);

        if (!isMounted) return;
        setRewardRun(data);
        if (data.unlockedAchievements.length > 0) {
          play("ticket");
        }
      } catch (error) {
        console.error(error);
        if (!isMounted) return;
        setErrorMessage("実績報酬を取得できませんでした。");
      } finally {
        if (!isMounted) return;
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [play, rewardRunId]);

  const activeAchievement = useMemo(
    () => rewardRun?.unlockedAchievements[activeIndex] ?? null,
    [activeIndex, rewardRun]
  );

  const goResult = () => {
    router.push(`/mission-rewards/${encodeURIComponent(rewardRunId)}/result`);
  };

  const handleNext = () => {
    if (!rewardRun || activeIndex >= rewardRun.unlockedAchievements.length - 1) {
      goResult();
      return;
    }

    setActiveIndex((current) => current + 1);
  };

  return (
    <>
      <AppHeader />
      <RewardPageShell maxWidth={820}>
        {isLoading ? (
          <Skeleton variant="rounded" height={420} sx={{ borderRadius: 4 }} />
        ) : !rewardRun ? (
          <Alert severity="error">{errorMessage ?? "報酬データがありません。"}</Alert>
        ) : rewardRun.unlockedAchievements.length === 0 ? (
          <Stack spacing={3} alignItems="center">
            <RewardHero
              chip="Achievement Check"
              title="実績チェック完了"
              subtitle="今回は新しく解除された実績はありません。報酬まとめへ進みます。"
            />
            <Paper
              component={motion.div}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              elevation={0}
              sx={{ p: 4, borderRadius: 4, border: "1px solid #dbe3ef", bgcolor: "rgba(255,255,255,0.9)", textAlign: "center", width: "100%" }}
            >
              <Stack spacing={2} alignItems="center">
                <EmojiEventsIcon sx={{ fontSize: 56, color: "#94a3b8" }} />
                <Typography fontWeight={900}>新しい実績はありません</Typography>
                <Button
                  variant="contained"
                  endIcon={<NavigateNextIcon />}
                  onClick={goResult}
                  sx={{ minHeight: 48, fontWeight: 900, borderRadius: 2 }}
                >
                  まとめへ
                </Button>
              </Stack>
            </Paper>
          </Stack>
        ) : (
          <Stack spacing={3} alignItems="center">
            <RewardHero
              chip="Achievement Unlock"
              title="実績解除！"
              subtitle="今回のミッションで新しい実績が解除されました。"
            />
            <AnimatePresence mode="wait">
              {activeAchievement && (
                <AchievementUnlockCard
                  key={activeAchievement.id}
                  title={activeAchievement.title}
                  description={activeAchievement.description}
                  categoryLabel={activeAchievement.categoryLabel}
                  progressLabel={`${activeIndex + 1} / ${rewardRun.unlockedAchievements.length}`}
                />
              )}
            </AnimatePresence>
            <Button
              component={motion.button}
              whileHover={{ y: -2 }}
              variant="contained"
              endIcon={<NavigateNextIcon />}
              onClick={handleNext}
              sx={{ minHeight: 50, px: 5, fontWeight: 900, borderRadius: 2, boxShadow: "0 16px 34px rgba(37, 99, 235, 0.26)" }}
            >
              {activeIndex >= rewardRun.unlockedAchievements.length - 1 ? "まとめへ" : "次へ"}
            </Button>
          </Stack>
        )}
      </RewardPageShell>
    </>
  );
}
