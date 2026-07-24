"use client";

import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  LinearProgress,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import LockOutlineIcon from "@mui/icons-material/LockOutline";
import ReplayIcon from "@mui/icons-material/Replay";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import RouteIcon from "@mui/icons-material/Route";
import { onAuthStateChanged } from "firebase/auth";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { getMissionOverview } from "@/api/mission.api";
import { AppBreadcrumbs } from "@/app/component/appBreadcrumbs";
import { AppHeader } from "@/app/component/appHeader";
import { DifficultyLabel } from "@/app/component/difficultyLabel";
import { PageTransitionOverlay } from "@/app/component/pageTransitionOverlay";
import { useNavigationFeedback } from "@/hooks/useNavigationFeedback";
import { auth } from "@/lib/firebase";

import type {
  MissionActivity,
  MissionOverviewResponse,
} from "./type";

type SectionGroup = {
  id: string;
  title: string;
  description: string | null;
  activities: MissionActivity[];
  isMissionCheck?: boolean;
};

const MissionOverviewLoadingSkeleton = () => (
  <Container maxWidth="lg" sx={{ py: 4 }}>
    <Stack spacing={3}>
      <Paper
        elevation={0}
        sx={{ p: { xs: 3, md: 4 }, borderRadius: 3, border: "1px solid #e2e8f0" }}
      >
        <Skeleton variant="text" width={130} height={28} />
        <Skeleton variant="text" width="62%" height={64} sx={{ mt: 1 }} />
        <Skeleton variant="text" width="76%" height={28} />
        <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
          {[92, 86, 112, 132].map((width) => (
            <Skeleton key={width} variant="rounded" width={width} height={32} sx={{ borderRadius: 999 }} />
          ))}
        </Stack>
        <Skeleton variant="rounded" height={10} sx={{ mt: 3, borderRadius: 999 }} />
        <Stack direction="row" spacing={1.5} sx={{ mt: 2 }}>
          <Skeleton variant="rounded" width={190} height={48} />
          <Skeleton variant="rounded" width={190} height={48} />
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid #e2e8f0" }}>
        <Skeleton variant="text" width={180} height={42} />
        <Skeleton variant="text" width={340} height={24} />
        <Stack direction="row" spacing={8} sx={{ mt: 3, overflow: "hidden" }}>
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} variant="rounded" width={280} height={300} sx={{ flexShrink: 0, borderRadius: 2 }} />
          ))}
        </Stack>
      </Paper>
    </Stack>
  </Container>
);

const getSectionStatus = (activities: MissionActivity[], completedIds: Set<string>) => {
  const completedCount = activities.filter(
    (activity) => completedIds.has(activity.id) || activity.progressStatus === "completed"
  ).length;

  if (completedCount === 0) return { label: "未着手", completedCount, state: "not_started" as const };
  if (completedCount === activities.length) return { label: "完了", completedCount, state: "completed" as const };
  return { label: "進行中", completedCount, state: "in_progress" as const };
};

const ProgressDots = ({
  activities,
  completedIds,
  currentActivityId,
}: {
  activities: MissionActivity[];
  completedIds: Set<string>;
  currentActivityId: string | null;
}) => (
  <Stack direction="row" spacing={0.8}>
    {activities.map((activity) => {
      const isCompleted =
        completedIds.has(activity.id) || activity.progressStatus === "completed";
      const isCurrent = activity.id === currentActivityId;

      return (
        <Box
          key={activity.id}
          title={activity.title}
          sx={{
            width: 12,
            height: 12,
            borderRadius: "50%",
            border: "2px solid",
            borderColor: isCompleted ? "#16a34a" : isCurrent ? "#2563eb" : "#cbd5e1",
            bgcolor: isCompleted ? "#16a34a" : isCurrent ? "#2563eb" : "#fff",
            boxShadow: isCurrent ? "0 0 0 4px rgba(37, 99, 235, 0.12)" : "none",
          }}
        />
      );
    })}
  </Stack>
);

