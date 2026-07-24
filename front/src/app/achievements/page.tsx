"use client";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import LockIcon from "@mui/icons-material/Lock";
import PushPinIcon from "@mui/icons-material/PushPin";
import TrackChangesIcon from "@mui/icons-material/TrackChanges";
import VisibilityIcon from "@mui/icons-material/Visibility";
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
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import type { AlertColor } from "@mui/material";
import { onAuthStateChanged } from "firebase/auth";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import {
  type AchievementCategoryGroup,
  type AchievementItem,
  getAchievements,
  updateTargetAchievement,
} from "@/api/achievements.api";
import { AppBreadcrumbs } from "@/app/component/appBreadcrumbs";
import { AppHeader } from "@/app/component/appHeader";
import { AppSnackbar } from "@/app/component/appSnackbar";
import { useSoundEffect } from "@/app/component/soundFeedback";
import { auth } from "@/lib/firebase";

type AchievementSeries = {
  key: string;
  category: string;
  categoryLabel: string;
  title: string;
  levels: AchievementItem[];
  currentLevel: number;
  nextLevel: AchievementItem | null;
  displayLevel: AchievementItem;
  progress: number;
  goal: number;
  progressPercent: number;
  isMaxLevel: boolean;
  isSecret: boolean;
};

const statusMeta = {
  achieved: {
    label: "達成済み",
    color: "#16a34a",
    bgcolor: "#dcfce7",
    icon: <CheckCircleIcon />,
  },
  visible_locked: {
    label: "進行中",
    color: "#2563eb",
    bgcolor: "#dbeafe",
    icon: <VisibilityIcon />,
  },
  secret_locked: {
    label: "未解除",
    color: "#64748b",
    bgcolor: "#f1f5f9",
    icon: <LockIcon />,
  },
} as const;

const toSeries = (groups: AchievementCategoryGroup[]) =>
  groups.flatMap((group) => {
    const seriesMap = new Map<string, AchievementSeries>();

    group.achievements.forEach((achievement) => {
      const current = seriesMap.get(achievement.seriesKey);
      if (current) {
        current.levels.push(achievement);
        return;
      }

      seriesMap.set(achievement.seriesKey, {
        key: achievement.seriesKey,
        category: achievement.category,
        categoryLabel: group.label,
        title: achievement.seriesTitle,
        levels: [achievement],
        currentLevel: 0,
        nextLevel: null,
        displayLevel: achievement,
        progress: achievement.progress,
        goal: achievement.goal,
        progressPercent: 0,
        isMaxLevel: false,
        isSecret: achievement.status === "secret_locked",
      });
    });

    return [...seriesMap.values()].map((series) => {
      const levels = [...series.levels].sort((a, b) => a.level - b.level);
      const achievedLevels = levels.filter((level) => level.status === "achieved");
      const nextLevel = levels.find((level) => level.status !== "achieved") ?? null;
      const displayLevel = nextLevel ?? achievedLevels.at(-1) ?? levels[0];
      const currentLevel = achievedLevels.at(-1)?.level ?? 0;
      const goal = Math.max(displayLevel.goal, 1);
      const progress = Math.min(displayLevel.progress, goal);

      return {
        ...series,
        levels,
        currentLevel,
        nextLevel,
        displayLevel,
        progress,
        goal,
        progressPercent: Math.round((progress / goal) * 100),
        isMaxLevel: achievedLevels.length === levels.length,
        isSecret: levels.every((level) => level.status === "secret_locked"),
      };
    });
  });

const getSeriesStatus = (series: AchievementSeries) => {
  if (series.isSecret) return "secret_locked";
  if (series.isMaxLevel) return "achieved";
  return "visible_locked";
};

const isLeveledSeries = (series: AchievementSeries) => series.levels.length > 1;

const formatSeriesDisplayTitle = (series: AchievementSeries) =>
  isLeveledSeries(series)
    ? `${series.title} Lv.${series.isMaxLevel ? series.currentLevel : series.displayLevel.level}`
    : series.title;

