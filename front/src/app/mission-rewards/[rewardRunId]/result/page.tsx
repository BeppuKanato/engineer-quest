"use client";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import RouteIcon from "@mui/icons-material/Route";
import SecurityIcon from "@mui/icons-material/Security";
import StarIcon from "@mui/icons-material/Star";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import { Alert, Box, Button, Chip, Paper, Skeleton, Stack, Typography } from "@mui/material";
import { onAuthStateChanged } from "firebase/auth";
import { motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

import { getMissionRewardRun, type MissionRewardRunResponse } from "@/api/missionRewards.api";
import { AppHeader } from "@/app/component/appHeader";
import { AppBreadcrumbs } from "@/app/component/appBreadcrumbs";
import { getMascotImagePath, useUserMascot } from "@/app/component/mascot";
import { PageTransitionOverlay } from "@/app/component/pageTransitionOverlay";
import { useSoundEffect } from "@/app/component/soundFeedback";
import { useAchievementNotificationMode } from "@/hooks/useAchievementNotificationMode";
import { useNavigationFeedback } from "@/hooks/useNavigationFeedback";
import { auth } from "@/lib/firebase";

import {
  RewardPageShell,
  RewardSparkles,
  getRarityTone,
} from "../../_components/rewardVisuals";
import {
  AchievementUnlockModal,
  AchievementUnlockSnackbar,
} from "../../_components/achievementNotification";

const learnedIcons = [StarIcon, SecurityIcon, TrendingUpIcon];
const ACHIEVEMENT_SNACKBAR_DELAY_MS = 700;

export default function MissionRewardResultPage() {
  const params = useParams<{ rewardRunId: string }>();
  const rewardRunId = params.rewardRunId;
  const router = useRouter();
  const { play } = useSoundEffect();
  const {
    mode: achievementNotificationMode,
    isReady: isAchievementNotificationModeReady,
  } = useAchievementNotificationMode();
  const mascotId = useUserMascot();
  const { showOverlay, startNavigation } = useNavigationFeedback();
  const [rewardRun, setRewardRun] = useState<MissionRewardRunResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notificationType, setNotificationType] = useState<
    "modal" | "snackbar" | null
  >(null);
  const [activeAchievementIndex, setActiveAchievementIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalClosing, setIsModalClosing] = useState(false);
  const [visibleSnackbarAchievementIds, setVisibleSnackbarAchievementIds] =
    useState<string[]>([]);
  const notificationInitializedRef = useRef(false);
  const snackbarTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    notificationInitializedRef.current = false;
    setRewardRun(null);
    setNotificationType(null);
    setActiveAchievementIndex(0);
    setIsModalOpen(false);
    setIsModalClosing(false);
    setVisibleSnackbarAchievementIds([]);
  }, [rewardRunId]);

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
        if (data.mission.isCourseCompletion) {
          router.replace(`/course-results/${encodeURIComponent(rewardRunId)}`);
          return;
        }
        setRewardRun(data);
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
  }, [play, rewardRunId, router]);

  const playResultFanfareOnce = useCallback(() => {
    const soundKey = `mission-completed-sound:${rewardRunId}`;
    if (window.sessionStorage.getItem(soundKey) === "played") return;
    window.sessionStorage.setItem(soundKey, "played");
    play("missionCompleted");
  }, [play, rewardRunId]);

  const playAchievementSoundOnce = useCallback(() => {
    const soundKey = `achievement-unlocked-sound:${rewardRunId}`;
    if (window.sessionStorage.getItem(soundKey) === "played") return;
    window.sessionStorage.setItem(soundKey, "played");
    play("achievementUnlocked");
  }, [play, rewardRunId]);

  useEffect(() => {
    if (
      !rewardRun ||
      !isAchievementNotificationModeReady ||
      notificationInitializedRef.current
    ) {
      return;
    }
    notificationInitializedRef.current = true;

    if (rewardRun.unlockedAchievements.length === 0) {
      playResultFanfareOnce();
      return;
    }

    const notificationKey = `achievement-notification-shown:${rewardRunId}`;
    if (window.sessionStorage.getItem(notificationKey) === "shown") {
      playResultFanfareOnce();
      return;
    }
    window.sessionStorage.setItem(notificationKey, "shown");

    if (achievementNotificationMode === "modal") {
      setNotificationType("modal");
      setIsModalOpen(true);
      return;
    }

    playResultFanfareOnce();
    if (achievementNotificationMode === "snackbar") {
      setNotificationType("snackbar");
    }
  }, [
    achievementNotificationMode,
    isAchievementNotificationModeReady,
    playResultFanfareOnce,
    rewardRun,
    rewardRunId,
  ]);

  useEffect(() => {
    if (notificationType !== "modal" || !isModalOpen) return;
    playAchievementSoundOnce();
  }, [isModalOpen, notificationType, playAchievementSoundOnce]);

  useEffect(() => {
    if (notificationType !== "snackbar") return;

    snackbarTimeoutRef.current = window.setTimeout(() => {
      setVisibleSnackbarAchievementIds(
        rewardRun?.unlockedAchievements.map((achievement) => achievement.id) ?? []
      );
      playAchievementSoundOnce();
      snackbarTimeoutRef.current = null;
    }, ACHIEVEMENT_SNACKBAR_DELAY_MS);

    return () => {
      if (snackbarTimeoutRef.current !== null) {
        window.clearTimeout(snackbarTimeoutRef.current);
        snackbarTimeoutRef.current = null;
      }
    };
  }, [notificationType, playAchievementSoundOnce, rewardRun]);

  useEffect(
    () => () => {
      if (snackbarTimeoutRef.current !== null) {
        window.clearTimeout(snackbarTimeoutRef.current);
      }
    },
    []
  );

  const handleModalNext = () => {
    if (!rewardRun || isModalClosing) return;
    if (activeAchievementIndex < rewardRun.unlockedAchievements.length - 1) {
      setActiveAchievementIndex((current) => current + 1);
      return;
    }

    setIsModalClosing(true);
    setIsModalOpen(false);
    playResultFanfareOnce();
  };

  const handleSnackbarClose = useCallback((achievementId: string) => {
    setVisibleSnackbarAchievementIds((current) =>
      current.filter((id) => id !== achievementId)
    );
  }, []);

  const goNextMission = () => {
    if (!rewardRun) return;
    startNavigation(() => {
      if (rewardRun.nextMission) {
        router.push(`/mission/${encodeURIComponent(rewardRun.nextMission.id)}/play`);
        return;
      }

      router.push(`/courses/roadmap/${encodeURIComponent(rewardRun.mission.courseId)}`);
    });
  };

  const goRoadmap = () => {
    if (!rewardRun) return;
    startNavigation(() => {
      router.push(`/courses/roadmap/${encodeURIComponent(rewardRun.mission.courseId)}`);
    });
  };

  const goAchievements = () => {
    startNavigation(() => {
      const unlockedIds = rewardRun?.unlockedAchievements.map((achievement) => achievement.id) ?? [];
      const query = unlockedIds.length > 0 ? `?new=${encodeURIComponent(unlockedIds.join(","))}` : "";
      router.push(`/achievements${query}`);
    });
  };

  const selectedCardTone = rewardRun?.selectedKnowledgeCard
    ? getRarityTone(rewardRun.selectedKnowledgeCard.rarity)
    : null;
  const nextActionLabel = rewardRun?.nextMission
    ? `次は「${rewardRun.nextMission.title}」に進めます。`
    : "このコースの到達済み内容をロードマップで確認できます。";

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#eef4fb" }}>
      <AppHeader />
      <PageTransitionOverlay open={showOverlay} message="次の画面を準備しています..." />
      <RewardPageShell maxWidth={1320}>
        <Box sx={{ mb: 2 }}>
          <AppBreadcrumbs
            items={[
              { label: "コース", href: "/courses" },
              { label: "ミッション結果" },
            ]}
          />
        </Box>
        {isLoading ? (
          <Skeleton variant="rounded" height={720} sx={{ borderRadius: 4 }} />
        ) : !rewardRun ? (
          <Alert severity="error">{errorMessage ?? "報酬データがありません。"}</Alert>
        ) : (
          <Paper
            component={motion.section}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            elevation={0}
            sx={{
              position: "relative",
              overflow: "hidden",
              borderRadius: 5,
              border: "1px solid rgba(191, 219, 254, 0.95)",
              bgcolor: "rgba(255,255,255,0.9)",
              px: { xs: 2, md: 5 },
              py: { xs: 3, md: 4 },
              boxShadow: "0 30px 90px rgba(37, 99, 235, 0.16)",
            }}
          >
            <RewardSparkles />

            <Box sx={{ position: "relative", zIndex: 1 }}>
              <Box sx={{ position: "relative", minHeight: { xs: 0, md: 170 }, mb: 2 }}>
                <Box
                  component="img"
                  src={getMascotImagePath(mascotId, "happy")}
                  alt="ミッション完了を祝うマスコット"
                  sx={{
                    position: { xs: "static", md: "absolute" },
                    left: { md: 0 },
                    top: { md: 8 },
                    display: "block",
                    width: { xs: 110, md: 170 },
                    height: { xs: 110, md: 170 },
                    objectFit: "contain",
                    mx: { xs: "auto", md: 0 },
                  }}
                />
                <Paper
                  elevation={0}
                  sx={{
                    position: { xs: "static", md: "absolute" },
                    left: { md: 160 },
                    top: { md: 20 },
                    mt: { xs: 1, md: 0 },
                    mx: { xs: "auto", md: 0 },
                    width: "fit-content",
                    maxWidth: 260,
                    px: 2,
                    py: 1.3,
                    borderRadius: 2,
                    border: "1px solid #dbe3ef",
                    bgcolor: "rgba(255,255,255,0.96)",
                    fontWeight: 900,
                    lineHeight: 1.7,
                  }}
                >
                  おつかれさま！<br />今回もよく頑張ったね！
                </Paper>

                <Stack spacing={1.3} alignItems="center" textAlign="center" sx={{ px: { md: 24 } }}>
                  <Chip
                    icon={<StarIcon />}
                    label="Reward Summary"
                    sx={{
                      fontWeight: 900,
                      color: "#1d4ed8",
                      bgcolor: "#dbeafe",
                      border: "1px solid #bfdbfe",
                      "& .MuiChip-icon": { color: "inherit" },
                    }}
                  />
                  <Typography variant="h2" fontWeight={900} sx={{ color: "#071b4d", fontSize: { xs: 40, md: 64 }, lineHeight: 1.05 }}>
                    ミッション完了！
                  </Typography>
                  <Typography color="text.secondary" sx={{ fontWeight: 800, lineHeight: 1.8 }}>
                    {rewardRun.mission.title} の報酬と、今回できるようになったことを確認します。
                  </Typography>
                </Stack>
              </Box>

              <Paper
                elevation={0}
                sx={{
                  mb: 3,
                  p: { xs: 2, md: 2.5 },
                  borderRadius: 3,
                  border: "1px solid #bfdbfe",
                  bgcolor: "rgba(239, 246, 255, 0.92)",
                }}
              >
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  spacing={2}
                  justifyContent="space-between"
                  alignItems={{ xs: "flex-start", md: "center" }}
                >
                  <Box>
                    <Typography variant="h6" fontWeight={900} color="#0f172a">
                      今回の成果
                    </Typography>
                    <Typography color="#334155" sx={{ mt: 0.5, lineHeight: 1.7 }}>
                      {rewardRun.mission.learnedItems[0] ??
                        `${rewardRun.mission.title}を完了しました。`}
                      {rewardRun.selectedKnowledgeCard
                        ? ` 知識カード「${rewardRun.selectedKnowledgeCard.title}」もコレクションに追加されています。`
                        : ""}
                    </Typography>
                  </Box>
                  <Chip
                    label={nextActionLabel}
                    color={rewardRun.nextMission ? "primary" : "default"}
                    sx={{ fontWeight: 900, maxWidth: { xs: "100%", md: 360 }, height: "auto", py: 0.8 }}
                  />
                </Stack>
              </Paper>

              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(4, 1fr)" }, gap: 2, mb: 3 }}>
                <ResultSummaryPanel
                  label="獲得EXP"
                  icon={<StarIcon />}
                  value={`+${rewardRun.awardedExp}`}
                  suffix="EXP"
                  tone="blue"
                />
                <ResultSummaryPanel
                  label="Badge Ticket"
                  icon={<ConfirmationNumberIcon />}
                  value={`+${rewardRun.awardedBadgeTickets}`}
                  tone="green"
                />
                <ResultSummaryPanel
                  label="獲得カード"
                  icon={<MenuBookIcon />}
                  value={rewardRun.selectedKnowledgeCard?.title ?? "なし"}
                  suffix={rewardRun.selectedKnowledgeCard?.rarity}
                  tone="purple"
                />
                <ResultSummaryPanel
                  label="解除実績"
                  icon={<EmojiEventsIcon />}
                  value={`${rewardRun.unlockedAchievements.length}`}
                  suffix="件"
                  tone="gold"
                />
              </Box>

              {rewardRun.unlockedAchievements.length > 0 && (
                <Paper elevation={0} sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 3, border: "1px solid #fde68a", bgcolor: "rgba(255, 251, 235, 0.82)", mb: 3 }}>
                  <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mb: 2 }}>
                    <EmojiEventsIcon sx={{ color: "#d97706" }} />
                    <Typography variant="h6" fontWeight={900}>今回解除された実績</Typography>
                  </Stack>
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" }, gap: 1.5 }}>
                    {rewardRun.unlockedAchievements.map((achievement, index) => (
                      <Paper
                        key={achievement.id}
                        component={motion.div}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.28, delay: index * 0.05 }}
                        elevation={0}
                        sx={{ p: 2, borderRadius: 2, bgcolor: "#fff", border: "1px solid #fde68a" }}
                      >
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Box sx={{ width: 56, height: 56, borderRadius: "50%", display: "grid", placeItems: "center", color: "#d97706", bgcolor: "#fff7ed", flexShrink: 0 }}>
                            <EmojiEventsIcon />
                          </Box>
                          <Box>
                            <Typography fontWeight={900}>{achievement.title}</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65 }}>
                              {achievement.description}
                            </Typography>
                          </Box>
                        </Stack>
                      </Paper>
                    ))}
                  </Box>
                  <Button
                    variant="outlined"
                    startIcon={<EmojiEventsIcon />}
                    onClick={goAchievements}
                    sx={{ mt: 2, fontWeight: 900, borderRadius: 2, bgcolor: "#fff" }}
                  >
                    実績一覧で確認する
                  </Button>
                </Paper>
              )}

              {rewardRun.selectedKnowledgeCard && selectedCardTone && (
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: 3,
                    border: `1px solid ${selectedCardTone.border}`,
                    bgcolor: "rgba(255,255,255,0.86)",
                    mb: 3,
                    display: { xs: "block", md: "none" },
                  }}
                >
                  <Chip label="獲得カード" size="small" color="primary" sx={{ fontWeight: 900, mb: 1 }} />
                  <Typography fontWeight={900}>{rewardRun.selectedKnowledgeCard.title}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {rewardRun.selectedKnowledgeCard.description}
                  </Typography>
                </Paper>
              )}

              {rewardRun.mission.learnedItems.length > 0 && (
                <Paper elevation={0} sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 3, border: "1px solid #dbe3ef", bgcolor: "rgba(255,255,255,0.86)", mb: 3 }}>
                  <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mb: 2 }}>
                    <CheckCircleIcon sx={{ color: "#16a34a" }} />
                    <Typography variant="h6" fontWeight={900}>できるようになったこと</Typography>
                  </Stack>
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 1.5 }}>
                    {rewardRun.mission.learnedItems.slice(0, 3).map((item, index) => {
                      const Icon = learnedIcons[index % learnedIcons.length];
                      return (
                        <Paper key={item} elevation={0} sx={{ p: 2, borderRadius: 2, border: "1px solid #dbeafe", bgcolor: "#fff" }}>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Box sx={{ width: 56, height: 56, borderRadius: "50%", display: "grid", placeItems: "center", color: "#1d4ed8", bgcolor: "#dbeafe", flexShrink: 0 }}>
                              <Icon />
                            </Box>
                            <Box>
                              <Stack direction="row" spacing={0.6} alignItems="center">
                                <CheckCircleIcon sx={{ fontSize: 18, color: "#16a34a" }} />
                                <Typography fontWeight={900}>{item}</Typography>
                              </Stack>
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.6 }}>
                                学習した内容を確認できました。
                              </Typography>
                            </Box>
                          </Stack>
                        </Paper>
                      );
                    })}
                  </Box>
                </Paper>
              )}

              {rewardRun.unlockedChallenges.length > 0 && (
                <Alert severity="info" sx={{ mb: 3 }}>
                  新しい挑戦ミッション: {rewardRun.unlockedChallenges.map((challenge) => challenge.title).join("、")}
                </Alert>
              )}

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="center">
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<RouteIcon />}
                  onClick={goRoadmap}
                  sx={{ minHeight: 56, px: 6, fontWeight: 900, borderRadius: 2, bgcolor: "rgba(255,255,255,0.72)" }}
                >
                  ミッションロードマップへ
                </Button>
                <Button
                  variant="contained"
                  size="large"
                  endIcon={rewardRun.nextMission ? <NavigateNextIcon /> : undefined}
                  startIcon={rewardRun.nextMission ? <PlayArrowIcon /> : undefined}
                  onClick={goNextMission}
                  sx={{ minHeight: 56, px: 7, fontWeight: 900, borderRadius: 2, boxShadow: "0 18px 40px rgba(37, 99, 235, 0.28)" }}
                >
                  {rewardRun.nextMission ? "次のミッションへ" : "コース完了"}
                </Button>
              </Stack>
            </Box>
          </Paper>
        )}
      </RewardPageShell>
      <AchievementUnlockModal
        open={isModalOpen}
        achievement={
          rewardRun?.unlockedAchievements[activeAchievementIndex] ?? null
        }
        currentIndex={activeAchievementIndex}
        total={rewardRun?.unlockedAchievements.length ?? 0}
        mascotId={mascotId}
        isClosing={isModalClosing}
        onNext={handleModalNext}
      />
      <AchievementUnlockSnackbar
        achievements={rewardRun?.unlockedAchievements ?? []}
        visibleAchievementIds={visibleSnackbarAchievementIds}
        onClose={handleSnackbarClose}
      />
    </Box>
  );
}