const MiniProgressBar = ({
  completed,
  total,
}: {
  completed: number;
  total: number;
}) => (
  <Box
    sx={{
      height: 8,
      borderRadius: 999,
      bgcolor: "#e2e8f0",
      overflow: "hidden",
    }}
  >
    <Box
      sx={{
        width: `${total > 0 ? Math.round((completed / total) * 100) : 0}%`,
        height: "100%",
        bgcolor: completed === total ? "#16a34a" : completed > 0 ? "#2563eb" : "#cbd5e1",
      }}
    />
  </Box>
);

const SectionCard = ({
  group,
  index,
  completedIds,
  currentActivityId,
}: {
  group: SectionGroup;
  index: number;
  completedIds: Set<string>;
  currentActivityId: string | null;
}) => {
  const { label, completedCount, state } = getSectionStatus(group.activities, completedIds);
  const isMissionCheck = group.isMissionCheck;
  const isCompleted = state === "completed";
  const isInProgress = state === "in_progress";

  return (
    <Paper
      elevation={0}
      sx={{
        width: "100%",
        minHeight: isMissionCheck ? 222 : 246,
        p: 2.5,
        borderRadius: 3,
        border: "2px solid",
        borderColor: isCompleted
          ? "#22c55e"
          : isInProgress
            ? "#93c5fd"
            : isMissionCheck
              ? "#fed7aa"
              : "#dbe3ef",
        bgcolor: isMissionCheck ? "#fffaf5" : "#fff",
        boxShadow: isCompleted
          ? "0 16px 34px rgba(34, 197, 94, 0.18)"
          : isInProgress
            ? "0 16px 34px rgba(37, 99, 235, 0.16)"
            : "0 12px 26px rgba(15, 23, 42, 0.08)",
      }}
    >
      <Stack spacing={2} sx={{ height: "100%" }}>
        <Stack direction="row" spacing={1.25} alignItems="center">
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              bgcolor: isCompleted ? "#dcfce7" : isMissionCheck ? "#fff7ed" : "#eff6ff",
              color: isCompleted ? "#15803d" : isMissionCheck ? "#c2410c" : "#2563eb",
              fontWeight: 900,
            }}
          >
            {isCompleted ? "✓" : isMissionCheck ? "?" : index + 1}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography fontWeight={900} sx={{ lineHeight: 1.35, color: "#0f172a" }}>
              {group.title}
            </Typography>
            <Typography variant="caption" color="text.secondary" fontWeight={800}>
              {group.activities.length}アクティビティ
            </Typography>
          </Box>
        </Stack>

        {group.description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              lineHeight: 1.7,
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {group.description}
          </Typography>
        )}

        <Stack spacing={1.25} sx={{ mt: "auto" }}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <Chip
              size="small"
              label={label}
              sx={{
                fontWeight: 900,
                bgcolor:
                  state === "completed" ? "#bbf7d0" : state === "in_progress" ? "#dbeafe" : "#f1f5f9",
                color:
                  state === "completed" ? "#15803d" : state === "in_progress" ? "#1d4ed8" : "#475569",
              }}
            />
            <Typography variant="caption" color="text.secondary" fontWeight={800}>
              {completedCount} / {group.activities.length}
            </Typography>
          </Stack>
          <MiniProgressBar completed={completedCount} total={group.activities.length} />
          <ProgressDots
            activities={group.activities}
            completedIds={completedIds}
            currentActivityId={currentActivityId}
          />
        </Stack>
      </Stack>
    </Paper>
  );
};