export default function AchievementsPage() {
  return (
    <Suspense fallback={<AchievementsPageFallback />}>
      <AchievementsPageContent />
    </Suspense>
  );
}

function AchievementsPageContent() {
  const { play } = useSoundEffect();
  const searchParams = useSearchParams();
  const [groups, setGroups] = useState<AchievementCategoryGroup[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [selectedSeriesKey, setSelectedSeriesKey] = useState<string | null>(null);
  const [targetSeriesKey, setTargetSeriesKey] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: AlertColor }>({
    open: false,
    message: "",
    severity: "success",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        if (!isMounted) return;
        setGroups([]);
        setErrorMessage("ログインが必要です。");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage(null);
        const token = await user.getIdToken();
        const data = await getAchievements(token);

        if (!isMounted) return;
        setGroups(data.groups);
        const targetSeries = data.targetAchievementId
          ? toSeries(data.groups).find((series) =>
              series.levels.some((level) => level.id === data.targetAchievementId)
            )
          : null;
        setTargetSeriesKey(targetSeries?.key ?? null);
      } catch (error) {
        console.error(error);
        if (!isMounted) return;
        setErrorMessage("実績を取得できませんでした。");
      } finally {
        if (!isMounted) return;
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const allAchievements = useMemo(() => groups.flatMap((group) => group.achievements), [groups]);
  const allSeries = useMemo(() => toSeries(groups), [groups]);
  const newlyUnlockedIdsParam = searchParams.get("new") ?? "";
  const newlyUnlockedAchievementIds = useMemo(
    () => new Set(newlyUnlockedIdsParam.split(",").filter(Boolean)),
    [newlyUnlockedIdsParam]
  );
  const shownSeries = useMemo(() => {
    const base =
      activeCategory === "all"
        ? allSeries
        : allSeries.filter((series) => series.category === activeCategory);

    return [...base].sort((a, b) => {
      const aNew = a.levels.some((level) => newlyUnlockedAchievementIds.has(level.id));
      const bNew = b.levels.some((level) => newlyUnlockedAchievementIds.has(level.id));
      if (aNew === bNew) return 0;
      return aNew ? -1 : 1;
    });
  }, [activeCategory, allSeries, newlyUnlockedAchievementIds]);
  const selectedSeries = useMemo(
    () => allSeries.find((series) => series.key === selectedSeriesKey) ?? shownSeries[0] ?? null,
    [allSeries, selectedSeriesKey, shownSeries]
  );

  useEffect(() => {
    if (!selectedSeriesKey && shownSeries[0]) {
      setSelectedSeriesKey(shownSeries[0].key);
    }
  }, [selectedSeriesKey, shownSeries]);

  const achievedCount = allAchievements.filter((achievement) => achievement.status === "achieved").length;
  const visibleLockedCount = allSeries.filter((series) => !series.isMaxLevel && !series.isSecret).length;
  const secretLockedCount = allSeries.filter((series) => series.isSecret).length;
  const progress = allAchievements.length === 0 ? 0 : Math.round((achievedCount / allAchievements.length) * 100);

  const handleToggleTarget = async (series: AchievementSeries) => {
    const previousTargetSeriesKey = targetSeriesKey;
    const isCurrentTarget = targetSeriesKey === series.key;

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("Unauthorized");
      }
      const token = await currentUser.getIdToken();

      if (isCurrentTarget) {
        setTargetSeriesKey(null);
        await updateTargetAchievement(token, null);
        setSnackbar({ open: true, message: "目標実績を解除しました", severity: "success" });
        play("saveSuccess");
        return;
      }

      const targetLevel = series.nextLevel ?? series.displayLevel;
      setTargetSeriesKey(series.key);
      await updateTargetAchievement(token, targetLevel.id);
      setSnackbar({ open: true, message: "目標実績に設定しました", severity: "success" });
      play("saveSuccess");
    } catch (error) {
      console.error(error);
      setTargetSeriesKey(previousTargetSeriesKey);
      setSnackbar({ open: true, message: "目標実績を保存できませんでした。もう一度お試しください。", severity: "error" });
    }
  };
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f5f8fc" }}>
      <AppHeader />
      <Container maxWidth={false} sx={{ maxWidth: 1440, py: { xs: 3, md: 4 } }}>
        <Stack spacing={3}>
          <AppBreadcrumbs items={[{ label: "コレクション", href: "/collection" }, { label: "実績" }]} />
          {isLoading ? (
            <AchievementsSkeleton />
          ) : (
            <>
              <Box>
                <Typography variant="h2" fontWeight={900} sx={{ fontSize: { xs: 38, md: 52 } }}>
                  実績コレクション
                </Typography>
                <Typography color="text.secondary" sx={{ mt: 1, fontSize: 17 }}>
                  学習で達成した実績をレベルごとに確認できます。
                </Typography>
              </Box>

              <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, border: "1px solid #dbe3ef", bgcolor: "#fff", boxShadow: "0 18px 44px rgba(15, 23, 42, 0.06)" }}>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.4fr 1fr 1fr 1fr" }, gap: 2, alignItems: "center" }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box sx={{ width: 70, height: 70, borderRadius: "50%", display: "grid", placeItems: "center", color: "#d97706", bgcolor: "#fff7ed" }}>
                      <EmojiEventsIcon sx={{ fontSize: 42 }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography fontWeight={900}>全体の達成状況</Typography>
                      <Stack direction="row" spacing={1} alignItems="baseline">
                        <Typography variant="h3" fontWeight={900}>
                          {achievedCount} / {allAchievements.length}
                        </Typography>
                        <Typography color="text.secondary" fontWeight={800}>
                          レベルを解除
                        </Typography>
                      </Stack>
                      <LinearProgress variant="determinate" value={progress} sx={{ mt: 1, height: 8, borderRadius: 999 }} />
                    </Box>
                  </Stack>
                  <SummaryMetric icon={<TrackChangesIcon />} label="進行中の実績" value={visibleLockedCount} tone="#2563eb" />
                  <SummaryMetric icon={<CheckCircleIcon />} label="最大Lv到達" value={allSeries.filter((series) => series.isMaxLevel).length} tone="#16a34a" />
                  <SummaryMetric icon={<LockIcon />} label="未解除の実績" value={secretLockedCount} tone="#64748b" />
                </Box>
              </Paper>

              {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1fr) 420px" }, gap: 3, alignItems: "start" }}>
                <Stack spacing={2}>
                  <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
                    <Typography variant="h4" fontWeight={900}>
                      すべての実績
                    </Typography>
                    <ToggleButtonGroup value={activeCategory} exclusive onChange={(_, value) => value && setActiveCategory(value)} size="small" sx={{ gap: 1, flexWrap: "wrap", "& .MuiToggleButton-root": { border: 0, borderRadius: 2, px: 2, fontWeight: 900, bgcolor: "#eef2f7" }, "& .Mui-selected": { bgcolor: "#0052d9 !important", color: "#fff !important" } }}>
                      <ToggleButton value="all">すべて</ToggleButton>
                      {groups.map((group) => (
                        <ToggleButton key={group.category} value={group.category}>
                          {group.label}
                        </ToggleButton>
                      ))}
                    </ToggleButtonGroup>
                  </Stack>
                  {shownSeries.length === 0 ? (
                    <Alert severity="info">表示できる実績がありません。</Alert>
                  ) : (
                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" }, gap: 2 }}>
                      {shownSeries.map((series) => (
                        <AchievementCard
                          key={series.key}
                          series={series}
                          selected={selectedSeries?.key === series.key}
                          isTarget={targetSeriesKey === series.key}
                          isNew={series.levels.some((level) => newlyUnlockedAchievementIds.has(level.id))}
                          onClick={() => setSelectedSeriesKey(series.key)}
                        />
                      ))}
                    </Box>
                  )}
                </Stack>

                <AchievementDetailPanel
                  series={selectedSeries}
                  targetSeriesKey={targetSeriesKey}
                  newlyUnlockedAchievementIds={newlyUnlockedAchievementIds}
                  onToggleTarget={handleToggleTarget}
                />
              </Box>
            </>
          )}
        </Stack>
      </Container>
      <AppSnackbar open={snackbar.open} message={snackbar.message} severity={snackbar.severity} onClose={() => setSnackbar((current) => ({ ...current, open: false }))} />
    </Box>
  );
}

