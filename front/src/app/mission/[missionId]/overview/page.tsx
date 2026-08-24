"use client";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LockOutlineIcon from "@mui/icons-material/LockOutline";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import ReplayIcon from "@mui/icons-material/Replay";
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
import type { MissionOverviewResponse } from "./type";

const Loading = () => (
  <Container maxWidth="lg" sx={{ py: 4 }}>
    <Stack spacing={3}>
      <Skeleton variant="rounded" height={300} />
      <Skeleton variant="rounded" height={420} />
    </Stack>
  </Container>
);

export default function MissionOverviewPage() {
  const params = useParams<{ missionId: string }>();
  const router = useRouter();
  const missionId = decodeURIComponent(params.missionId);
  const [mission, setMission] = useState<MissionOverviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { showOverlay, startNavigation } = useNavigationFeedback();

  useEffect(() => {
    let mounted = true;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        if (mounted) {
          setErrorMessage("ログインが必要です。");
          setIsLoading(false);
        }
        return;
      }
      try {
        const data = await getMissionOverview(await user.getIdToken(), missionId);
        if (mounted) setMission(data);
      } catch (error) {
        console.error(error);
        if (mounted) setErrorMessage("Missionの取得に失敗しました。");
      } finally {
        if (mounted) setIsLoading(false);
      }
    });
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [missionId]);

  const completedIds = useMemo(
    () => new Set(mission?.progress.completedActivityIds ?? []),
    [mission],
  );

  if (isLoading) return <Box sx={{ minHeight: "100vh", bgcolor: "#F7F8FC" }}><AppHeader /><Loading /></Box>;
  if (!mission) return <Box sx={{ minHeight: "100vh", bgcolor: "#F7F8FC" }}><AppHeader /><Container maxWidth="lg" sx={{ py: 6 }}><Alert severity="error">{errorMessage}</Alert></Container></Box>;

  const progressValue = mission.activities.length
    ? Math.round((completedIds.size / mission.activities.length) * 100)
    : 0;
  const goToPlay = (review = false) => startNavigation(() => {
    router.push(`/mission/${encodeURIComponent(missionId)}/play${review ? "?review=1" : ""}`);
  });

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#F7F8FC" }}>
      <AppHeader />
      <PageTransitionOverlay open={showOverlay} message="Activityを準備しています..." />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Stack spacing={3}>
          <AppBreadcrumbs items={[
            { label: "コース", href: "/courses" },
            { label: mission.courseTitle, href: `/courses/roadmap/${encodeURIComponent(mission.courseId)}` },
            { label: mission.title },
          ]} />
          <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => startNavigation(() => router.push(`/courses/roadmap/${encodeURIComponent(mission.courseId)}`))} sx={{ alignSelf: "flex-start", bgcolor: "#fff", fontWeight: 900 }}>
            ロードマップへ戻る
          </Button>
          <Paper elevation={0} sx={{ p: { xs: 2.5, md: 4 }, borderRadius: 3, border: "1px solid #e2e8f0" }}>
            <Stack spacing={2.5}>
              <Box>
                <Typography color="text.secondary" fontWeight={800}>Mission</Typography>
                <Typography variant="h3" fontWeight={900}>{mission.title}</Typography>
                <Typography color="text.secondary" sx={{ mt: 1 }}>{mission.description}</Typography>
              </Box>
              <Stack direction="row" gap={1} flexWrap="wrap">
                <DifficultyLabel difficulty={mission.difficulty} variant="chip" />
                <Chip label={`約${mission.estimatedMinutes}分`} sx={{ fontWeight: 900 }} />
                <Chip label={`${mission.activities.length} Activity`} sx={{ fontWeight: 900 }} />
              </Stack>
              <Box>
                <Stack direction="row" justifyContent="space-between"><Typography fontWeight={800}>進捗</Typography><Typography fontWeight={800}>{completedIds.size} / {mission.activities.length}</Typography></Stack>
                <LinearProgress variant="determinate" value={progressValue} sx={{ mt: 1, height: 8, borderRadius: 999 }} />
              </Box>
              {mission.isLocked ? (
                <Alert severity="info" icon={<LockOutlineIcon />}>前のMissionを完了すると開始できます。</Alert>
              ) : (
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                  <Button variant="contained" startIcon={<PlayArrowIcon />} onClick={() => goToPlay()} sx={{ minHeight: 46, fontWeight: 900 }}>
                    {mission.progress.status === "in_progress" ? "続きから始める" : "Activityを始める"}
                  </Button>
                  <Button variant="outlined" startIcon={<ReplayIcon />} onClick={() => goToPlay(true)} sx={{ minHeight: 46, fontWeight: 900 }}>最初から復習する</Button>
                </Stack>
              )}
            </Stack>
          </Paper>
          <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, border: "1px solid #e2e8f0" }}>
            <Typography variant="h5" fontWeight={900}>Activity一覧</Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>上から順番に学習を進めます。</Typography>
            <Stack spacing={1}>
              {mission.activities.map((activity, index) => {
                const completed = completedIds.has(activity.id) || activity.progressStatus === "completed";
                const current = mission.progress.currentActivityId === activity.id;
                return (
                  <Paper key={activity.id} elevation={0} sx={{ p: 2, border: `1px solid ${current ? "#60a5fa" : "#dbe3ef"}`, bgcolor: current ? "#eff6ff" : "#fff" }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      {completed ? <CheckCircleIcon color="success" /> : <Chip size="small" label={index + 1} />}
                      <Box sx={{ flex: 1 }}><Typography fontWeight={900}>{activity.title}</Typography><Typography variant="body2" color="text.secondary">{activity.instruction}</Typography></Box>
                    </Stack>
                  </Paper>
                );
              })}
            </Stack>
          </Paper>
        </Stack>
      </Container>
    </Box>
  );
}
