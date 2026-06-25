"use client";

import { Box, Container, Stack, Typography } from "@mui/material";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { getCourses } from "@/api/courses.api";
import { PageTransitionOverlay } from "@/app/component/pageTransitionOverlay";
import { useNavigationFeedback } from "@/hooks/useNavigationFeedback";
import { ApiError } from "@/lib/fetcher";
import { auth } from "@/lib/firebase";

import { AppHeader } from "../component/appHeader";
import { CourseCard } from "./component/courseCard";
import { CourseFilter } from "./component/courseFilter";
import { CourseSkeleton } from "./component/courseSkeleton";
import type { Course, CourseFilterState } from "./type";

const initialFilter: CourseFilterState = {
  category: "all",
  status: "all",
  difficulty: "all",
};

export default function CoursesPage() {
  const [filter, setFilter] = useState<CourseFilterState>(initialFilter);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);

  const router = useRouter();
  const { showOverlay, startNavigation } = useNavigationFeedback();

  const handleCourseClick = (courseId: string) => {
    startNavigation(() => {
      router.push(`/courses/roadmap/${courseId}`);
    });
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        if (!user) {
          setCourses([]);
          setErrorMessage("ログインが必要です。");
          return;
        }

        const token = await user.getIdToken();
        const data = await getCourses(token);

        setCourses(data);
      } catch (error) {
        if (error instanceof ApiError) {
          if (error.status === 401) {
            setErrorMessage(
              "ログインの有効期限が切れました。再ログインしてください。"
            );
            return;
          }
          if (error.status === 404) {
            setErrorMessage("ユーザー情報が見つかりませんでした。");
            return;
          }
          if (error.status >= 500) {
            setErrorMessage(
              "サーバー側でエラーが発生しました。時間をおいて再度お試しください。"
            );
            return;
          }
        }
        setErrorMessage("コース情報の取得に失敗しました。");
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const matchesCategory =
        filter.category === "all" || course.categories.includes(filter.category);
      const matchesStatus =
        filter.status === "all" || course.status === filter.status;
      const matchesDifficulty =
        filter.difficulty === "all" || course.difficulty === filter.difficulty;

      return matchesCategory && matchesStatus && matchesDifficulty;
    });
  }, [courses, filter]);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#F3F6FB" }}>
      <AppHeader />
      <PageTransitionOverlay
        open={showOverlay}
        message="コースロードマップを準備しています..."
      />

      <Container maxWidth="xl" sx={{ py: { xs: 3, md: 4 } }}>
        <Stack spacing={4}>
          <Box
            sx={{
              px: { xs: 0, md: 0.5 },
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              justifyContent: "space-between",
              gap: 2,
            }}
          >
            <Box>
              <Typography variant="h4" fontWeight={900} letterSpacing={0}>
                コース一覧
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 1, lineHeight: 1.8 }}>
                学びたいテーマや作ってみたいものからコースを選びましょう
              </Typography>
            </Box>
          </Box>

          <CourseFilter value={filter} onChange={setFilter} />

          {isLoading ? (
            <CourseSkeleton />
          ) : errorMessage ? (
            <Box
              sx={{
                p: 4,
                borderRadius: 3,
                border: "1px solid #fecaca",
                bgcolor: "#fff7f7",
                textAlign: "center",
              }}
            >
              <Typography fontWeight={800} color="error">
                {errorMessage}
              </Typography>
            </Box>
          ) : (
            <Stack spacing={2.5}>
              <Stack direction="row" alignItems="baseline" spacing={1}>
                <Typography variant="h5" fontWeight={900} letterSpacing={0}>
                  絞り込み結果
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
                      md: "repeat(2, minmax(0, 1fr))",
                      lg: "repeat(3, minmax(0, 1fr))",
                    },
                    gap: 3,
                    alignItems: "stretch",
                  }}
                >
                  {filteredCourses.map((course) => (
                    <CourseCard
                      key={course.id}
                      {...course}
                      onCourseClick={handleCourseClick}
                    />
                  ))}
                </Box>
              ) : (
                <Box
                  sx={{
                    p: 4,
                    borderRadius: 3,
                    border: "1px dashed #cbd5e1",
                    bgcolor: "#f8fafc",
                    textAlign: "center",
                  }}
                >
                  <Typography fontWeight={800}>
                    条件に合うコースがありません
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 1 }}
                  >
                    フィルター条件を変えて探してみてください。
                  </Typography>
                </Box>
              )}
            </Stack>
          )}
        </Stack>
      </Container>
    </Box>
  );
}
