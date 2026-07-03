"use client";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StarIcon from "@mui/icons-material/Star";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  LinearProgress,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";
import { useEffect, useState } from "react";

import { getHome, type HomeResponse } from "@/api/home.api";
import { AppHeader } from "@/app/component/appHeader";
import { auth } from "@/lib/firebase";

import { MissionHeroCard } from "./component/missionHeroCard";
import type { MissionTab } from "./type";

const weekDays = ["日", "月", "火", "水", "木", "金", "土"];
const mascotIds = ["red-panda", "penguin", "owl"] as const;
type MascotId = (typeof mascotIds)[number];

const buildCurrentWeek = (calendar: HomeResponse["calendar"]) => {
  const today = new Date(calendar.year, calendar.month, calendar.date);
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    const isCurrentMonth = date.getFullYear() === calendar.year && date.getMonth() === calendar.month;
    return {
      label: weekDays[date.getDay()],
      day: date.getDate(),
      checked: isCurrentMonth && calendar.learnedDays.includes(date.getDate()),
      isToday: date.toDateString() === today.toDateString(),
    };
  });
};

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<MissionTab>("today");
  const [homeData, setHomeData] = useState<HomeResponse | null>(null);
  const [storedTargetAchievement, setStoredTargetAchievement] = useState<HomeResponse["targetAchievement"]>(null);
  const [mascotId, setMascotId] = useState<MascotId>("red-panda");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem("engineerQuest.targetAchievement");
    if (stored) {
      try {
        setStoredTargetAchievement(JSON.parse(stored));
      } catch {
        setStoredTargetAchievement(null);
      }
    }
    const storedMascot = window.localStorage.getItem("engineerQuest.companionMascot");
    if (storedMascot && mascotIds.includes(storedMascot as MascotId)) {
      setMascotId(storedMascot as MascotId);
    }

    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        if (!isMounted) return;
        setHomeData(null);
        setErrorMessage("ログインが必要です。");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage(null);
        const token = await user.getIdToken();
        const data = await getHome(token);

        if (!isMounted) return;
        setHomeData(data);
      } catch (error) {
        console.error(error);
        if (!isMounted) return;
        setHomeData(null);
        setErrorMessage("ホーム情報を取得できませんでした。");
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

  if (isLoading) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "#f3f6fb" }}>
        <AppHeader />
        <Container maxWidth={false} sx={{ maxWidth: 1440, py: { xs: 3, md: 4 } }}>
          <HomeSkeleton />
        </Container>
      </Box>
    );
  }

  if (!homeData) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "#f3f6fb" }}>
        <AppHeader />
        <Container maxWidth={false} sx={{ maxWidth: 1440, py: { xs: 3, md: 4 } }}>
          <Alert severity="error">{errorMessage ?? "ホーム情報がありません。"}</Alert>
        </Container>
      </Box>
    );
  }

  const userData = homeData.user;
  const resumeMission = homeData.missions.resume ?? homeData.missions.recommended;
  const recommendedMission = homeData.missions.recommended;
  const targetAchievement = storedTargetAchievement;
  const weekEntries = buildCurrentWeek(homeData.calendar);
  const remainingExp = Math.max(0, userData.requireNextLevelExp - userData.exp);
  const levelProgress =
    userData.requireNextLevelExp === 0
      ? 0
      : Math.min(100, (userData.exp / userData.requireNextLevelExp) * 100);
  const displayName = userData.displayName?.trim() || "Engineer";
  const recommendedMissions = [
    ...(homeData.missions.recommendedList ?? []),
    ...(recommendedMission ? [recommendedMission] : []),
  ]
    .filter((mission, index, missions) => missions.findIndex((item) => item.id === mission.id) === index)
    .slice(0, 3);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f3f6fb" }}>
      <AppHeader />

      <Container maxWidth={false} sx={{ maxWidth: 1440, py: { xs: 3, md: 4 } }}>
        {errorMessage && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            {errorMessage}
          </Alert>
        )}

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "360px minmax(0, 1fr)" },
            gap: 3,
            alignItems: "start",
          }}
        >
          <Stack spacing={3}>
            <Card sx={{ borderRadius: 3, border: "1px solid #e2e8f0", boxShadow: "0 12px 30px rgba(15,23,42,0.06)" }}>
              <CardContent sx={{ p: 3 }}>
                <Stack spacing={2.5}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box
                      component="img"
                      src={`/images/mascots/${mascotId}/normal.png`}
                      alt="ユーザーの相棒"
                      sx={{ width: 132, height: 132, objectFit: "cover", borderRadius: 3 }}
                    />
                    <Box>
                      <Chip label="エンジニア見習い" size="small" sx={{ mb: 1, fontWeight: 900, bgcolor: "#dbeafe", color: "#0b4ac8" }} />
                      <Typography sx={{ fontSize: 28, fontWeight: 950, lineHeight: 1.1 }}>{displayName}</Typography>
                      <Chip label={`Lv. ${userData.level}`} sx={{ mt: 1.5, bgcolor: "#0057e7", color: "#fff", fontWeight: 900 }} />
                    </Box>
                  </Stack>

                  <Box>
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                      <Typography fontWeight={900}>EXP</Typography>
                      <Typography color="text.secondary" fontWeight={800}>
                        {userData.exp.toLocaleString()} / {userData.requireNextLevelExp.toLocaleString()}
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={levelProgress}
                      sx={{ height: 10, borderRadius: 999, bgcolor: "#e5e7eb", "& .MuiLinearProgress-bar": { borderRadius: 999, bgcolor: "#0057e7" } }}
                    />
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 3, border: "1px solid #e2e8f0", boxShadow: "0 12px 30px rgba(15,23,42,0.06)" }}>
              <CardContent sx={{ p: 3 }}>
                <Stack spacing={2.5}>
                  <Stack direction="row" spacing={1.25} alignItems="center">
                    <EmojiEventsIcon sx={{ color: "#b45309" }} />
                    <Typography variant="h6" fontWeight={950}>ランク</Typography>
                  </Stack>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box
                      sx={{
                        width: 72,
                        height: 72,
                        borderRadius: 3,
                        display: "grid",
                        placeItems: "center",
                        color: "#b45309",
                        bgcolor: "#ffedd5",
                      }}
                    >
                      <EmojiEventsIcon sx={{ fontSize: 42 }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontSize: 24, fontWeight: 950 }}>{userData.rank}</Typography>
                      <Typography color="text.secondary">次のランクまで {remainingExp} EXP</Typography>
                    </Box>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={levelProgress}
                    sx={{ height: 10, borderRadius: 999, bgcolor: "#fde68a", "& .MuiLinearProgress-bar": { borderRadius: 999, bgcolor: "#f59e0b" } }}
                  />
                </Stack>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 3, border: "1px solid #e2e8f0", boxShadow: "0 12px 30px rgba(15,23,42,0.06)" }}>
              <CardContent sx={{ p: 3 }}>
                <Stack spacing={2.5}>
                  <Stack direction="row" spacing={1.25} alignItems="center">
                    <LocalFireDepartmentIcon sx={{ color: "#ea580c" }} />
                    <Typography variant="h6" fontWeight={950}>学習ストリーク</Typography>
                  </Stack>
                  <Box>
                    <Typography sx={{ fontSize: 34, fontWeight: 950 }}>
                      {userData.continuationDays}
                      <Box component="span" sx={{ fontSize: 16, ml: 0.75 }}>日連続中</Box>
                    </Typography>
                    <Stack direction="row" spacing={1.1} sx={{ mt: 2 }}>
                      {weekEntries.map((entry) => {
                        return (
                          <Stack key={`${entry.label}-${entry.day}`} spacing={1} alignItems="center">
                            <Typography variant="caption" color={entry.isToday ? "#0057e7" : "text.secondary"} fontWeight={900}>
                              {entry.label}
                            </Typography>
                            <Box
                              sx={{
                                width: 28,
                                height: 28,
                                borderRadius: "50%",
                                display: "grid",
                                placeItems: "center",
                                bgcolor: entry.checked ? "#0057e7" : "#fff",
                                border: "2px solid",
                                borderColor: entry.checked ? "#0057e7" : entry.isToday ? "#0057e7" : "#f59e0b",
                                color: entry.checked ? "#fff" : entry.isToday ? "#0057e7" : "#f59e0b",
                              }}
                            >
                              {entry.checked ? <CheckCircleIcon sx={{ fontSize: 18 }} /> : entry.day}
                            </Box>
                          </Stack>
                        );
                      })}
                    </Stack>
                  </Box>
                  <Box sx={{ p: 2, borderRadius: 3, bgcolor: "#eff6ff", display: "flex", gap: 1.5 }}>
                    <Box component="img" src={`/images/mascots/${mascotId}/happy.png`} alt="応援する相棒" sx={{ width: 54, height: 54, borderRadius: "50%", objectFit: "cover" }} />
                    <Box>
                      <Typography fontWeight={900}>いいペースだよ！</Typography>
                      <Typography variant="body2" color="text.secondary">この調子でスキルをレベルアップしよう。</Typography>
                    </Box>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Stack>

          <Stack spacing={3}>
            <MissionHeroCard
              mission={resumeMission}
              recommendedMission={recommendedMission}
              targetAchievement={targetAchievement}
              todayCompletedMissionCount={userData.todayCompletedMissionCount}
              dailyMissionGoal={userData.dailyMissionGoal}
              mascotId={mascotId}
              tab={activeTab}
              onChangeTab={setActiveTab}
            />

            {resumeMission && (
            <Card sx={{ borderRadius: 3, border: "1px solid #e2e8f0", boxShadow: "0 12px 30px rgba(15,23,42,0.06)" }}>
              <CardContent sx={{ p: 3 }}>
                <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "stretch", md: "center" }} justifyContent="space-between">
                  <Stack spacing={1} sx={{ flex: 1 }}>
                    <Typography variant="h5" fontWeight={950}>続きから再開</Typography>
                    <Typography fontWeight={800}>{resumeMission.title}</Typography>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <LinearProgress
                        variant="determinate"
                        value={resumeMission.progress ?? 0}
                        sx={{ flex: 1, height: 10, borderRadius: 999, bgcolor: "#e5e7eb", "& .MuiLinearProgress-bar": { borderRadius: 999, bgcolor: "#0057e7" } }}
                      />
                      <Typography color="text.secondary" fontWeight={900}>{resumeMission.progress ?? 0}%</Typography>
                    </Stack>
                  </Stack>
                  <Button component={Link} href={resumeMission.href} variant="contained" startIcon={<PlayArrowIcon />} sx={{ minHeight: 56, px: 4, borderRadius: 2, fontWeight: 950 }}>
                    続きから始める
                  </Button>
                </Stack>
              </CardContent>
            </Card>
            )}

            <Card sx={{ borderRadius: 3, border: "1px solid #e2e8f0", boxShadow: "0 12px 30px rgba(15,23,42,0.06)" }}>
              <CardContent sx={{ p: 3 }}>
                <Stack spacing={2.5}>
                  <Stack direction="row" spacing={1.25} alignItems="center">
                    <StarIcon sx={{ color: "#f59e0b" }} />
                    <Typography variant="h5" fontWeight={950}>おすすめミッション</Typography>
                  </Stack>

                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
                      gap: 2,
                    }}
                  >
                    {recommendedMissions.length === 0 ? (
                      <Alert severity="info" sx={{ gridColumn: "1 / -1" }}>おすすめできる未完了ミッションはありません。</Alert>
                    ) : recommendedMissions.map((mission) => (
                      <Box key={mission.id} sx={{ p: 2, borderRadius: 3, border: "1px solid #e2e8f0", bgcolor: "#fff" }}>
                        <Stack spacing={1.5}>
                          <Chip label={mission.badgeLabel || "次におすすめ"} size="small" sx={{ alignSelf: "flex-start", fontWeight: 900, bgcolor: "#eff6ff", color: "#0057e7" }} />
                          <Box
                            component="img"
                            src={mission.goalImg}
                            alt={mission.title}
                            sx={{ width: 64, height: 64, objectFit: "cover", borderRadius: 2 }}
                          />
                          <Typography fontWeight={950}>{mission.title}</Typography>
                          <Typography color="text.secondary" variant="body2">+20 EXP</Typography>
                        </Stack>
                      </Box>
                    ))}
                  </Box>

                  <Button component={Link} href="/courses" sx={{ width: "fit-content", alignSelf: "center", fontWeight: 950 }}>
                    すべて見る
                  </Button>
                </Stack>
              </CardContent>
            </Card>

          </Stack>
        </Box>
      </Container>
    </Box>
  );
}

const HomeSkeleton = () => (
  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "360px minmax(0, 1fr)" }, gap: 3 }}>
    <Stack spacing={3}>
      <Skeleton variant="rounded" height={220} sx={{ borderRadius: 3 }} />
      <Skeleton variant="rounded" height={190} sx={{ borderRadius: 3 }} />
      <Skeleton variant="rounded" height={280} sx={{ borderRadius: 3 }} />
    </Stack>
    <Stack spacing={3}>
      <Skeleton variant="rounded" height={380} sx={{ borderRadius: 3 }} />
      <Skeleton variant="rounded" height={118} sx={{ borderRadius: 3 }} />
      <Skeleton variant="rounded" height={300} sx={{ borderRadius: 3 }} />
    </Stack>
  </Box>
);
