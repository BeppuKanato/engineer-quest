"use client";
import { Alert, Box, Chip, Container, Paper, Skeleton, Stack, Typography } from "@mui/material";
import FlagIcon from "@mui/icons-material/Flag";
import { useEffect, useState } from "react";
import { getHome, type HomeResponse } from "@/api/home.api";
import { AppHeader } from "@/app/component/appHeader";
import { FeedbackDestination } from "@/app/component/feedbackV1";
import { useUserSession } from "@/app/component/userSession";
import { HomeDashboard } from "@/features/home/HomeDashboard";
import { useGoalCourseId } from "@/features/learning/app/goalStore";
import { findUnitMission } from "@/features/learning/app/missionRegistry";
import { DailyReviewCard } from "@/features/learning/daily-review/DailyReviewCard";
import { peekClientQueryData } from "@/lib/clientQueryCache";

const PRIMARY = "#2563eb";
const GREEN = "#16a34a";
const HAIRLINE = "#e3e9f4";

/**
 * 目標帯（2026-11-27 確定）：大目標（LLM生成）は廃止され、目標は学習者が自分で
 * 設定した単元ミッション（goalStore の旗）を表示する。目標が未設定なら帯は出ない。
 * 進み具合はその単元の段階の完了量（緑）で示す。
 */
function GoalBand({ data }: { data: HomeResponse }) {
  const goalCourseId = useGoalCourseId();
  const unit = goalCourseId ? data.overview.units.find(item => item.id === goalCourseId) : undefined;
  const mission = goalCourseId ? findUnitMission(goalCourseId) : undefined;
  if (!unit || !mission) return null;
  const percent = unit.totalPhases > 0 ? Math.round((unit.completedPhases / unit.totalPhases) * 100) : 0;
  return (
    <Paper component="section" data-home-section="goal" aria-label="目標" elevation={0} sx={{ borderRadius: "18px", border: `1px solid ${HAIRLINE}`, boxShadow: "0 1px 2px rgba(15, 23, 42, 0.05), 0 10px 28px rgba(15, 23, 42, 0.06)", px: { xs: 2.5, md: 3.5 }, py: 2.5 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <FlagIcon sx={{ color: PRIMARY, fontSize: 20 }} />
        <Typography sx={{ fontSize: 14, fontWeight: 900, letterSpacing: "0.08em" }}>目標</Typography>
        <Chip label={unit.title} size="small" sx={{ fontSize: 14, fontWeight: 800, height: 26, bgcolor: "#eef4ff", color: PRIMARY }} />
      </Box>
      <Typography sx={{ fontSize: 22, fontWeight: 900, lineHeight: 1.4, mt: 1 }}>{mission.title}</Typography>
      <Typography sx={{ fontSize: 16, lineHeight: 1.7, mt: 0.25 }}>{mission.description}</Typography>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 1.5 }}>
        <Typography sx={{ fontSize: 14, fontWeight: 800 }}>段階 {unit.completedPhases} / {unit.totalPhases}</Typography>
        <Box sx={{ flex: 1, height: 10, borderRadius: "999px", bgcolor: "#e5eaf3", overflow: "hidden" }} role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label="目標の単元の進み具合">
          <Box sx={{ width: `${percent}%`, height: "100%", bgcolor: GREEN, borderRadius: "999px" }} />
        </Box>
        <Typography sx={{ fontSize: 14, fontWeight: 900, color: GREEN }}>{percent}%</Typography>
      </Box>
    </Paper>
  );
}

export default function HomePage() {
  const { status, token } = useUserSession();
  const [cachedHome] = useState(() => peekClientQueryData<HomeResponse>("home"));
  const [homeData, setHomeData] = useState<HomeResponse | null>(cachedHome ?? null);
  const [isLoading, setIsLoading] = useState(!cachedHome);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  useEffect(() => {
    if (status === "loading") return;
    if (status !== "authenticated" || !token) { setHomeData(null); setIsLoading(false); setErrorMessage("ログインが必要です。"); return; }
    let active = true;
    void getHome(token).then(data => { if (active) { setHomeData(data); setErrorMessage(null); } }, () => { if (active) setErrorMessage("ホーム情報を取得できませんでした。"); }).finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [status, token]);
  return <Box sx={{ minHeight: "100vh", bgcolor: "#f3f6fb" }}>
    <AppHeader /><FeedbackDestination failed={!!errorMessage} ready={!isLoading && !!homeData && !errorMessage} />
    <Container maxWidth={false} sx={{ maxWidth: 1440, py: { xs: 3, md: 4 } }}>
      {errorMessage && <Alert severity={homeData ? "warning" : "error"} sx={{ mb: 3 }}>{errorMessage}</Alert>}
      {homeData ? <HomeDashboard data={homeData} review={<DailyReviewCard />} goalBand={<GoalBand data={homeData} />} /> : isLoading ? <Stack spacing={3}><Skeleton variant="rounded" height={260} /><Skeleton variant="rounded" height={180} /></Stack> : null}
    </Container>
  </Box>;
}