const AchievementsPageFallback = () => (
  <Box sx={{ minHeight: "100vh", bgcolor: "#f5f8fc" }}>
    <AppHeader />
    <Container maxWidth={false} sx={{ maxWidth: 1440, py: { xs: 3, md: 4 } }}>
      <AchievementsSkeleton />
    </Container>
  </Box>
);

const SummaryMetric = ({ icon, label, value, tone }: { icon: ReactNode; label: string; value: number; tone: string }) => (
  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ px: { md: 2 }, py: 1, borderLeft: { md: "1px solid #e2e8f0" } }}>
    <Box sx={{ width: 62, height: 62, borderRadius: "50%", display: "grid", placeItems: "center", color: tone, bgcolor: `${tone}18` }}>
      {icon}
    </Box>
    <Box>
      <Typography fontWeight={900}>{label}</Typography>
      <Typography variant="h4" fontWeight={900}>
        {value}
        <Typography component="span" fontSize={16} fontWeight={900}>
          件
        </Typography>
      </Typography>
    </Box>
  </Stack>
);

const AchievementCard = ({
  series,
  selected,
  isTarget,
  isNew,
  onClick,
}: {
  series: AchievementSeries;
  selected: boolean;
  isTarget: boolean;
  isNew: boolean;
  onClick: () => void;
}) => {
  const meta = statusMeta[getSeriesStatus(series)];
  const nextText = series.isMaxLevel
    ? "最大レベルに到達済み"
    : series.displayLevel.conditionLabel ?? "条件達成で解放";
  const borderColor = selected
    ? "#0052d9"
    : isNew
      ? "#f59e0b"
      : isTarget
        ? "#f59e0b"
        : series.isMaxLevel
          ? "#86efac"
          : "#dbe3ef";
  const backgroundColor = isNew
    ? "#fffbeb"
    : series.isMaxLevel
      ? "#f0fdf4"
      : series.isSecret
        ? "#f8fafc"
        : "#fff";

  return (
    <Paper
      component="button"
      type="button"
      elevation={0}
      onClick={onClick}
      sx={{
        appearance: "none",
        textAlign: "left",
        p: 2.25,
        minHeight: 238,
        borderRadius: 3,
        border: `${selected || isNew || isTarget || series.isMaxLevel ? 2 : 1}px solid ${borderColor}`,
        bgcolor: backgroundColor,
        cursor: "pointer",
        opacity: series.isSecret ? 0.78 : 1,
        boxShadow: selected
          ? "0 14px 34px rgba(0, 82, 217, 0.16)"
          : isNew
            ? "0 16px 36px rgba(245, 158, 11, 0.2)"
            : "0 10px 26px rgba(15, 23, 42, 0.05)",
      }}
    >
      <Stack spacing={1.5}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Chip icon={meta.icon} label={meta.label} size="small" sx={{ fontWeight: 900, color: meta.color, bgcolor: meta.bgcolor, "& .MuiChip-icon": { color: "inherit" } }} />
          <Stack direction="row" spacing={0.75} alignItems="center">
            {isNew && <Chip label="今回解除" size="small" sx={{ fontWeight: 900, color: "#b45309", bgcolor: "#fef3c7" }} />}
            {isTarget && <Chip icon={<PushPinIcon />} label="目標設定中" size="small" sx={{ fontWeight: 900, color: "#b45309", bgcolor: "#fef3c7", "& .MuiChip-icon": { color: "inherit" } }} />}
          </Stack>
        </Stack>
        <Box sx={{ width: 70, height: 70, borderRadius: "50%", display: "grid", placeItems: "center", color: meta.color, bgcolor: meta.bgcolor }}>
          {meta.icon}
        </Box>
        <Box>
          <Typography variant="h6" fontWeight={900} sx={{ lineHeight: 1.35 }}>
            {formatSeriesDisplayTitle(series)}
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.6, fontSize: 14 }}>
            {nextText}
          </Typography>
        </Box>
        <Box>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.75 }}>
            <Typography fontWeight={900} color="#334155" fontSize={13}>
              {series.isMaxLevel ? "達成済み" : `Lv.${series.displayLevel.level} 進行`}
            </Typography>
            <Typography fontWeight={900} color="#334155" fontSize={13}>
              {series.progress} / {series.goal}
            </Typography>
          </Stack>
          <LinearProgress variant="determinate" value={series.progressPercent} sx={{ height: 8, borderRadius: 999, bgcolor: "#e2e8f0" }} />
        </Box>
      </Stack>
    </Paper>
  );
};

