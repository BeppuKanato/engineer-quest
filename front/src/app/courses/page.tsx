"use client";

import { FeedbackDestination } from "@/app/component/feedbackV1";
import { Box, Container, Stack, Typography } from "@mui/material";
import { useEffect, useRef, useState } from "react";

import { getCourses } from "@/api/courses.api";
import { withLearningProgress } from "./courseProgress";
import { AppBreadcrumbs } from "@/app/component/appBreadcrumbs";
import { useUserSession } from "@/app/component/userSession";
import { peekClientQueryData } from "@/lib/clientQueryCache";
import { ApiError } from "@/lib/fetcher";

import { AppHeader } from "../component/appHeader";
import { CoursesDesign } from "./component/coursesDesign";
import { CourseSkeleton } from "./component/courseSkeleton";
import type { Course } from "./type";

export default function CoursesPage() {
  const { status, token } = useUserSession();
  const [cachedCourses] = useState(() => peekClientQueryData<Course[]>("courses"));
  const [isLoading, setIsLoading] = useState(!cachedCourses);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>(cachedCourses ?? []);
  const coursesRef = useRef(courses);
  coursesRef.current = courses;
  const requestRef = useRef(0);

  useEffect(() => {
    if (status === "loading") return;
    if (status !== "authenticated" || !token) {
      setIsLoading(false);
      if (coursesRef.current.length === 0) setErrorMessage("ログインが必要です。");
      return;
    }

    const request = ++requestRef.current;
    void (async () => {
      try {
        setErrorMessage(null);
        const data = await getCourses(token);

        const merged = await withLearningProgress(token, data);
        if (request !== requestRef.current) return;
        setCourses(merged);
      } catch (error) {
        if (request !== requestRef.current) return;
        // 前回データがある場合は保持し、エラー表示で一覧を消さない。
        if (coursesRef.current.length > 0) {
          console.error(error);
          return;
        }
        if (error instanceof ApiError) {
          if (error.status === 401) {
            setErrorMessage("ログインの有効期限が切れました。再ログインしてください。");
            return;
          }
          if (error.status === 404) {
            setErrorMessage("ユーザー情報が見つかりませんでした。");
            return;
          }
          if (error.status >= 500) {
            setErrorMessage("サーバー側でエラーが発生しました。時間をおいて再度お試しください。");
            return;
          }
        }
        setErrorMessage("コース情報の取得に失敗しました。");
      } finally {
        if (request === requestRef.current) setIsLoading(false);
      }
    })();
  }, [status, token]);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f3f6fb" }}>
      <AppHeader /><FeedbackDestination failed={!!errorMessage} ready={!isLoading && !errorMessage} />

      <Container maxWidth={false} sx={{ maxWidth: 1440, py: { xs: 3, md: 4 } }}>
        <Stack spacing={3}>
          <AppBreadcrumbs items={[{ label: "コース" }]} />
          {isLoading ? (
            <CourseSkeleton />
          ) : errorMessage ? (
            <Box sx={{ p: 4, borderRadius: 3, border: "1px solid #fecaca", bgcolor: "#fff7f7", textAlign: "center" }}>
              <Typography fontWeight={900} color="error">
                {errorMessage}
              </Typography>
            </Box>
          ) : (
            <CoursesDesign courses={courses} />
          )}
        </Stack>
      </Container>
    </Box>
  );
}
