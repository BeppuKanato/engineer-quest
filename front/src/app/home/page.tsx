"use client";

import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import BoltIcon from "@mui/icons-material/Bolt";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import MovingIcon from "@mui/icons-material/Moving";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Fade,
  Grid,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";

import { getHome, type HomeResponse } from "@/api/home.api";
import { AppHeader } from "@/app/component/appHeader";
import { MonthlyCalender } from "@/app/component/monthlyCalender";
import { SummaryCard } from "@/app/component/summaryCard";
import { auth } from "@/lib/firebase";

import { MissionHeroCard } from "./component/missionHeroCard";
import { NextRankInfo } from "./component/nextRankInfo";
import { TargetAchievementInfo } from "./component/targetAchievementInfo";
import type { Mission, MissionTab, Status } from "./type";

const fallbackUserData = {
  rank: "Junior",
  level: 1,
  requireNextLevelExp: 100,
  exp: 0,
  completedMissionNum: 0,
  completedAchievementNum: 0,
  continuationDays: 0,
  totalDays: 0,
};

const fallbackMission: Mission = {
  id: "fallback-mission",
  title: "Missionを選んで学習を始める",
  difficulty: 1,
  goalImg: "/images/goals/sample.png",
  description: "Course一覧から取り組むMissionを選び、学習を進めましょう。",
  progress: 0,
  ctaLabel: "Courseを見る",
  badgeLabel: "Start",
  href: "/courses",
};

const fallbackRankCondition: Record<string, { title: string; status: Status }[]> = {
  mission: [{ title: "Missionを完了する", status: "incomplete" }],
};

