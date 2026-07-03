"use client";

import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import { Alert, Box, Button, Paper, Skeleton, Stack, Typography } from "@mui/material";
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
        if (data.unlockedAchievements.length === 0) {
          router.replace(`/mission-rewards/${encodeURIComponent(rewardRunId)}/result`);
          return;
        }
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
  }, [play, rewardRunId, router]);

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
    <Box sx={{ minHeight: "100vh", bgcolor: "#eef4fb" }}>
      <AppHeader />
      <RewardPageShell maxWidth={1120}>
        {isLoading ? (
          <Skeleton variant="rounded" height={560} sx={{ borderRadius: 4 }} />
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
              sx={{ p: 4, borderRadius: 4, border: "1px solid #dbe3ef", bgcolor: "rgba(255,255,255,0.92)", textAlign: "center", width: "100%", maxWidth: 560 }}
            >
              <Stack spacing={2} alignItems="center">
                <EmojiEventsIcon sx={{ fontSize: 60, color: "#94a3b8" }} />
                <Typography fontWeight={900}>新しい実績はありません</Typography>
                <Button
                  variant="contained"
                  endIcon={<NavigateNextIcon />}
                  onClick={goResult}
                  sx={{ minHeight: 50, px: 5, fontWeight: 900, borderRadius: 2 }}
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

            <Box
              sx={{
                position: "relative",
                width: "100%",
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "260px minmax(0, 1fr) 180px" },
                alignItems: "end",
                gap: { xs: 2, md: 3 },
              }}
            >
              <Box
                component={motion.div}
                initial={{ opacity: 0, x: -28 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.42, delay: 0.12 }}
                sx={{ position: "relative", display: { xs: "none", md: "block" }, minHeight: 360 }}
              >
                <Paper
                  elevation={0}
                  sx={{
                    position: "absolute",
                    top: 12,
                    left: 10,
                    px: 2.3,
                    py: 1.8,
                    borderRadius: "50%",
                    border: "1px solid #dbeafe",
                    bgcolor: "rgba(255,255,255,0.96)",
                    fontWeight: 900,
                    color: "#0f4bb8",
                    lineHeight: 1.8,
                    boxShadow: "0 18px 46px rgba(37, 99, 235, 0.14)",
                  }}
                >
                  おめでとう！<br />新しい実績を<br />達成したよ！
                </Paper>
                <Box
                  component="img"
                  src="/images/mascots/red-panda/happy.png"
                  alt="実績解除を祝うマスコット"
                  sx={{ position: "absolute", left: 8, bottom: 0, width: 230, height: 230, objectFit: "contain" }}
                />
              </Box>

              <Stack alignItems="center" spacing={2}>
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
                  sx={{
                    minHeight: 56,
                    px: 7,
                    fontWeight: 900,
                    borderRadius: 3,
                    boxShadow: "0 18px 40px rgba(37, 99, 235, 0.3)",
                  }}
                >
                  {activeIndex >= rewardRun.unlockedAchievements.length - 1 ? "まとめへ" : "次へ"}
                </Button>
              </Stack>

              <Box />
            </Box>
          </Stack>
        )}
      </RewardPageShell>
    </Box>
  );
}