const SectionFlow = ({
  groups,
  completedIds,
  currentActivityId,
}: {
  groups: SectionGroup[];
  completedIds: Set<string>;
  currentActivityId: string | null;
}) => (
  <Box sx={{ overflowX: "auto", pb: 1, scrollbarWidth: "thin" }}>
    <Box
      sx={{
        minWidth: Math.max(940, groups.length * 280 + Math.max(0, groups.length - 1) * 88),
        display: "flex",
        alignItems: "stretch",
        gap: "88px",
        py: 1,
      }}
    >
      {groups.map((group, index) => (
        <Box
          key={group.id}
          sx={{
            width: 280,
            flex: "0 0 280px",
            position: "relative",
          }}
        >
          <SectionCard
            group={group}
            index={index}
            completedIds={completedIds}
            currentActivityId={currentActivityId}
          />
          {index < groups.length - 1 && (
            <Box
              aria-hidden
              sx={{
                position: "absolute",
                top: "50%",
                left: "100%",
                width: 88,
                height: 4,
                bgcolor: "#cbd5e1",
                transform: "translateY(-50%)",
              }}
            />
          )}
          {index < groups.length - 1 && (
            <Box
              aria-hidden
              sx={{
                position: "absolute",
                top: "50%",
                left: "calc(100% + 72px)",
                width: 0,
                height: 0,
                borderTop: "7px solid transparent",
                borderBottom: "7px solid transparent",
                borderLeft: "10px solid #cbd5e1",
                transform: "translateY(-50%)",
              }}
            />
          )}
        </Box>
      ))}
    </Box>
  </Box>
);

