"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { Alert, Box, Container, Stack } from "@mui/material";

import { AppHeader } from "@/app/component/appHeader";
import { PageTransitionOverlay } from "@/app/component/pageTransitionOverlay";
import { getCourseRoadmap } from "@/api/courses.api";
import { auth } from "@/lib/firebase";
import { useNavigationFeedback } from "@/hooks/useNavigationFeedback";
import type { CourseRoadmap } from "../type";
import { CourseRoadmapFlow } from "./components/courseRoadmapFlow";
import { RoadmapHeader } from "./components/roadmapHeader";
import { RoadmapSkeleton } from "./components/roadmapSkeleton";

export default function CourseRoadmapPage() {
  const params = useParams<{ courseId: string }>();
  const router = useRouter();
  const courseId = params.courseId;
  const { showOverlay, startNavigation } = useNavigationFeedback();

  const [course, setCourse] = useState<CourseRoadmap | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        if (!isMounted) return;

        setCourse(null);
        setErrorMessage("ログイン情報を取得できませんでした。");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage(null);

        const token = await user.getIdToken();
        const data = await getCourseRoadmap(token, courseId);

        if (!isMounted) return;

        setCourse(data);
      } catch (error) {
        console.error("Failed to fetch course roadmap:", error);

        if (!isMounted) return;

        setCourse(null);
        setErrorMessage("コースロードマップの取得に失敗しました。");
      } finally {
        if (!isMounted) return;

        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [courseId]);

  const handleMissionClick = (missionId: string) => {
    startNavigation(() => {
      router.push(`/mission/${encodeURIComponent(missionId)}/play`);
    });
  };

  const handleMissionDetailClick = (missionId: string) => {
    startNavigation(() => {
      router.push(`/mission/${encodeURIComponent(missionId)}/overview`);
    });
  };

  const handleNextMissionClick = () => {
    if (!course?.nextMission) {
      return;
    }

    handleMissionClick(course.nextMission.id);
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f3f6fb" }}>
      <AppHeader />
      <PageTransitionOverlay open={showOverlay} message="ミッションを準備しています..." />

      <Container maxWidth={false} sx={{ maxWidth: 1480, py: 4 }}>
        {isLoading && <RoadmapSkeleton />}

        {!isLoading && errorMessage && <Alert severity="error">{errorMessage}</Alert>}

        {!isLoading && !errorMessage && course && (
          <Stack spacing={3}>
            <RoadmapHeader course={course} onNextMissionClick={handleNextMissionClick} />
            <CourseRoadmapFlow
              course={course}
              onMissionClick={handleMissionClick}
              onMissionDetailClick={handleMissionDetailClick}
            />
          </Stack>
        )}
      </Container>
    </Box>
  );
}
