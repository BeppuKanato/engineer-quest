"use client";
import { Alert, Box, Container, Skeleton, Stack } from "@mui/material";
import { useEffect, useState } from "react";
import { getHome, type HomeResponse } from "@/api/home.api";
import { AppHeader } from "@/app/component/appHeader";
import { FeedbackDestination } from "@/app/component/feedbackV1";
import { useUserSession } from "@/app/component/userSession";
import { HomeDashboard } from "@/features/home/HomeDashboard";
import { BigGoalBanner } from "@/features/learning/app/bigGoal/BigGoalBanner";
import { DailyReviewCard } from "@/features/learning/daily-review/DailyReviewCard";
import { peekClientQueryData } from "@/lib/clientQueryCache";

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
      {homeData ? <HomeDashboard data={homeData} review={<DailyReviewCard />} currentGoal={homeData.hasInProgressUnit ? <BigGoalBanner currentOnly /> : undefined} /> : isLoading ? <Stack spacing={3}><Skeleton variant="rounded" height={260} /><Skeleton variant="rounded" height={180} /></Stack> : null}
    </Container>
  </Box>;
}
