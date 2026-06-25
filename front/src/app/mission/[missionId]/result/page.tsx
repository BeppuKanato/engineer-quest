"use client";

import { Alert, Box, Container } from "@mui/material";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AppHeader } from "@/app/component/appHeader";
import { PageTransitionOverlay } from "@/app/component/pageTransitionOverlay";
import { useNavigationFeedback } from "@/hooks/useNavigationFeedback";

import type { CompleteMissionResponse } from "../play/type";
import { MissionResultCard } from "./components/missionResultCard";

export default function MissionResultPage() {
  const params = useParams<{ missionId: string }>();
  const missionId = params.missionId;
  const router = useRouter();
  const { showOverlay, startNavigation } = useNavigationFeedback();

  const [result, setResult] = useState<CompleteMissionResponse | null>(null);

  useEffect(() => {
    const storedResult = window.sessionStorage.getItem(
      `mission-result:${missionId}`
    );

    if (!storedResult) {
      return;
    }

    try {
      setResult(JSON.parse(storedResult) as CompleteMissionResponse);
    } catch {
      setResult(null);
    }
  }, [missionId]);

  const handleNextMission = () => {
    const nextMission = result?.nextMission;

    if (!nextMission) return;

    startNavigation(() => {
      router.push(`/mission/${encodeURIComponent(nextMission.id)}/play`);
    });
  };

  const handleCourseRoadmap = () => {
    if (!result) return;

    startNavigation(() => {
      router.push(
        `/courses/roadmap/${encodeURIComponent(result.mission.courseId)}`
      );
    });
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#F7F8FC" }}>
      <AppHeader />
      <PageTransitionOverlay open={showOverlay} message="次の画面を準備しています..." />

      <Container maxWidth="md" sx={{ py: 5 }}>
        {!result ? (
          <Alert severity="info">
            ミッション結果を表示できませんでした。コース一覧から再度確認してください。
          </Alert>
        ) : (
          <MissionResultCard
            result={result}
            onNextMission={handleNextMission}
            onCourseRoadmap={handleCourseRoadmap}
          />
        )}
      </Container>
    </Box>
  );
}