export default function MissionOverviewPage() {
  const params = useParams<{ missionId: string }>();
  const missionId = params.missionId;
  const router = useRouter();
  const { showOverlay, startNavigation } = useNavigationFeedback();

  const [mission, setMission] = useState<MissionOverviewResponse | null>(null);
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
        const data = await getMissionOverview(token, missionId);

        if (!isMounted) return;
        setMission(data);
      } catch (error) {
        console.error(error);
        if (!isMounted) return;
        setErrorMessage("ミッション内容の取得に失敗しました。");
      } finally {
        if (!isMounted) return;
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [missionId]);

  const completedIds = useMemo(
    () => new Set(mission?.progress.completedActivityIds ?? []),
    [mission]
  );

  const sectionGroups = useMemo<SectionGroup[]>(() => {
    if (!mission) return [];

    const regularActivities = mission.activities.filter((activity) => !activity.isMissionCheck);
    const missionCheckActivities = mission.activities.filter((activity) => activity.isMissionCheck);

    const groups: SectionGroup[] = mission.sections
      .map((section) => ({
        id: section.id,
        title: section.title,
        description: section.description,
        activities: regularActivities.filter((activity) => activity.sectionId === section.id),
      }))
      .filter((group) => group.activities.length > 0);

    const activitiesWithoutSection = regularActivities.filter((activity) => !activity.sectionId);
    if (activitiesWithoutSection.length > 0) {
      groups.push({
        id: "no-section",
        title: "学習内容",
        description: null,
        activities: activitiesWithoutSection,
      });
    }

    if (missionCheckActivities.length > 0) {
      groups.push({
        id: "mission-check",
        title: "Mission Check",
        description: "このMissionの確認問題",
        activities: missionCheckActivities,
        isMissionCheck: true,
      });
    }

    return groups;
  }, [mission]);

  const handleStart = () => {
    if (mission?.isLocked) return;
    startNavigation(() => {
      router.push(`/mission/${encodeURIComponent(missionId)}/play`);
    });
  };

  const handleReview = () => {
    if (mission?.isLocked) return;
    startNavigation(() => {
      router.push(`/mission/${encodeURIComponent(missionId)}/play?review=1`);
    });
  };

  const handleBackToCourse = () => {
    if (!mission) return;

    startNavigation(() => {
      router.push(
        `/courses/roadmap/${encodeURIComponent(mission.courseId)}`
      );
    });
  };

  if (isLoading) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "#F7F8FC" }}>
        <AppHeader />
        <MissionOverviewLoadingSkeleton />
      </Box>
    );
  }

  if (!mission) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "#F7F8FC" }}>
        <AppHeader />
        <Container maxWidth="lg" sx={{ py: 6 }}>
          <Alert severity="error">{errorMessage ?? "ミッション内容を表示できません。"}</Alert>
        </Container>
      </Box>
    );
  }

  const progressValue =
    mission.activities.length > 0
      ? Math.round((completedIds.size / mission.activities.length) * 100)
      : 0;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#F7F8FC" }}>
      <AppHeader />
      <PageTransitionOverlay open={showOverlay} message="アクティビティを準備しています..." />

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Stack spacing={3}>
          <AppBreadcrumbs
            items={[
              { label: "コース", href: "/courses" },
              { label: mission.courseTitle, href: `/courses/roadmap/${encodeURIComponent(mission.courseId)}` },
              { label: mission.title },
            ]}
          />
          <Button
            variant="outlined"
            size="large"
            startIcon={<ArrowBackIcon />}
            onClick={handleBackToCourse}
            sx={{
              alignSelf: "flex-start",
              minHeight: 46,
              px: 2.5,
              borderRadius: 2,
              bgcolor: "#fff",
              fontWeight: 900,
              boxShadow: "0 8px 20px rgba(15, 23, 42, 0.08)",
            }}
          >
            ミッションロードマップへ戻る
          </Button>

          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 3,
              border: "1px solid #e2e8f0",
              boxShadow: "0 14px 34px rgba(15, 23, 42, 0.08)",
            }}
          >
            <Stack spacing={2.5}>
              <Box>
                <Typography color="text.secondary" fontWeight={800}>
                  Mission
                </Typography>
                <Typography variant="h3" fontWeight={900} letterSpacing={0}>
                  {mission.title}
                </Typography>
                <Typography color="text.secondary" sx={{ mt: 1, lineHeight: 1.8 }}>
                  {mission.description}
                </Typography>
              </Box>

              <Stack direction="row" spacing={1} flexWrap="wrap">
                <DifficultyLabel difficulty={mission.difficulty} variant="chip" />
                <Chip label={`約${mission.estimatedMinutes}分`} sx={{ fontWeight: 900 }} />
                <Chip label={`${sectionGroups.length}セクション`} sx={{ fontWeight: 900 }} />
                <Chip
                  icon={<RouteIcon />}
                  label={`${mission.activities.length}アクティビティ`}
                  sx={{ fontWeight: 900, "& .MuiChip-icon": { color: "inherit" } }}
                />
              </Stack>

              <Box>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={800}>
                    進捗
                  </Typography>
                  <Typography variant="caption" color="text.secondary" fontWeight={800}>
                    {completedIds.size} / {mission.activities.length}
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={progressValue}
                  sx={{ height: 8, borderRadius: 999 }}
                />
              </Box>

              {mission.isLocked ? (
                <Stack spacing={1.5} alignItems="flex-start">
                  <Alert severity="info" icon={<LockOutlineIcon />} sx={{ width: "100%" }}>
                    <Typography fontWeight={900}>このミッションはまだ開放されていません</Typography>
                    <Typography sx={{ mt: 0.5 }}>
                      {mission.unlockRequirement
                        ? `「${mission.unlockRequirement.missionTitle}」を完了すると学習を始められます。`
                        : "コースの前のミッションを完了すると学習を始められます。"}
                    </Typography>
                  </Alert>
                  <Button
                    variant="contained"
                    disabled
                    startIcon={<LockOutlineIcon />}
                    sx={{ fontWeight: 900, borderRadius: 2, minHeight: 46 }}
                  >
                    未開放
                  </Button>
                </Stack>
              ) : (
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                  <Button
                    variant="contained"
                    startIcon={<PlayArrowIcon />}
                    onClick={handleStart}
                    sx={{ fontWeight: 900, borderRadius: 2, minHeight: 46 }}
                  >
                    {mission.progress.status === "in_progress" ? "続きから始める" : "アクティビティを始める"}
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<ReplayIcon />}
                    onClick={handleReview}
                    sx={{ fontWeight: 900, borderRadius: 2, minHeight: 46 }}
                  >
                    最初から復習する
                  </Button>
                </Stack>
              )}
            </Stack>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              border: "1px solid #e2e8f0",
              boxShadow: "0 14px 34px rgba(15, 23, 42, 0.08)",
            }}
          >
            <Stack spacing={2}>
              <Box>
                <Typography variant="h5" fontWeight={900}>
                  学習の流れ
                </Typography>
                <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                  セクションごとに、何を学ぶか確認できます。
                </Typography>
              </Box>
              <SectionFlow
                groups={sectionGroups}
                completedIds={completedIds}
                currentActivityId={mission.progress.currentActivityId}
              />
            </Stack>
          </Paper>
        </Stack>
      </Container>
    </Box>
  );
}
