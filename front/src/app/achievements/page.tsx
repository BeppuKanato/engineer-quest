"use client";

import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import LockIcon from "@mui/icons-material/Lock";
import VisibilityIcon from "@mui/icons-material/Visibility";
import {
  Alert,
  Box,
  Chip,
  Container,
  Grid,
  LinearProgress,
  Paper,
  Skeleton,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useMemo, useState } from "react";

import {
  AchievementCategoryGroup,
  AchievementItem,
  getAchievements,
} from "@/api/achievements.api";
import { AppHeader } from "@/app/component/appHeader";
import { auth } from "@/lib/firebase";

const statusMeta = {
  achieved: {
    label: "達成済み",
    color: "#16a34a",
    bgcolor: "#dcfce7",
    icon: <EmojiEventsIcon fontSize="small" />,
  },
  visible_locked: {
    label: "未達成",
    color: "#2563eb",
    bgcolor: "#dbeafe",
    icon: <VisibilityIcon fontSize="small" />,
  },
  secret_locked: {
    label: "シークレット",
    color: "#64748b",
    bgcolor: "#f1f5f9",
    icon: <LockIcon fontSize="small" />,
  },
} as const;

const AchievementCard = ({ achievement }: { achievement: AchievementItem }) => {
  const meta = statusMeta[achievement.status];
  const isSecret = achievement.status === "secret_locked";

  return (
    <Paper
      elevation={0}
      sx={{
        height: "100%",
        p: 2.5,
        borderRadius: 2,
        border: "1px solid #e2e8f0",
        bgcolor: isSecret ? "#f8fafc" : "#ffffff",
        opacity: isSecret ? 0.88 : 1,
        boxShadow: "0 10px 26px rgba(15, 23, 42, 0.06)",
      }}
    >
      <Stack spacing={1.5} sx={{ height: "100%" }}>
        <Stack direction="row" justifyContent="space-between" gap={1}>
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: 2,
              display: "grid",
              placeItems: "center",
              color: meta.color,
              bgcolor: meta.bgcolor,
              flexShrink: 0,
            }}
          >
            {meta.icon}
          </Box>
          <Chip
            label={meta.label}
            size="small"
            sx={{
              alignSelf: "flex-start",
              color: meta.color,
              bgcolor: meta.bgcolor,
              fontWeight: 900,
            }}
          />
        </Stack>

        <Box>
          <Typography variant="h6" fontWeight={900} sx={{ lineHeight: 1.35 }}>
            {achievement.title}
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.7 }}>
            {achievement.description}
          </Typography>
        </Box>

        <Box sx={{ mt: "auto" }}>
          {achievement.conditionLabel && (
            <Typography variant="body2" fontWeight={800} color="#475569">
              条件: {achievement.conditionLabel}
            </Typography>
          )}
          {achievement.achievedAt && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
              {new Date(achievement.achievedAt).toLocaleDateString("ja-JP")} 達成
            </Typography>
          )}
        </Box>
      </Stack>
    </Paper>
  );
};

const LoadingSkeleton = () => (
  <Grid container spacing={2.5}>
    {[0, 1, 2, 3, 4, 5].map((index) => (
      <Grid key={index} size={{ xs: 12, sm: 6, md: 4 }}>
        <Skeleton variant="rounded" height={220} sx={{ borderRadius: 2 }} />
      </Grid>
    ))}
  </Grid>
);

export default function AchievementsPage() {
  const [groups, setGroups] = useState<AchievementCategoryGroup[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("all");
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
        setActiveCategory((current) =>
          current === "all" || data.some((group) => group.category === current)
            ? current
            : "all"
        );
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

  const allAchievements = useMemo(
    () => groups.flatMap((group) => group.achievements),
    [groups]
  );
  const shownAchievements = useMemo(() => {
    if (activeCategory === "all") return allAchievements;
    return (
      groups.find((group) => group.category === activeCategory)?.achievements ??
      []
    );
  }, [activeCategory, allAchievements, groups]);
  const achievedCount = allAchievements.filter(
    (achievement) => achievement.status === "achieved"
  ).length;
  const progress =
    allAchievements.length === 0
      ? 0
      : Math.round((achievedCount / allAchievements.length) * 100);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#F7F8FC" }}>
      <AppHeader />

      <Container maxWidth={false} sx={{ maxWidth: 1120, py: 4 }}>
        <Stack spacing={3}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2.5, md: 3 },
              borderRadius: 2,
              border: "1px solid #e2e8f0",
              boxShadow: "0 12px 32px rgba(15, 23, 42, 0.06)",
            }}
          >
            <Stack spacing={2}>
              <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={2}>
                <Box>
                  <Typography variant="h4" fontWeight={900}>
                    Achievements
                  </Typography>
                  <Typography color="text.secondary" sx={{ mt: 0.75 }}>
                    学習の区切りや挑戦の達成をカテゴリごとに確認できます。
                  </Typography>
                </Box>
                <Box sx={{ minWidth: { xs: "100%", md: 260 } }}>
                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.75 }}>
                    <Typography variant="body2" fontWeight={900}>
                      達成数
                    </Typography>
                    <Typography variant="body2" fontWeight={900}>
                      {achievedCount} / {allAchievements.length}
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={progress}
                    sx={{ height: 10, borderRadius: 999 }}
                  />
                </Box>
              </Stack>

              <ToggleButtonGroup
                value={activeCategory}
                exclusive
                onChange={(_, value) => {
                  if (value) setActiveCategory(value);
                }}
                size="small"
                sx={{
                  flexWrap: "wrap",
                  gap: 1,
                  "& .MuiToggleButton-root": {
                    border: "1px solid #e2e8f0",
                    borderRadius: 2,
                    px: 1.5,
                    py: 0.75,
                    fontWeight: 900,
                  },
                  "& .Mui-selected": {
                    bgcolor: "#1976d2",
                    color: "#fff",
                    "&:hover": { bgcolor: "#1565c0" },
                  },
                }}
              >
                <ToggleButton value="all">ALL</ToggleButton>
                {groups.map((group) => (
                  <ToggleButton key={group.category} value={group.category}>
                    {group.label}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Stack>
          </Paper>

          {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

          {isLoading ? (
            <LoadingSkeleton />
          ) : shownAchievements.length === 0 ? (
            <Alert severity="info">表示できる実績がありません。</Alert>
          ) : (
            <Grid container spacing={2.5}>
              {shownAchievements.map((achievement) => (
                <Grid key={achievement.id} size={{ xs: 12, sm: 6, md: 4 }}>
                  <AchievementCard achievement={achievement} />
                </Grid>
              ))}
            </Grid>
          )}
        </Stack>
      </Container>
    </Box>
  );
}
