"use client";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import RouteIcon from "@mui/icons-material/Route";
import StarIcon from "@mui/icons-material/Star";
import { Alert, Box, Button, Chip, Paper, Skeleton, Stack, Typography } from "@mui/material";
import { onAuthStateChanged } from "firebase/auth";
import { motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { getMissionRewardRun, type MissionRewardRunResponse } from "@/api/missionRewards.api";
import { AppHeader } from "@/app/component/appHeader";
import { PageTransitionOverlay } from "@/app/component/pageTransitionOverlay";
import { useSoundEffect } from "@/app/component/soundFeedback";
import { useNavigationFeedback } from "@/hooks/useNavigationFeedback";
import { auth } from "@/lib/firebase";

import {
  LearnedItem,
  RewardHero,
  RewardPageShell,
  RewardSummaryCard,
  getRarityTone,
} from "../../_components/rewardVisuals";

export default function MissionRewardResultPage() {
  const params = useParams<{ rewardRunId: string }>();
  const rewardRunId = params.rewardRunId;
  const router = useRouter();
  const { play } = useSoundEffect();
  const { showOverlay, startNavigation } = useNavigationFeedback();
  const [rewardRun, setRewardRun] = useState<MissionRewardRunResponse | null>(null);
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
        play("missionComplete");
      } catch (error) {
        console.error(error);
        if (!isMounted) return;
        setErrorMessage("報酬まとめを取得できませんでした。");
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

  const goNextMission = () => {
    if (!rewardRun?.nextMission) return;
    startNavigation(() => {
      router.push(`/mission/${encodeURIComponent(rewardRun.nextMission!.id)}/play`);
    });
  };

  const goRoadmap = () => {
    if (!rewardRun) return;
    startNavigation(() => {
      router.push(`/courses/roadmap/${encodeURIComponent(rewardRun.mission.courseId)}`);
    });
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f7f8fc" }}>
      <AppHeader />
      <PageTransitionOverlay open={showOverlay} message="次の画面を準備しています..." />
      <RewardPageShell maxWidth={980}>
        {isLoading ? (
          <Skeleton variant="rounded" height={640} sx={{ borderRadius: 4 }} />
        ) : !rewardRun ? (
          <Alert severity="error">{errorMessage ?? "報酬データがありません。"}</Alert>
        ) : (
          <Stack spacing={3}>
            <RewardHero
              chip="Reward Summary"
              title="ミッション完了！"
              subtitle={`${rewardRun.mission.title} の報酬と、今回できるようになったことを確認します。`}
            />

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" }, gap: 2 }}>
              <RewardSummaryCard icon={<StarIcon />} label="獲得EXP" value={`+${rewardRun.awardedExp}`} tone="blue" />
              <RewardSummaryCard icon={<ConfirmationNumberIcon />} label="Badge Ticket" value={`+${rewardRun.awardedBadgeTickets}`} tone="green" />
            </Box>

            {rewardRun.selectedKnowledgeCard && (
              <Paper
                component={motion.div}
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.1 }}
                elevation={0}
                sx={{
                  p: { xs: 2.5, md: 3 },
                  borderRadius: 3,
                  border: `1px solid ${getRarityTone(rewardRun.selectedKnowledgeCard.rarity).border}`,
                  bgcolor: "rgba(255,255,255,0.92)",
                  boxShadow: getRarityTone(rewardRun.selectedKnowledgeCard.rarity).glow,
                }}
              >
                <Stack direction={{ xs: "column", md: "row" }} spacing={2.5} alignItems={{ xs: "stretch", md: "center" }}>
                  <Box sx={{ width: 68, height: 68, borderRadius: 2, display: "grid", placeItems: "center", color: getRarityTone(rewardRun.selectedKnowledgeCard.rarity).color, bgcolor: getRarityTone(rewardRun.selectedKnowledgeCard.rarity).bgcolor, border: `1px solid ${getRarityTone(rewardRun.selectedKnowledgeCard.rarity).border}` }}>
                    <MenuBookIcon sx={{ fontSize: 38 }} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 1 }}>
                      <Chip label="今回入手したカード" size="small" color="primary" sx={{ fontWeight: 900 }} />
                      <Chip label={rewardRun.selectedKnowledgeCard.rarity} size="small" sx={{ fontWeight: 900 }} />
                    </Stack>
                    <Typography variant="h5" fontWeight={900}>
                      {rewardRun.selectedKnowledgeCard.title}
                    </Typography>
                    <Typography color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.8 }}>
                      {rewardRun.selectedKnowledgeCard.description}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            )}

            {rewardRun.unlockedAchievements.length > 0 && (
              <Paper elevation={0} sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 3, border: "1px solid #fde68a", bgcolor: "rgba(255, 251, 235, 0.9)" }}>
                <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mb: 2 }}>
                  <EmojiEventsIcon sx={{ color: "#d97706" }} />
                  <Typography variant="h6" fontWeight={900}>解除された実績</Typography>
                </Stack>
                <Stack spacing={1.25}>
                  {rewardRun.unlockedAchievements.map((achievement, index) => (
                    <Paper
                      key={achievement.id}
                      component={motion.div}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.28, delay: index * 0.05 }}
                      elevation={0}
                      sx={{ p: 1.75, borderRadius: 2, bgcolor: "#fff", border: "1px solid #fde68a" }}
                    >
                      <Stack direction="row" spacing={1.5} alignItems="flex-start">
                        <EmojiEventsIcon sx={{ color: "#d97706", mt: 0.25 }} />
                        <Box>
                          <Typography fontWeight={900}>{achievement.title}</Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                            {achievement.description}
                          </Typography>
                        </Box>
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              </Paper>
            )}

            {rewardRun.mission.learnedItems.length > 0 && (
              <Paper elevation={0} sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 3, border: "1px solid #dbe3ef", bgcolor: "rgba(255,255,255,0.9)" }}>
                <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mb: 2 }}>
                  <CheckCircleIcon sx={{ color: "#16a34a" }} />
                  <Typography variant="h6" fontWeight={900}>できるようになったこと</Typography>
                </Stack>
                <Stack spacing={1}>
                  {rewardRun.mission.learnedItems.map((item) => (
                    <LearnedItem key={item}>{item}</LearnedItem>
                  ))}
                </Stack>
              </Paper>
            )}

            {rewardRun.unlockedChallenges.length > 0 && (
              <Alert severity="info">
                新しい Challenge Mission: {rewardRun.unlockedChallenges.map((challenge) => challenge.title).join("、")}
              </Alert>
            )}

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <Button fullWidth variant="outlined" size="large" startIcon={<RouteIcon />} onClick={goRoadmap} sx={{ minHeight: 52, fontWeight: 900, borderRadius: 2, bgcolor: "rgba(255,255,255,0.72)" }}>
                ミッションロードマップへ
              </Button>
              <Button fullWidth variant="contained" size="large" endIcon={<PlayArrowIcon />} disabled={!rewardRun.nextMission} onClick={goNextMission} sx={{ minHeight: 52, fontWeight: 900, borderRadius: 2, boxShadow: "0 18px 38px rgba(37, 99, 235, 0.25)" }}>
                {rewardRun.nextMission ? "次のミッションへ" : "基礎ルート完了"}
              </Button>
            </Stack>
          </Stack>
        )}
      </RewardPageShell>
    </Box>
  );
}
