"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Alert, Box, Container, Grid } from "@mui/material";

import { AppHeader } from "@/app/component/appHeader";
import { getMissionOverview } from "@/api/mission.api";
import { auth } from "@/lib/firebase";

import { LessonRoadmap } from "./component/lessonRoadmap";
import { MissionSummaryCard } from "./component/missionSummaryCard";
import type { Mission } from "./type";
import { MissionOverviewSkeleton } from "./component/skelton";

import { PageTransitionOverlay } from "@/app/component/pageTransitionOverlay";
import { useNavigationFeedback } from "@/hooks/useNavigationFeedback";

export default function MissionOverviewPage() {
  const params = useParams<{ missionId: string }>();
  const router = useRouter();
  const { showOverlay, startNavigation } = useNavigationFeedback();
  const missionId = params.missionId;

  const [mission, setMission] = useState<Mission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchMissionOverview = async () => {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        const token = await auth.currentUser?.getIdToken();

        if (!token) {
          setErrorMessage("ログイン情報を取得できませんでした。");
          return;
        }

        const data = await getMissionOverview(token, missionId);

        setMission(data);
      } catch (error) {
        console.error(error);
        setErrorMessage("ミッション情報の取得に失敗しました。");
      } finally {
        setIsLoading(false);
      }
    };

    if (missionId) {
      fetchMissionOverview();
    }
  }, [missionId]);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#F7F8FC" }}>
      <AppHeader />
      <PageTransitionOverlay
        open={showOverlay}
        message="レッスンを準備しています..." 
      />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {isLoading && <MissionOverviewSkeleton />}

        {!isLoading && errorMessage && (
          <Alert severity="error">{errorMessage}</Alert>
        )}

        {!isLoading && !errorMessage && mission && (
          <Grid container spacing={3} alignItems="flex-start">
            <Grid size={{ xs: 12, md: 4 }}>
              <MissionSummaryCard mission={mission} />
            </Grid>

            <Grid size={{ xs: 12, md: 8 }}>
              <LessonRoadmap
                lessons={mission.lessons}
                missionExam={mission.missionExam}
                onLessonClick={(lessonId) => {
                    startNavigation(() => {
                        router.push(`/mission/${missionId}/lesson/${lessonId}/play`);
                    });
                }}
                onMissionExamClick={() => {
                    startNavigation(() => {
                        router.push(`/mission/${missionId}/exam/intro`);
                    });
                }}
              />
            </Grid>
          </Grid>
        )}
      </Container>
    </Box>
  );
}