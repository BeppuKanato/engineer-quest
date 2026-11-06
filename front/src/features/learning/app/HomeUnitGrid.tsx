"use client";
import { Alert, Box, Button, Skeleton, Stack, Typography } from "@mui/material";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { getCourses } from "@/api/courses.api";
import { useUserSession } from "@/app/component/userSession";
import { CourseCard } from "@/app/courses/component/courseCard";
import { withLearningProgress } from "@/app/courses/courseProgress";
import type { Course, ProgressStatus } from "@/app/courses/type";
import { peekClientQueryData } from "@/lib/clientQueryCache";

/** ホームに出す単元の上限。全件表示と絞り込みはコース一覧ページの領分にする（Issue #137）。 */
export const HOME_UNIT_LIMIT = 6;

const STATUS_ORDER: Record<ProgressStatus, number> = { in_progress: 0, not_started: 1, completed: 2 };

/**
 * ホーム右カラムの単元グリッド。コース一覧と同じ CourseCard を、
 * 自分の進み具合の順（進行中 → 未着手 → 完了）で最大 HOME_UNIT_LIMIT 件まで並べる。
 */
export function HomeUnitGrid() {
  const { status, token } = useUserSession();
  const [cachedCourses] = useState(() => peekClientQueryData<Course[]>("courses"));
  const [courses, setCourses] = useState<Course[]>(cachedCourses ?? []);
  const [isLoading, setIsLoading] = useState(!cachedCourses);
  const [failed, setFailed] = useState(false);
  const coursesRef = useRef(courses);
  coursesRef.current = courses;

  useEffect(() => {
    if (status === "loading") return;
    if (status !== "authenticated" || !token) {
      setIsLoading(false);
      return;
    }
    let current = true;
    void (async () => {
      try {
        const data = await getCourses(token);
        const merged = await withLearningProgress(token, data);
        if (!current) return;
        setCourses(merged);
        setFailed(false);
      } catch (error) {
        console.error(error);
        // 前回データがある場合は保持し、警告でグリッドを消さない。
        if (current && coursesRef.current.length === 0) setFailed(true);
      } finally {
        if (current) setIsLoading(false);
      }
    })();
    return () => {
      current = false;
    };
  }, [status, token]);

  const sorted = [...courses].sort((left, right) => STATUS_ORDER[left.status] - STATUS_ORDER[right.status]);
  const visible = sorted.slice(0, HOME_UNIT_LIMIT);
  const hasMore = sorted.length > HOME_UNIT_LIMIT;

  return (
    <Box component="section" aria-label="単元">
      <Stack direction="row" alignItems="baseline" spacing={1.5} sx={{ mb: 2 }}>
        <Typography component="h2" variant="h5" fontWeight={950}>
          単元
        </Typography>
        <Typography variant="body2" color="text.secondary">
          進み具合の順に並んでいます
        </Typography>
      </Stack>

      {isLoading ? (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" }, gap: 2.5 }}>
          {[0, 1, 2, 3].map((index) => (
            <Skeleton key={index} variant="rounded" height={320} sx={{ borderRadius: 2 }} />
          ))}
        </Box>
      ) : failed ? (
        <Alert severity="warning" action={<Button component={Link} href="/courses">単元一覧へ</Button>}>
          単元情報を取得できませんでした。
        </Alert>
      ) : (
        <>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
              gap: 2.5,
              alignItems: "stretch",
            }}
          >
            {visible.map((course) => (
              <CourseCard key={course.id} {...course} />
            ))}
          </Box>
          <Box sx={{ mt: 2, textAlign: "right" }}>
            <Button component={Link} href="/courses" sx={{ fontWeight: 800 }}>
              {hasMore ? "残りの単元と絞り込みは単元一覧へ" : "絞り込みは単元一覧へ"}
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
}
