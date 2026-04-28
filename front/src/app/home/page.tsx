"use client"

import { useState } from "react"
import { Box, Card, CardContent, Container, Divider, Fade, Grid, Stack, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material"
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import MovingIcon from "@mui/icons-material/Moving";
import BoltIcon from "@mui/icons-material/Bolt";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import { AppHeader } from "../component/appHeader";
import { MonthlyCalender } from "../component/monthlyCalender";
import { Mission, MissionTab } from "./type";
import { MissionHeroCard } from "./component/missionHeroCard";
import { SummaryCard } from "../component/summaryCard";
import { NextRankCard } from "./component/nextRankCard";
import { TargetAchievementCard } from "./component/targetAchievementCard";

enum Status {
    Complete = "complete",
    Incomplete = "incomplete"
}

const userData = {
    rank: "Junior",
    level: 12,
    requireNextLevelExp: 2000,
    exp: 1550,
    completedMissionNum: 28,
    completedAchievementNum: 5,
    continuationDays: 3,
    totalDays: 15
};

const continueMission: Mission = {
  id: "continue-mission",
  title: "Reactフックの基礎",
  difficulty: 1,
  goalImg: "/images/goals/sample.png",
  description:
    "useStateとuseEffectを使って、インタラクティブなコンポーネントを作成しましょう。",
  progress: 75,
  ctaLabel: "続きから始める",
  badgeLabel: "再開",
};

const recommendMission: Mission = {
  id: "recommend-mission",
  title: "状態管理の基本",
  difficulty: 2,
  goalImg: "/images/goals/sample.png",
  description:
    "複数コンポーネント間で状態を整理し、見通しのよい設計を学びましょう。",
  progress: 20,
  ctaLabel: "ミッション開始",
  badgeLabel: "おすすめ",
};

const nextRankInfo = {
  name: "Senior",
};

const nextRankCondition: Record<string, { title: string; status: Status }[]> = {
  mission: [
    { title: "ミッション1", status: Status.Complete },
    { title: "ミッション2", status: Status.Complete },
    { title: "ミッション3", status: Status.Complete },
  ],
  achievement: [
    { title: "実績1", status: Status.Complete },
    { title: "実績2", status: Status.Complete },
    { title: "実績3", status: Status.Incomplete },
  ],
};

const targetAchievement: {title: string, factor: {name: string, goal: number, progress: number}[]} | null= 
{
    title: "継続マスター",
    factor: [
        {
            name: "7日連続でログイン",
            goal: 7,
            progress: 4
        },
        {
            name: "累計30日ログイン",
            goal: 30,
            progress: 15
        }
    ]
} 

export default function HomePage() {
    const [activaTab, setActiveTab] = useState<MissionTab>("resume");
    const [goalView, setGoalView] = useState<"rank" | "achievement">("rank");
    const activeMission = activaTab === "resume" ? continueMission : recommendMission;
   
    const levelProgress = (userData.exp / userData.requireNextLevelExp) * 100;

    return (
        <Box sx={{ minHeight: "100vh", bgcolor: "#F7F8FC"}} >
            <AppHeader/ >
            
            <Container maxWidth={false} sx={{ maxWidth: 1120, py: 4 }}>
                <Stack spacing={3.5}>
                    <MissionHeroCard
                        mission={activeMission}
                        tab={activaTab}
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
                                subtext={`次のレベルまで ${userData.requireNextLevelExp - userData.exp} EXP`}
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
                                accentColor="#1976D2"
                            />
                        </Grid>
                    </Grid>

                    <Grid container spacing={2.5} alignItems="stretch">
                        <Grid size={{ xs: 12, md: 7}}>
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
                                                onChange={(_, value) => {if (value !== null) setGoalView(value); }}
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
                                                <ToggleButton value="achievement" disabled={!targetAchievement}>ACHIEVEMENT</ToggleButton>
                                            </ToggleButtonGroup>
                                        </Stack>
                                        <Fade in timeout={220} key={goalView}>
                                            <Box sx={{ pt: 0.5 }}>
                                                {goalView === "rank" || !targetAchievement ? (
                                                    <NextRankCard
                                                        nextRankInfo={nextRankInfo}
                                                        nextRankCondition={nextRankCondition}
                                                    />):
                                                    <TargetAchievementCard
                                                        title={targetAchievement.title}
                                                        factor={targetAchievement.factor}
                                                    /> 
                                                }
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
                                    <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 2 }}>
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
                                        <MonthlyCalender year={2026} month={3} date={21} />
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
                                                <Typography sx={{ fontSize: 28, fontWeight: 800, color: "#6174F3" }}>
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
                                                <Typography sx={{ fontSize: 28, fontWeight: 800, color: "#4CAF50" }}>
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
    )
}