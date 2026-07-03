"use client";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import LockIcon from "@mui/icons-material/Lock";
import TrackChangesIcon from "@mui/icons-material/TrackChanges";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { Alert, Box, Button, Chip, Container, LinearProgress, Paper, Skeleton, Stack, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import {
  type AchievementCategoryGroup,
  type AchievementItem,
  getAchievements,
} from "@/api/achievements.api";
import { AppHeader } from "@/app/component/appHeader";
import { auth } from "@/lib/firebase";

const statusMeta = {
  achieved: { label: "達成済み", color: "#16a34a", bgcolor: "#dcfce7", icon: <CheckCircleIcon /> },
  visible_locked: { label: "進行中", color: "#2563eb", bgcolor: "#dbeafe", icon: <VisibilityIcon /> },
  secret_locked: { label: "未解除", color: "#64748b", bgcolor: "#f1f5f9", icon: <LockIcon /> },
} as const;

export default function AchievementsPage() {
  const [groups, setGroups] = useState<AchievementCategoryGroup[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [selectedAchievementId, setSelectedAchievementId] = useState<string | null>(null);
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
        setGroups(data);
        const first = data.flatMap((group) => group.achievements)[0];
        setSelectedAchievementId((current) => current ?? first?.id ?? null);
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
  const shownAchievements = useMemo(() => {
    if (activeCategory === "all") return allAchievements;
    return groups.find((group) => group.category === activeCategory)?.achievements ?? [];
  }, [activeCategory, allAchievements, groups]);
  const selectedAchievement = useMemo(
    () => allAchievements.find((achievement) => achievement.id === selectedAchievementId) ?? shownAchievements[0] ?? null,
    [allAchievements, selectedAchievementId, shownAchievements]
  );

  const achievedCount = allAchievements.filter((achievement) => achievement.status === "achieved").length;
  const visibleLockedCount = allAchievements.filter((achievement) => achievement.status === "visible_locked").length;
  const secretLockedCount = allAchievements.filter((achievement) => achievement.status === "secret_locked").length;
  const progress = allAchievements.length === 0 ? 0 : Math.round((achievedCount / allAchievements.length) * 100);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f5f8fc" }}>
      <AppHeader />
      <Container maxWidth={false} sx={{ maxWidth: 1440, py: { xs: 3, md: 4 } }}>
        {isLoading ? (
          <AchievementsSkeleton />
        ) : (
          <Stack spacing={3}>
            <Box>
              <Typography variant="h2" fontWeight={900} sx={{ fontSize: { xs: 38, md: 52 } }}>実績コレクション</Typography>
              <Typography color="text.secondary" sx={{ mt: 1, fontSize: 17 }}>学習で達成した実績を確認できます。</Typography>
            </Box>

            <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, border: "1px solid #dbe3ef", bgcolor: "#fff", boxShadow: "0 18px 44px rgba(15, 23, 42, 0.06)" }}>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.4fr 1fr 1fr 1fr" }, gap: 2, alignItems: "center" }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box sx={{ width: 70, height: 70, borderRadius: "50%", display: "grid", placeItems: "center", color: "#d97706", bgcolor: "#fff7ed" }}><EmojiEventsIcon sx={{ fontSize: 42 }} /></Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography fontWeight={900}>全体の達成状況</Typography>
                    <Stack direction="row" spacing={1} alignItems="baseline">
                      <Typography variant="h3" fontWeight={900}>{achievedCount} / {allAchievements.length}</Typography>
                      <Typography color="text.secondary" fontWeight={800}>実績を解除</Typography>
                    </Stack>
                    <LinearProgress variant="determinate" value={progress} sx={{ mt: 1, height: 8, borderRadius: 999 }} />
                  </Box>
                </Stack>
                <SummaryMetric icon={<TrackChangesIcon />} label="進行中の実績" value={visibleLockedCount} tone="#2563eb" />
                <SummaryMetric icon={<CheckCircleIcon />} label="解除済みの実績" value={achievedCount} tone="#16a34a" />
                <SummaryMetric icon={<LockIcon />} label="未解除の実績" value={secretLockedCount} tone="#64748b" />
              </Box>
            </Paper>

            {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1fr) 420px" }, gap: 3, alignItems: "start" }}>
              <Stack spacing={2}>
                <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
                  <Typography variant="h4" fontWeight={900}>すべての実績</Typography>
                  <ToggleButtonGroup value={activeCategory} exclusive onChange={(_, value) => value && setActiveCategory(value)} size="small" sx={{ gap: 1, flexWrap: "wrap", "& .MuiToggleButton-root": { border: 0, borderRadius: 2, px: 2, fontWeight: 900, bgcolor: "#eef2f7" }, "& .Mui-selected": { bgcolor: "#0052d9 !important", color: "#fff !important" } }}>
                    <ToggleButton value="all">すべて</ToggleButton>
                    {groups.map((group) => <ToggleButton key={group.category} value={group.category}>{group.label}</ToggleButton>)}
                  </ToggleButtonGroup>
                </Stack>
                {shownAchievements.length === 0 ? (
                  <Alert severity="info">表示できる実績がありません。</Alert>
                ) : (
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" }, gap: 2 }}>
                    {shownAchievements.map((achievement) => (
                      <AchievementCard key={achievement.id} achievement={achievement} selected={selectedAchievement?.id === achievement.id} onClick={() => setSelectedAchievementId(achievement.id)} />
                    ))}
                  </Box>
                )}
              </Stack>

              <AchievementDetailPanel achievement={selectedAchievement} />
            </Box>
          </Stack>
        )}
      </Container>
    </Box>
  );
}

