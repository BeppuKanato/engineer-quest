"use client";

import React, { useEffect, useState } from "react";
import { Alert, Box, Container } from "@mui/material";
import { useParams, useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";

import { AppHeader } from "@/app/component/appHeader";
import { PageTransitionOverlay } from "@/app/component/pageTransitionOverlay";
import { getMissionExamIntro, startMissionExam } from "@/api/mission.api";
import { auth } from "@/lib/firebase";
import { useNavigationFeedback } from "@/hooks/useNavigationFeedback";

import { MissionExamIntroCard } from "./components/missionExamIntroCard";
import { MissionExamIntroSkeleton } from "./components/skeleton";
import { defaultExamDifficulty } from "./difficulty";
import type { Difficulty, ExamIntroData } from "./type";

export default function MissionExamIntroPage() {
  const params = useParams<{ missionId: string }>();
  const router = useRouter();

  const missionId = params.missionId;

  const { showOverlay, startNavigation, resetNavigation } =
    useNavigationFeedback();

  const [examIntroData, setExamIntroData] = useState<ExamIntroData | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>(
    defaultExamDifficulty
  );
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        if (!isMounted) return;

        setExamIntroData(null);
        setErrorMessage("ログイン情報を取得できませんでした。");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage(null);

        const token = await user.getIdToken();
        const data = await getMissionExamIntro(token, missionId);

        if (!isMounted) return;

        setExamIntroData(data);
      } catch (error) {
        console.error("Failed to fetch mission exam intro:", error);

        if (!isMounted) return;

        setExamIntroData(null);
        setErrorMessage("ミッション確認テストの情報を取得できませんでした。");
      } finally {
        if (!isMounted) return;

        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [missionId]);

  const handleStart = () => {
    startNavigation(async () => {
      try {
        setErrorMessage(null);

        const token = await auth.currentUser?.getIdToken();

        if (!token) {
          setErrorMessage("ログイン情報を取得できませんでした。");
          resetNavigation();
          return;
        }

        await startMissionExam(token, missionId, difficulty);

        router.push(
          `/mission/${encodeURIComponent(
            missionId
          )}/exam/play?difficulty=${difficulty}`
        );
      } catch (error) {
        console.error("Failed to start mission exam:", error);
        setErrorMessage("確認テストの開始に失敗しました。");
        resetNavigation();
      }
    });
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#F7F8FC" }}>
      <AppHeader />

      <PageTransitionOverlay
        open={showOverlay}
        message="確認テストを準備しています..."
      />

      <Box
        sx={{
          minHeight: "calc(100vh - 64px)",
          display: "flex",
          alignItems: { xs: "flex-start", md: "center" },
          py: { xs: 3, md: 4 },
        }}
      >
        <Container maxWidth="md">
          {isLoading && <MissionExamIntroSkeleton />}

          {!isLoading && errorMessage && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errorMessage}
            </Alert>
          )}

          {!isLoading && !errorMessage && examIntroData && (
            <MissionExamIntroCard
              data={examIntroData}
              difficulty={difficulty}
              onChangeDifficulty={setDifficulty}
              onStart={handleStart}
            />
          )}

          {!isLoading && errorMessage && examIntroData && (
            <MissionExamIntroCard
              data={examIntroData}
              difficulty={difficulty}
              onChangeDifficulty={setDifficulty}
              onStart={handleStart}
            />
          )}
        </Container>
      </Box>
    </Box>
  );
}