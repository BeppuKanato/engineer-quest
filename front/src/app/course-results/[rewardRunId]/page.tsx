"use client";

import AccessTimeFilledIcon from "@mui/icons-material/AccessTimeFilled";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import FlagIcon from "@mui/icons-material/Flag";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import ReplayIcon from "@mui/icons-material/Replay";
import SendIcon from "@mui/icons-material/Send";
import StarIcon from "@mui/icons-material/Star";
import TrackChangesIcon from "@mui/icons-material/TrackChanges";
import VisibilityIcon from "@mui/icons-material/Visibility";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import { onAuthStateChanged } from "firebase/auth";
import { motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

import {
  getCourseResult,
  getCourseResultFeedback,
  recordCourseResultEvent,
  startCourseResultFeedback,
  type CourseResultActionType,
  type CourseResultEventType,
  type CourseResultFeedbackResponse,
  type CourseResultResponse,
} from "@/api/courseResults.api";
import { AppHeader } from "@/app/component/appHeader";
import { getMascotImagePath, useUserMascot } from "@/app/component/mascot";
import { PageTransitionOverlay } from "@/app/component/pageTransitionOverlay";
import { useSoundEffect } from "@/app/component/soundFeedback";
import { useAchievementNotificationMode } from "@/hooks/useAchievementNotificationMode";
import { useNavigationFeedback } from "@/hooks/useNavigationFeedback";
import { auth } from "@/lib/firebase";
import { startCourseExamAttempt } from "@/api/mission.api";

import {
  AchievementUnlockModal,
  AchievementUnlockSnackbar,
} from "../../mission-rewards/_components/achievementNotification";
import { RewardPageShell, RewardSparkles } from "../../mission-rewards/_components/rewardVisuals";

const FEEDBACK_POLL_INTERVAL_MS = 1_000;
const ACHIEVEMENT_SNACKBAR_DELAY_MS = 700;

const formatDuration = (seconds: number) => {
  const safeSeconds = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return minutes > 0
    ? `${minutes}分${remainingSeconds.toString().padStart(2, "0")}秒`
    : `${remainingSeconds}秒`;
};

const actionRouteMap: Record<
  Exclude<CourseResultActionType, "RETRY_COURSE_EXAM" | "NO_APP_ACTION">,
  string
> = {
  SOLVE_PRACTICE_PROBLEM: "/courses",
  CREATE_LEARNING_MEMO: "/quest-board/new?category=MEMO",
  CREATE_QUESTION_POST: "/quest-board/new?category=QUESTION",
  CREATE_ERROR_HELP_POST: "/quest-board/new?category=ERROR_HELP",
  CREATE_WORK_POST: "/quest-board/new?category=WORK_SHARE",
  VIEW_BOARD_POSTS: "/quest-board",
  ANSWER_BOARD_POST: "/quest-board",
  REVIEW_KNOWLEDGE_CARDS: "/knowledge-cards",
  VIEW_ACHIEVEMENTS: "/achievements",
  SET_TARGET_ACHIEVEMENT: "/achievements",
  USE_BADGE_TICKET: "/badges",
  VIEW_BADGE_COLLECTION: "/badges",
  SET_PROFILE_BADGE: "/profile",
  VIEW_PROFILE: "/profile",
};

const resolveActionRoute = (
  actionType: CourseResultActionType,
  fallbackMissionId: string
) => {
  if (actionType === "RETRY_COURSE_EXAM") {
    return `/mission/${encodeURIComponent(fallbackMissionId)}/play?review=1`;
  }
  if (actionType === "NO_APP_ACTION") return null;
  return actionRouteMap[actionType];
};

export default function CourseCompletionResultPage() {
  const params = useParams<{ rewardRunId: string }>();
  const rewardRunId = params.rewardRunId;
  const router = useRouter();
  const mascotId = useUserMascot();
  const { play } = useSoundEffect();
  const {
    mode: achievementNotificationMode,
    isReady: isAchievementNotificationModeReady,
  } = useAchievementNotificationMode();
  const { showOverlay, startNavigation } = useNavigationFeedback();
  const [token, setToken] = useState<string | null>(null);
  const [result, setResult] = useState<CourseResultResponse | null>(null);
  const [feedback, setFeedback] = useState<CourseResultFeedbackResponse | null>(null);
  const [isFeedbackVisible, setIsFeedbackVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [retryError, setRetryError] = useState<string | null>(null);
  const [isStartingRetry, setIsStartingRetry] = useState(false);
  const [notificationType, setNotificationType] = useState<"modal" | "snackbar" | null>(null);
  const [activeAchievementIndex, setActiveAchievementIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalClosing, setIsModalClosing] = useState(false);
  const [visibleSnackbarAchievementIds, setVisibleSnackbarAchievementIds] = useState<string[]>([]);
  const loggedEventsRef = useRef(new Set<string>());
  const notificationInitializedRef = useRef(false);
  const snackbarTimeoutRef = useRef<number | null>(null);
  const sessionIdRef = useRef(`course-result-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const feedbackRegionRef = useRef<HTMLDivElement | null>(null);
  const feedbackInViewRef = useRef(false);
  const feedbackVisibleMsRef = useRef(0);

  const logEvent = useCallback(
    (eventType: CourseResultEventType, durationMs?: number) => {
      if (!token) return;
      const eventId = `${sessionIdRef.current}:${eventType}`;
      if (loggedEventsRef.current.has(eventId)) return;
      loggedEventsRef.current.add(eventId);
      void recordCourseResultEvent(token, rewardRunId, {
        eventId,
        eventType,
        occurredAt: new Date().toISOString(),
        ...(typeof durationMs === "number" ? { durationMs } : {}),
      }).catch((error) => {
        console.error("Failed to record course result event:", error);
      });
    },
    [rewardRunId, token]
  );

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
        const idToken = await user.getIdToken();
        const data = await getCourseResult(idToken, rewardRunId);
        if (!isMounted) return;
        setToken(idToken);
        setResult(data);
        setErrorMessage(null);
      } catch (error) {
        console.error("Failed to load course result:", error);
        if (isMounted) setErrorMessage("コース完了結果を読み込めませんでした。");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    });
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [rewardRunId]);

  useEffect(() => {
    if (!result || !token) return;
    logEvent("COURSE_RESULT_VIEWED");
  }, [logEvent, result, token]);

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
      !result ||
      !isAchievementNotificationModeReady ||
      notificationInitializedRef.current
    ) {
      return;
    }
    notificationInitializedRef.current = true;

    if (result.unlockedAchievements.length === 0) {
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
    result,
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
        result?.unlockedAchievements.map((achievement) => achievement.id) ?? []
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
  }, [notificationType, playAchievementSoundOnce, result]);

  const handleModalNext = () => {
    if (!result || isModalClosing) return;
    if (activeAchievementIndex < result.unlockedAchievements.length - 1) {
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

  const requestFeedback = useCallback(async () => {
    if (!token) return;
    setFeedbackError(null);
    try {
      const nextFeedback = await startCourseResultFeedback(token, rewardRunId);
      setFeedback(nextFeedback);
    } catch (error) {
      console.error("Failed to start course feedback:", error);
      setFeedback({
        status: "FAILED",
        source: "GENERATED",
        requestedAt: new Date().toISOString(),
        completedAt: null,
        feedback: null,
      });
      setFeedbackError("フィードバックを生成できませんでした。再試行できます。");
    }
  }, [rewardRunId, token]);

  useEffect(() => {
    if (!token || feedback) return;
    void requestFeedback();
  }, [feedback, requestFeedback, token]);

  useEffect(() => {
    if (!token || feedback?.status !== "GENERATING") return;
    const timer = window.setInterval(async () => {
      if (document.visibilityState === "hidden") return;
      try {
        const nextFeedback = await getCourseResultFeedback(token, rewardRunId);
        setFeedback(nextFeedback);
        if (nextFeedback.status === "FAILED") {
          setFeedbackError("フィードバックを生成できませんでした。再試行できます。");
        }
      } catch (error) {
        console.error("Failed to poll course feedback:", error);
        setFeedbackError("フィードバックの状態を確認できませんでした。再試行できます。");
        setFeedback((current) => current ? { ...current, status: "FAILED" } : current);
      }
    }, FEEDBACK_POLL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [feedback?.status, rewardRunId, token]);

  useEffect(() => {
    if (feedback?.status === "COMPLETED") {
      logEvent("FEEDBACK_GENERATION_COMPLETED");
    }
  }, [feedback?.status, logEvent]);

  useEffect(() => {
    if (!isFeedbackVisible || !feedbackRegionRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        feedbackInViewRef.current = entry.isIntersecting && entry.intersectionRatio >= 0.25;
      },
      { threshold: [0.25] }
    );
    observer.observe(feedbackRegionRef.current);
    return () => observer.disconnect();
  }, [isFeedbackVisible]);

  useEffect(() => {
    if (!isFeedbackVisible) return;
    const timer = window.setInterval(() => {
      if (
        document.visibilityState === "visible" &&
        document.hasFocus() &&
        feedbackInViewRef.current
      ) {
        feedbackVisibleMsRef.current += 250;
      }
    }, 250);
    return () => window.clearInterval(timer);
  }, [isFeedbackVisible]);

  useEffect(() => {
    const handlePageHide = () => {
      if (isFeedbackVisible) {
        logEvent("FEEDBACK_VIEW_DURATION", feedbackVisibleMsRef.current);
      }
      logEvent("COURSE_RESULT_LEFT");
    };
    window.addEventListener("pagehide", handlePageHide);
    return () => window.removeEventListener("pagehide", handlePageHide);
  }, [isFeedbackVisible, logEvent]);

  const showFeedback = () => {
    if (!feedback?.feedback) return;
    logEvent("FEEDBACK_VIEW_CLICKED");
    logEvent("FEEDBACK_VIEW_STARTED");
    logEvent("NEXT_ACTION_SHOWN");
    feedbackVisibleMsRef.current = 0;
    setIsFeedbackVisible(true);
  };

  const navigate = (path: string, isPrimaryAction = false) => {
    if (isFeedbackVisible) {
      logEvent("FEEDBACK_VIEW_DURATION", feedbackVisibleMsRef.current);
    }
    if (isPrimaryAction) logEvent("NEXT_ACTION_CLICKED");
    logEvent("COURSE_RESULT_LEFT");
    startNavigation(() => router.push(path));
  };

  const handleStartRetry = async (targetMissionId?: string) => {
    if (!token || !result || isStartingRetry) return;

    const missionId = targetMissionId ?? result.mission.id;
    try {
      setIsStartingRetry(true);
      setRetryError(null);
      await startCourseExamAttempt(token, missionId);
      navigate(`/mission/${encodeURIComponent(missionId)}/play`, true);
    } catch (error) {
      console.error("Failed to start COURSE_EXAM retry:", error);
      setRetryError("再挑戦を開始できませんでした。時間をおいて再度お試しください。");
      setIsStartingRetry(false);
    }
  };

  const primaryAction =
    feedback?.feedback && feedback.feedback.actionType !== "NO_APP_ACTION"
      ? {
          type: feedback.feedback.actionType,
          label: feedback.feedback.actionLabel,
        }
      : null;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#eef4fb" }}>
      <AppHeader />
      <PageTransitionOverlay open={showOverlay} message="次の画面を準備しています..." />
      <RewardPageShell maxWidth={1160}>
        {isLoading ? (
          <Skeleton variant="rounded" height={780} sx={{ borderRadius: 5 }} />
        ) : !result ? (
          <Alert severity="error">{errorMessage ?? "コース完了結果がありません。"}</Alert>
        ) : (
          <Paper
            component={motion.section}
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            elevation={0}
            sx={{
              position: "relative",
              overflow: "hidden",
              borderRadius: { xs: 3, md: 5 },
              border: "1px solid rgba(191, 219, 254, 0.95)",
              bgcolor: "rgba(255,255,255,0.94)",
              p: { xs: 2, sm: 3, md: 4 },
              boxShadow: "0 32px 90px rgba(37, 99, 235, 0.16)",
            }}
          >
            <RewardSparkles />
            <Box sx={{ position: "relative", zIndex: 1 }}>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "180px minmax(0, 1fr) 180px" },
                  alignItems: "center",
                  gap: 2,
                  mb: 3,
                }}
              >
                <Stack direction={{ xs: "row", md: "column" }} spacing={1} alignItems="center" justifyContent="center">
                  <Box
                    component="img"
                    src={getMascotImagePath(mascotId, "celebrate")}
                    alt="コース完了を祝うマスコット"
                    sx={{ width: { xs: 90, md: 132 }, height: { xs: 90, md: 132 }, objectFit: "contain" }}
                  />
                  <Paper elevation={0} sx={{ p: 1.25, border: "1px solid #dbeafe", borderRadius: 2, bgcolor: "#fff", fontWeight: 900, fontSize: 13 }}>
                    よくがんばったね！<br />次の挑戦も楽しみだよ！
                  </Paper>
                </Stack>
                <Stack alignItems="center" textAlign="center" spacing={1}>
                  <Chip icon={<StarIcon />} label="Course Summary" sx={{ fontWeight: 900, color: "#1d4ed8", bgcolor: "#eff6ff", border: "1px solid #bfdbfe", "& .MuiChip-icon": { color: "inherit" } }} />
                  <Typography component="h1" sx={{ fontSize: { xs: 38, md: 52 }, lineHeight: 1.1, fontWeight: 950, color: "#071b4d" }}>
                    コース完了！
                  </Typography>
                  <Typography sx={{ fontSize: { xs: 20, md: 25 }, fontWeight: 950, color: "#0756c9" }}>
                    {result.presentation.masteryTitle}
                  </Typography>
                  <Typography color="#475569" fontWeight={700}>{result.presentation.description}</Typography>
                </Stack>
                <Box sx={{ display: { xs: "none", md: "block" } }} />
              </Box>

              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }, gap: 1.5, mb: 2.5 }}>
                <MetricCard icon={<StarIcon />} label="獲得EXP" value={`+${result.rewards.experience}`} tone="blue" />
                <MetricCard icon={<ConfirmationNumberIcon />} label="Badge Ticket" value={`+${result.rewards.badgeTickets}`} tone="green" />
                <MetricCard icon={<EmojiEventsIcon />} label="解除実績" value={`${result.rewards.unlockedAchievementCount}件`} tone="orange" />
                <MetricCard icon={<FlagIcon />} label="コース完了" value={result.course.title.replace("の動きを理解する", "")} tone="purple" />
              </Box>

              {!isFeedbackVisible ? (
                <Stack spacing={2}>
                  <Paper elevation={0} sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 3, border: "1px solid #bfdbfe", bgcolor: "rgba(248,251,255,0.9)" }}>
                    <Typography color="#0756c9" fontWeight={950} sx={{ mb: 1.5 }}>今回の挑戦サマリー</Typography>
                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }, gap: 1.25 }}>
                      <SummaryItem icon={<CheckCircleIcon />} label="テストケース" value={`${result.summary.passedTests} / ${result.summary.totalTests} 成功`} color="#16a34a" />
                      <SummaryItem icon={<SendIcon />} label="提出回数" value={`${result.summary.submissionCount}回`} color="#2563eb" />
                      <SummaryItem icon={<LightbulbIcon />} label="ヒント利用" value={`${result.summary.hintUsageCount}回`} color="#f59e0b" />
                      <SummaryItem icon={<AccessTimeFilledIcon />} label="所要時間" value={formatDuration(result.summary.durationSeconds)} color="#7c3aed" />
                    </Box>
                  </Paper>

                  <Paper elevation={0} sx={{ px: 2.5, py: 1.75, borderRadius: 3, border: "1px solid #bbf7d0", bgcolor: "#f0fdf4" }}>
                    <Stack direction="row" spacing={1.25} alignItems="center">
                      <CheckCircleIcon sx={{ color: "#16a34a" }} />
                      <Box>
                        <Typography color="#15803d" fontWeight={950}>できるようになったこと</Typography>
                        <Typography fontWeight={900} sx={{ mt: 0.35 }}>{result.presentation.learningOutcome}</Typography>
                      </Box>
                    </Stack>
                  </Paper>

                  <FeedbackStatusCard feedback={feedback} errorMessage={feedbackError} onShow={showFeedback} onRetry={() => void requestFeedback()} />
                  {retryError && <Alert severity="error">{retryError}</Alert>}
                  <Stack direction={{ xs: "column", sm: "row" }} justifyContent="center">
                    <Button
                      variant="contained"
                      startIcon={isStartingRetry ? <CircularProgress size={18} color="inherit" /> : <ReplayIcon />}
                      disabled={isStartingRetry}
                      onClick={() => void handleStartRetry()}
                      sx={{ minHeight: 50, px: 5, fontWeight: 950, mr: { sm: 1.5 } }}
                    >
                      {isStartingRetry ? "再挑戦を準備中..." : "もう一度挑戦する"}
                    </Button>
                    <Button variant="outlined" startIcon={<FormatListBulletedIcon />} onClick={() => navigate("/courses")} sx={{ minHeight: 50, px: 5, fontWeight: 900 }}>
                      コース一覧へ
                    </Button>
                  </Stack>
                </Stack>
              ) : feedback?.feedback ? (
                <Stack ref={feedbackRegionRef} spacing={2.5}>
                  <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} gap={1}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <AutoAwesomeIcon sx={{ color: "#7c3aed" }} />
                      <Typography component="h2" variant="h5" fontWeight={950} color="#312e81">あなたへのフィードバック</Typography>
                    </Stack>
                    <Chip icon={<VisibilityIcon />} label="フィードバック表示中" sx={{ fontWeight: 900, color: "#6d28d9", bgcolor: "#f5f3ff" }} />
                  </Stack>
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 1.5 }}>
                    <FeedbackCard number="1" title="現在の状態" body={feedback.feedback.currentState} icon={<TrackChangesIcon />} color="#2563eb" bgcolor="#eff6ff" />
                    <FeedbackCard number="2" title="次の目標" body={feedback.feedback.nextGoal} icon={<FlagIcon />} color="#059669" bgcolor="#ecfdf5" />
                    <FeedbackCard number="3" title="次の一歩" body={feedback.feedback.nextStep} icon={<NavigateNextIcon />} color="#7c3aed" bgcolor="#f5f3ff" />
                  </Box>
                  <Typography textAlign="center" fontWeight={900} color="#334155">
                    フィードバックを確認しました。次の学習へ進みましょう。
                  </Typography>
                  <Stack direction={{ xs: "column", sm: "row" }} justifyContent="center" spacing={1.5}>
                    {primaryAction && (
                      <Button
                        variant="contained"
                        size="large"
                        startIcon={isStartingRetry ? <CircularProgress size={18} color="inherit" /> : <ReplayIcon />}
                        disabled={isStartingRetry}
                        onClick={() =>
                          primaryAction.type === "RETRY_COURSE_EXAM"
                            ? void handleStartRetry()
                            : (() => {
                                const route = resolveActionRoute(
                                  primaryAction.type,
                                  result.mission.id
                                );
                                if (route) navigate(route, true);
                              })()
                        }
                        sx={{ minHeight: 54, px: 7, fontWeight: 950 }}
                      >
                        {isStartingRetry && primaryAction.type === "RETRY_COURSE_EXAM"
                          ? "再挑戦を準備中..."
                          : primaryAction.label}
                      </Button>
                    )}
                    <Button variant="outlined" size="large" startIcon={<FormatListBulletedIcon />} onClick={() => navigate("/courses")} sx={{ minHeight: 54, px: 6, fontWeight: 900 }}>
                      コース一覧へ
                    </Button>
                  </Stack>
                </Stack>
              ) : null}
            </Box>
          </Paper>
        )}
      </RewardPageShell>
      <AchievementUnlockModal
        open={isModalOpen}
        achievement={result?.unlockedAchievements[activeAchievementIndex] ?? null}
        currentIndex={activeAchievementIndex}
        total={result?.unlockedAchievements.length ?? 0}
        mascotId={mascotId}
        isClosing={isModalClosing}
        onNext={handleModalNext}
      />
      <AchievementUnlockSnackbar
        achievements={result?.unlockedAchievements ?? []}
        visibleAchievementIds={visibleSnackbarAchievementIds}
        onClose={handleSnackbarClose}
      />
    </Box>
  );
}

function MetricCard({ icon, label, value, tone }: { icon: ReactNode; label: string; value: string; tone: "blue" | "green" | "orange" | "purple" }) {
  const styles = {
    blue: { color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
    green: { color: "#059669", bg: "#ecfdf5", border: "#bbf7d0" },
    orange: { color: "#ea580c", bg: "#fff7ed", border: "#fed7aa" },
    purple: { color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
  }[tone];
  return (
    <Paper elevation={0} sx={{ p: 1.75, borderRadius: 3, border: `1px solid ${styles.border}`, bgcolor: "#fff" }}>
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Box sx={{ width: 48, height: 48, display: "grid", placeItems: "center", borderRadius: 2, color: styles.color, bgcolor: styles.bg }}>{icon}</Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography fontSize={13} fontWeight={900} color="#475569">{label}</Typography>
          <Typography fontSize={22} lineHeight={1.2} fontWeight={950} color={styles.color} noWrap>{value}</Typography>
        </Box>
      </Stack>
    </Paper>
  );
}

function SummaryItem({ icon, label, value, color }: { icon: ReactNode; label: string; value: string; color: string }) {
  return (
    <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2.5, border: "1px solid #dbeafe", bgcolor: "#fff" }}>
      <Stack direction="row" spacing={1.25} alignItems="center">
        <Box sx={{ width: 40, height: 40, display: "grid", placeItems: "center", borderRadius: "50%", bgcolor: `${color}18`, color }}>{icon}</Box>
        <Box>
          <Typography fontSize={12} color="#64748b" fontWeight={900}>{label}</Typography>
          <Typography fontSize={20} color={color} fontWeight={950}>{value}</Typography>
        </Box>
      </Stack>
    </Paper>
  );
}

function FeedbackStatusCard({ feedback, errorMessage, onShow, onRetry }: { feedback: CourseResultFeedbackResponse | null; errorMessage: string | null; onShow: () => void; onRetry: () => void }) {
  const isPending = !feedback || feedback.status === "GENERATING";
  const isCompleted = feedback?.status === "COMPLETED" && Boolean(feedback.feedback);
  return (
    <Paper elevation={0} sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 3, border: "1px solid #ddd6fe", bgcolor: "#faf8ff" }} aria-live="polite">
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "stretch", md: "center" }} justifyContent="space-between">
        <Stack direction="row" spacing={2} alignItems="center">
          <Box sx={{ width: 58, height: 58, display: "grid", placeItems: "center", borderRadius: "50%", color: "#7c3aed", bgcolor: "#ede9fe", flexShrink: 0 }}>
            {isPending ? <CircularProgress size={34} color="inherit" /> : <AutoAwesomeIcon sx={{ fontSize: 34 }} />}
          </Box>
          <Box>
            <Typography color="#6d28d9" fontWeight={950}>AIフィードバック</Typography>
            <Typography variant="h6" fontWeight={950} sx={{ mt: 0.25 }}>
              {isPending ? "あなた向けのフィードバックを作成しています…" : isCompleted ? "フィードバックが届きました！" : "フィードバックを生成できませんでした"}
            </Typography>
            <Typography color="#64748b" fontSize={14} sx={{ mt: 0.35 }}>
              {isPending ? "今回のコード、テスト結果、提出回数、ヒント利用状況を整理しています。" : isCompleted ? "今回の取り組みと、次に目指す状態を確認しましょう。" : errorMessage}
            </Typography>
          </Box>
        </Stack>
        {isCompleted ? (
          <Button variant="contained" size="large" endIcon={<NavigateNextIcon />} onClick={onShow} sx={{ minHeight: 50, px: 4, fontWeight: 950, flexShrink: 0 }}>
            フィードバックを見る
          </Button>
        ) : feedback?.status === "FAILED" ? (
          <Button variant="outlined" startIcon={<ReplayIcon />} onClick={onRetry} sx={{ minHeight: 48, fontWeight: 900, flexShrink: 0 }}>
            生成を再試行
          </Button>
        ) : null}
      </Stack>
    </Paper>
  );
}

function FeedbackCard({ number, title, body, icon, color, bgcolor }: { number: string; title: string; body: string; icon: ReactNode; color: string; bgcolor: string }) {
  return (
    <Paper component={motion.section} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} elevation={0} sx={{ p: 2.25, borderRadius: 3, border: `1px solid ${color}33`, bgcolor, minHeight: { md: 260 } }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Box sx={{ width: 34, height: 34, display: "grid", placeItems: "center", borderRadius: "50%", bgcolor: color, color: "#fff", fontWeight: 950 }}>{number}</Box>
          <Typography component="h3" fontSize={19} color={color} fontWeight={950}>{title}</Typography>
        </Stack>
        <Box sx={{ color, opacity: 0.55 }}>{icon}</Box>
      </Stack>
      <Box sx={{ borderTop: `2px solid ${color}55`, pt: 1.75 }}>
        <Typography color="#334155" sx={{ lineHeight: 1.85, fontWeight: 700 }}>{body}</Typography>
      </Box>
    </Paper>
  );
}
