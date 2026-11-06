"use client";

import { FeedbackDestination } from "@/app/component/feedbackV1";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
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

import { ContinueLearning } from "@/features/learning/app/ContinueLearning";

import { getHome, type HomeResponse } from "@/api/home.api";
import { AppHeader } from "@/app/component/appHeader";
import { isMascotId, type MascotId } from "@/app/component/mascot";
import { MascotFigure } from "@/app/component/mascotFigure";
import { auth } from "@/lib/firebase";

const weekDays = ["日", "月", "火", "水", "木", "金", "土"];
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
  const [homeData, setHomeData] = useState<HomeResponse | null>(null);
  const [mascotId, setMascotId] = useState<MascotId>("red-panda");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
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
        setMascotId(isMascotId(data.user.selectedMascotId) ? data.user.selectedMascotId : "red-panda");
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
        <AppHeader /><FeedbackDestination failed={!!errorMessage} ready={!isLoading && !!homeData && !errorMessage} />
        <Container maxWidth={false} sx={{ maxWidth: 1440, py: { xs: 3, md: 4 } }}>
          <ContinueLearning />
          <HomeSkeleton />
        </Container>
      </Box>
    );
  }

  if (!homeData) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "#f3f6fb" }}>
        <AppHeader /><FeedbackDestination failed={!!errorMessage} ready={!isLoading && !!homeData && !errorMessage} />
        <Container maxWidth={false} sx={{ maxWidth: 1440, py: { xs: 3, md: 4 } }}>
          <ContinueLearning />
          <Alert severity="error">{errorMessage ?? "ホーム情報がありません。"}</Alert>
        </Container>
      </Box>
    );
  }

  const userData = homeData.user;
  const weekEntries = buildCurrentWeek(homeData.calendar);
  const levelProgress =
    userData.requireNextLevelExp === 0
      ? 0
      : Math.min(100, (userData.exp / userData.requireNextLevelExp) * 100);
  const displayName = userData.displayName?.trim() || "Engineer";

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f3f6fb" }}>
      <AppHeader /><FeedbackDestination failed={!!errorMessage} ready={!isLoading && !!homeData && !errorMessage} />

      <Container maxWidth={false} sx={{ maxWidth: 1440, py: { xs: 3, md: 4 } }}>
        <ContinueLearning />
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
                    <MascotFigure mascotId={mascotId} state="normal" alt="ユーザーの相棒" size="L" grounding="disc" />
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
                      <Typography color="text.secondary">
                        {homeData.nextRank
                          ? `次のランクは「${homeData.nextRank.name}」`
                          : "最高ランクに到達済み"}
                      </Typography>
                    </Box>
                  </Stack>
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
                    <MascotFigure mascotId={mascotId} alt="応援する相棒" size="S" presentation="circle" />
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
            <Card sx={{ borderRadius: 3, border: "1px solid #e2e8f0", boxShadow: "0 12px 30px rgba(15,23,42,0.06)" }}>
              <CardContent sx={{ p: 3 }}>
                <Stack spacing={2}>
                  <Typography variant="h5" fontWeight={950}>ほかの単元を探す</Typography>
                  <Typography color="text.secondary" sx={{ lineHeight: 1.8 }}>
                    コース一覧から学びたい単元を選べます。
                  </Typography>
                  <Button component={Link} href="/courses" variant="contained" sx={{ width: "fit-content", fontWeight: 950 }}>
                    コース一覧を見る
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
      <Skeleton variant="rounded" height={220} sx={{ borderRadius: 3 }} />
    </Stack>
  </Box>
);