const fallbackCalendar = {
  year: new Date().getFullYear(),
  month: new Date().getMonth(),
  date: new Date().getDate(),
  learnedDays: [] as number[],
  hasLearnedToday: false,
};

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<MissionTab>("resume");
  const [goalView, setGoalView] = useState<"rank" | "achievement">("rank");
  const [homeData, setHomeData] = useState<HomeResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        if (!isMounted) return;
        setHomeData(null);
        setErrorMessage("ログインが必要です。");
        return;
      }

      try {
        setErrorMessage(null);
        const token = await user.getIdToken();
        const data = await getHome(token);

        if (!isMounted) return;
        setHomeData(data);
      } catch (error) {
        console.error(error);
        if (!isMounted) return;
        setHomeData(null);
        setErrorMessage("Homeデータを取得できませんでした。");
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const userData = homeData?.user ?? fallbackUserData;
  const resumeMission = homeData?.missions.resume ?? fallbackMission;
  const recommendedMission = homeData?.missions.recommended ?? resumeMission;
  const activeMission =
    activeTab === "resume" ? resumeMission : recommendedMission;
  const nextRankInfo = homeData?.nextRank ?? { name: "Senior" };
  const nextRankCondition =
    homeData?.nextRankCondition ?? fallbackRankCondition;
  const targetAchievement = homeData?.targetAchievement ?? null;
  const calendar = homeData?.calendar ?? fallbackCalendar;
  const remainingExp = Math.max(
    0,
    userData.requireNextLevelExp - userData.exp
  );
  const levelProgress =
    userData.requireNextLevelExp === 0
      ? 0
      : Math.min(100, (userData.exp / userData.requireNextLevelExp) * 100);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#F7F8FC" }}>
      <AppHeader />

      <Container maxWidth={false} sx={{ maxWidth: 1120, py: 4 }}>
        <Stack spacing={3.5}>
          {errorMessage && <Alert severity="warning">{errorMessage}</Alert>}

          <MissionHeroCard
            mission={activeMission}
            tab={activeTab}
            onChangeTab={setActiveTab}
          />

          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <SummaryCard
                icon={<EmojiEventsIcon fontSize="small" />}
                label="ランク"
                value={userData.rank}
                accentColor="#F59E0B"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <SummaryCard
                icon={<MovingIcon fontSize="small" />}
                label="レベル"
                value={userData.level}
                subtext={`次のレベルまで ${remainingExp} EXP`}
                accentColor="#6174F3"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <SummaryCard
                icon={<BoltIcon fontSize="small" />}
                label="EXP"
                value={userData.exp.toLocaleString()}
                progress={levelProgress}
                accentColor="#4CAF50"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <SummaryCard
                icon={<CheckCircleIcon fontSize="small" />}
                label="完了ミッション"
                value={userData.completedMissionNum}
                subtext={`実績 ${userData.completedAchievementNum} 件`}
                accentColor="#1976D2"
              />
            </Grid>
          </Grid>

          <Card
            sx={{
              borderRadius: 4,
              border: "1px solid #FED7AA",
              bgcolor: "#FFF7ED",
              boxShadow: "0 8px 22px rgba(251, 146, 60, 0.08)",
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                alignItems={{ xs: "flex-start", sm: "center" }}
                justifyContent="space-between"
              >
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: 2,
                      display: "grid",
                      placeItems: "center",
                      bgcolor: "#FFEDD5",
                      color: "#EA580C",
                    }}
                  >
                    <LocalFireDepartmentIcon />
                  </Box>
                  <Box>
                    <Typography fontWeight={900}>
                      {userData.continuationDays}日連続で学習中
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {calendar.hasLearnedToday
                        ? "今日は学習済みです。この調子で積み上げを残していきましょう。"
                        : "今日はまだ学習履歴がありません。Activityを1つ完了すると継続に反映されます。"}
                    </Typography>
                  </Box>
                </Stack>
                <Chip
                  label={calendar.hasLearnedToday ? "Today complete" : "Today pending"}
                  color={calendar.hasLearnedToday ? "success" : "warning"}
                  sx={{ fontWeight: 900 }}
                />
              </Stack>
            </CardContent>
          </Card>

          <Grid container spacing={2.5} alignItems="stretch">
            <Grid size={{ xs: 12, md: 7 }}>
              <Card
                sx={{
                  height: "100%",
                  borderRadius: 4,
                  border: "1px solid #E8ECF4",
                  boxShadow: "0 8px 22px rgba(17, 24, 39, 0.04)",
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    height: 4,
                    bgcolor: goalView === "rank" ? "#F59E0B" : "#8B5CF6",
                  }}
                />
                <CardContent sx={{ p: 3, height: "100%" }}>
                  <Stack spacing={3}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Typography variant="h5" fontWeight={800}>
                        進行目標
                      </Typography>

                      <ToggleButtonGroup
                        value={goalView}
                        exclusive
                        onChange={(_, value) => {
                          if (value !== null) setGoalView(value);
                        }}
                        size="small"
                        sx={{
                          bgcolor: "#F8FAFC",
                          borderRadius: 2.5,
                          p: 0.25,
                          gap: 0.5,
                          "& .MuiToggleButton-root": {
                            px: 1.75,
                            py: 0.6,
                            borderRadius: 2,
                            border: "1px solid transparent",
                            color: "#64748B",
                            fontWeight: 700,
                            fontSize: 12,
                            textTransform: "none",
                            lineHeight: 1.2,
                            "&:hover": {
                              bgcolor: "#EEF2F7",
                            },
                          },
                          "& .Mui-selected": {
                            bgcolor: "#FFFFFF",
                            color: "#111827",
                            borderColor: "#E5E7EB",
                            boxShadow: "0 1px 2px rgba(15, 23, 42, 0.06)",
                          },
                          "& .Mui-disabled": {
                            opacity: 0.45,
                          },
                        }}
                      >
                        <ToggleButton value="rank">RANK</ToggleButton>
                        <ToggleButton
                          value="achievement"
                          disabled={!targetAchievement}
                        >
                          ACHIEVEMENT
                        </ToggleButton>
                      </ToggleButtonGroup>
                    </Stack>
                    <Fade in timeout={220} key={goalView}>
                      <Box sx={{ pt: 0.5 }}>
                        {goalView === "rank" || !targetAchievement ? (
                          <NextRankInfo
                            nextRankInfo={nextRankInfo}
                            nextRankCondition={nextRankCondition}
                          />
                        ) : (
                          <TargetAchievementInfo
                            title={targetAchievement.title}
                            factor={targetAchievement.factor}
                          />
                        )}
                      </Box>
                    </Fade>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 5 }}>
              <Card
                sx={{
                  height: "100%",
                  borderRadius: 4,
                  border: "1px solid #E8ECF4",
                  boxShadow: "0 8px 22px rgba(17,24,39,0.04)",
                  overflow: "hidden",
                }}
              >
                <Box sx={{ height: 4, bgcolor: "#6174F3" }} />
                <CardContent
                  sx={{
                    p: 3,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <Stack
                    direction="row"
                    spacing={1.25}
                    alignItems="center"
                    sx={{ mb: 2 }}
                  >
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: 2,
                        bgcolor: "#6174F318",
                        color: "#6174F3",
                        display: "grid",
                        placeItems: "center",
                      }}
                    >
                      <CalendarMonthIcon fontSize="small" />
                    </Box>
                    <Typography variant="h5" fontWeight={800}>
                      学習カレンダー
                    </Typography>
                  </Stack>

                  <Box sx={{ flexGrow: 1 }}>
                    <MonthlyCalender
                      year={calendar.year}
                      month={calendar.month}
                      date={calendar.date}
                      learnedDays={calendar.learnedDays}
                    />
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Grid container spacing={1.5}>
                    <Grid size={6}>
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: 3,
                          bgcolor: "#6174F310",
                          textAlign: "center",
                        }}
                      >
                        <Typography variant="caption" color="text.secondary">
                          継続日数
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: 28,
                            fontWeight: 800,
                            color: "#6174F3",
                          }}
                        >
                          {userData.continuationDays}日
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid size={6}>
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: 3,
                          bgcolor: "#4CAF5010",
                          textAlign: "center",
                        }}
                      >
                        <Typography variant="caption" color="text.secondary">
                          学習日数
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: 28,
                            fontWeight: 800,
                            color: "#4CAF50",
                          }}
                        >
                          {userData.totalDays}日
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Stack>
      </Container>
    </Box>
  );
}