const ResultSummaryPanel = ({
  label,
  icon,
  value,
  suffix,
  tone,
}: {
  label: string;
  icon: ReactNode;
  value: string;
  suffix?: string;
  tone: "blue" | "green" | "purple" | "gold";
}) => {
  const styles = {
    blue: { color: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe" },
    green: { color: "#047857", bg: "#ecfdf5", border: "#bbf7d0" },
    purple: { color: "#6d28d9", bg: "#faf5ff", border: "#e9d5ff" },
    gold: { color: "#b45309", bg: "#fffbeb", border: "#fde68a" },
  }[tone];

  return (
    <Paper
      component={motion.div}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      elevation={0}
      sx={{
        p: 2.5,
        minHeight: 140,
        borderRadius: 3,
        border: `1px solid ${styles.border}`,
        bgcolor: "rgba(255,255,255,0.84)",
        boxShadow: "0 14px 36px rgba(15, 23, 42, 0.07)",
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ height: "100%" }}>
        <Box sx={{ width: 70, height: 70, borderRadius: 2, display: "grid", placeItems: "center", color: styles.color, bgcolor: styles.bg, flexShrink: 0 }}>
          {icon}
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography fontWeight={900} color="#334155">{label}</Typography>
          <Stack direction="row" spacing={1} alignItems="baseline" sx={{ mt: 1 }}>
            <Typography variant={value.length > 8 ? "h5" : "h4"} fontWeight={900} color={styles.color} noWrap>
              {value}
            </Typography>
            {suffix && <Typography fontWeight={900} color="#475569">{suffix}</Typography>}
          </Stack>
        </Box>
      </Stack>
    </Paper>
  );
};
