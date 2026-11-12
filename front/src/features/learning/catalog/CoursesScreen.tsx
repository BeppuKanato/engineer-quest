"use client";

import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";
import StarIcon from "@mui/icons-material/Star";
import { Box, Container, Stack, Typography } from "@mui/material";
import { useEffect, useMemo, useRef, useState, type ComponentType, type ReactNode } from "react";

import { getCourses } from "@/api/courses.api";
import { withLearningProgress } from "@/features/learning/catalog/courseProgress";
import { AppBreadcrumbs } from "@/components/layouts/AppBreadcrumbs";
import { useUserSession } from "@/lib/session/userSession";
import { peekClientQueryData } from "@/lib/clientQueryCache";
import { ApiError } from "@/lib/fetcher";

import { CourseCard } from "@/features/learning/catalog/components/CourseCard";
import { CourseFilter } from "@/features/learning/catalog/components/CourseFilter";
import { CourseSkeleton } from "@/features/learning/catalog/components/CourseSkeleton";
import type { Course, CourseFilterState } from "@/types/course";

const initialFilter: CourseFilterState = {
  category: "all",
  status: "all",
  difficulty: "all",
};

export function CoursesScreen({ header, FeedbackDestination }: { header: ReactNode; FeedbackDestination: ComponentType<{ failed?: boolean; ready: boolean }> }) {
  const { status, token } = useUserSession();
  const [cachedCourses] = useState(() => peekClientQueryData<Course[]>("courses"));
  const [filter, setFilter] = useState<CourseFilterState>(initialFilter);
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

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const matchesCategory = filter.category === "all" || course.categories.includes(filter.category);
      const matchesStatus = filter.status === "all" || course.status === filter.status;
      const matchesDifficulty = filter.difficulty === "all" || course.difficulty === filter.difficulty;

      return matchesCategory && matchesStatus && matchesDifficulty;
    });
  }, [courses, filter]);

  const recommendedCourse = courses.find((course) => course.status === "not_started") ?? courses[0];
  const continueCourse = courses.find((course) => course.status === "in_progress") ?? courses.find((course) => course.progressRate > 0);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f3f6fb" }}>
      {header}<FeedbackDestination failed={!!errorMessage} ready={!isLoading && !errorMessage} />

      <Container maxWidth={false} sx={{ maxWidth: 1440, py: { xs: 3, md: 4 } }}>
        <Stack spacing={3}>
          <AppBreadcrumbs items={[{ label: "コース" }]} />
          <Box>
            <Typography component="h1" sx={{ fontSize: { xs: 34, md: 46 }, fontWeight: 950, letterSpacing: 0, lineHeight: 1.1 }}>
              コース一覧
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1, lineHeight: 1.8 }}>
              エンジニアスキルを身につけるためのコースを選んで学習を進めましょう。
            </Typography>
          </Box>

          <CourseFilter value={filter} onChange={setFilter} />

          {isLoading ? (
            <CourseSkeleton />
          ) : errorMessage ? (
            <Box sx={{ p: 4, borderRadius: 3, border: "1px solid #fecaca", bgcolor: "#fff7f7", textAlign: "center" }}>
              <Typography fontWeight={900} color="error">
                {errorMessage}
              </Typography>
            </Box>
          ) : (
            <Stack spacing={3}>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 3 }}>
                {recommendedCourse && (
                  <Stack spacing={1.25}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <StarIcon sx={{ color: "#f59e0b" }} />
                      <Typography variant="h5" fontWeight={950}>おすすめ</Typography>
                    </Stack>
                    <CourseCard {...recommendedCourse} featured />
                  </Stack>
                )}

                {continueCourse && (
                  <Stack spacing={1.25}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <AutoAwesomeIcon sx={{ color: "#f59e0b" }} />
                      <Typography variant="h5" fontWeight={950}>続きから</Typography>
                    </Stack>
                    <CourseCard {...continueCourse} featured />
                  </Stack>
                )}
              </Box>

              <Stack spacing={2.25}>
                <Stack direction="row" alignItems="baseline" spacing={1}>
                  <PlayCircleIcon sx={{ color: "#0057e7" }} />
                  <Typography variant="h5" fontWeight={950} letterSpacing={0}>
                    すべてのコース
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {filteredCourses.length} 件
                  </Typography>
                </Stack>

                {filteredCourses.length > 0 ? (
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: {
                        xs: "1fr",
                        sm: "repeat(2, minmax(0, 1fr))",
                        lg: "repeat(3, minmax(0, 1fr))",
                        xl: "repeat(4, minmax(0, 1fr))",
                      },
                      gap: 2.5,
                      alignItems: "stretch",
                    }}
                  >
                    {filteredCourses.map((course) => (
                      <CourseCard key={course.id} {...course} />
                    ))}
                  </Box>
                ) : (
                  <Box sx={{ p: 4, borderRadius: 3, border: "1px dashed #cbd5e1", bgcolor: "#f8fafc", textAlign: "center" }}>
                    <Typography fontWeight={900}>条件に合うコースがありません</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      フィルター条件を変えて探してみてください。
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Stack>
          )}
        </Stack>
      </Container>
    </Box>
  );
}