const SummaryMetric = ({ icon, label, value, tone }: { icon: ReactNode; label: string; value: number; tone: string }) => (
  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ px: { md: 2 }, py: 1, borderLeft: { md: "1px solid #e2e8f0" } }}>
    <Box sx={{ width: 62, height: 62, borderRadius: "50%", display: "grid", placeItems: "center", color: tone, bgcolor: `${tone}18` }}>{icon}</Box>
    <Box><Typography fontWeight={900}>{label}</Typography><Typography variant="h4" fontWeight={900}>{value}<Typography component="span" fontSize={16} fontWeight={900}> 件</Typography></Typography></Box>
  </Stack>
);

const AchievementCard = ({ achievement, selected, onClick }: { achievement: AchievementItem; selected: boolean; onClick: () => void }) => {
  const meta = statusMeta[achievement.status];
  const isSecret = achievement.status === "secret_locked";
  return (
    <Paper component="button" type="button" elevation={0} onClick={onClick} sx={{ appearance: "none", textAlign: "center", p: 2, minHeight: 220, borderRadius: 3, border: selected ? "2px solid #0052d9" : "1px solid #dbe3ef", bgcolor: isSecret ? "#f8fafc" : "#fff", cursor: "pointer", opacity: isSecret ? 0.78 : 1, boxShadow: selected ? "0 14px 34px rgba(0, 82, 217, 0.16)" : "0 10px 26px rgba(15, 23, 42, 0.05)" }}>
      <Stack spacing={1.4} alignItems="center">
        <Chip icon={meta.icon} label={meta.label} size="small" sx={{ alignSelf: "flex-start", fontWeight: 900, color: meta.color, bgcolor: meta.bgcolor, "& .MuiChip-icon": { color: "inherit" } }} />
        <Box sx={{ width: 84, height: 84, borderRadius: "50%", display: "grid", placeItems: "center", color: meta.color, bgcolor: meta.bgcolor }}>
          {meta.icon}
        </Box>
        <Typography variant="h6" fontWeight={900} sx={{ lineHeight: 1.35 }}>{achievement.title}</Typography>
        <Typography color="text.secondary" sx={{ lineHeight: 1.6, fontSize: 14 }}>{achievement.description}</Typography>
      </Stack>
    </Paper>
  );
};

const AchievementDetailPanel = ({ achievement }: { achievement: AchievementItem | null }) => {
  if (!achievement) return null;
  const meta = statusMeta[achievement.status];
  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid #dbe3ef", bgcolor: "#fff", minHeight: 560, position: { lg: "sticky" }, top: { lg: 88 } }}>
      <Stack spacing={3} alignItems="center" textAlign="center">
        <Chip label={meta.label} sx={{ alignSelf: "flex-start", fontWeight: 900, color: meta.color, bgcolor: meta.bgcolor }} />
        <Box sx={{ width: 132, height: 132, borderRadius: "50%", display: "grid", placeItems: "center", color: meta.color, bgcolor: meta.bgcolor, border: "1px solid #dbe3ef" }}>
          {meta.icon}
        </Box>
        <Box>
          <Typography variant="h3" fontWeight={900} sx={{ fontSize: 34 }}>{achievement.title}</Typography>
          <Typography color="text.secondary" sx={{ mt: 1.5, lineHeight: 1.8 }}>{achievement.description}</Typography>
        </Box>
        <Box sx={{ width: "100%", textAlign: "left", borderTop: "1px solid #e2e8f0", pt: 2 }}>
          <Typography fontWeight={900} color="#0052d9" sx={{ mb: 1 }}>達成条件</Typography>
          <Typography color="text.secondary" sx={{ lineHeight: 1.8 }}>{achievement.conditionLabel ?? "さらなる挑戦をお楽しみに。"}</Typography>
        </Box>
        {achievement.achievedAt && (
          <Box sx={{ width: "100%", textAlign: "left" }}>
            <Typography fontWeight={900} color="#0052d9" sx={{ mb: 1 }}>達成日</Typography>
            <Typography color="text.secondary">{new Date(achievement.achievedAt).toLocaleString("ja-JP")}</Typography>
          </Box>
        )}
        {achievement.status !== "secret_locked" && (
          <Button
            fullWidth
            variant="contained"
            startIcon={<TrackChangesIcon />}
            onClick={() => {
              window.localStorage.setItem(
                "engineerQuest.targetAchievement",
                JSON.stringify({
                  title: achievement.title,
                  factor: [
                    {
                      name: achievement.conditionLabel ?? "実績達成",
                      goal: 1,
                      progress: achievement.status === "achieved" ? 1 : 0,
                    },
                  ],
                })
              );
            }}
            sx={{ mt: "auto", minHeight: 54, borderRadius: 2, fontWeight: 900 }}
          >
            目標に設定する
          </Button>
        )}
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
