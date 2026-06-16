"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Alert, Box, CircularProgress, Container, Stack, Typography } from "@mui/material";

import { AppHeader } from "../../../../../component/appHeader";
import { LessonCompleteCard } from "./component/LessonCompleteCard";
import type { LessonCompleteData } from "./type";

import { auth } from "@/lib/firebase";
import { getLessonComplete } from "@/api/mission.api";
import { LessonCompleteSkeleton } from "./component/skeleton";

export default function LessonCompletePage() {
  const params = useParams<{
    missionId: string;
    lessonId: string;
  }>();

  const router = useRouter();

  const missionId = params.missionId;
  const lessonId = params.lessonId;

  const [completeData, setCompleteData] = useState<LessonCompleteData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  useEffect(() => {
    const fetchLessonComplete = async () => {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        const token = await auth.currentUser?.getIdToken();

        if (!token) {
          setErrorMessage("ログイン情報を取得できませんでした。");
          return;
        }

        const data = await getLessonComplete(token, lessonId);

        setCompleteData(data);
      } catch (error) {
        console.error(error);
        setErrorMessage("レッスン完了情報の取得に失敗しました。");
      } finally {
        setIsLoading(false);
      }
    };

    if (lessonId) {
      fetchLessonComplete();
    }
  }, [lessonId]);

  const handleClickNextLesson = () => {
    if (!completeData) return;

    if (completeData.nextLesson) {
      router.push(
        `/mission/${missionId}/lesson/${completeData.nextLesson.id}/play`
      );
      return;
    }

    router.push(`/mission/${missionId}/exam/intro`);
  };

  const handleClickLessonMap = () => {
    router.push(`/mission/${missionId}/overview`);
  };

  const handleClickReview = () => {
    router.push(`/mission/${missionId}/lesson/${lessonId}/play`);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#F7F8FC",
        background:
          "linear-gradient(180deg, #F7F8FC 0%, #F3F7FF 48%, #F7F8FC 100%)",
      }}
    >
      <AppHeader />

      <Box
        component="main"
        sx={{
          minHeight: "calc(100vh - 64px)",
          py: { xs: 4, md: 6 },
        }}
      >
        <Container maxWidth="md">
          {isLoading && (
            <LessonCompleteSkeleton />
          )}

          {!isLoading && errorMessage && (
            <Alert severity="error">{errorMessage}</Alert>
          )}

          {!isLoading && !errorMessage && completeData && (
            <LessonCompleteCard
              lesson={completeData.lesson}
              nextLesson={completeData.nextLesson}
              completedLessonCount={completeData.completedLessonCount}
              totalLessonCount={completeData.totalLessonCount}
              onClickNextLesson={handleClickNextLesson}
              onClickLessonMap={handleClickLessonMap}
              onClickReview={handleClickReview}
            />
          )}
        </Container>
      </Box>
    </Box>
  );
}