const AchievementDetailPanel = ({
  series,
  targetSeriesKey,
  newlyUnlockedAchievementIds,
  onToggleTarget,
}: {
  series: AchievementSeries | null;
  targetSeriesKey: string | null;
  newlyUnlockedAchievementIds: Set<string>;
  onToggleTarget: (series: AchievementSeries) => void;
}) => {
  if (!series) return null;
  const meta = statusMeta[getSeriesStatus(series)];
  const isTarget = series.key === targetSeriesKey;
  const canSetTarget = !series.isSecret && !series.isMaxLevel;
  const newlyUnlockedLevel = series.levels.find((level) => newlyUnlockedAchievementIds.has(level.id));

  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: isTarget ? "2px solid #f59e0b" : "1px solid #dbe3ef", bgcolor: "#fff", minHeight: 560, position: { lg: "sticky" }, top: { lg: 88 } }}>
      <Stack spacing={3}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Chip label={meta.label} sx={{ fontWeight: 900, color: meta.color, bgcolor: meta.bgcolor }} />
          <Stack direction="row" spacing={1}>
            {newlyUnlockedLevel && <Chip label="今回解除" sx={{ fontWeight: 900, color: "#b45309", bgcolor: "#fef3c7" }} />}
            {isTarget && <Chip icon={<PushPinIcon />} label="目標設定中" sx={{ fontWeight: 900, color: "#b45309", bgcolor: "#fef3c7", "& .MuiChip-icon": { color: "inherit" } }} />}
          </Stack>
        </Stack>
        <Stack spacing={2} alignItems="center" textAlign="center">
          <Box sx={{ width: 132, height: 132, borderRadius: "50%", display: "grid", placeItems: "center", color: meta.color, bgcolor: meta.bgcolor, border: "1px solid #dbe3ef" }}>
            {meta.icon}
          </Box>
          <Box>
            <Typography variant="h3" fontWeight={900} sx={{ fontSize: 34 }}>
              {formatSeriesDisplayTitle(series)}
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1.5, lineHeight: 1.8 }}>
              {series.displayLevel.description}
            </Typography>
          </Box>
        </Stack>

        <Box>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography fontWeight={900} color="#0052d9">
              {series.isMaxLevel
                ? isLeveledSeries(series)
                  ? "最大レベル到達"
                  : "達成済み"
                : isLeveledSeries(series)
                  ? `次のレベル: Lv.${series.displayLevel.level}`
                  : "達成条件"}
            </Typography>
            <Typography fontWeight={900}>
              {series.progress} / {series.goal}
            </Typography>
          </Stack>
          <LinearProgress variant="determinate" value={series.progressPercent} sx={{ height: 10, borderRadius: 999 }} />
          <Typography color="text.secondary" sx={{ mt: 1, lineHeight: 1.7 }}>
            {series.displayLevel.conditionLabel ?? "さらなる挑戦をお楽しみに。"}
          </Typography>
          {!series.isMaxLevel && isLeveledSeries(series) && (
            <Typography color="#475569" sx={{ mt: 0.75, lineHeight: 1.7, fontWeight: 800 }}>
              現在は Lv.{series.displayLevel.level} に挑戦中です。
              {series.currentLevel > 0 ? ` 達成済みの最高レベルは Lv.${series.currentLevel} です。` : ""}
            </Typography>
          )}
        </Box>

        <Box sx={{ borderTop: "1px solid #e2e8f0", pt: 2 }}>
          <Typography fontWeight={900} color="#0052d9" sx={{ mb: 1.5 }}>
            レベル条件
          </Typography>
          <Stack spacing={1}>
            {series.levels.map((level) => {
              const achieved = level.status === "achieved";
              const isNewLevel = newlyUnlockedAchievementIds.has(level.id);
              return (
                <Paper
                  key={level.id}
                  elevation={0}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    border: isNewLevel ? "2px solid #f59e0b" : "1px solid #e2e8f0",
                    bgcolor: isNewLevel ? "#fffbeb" : achieved ? "#f0fdf4" : "#f8fafc",
                  }}
                >
                  <Stack direction="row" spacing={1.25} alignItems="center">
                    {achieved ? <CheckCircleIcon sx={{ color: "#16a34a" }} /> : <VisibilityIcon sx={{ color: "#64748b" }} />}
                    <Box sx={{ flex: 1 }}>
                      <Typography fontWeight={900}>{isLeveledSeries(series) ? `Lv.${level.level}` : "条件"}</Typography>
                      <Typography color="text.secondary" fontSize={14}>
                        {level.conditionLabel ?? "条件達成で解放"}
                      </Typography>
                    </Box>
                    {level.achievedAt && (
                      <Typography color="text.secondary" fontSize={12}>
                        {new Date(level.achievedAt).toLocaleDateString("ja-JP")}
                      </Typography>
                    )}
                    {isNewLevel && <Chip label="今回解除" size="small" sx={{ fontWeight: 900, color: "#b45309", bgcolor: "#fef3c7" }} />}
                  </Stack>
                </Paper>
              );
            })}
          </Stack>
        </Box>

        {series.displayLevel.achievedAt && (
          <Box>
            <Typography fontWeight={900} color="#0052d9" sx={{ mb: 1 }}>
              最終達成日
            </Typography>
            <Typography color="text.secondary">{new Date(series.displayLevel.achievedAt).toLocaleString("ja-JP")}</Typography>
          </Box>
        )}

        <Button
          fullWidth
          variant={isTarget ? "outlined" : "contained"}
          startIcon={<TrackChangesIcon />}
          disabled={!canSetTarget && !isTarget}
          onClick={() => onToggleTarget(series)}
          sx={{ mt: "auto", minHeight: 54, borderRadius: 2, fontWeight: 900 }}
        >
          {series.isMaxLevel ? "最大レベル到達済み" : isTarget ? "目標を解除する" : "目標に設定する"}
        </Button>
      </Stack>
    </Paper>
  );
};

const AchievementsSkeleton = () => (
  <Stack spacing={3}>
    <Skeleton variant="rounded" height={150} sx={{ borderRadius: 3 }} />
    <Skeleton variant="rounded" height={112} sx={{ borderRadius: 3 }} />
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 420px" }, gap: 3 }}>
      <Skeleton variant="rounded" height={580} sx={{ borderRadius: 3 }} />
      <Skeleton variant="rounded" height={560} sx={{ borderRadius: 3 }} />
    </Box>
  </Stack>
);
