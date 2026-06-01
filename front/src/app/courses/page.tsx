"use client";

import { Box, Container, Stack, Typography } from "@mui/material";
import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Course, CourseFilterState } from "./type";
import { CourseAccordion } from "./component/courseAccordion";
import { CourseFilter } from "./component/courseFilter";
import { AppHeader } from "../component/appHeader";
import { getCourses } from "@/api/courses.api";
import { ApiError } from "@/lib/fetcher";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { CourseSkeleton } from "./component/courseSkeleton";
import { PageTransitionOverlay } from "@/app/component/pageTransitionOverlay";
import { useNavigationFeedback } from "@/hooks/useNavigationFeedback";

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

    const handleMissionClick =  (missionId: string) => {
        startNavigation(() => {
            router.push(`/mission/${missionId}/overview`);
        });
    }

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
            }
            catch(error) {
                if (error instanceof ApiError) {
                    if (error.status === 401) {
                        setErrorMessage("ログインの有効期限が切れました。再ログインしてください");
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
                setErrorMessage("コース情報の取得に失敗しました");
            }
            finally {
                setIsLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    const filteredCourses = useMemo(() => {
        return courses.filter((course) => {
            const matchesCategory = filter.category === "all" || course.categories.includes(filter.category);

            const matchesStatus = filter.status === "all" || course.status === filter.status;

            const matchesDifficulty = filter.difficulty === "all" || course.difficulty === filter.difficulty;

            return matchesCategory && matchesStatus && matchesDifficulty;
        });
    }, [courses, filter]);

    return (
        <Box sx={{ minHeight: "100vh", bgcolor: "#F7F8FC"}} >
            <AppHeader />
            <PageTransitionOverlay
                open={showOverlay}
                message="ミッションを準備しています..." 
            />

            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Stack spacing={4}>
                    <Box>
                        <Typography variant="h4" fontWeight={900}>
                            コース一覧
                        </Typography>
                        <Typography color="text.secondary" sx={{ mt: 1 }}>
                            作ってみたいものからコースを選びましょう
                        </Typography>
                    </Box>

                    <CourseFilter value={filter} onChange={setFilter} />

                    {isLoading ? (
                        <CourseSkeleton />
                    ): errorMessage?(
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
                    ): (
                        <Stack spacing={2}>
                            <Stack direction="row" alignItems="baseline" spacing={1}>
                                <Typography variant="h5" fontWeight={900}>
                                    条件に合うコース
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {filteredCourses.length} 件
                                </Typography>
                            </Stack>

                            {filteredCourses.length > 0 ? (
                                <Stack spacing={3}>
                                    {filteredCourses.map((course) => (
                                        <CourseAccordion 
                                            key={course.id} 
                                            {...course}
                                            onMissionClick={handleMissionClick} 
                                        />
                                    ))}
                                </Stack>
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
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                        フィルター条件を変更して探してみてください。
                                    </Typography>
                                </Box>
                            )}
                        </Stack>  
                    )}
                </Stack>
            </Container>
        </Box>
    );
};