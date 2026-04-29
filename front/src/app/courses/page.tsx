"use client";

import { Box, Container, Stack, Typography } from "@mui/material";
import { useMemo, useState } from "react";
import { Course, CourseFilterState } from "./type";
import { CourseAccordion } from "./component/courseAccordion";
import { CourseFilter } from "./component/courseFilter";
import { AppHeader } from "../component/appHeader";

const courses: Course[] = [
    {
        "id" : "course-1",
        "title": "Webページ基礎コース",
        "description": "HTML/CSSの基礎を学び、簡単なWebページを作成するコースです。",
        "categories": ["ui", "tool"],
        "difficulty": "easy",
        "missions": [
            {
                "id": "test-mission-1",
                "title": "自己紹介カードを作ろう",
                "description": "見出し・文章・画像を並べたカードUIを作成する",
                "goalImg": "/images/goals/sample.png",
                "status": "completed"
            },
            {
                "id": "test-mission-2",
                "title": "ボタン付きリンク集を作ろう",
                "description": "複数のリンクをボタンで並べたUIを作成する",
                "goalImg": "/images/goals/sample.png",
                "status": "completed"
            },
            {
                "id": "test-mission-3",
                "title": "レスポンシブな2カラム画面を作ろう",
                "description": "画面幅に合わせてレイアウトを切り替えるUIを作成する",
                "goalImg": "/images/goals/sample.png",
                "status": "completed"
            },
            {
                "id": "test-mission-4",
                "title": "商品紹介ページを作ろう",
                "description": "画像・説明・ボタンを使った紹介UIを作成する",
                "goalImg": "/images/goals/sample.png",
                "status": "completed"
            }
        ]
    },
    {
        "id": "course-2",
        "title": "ぷよぷよ作成コース",
        "description": "JavaScriptの基礎を学び、ぷよぷよゲームを作成するコースです。",
        "categories": ["game", "algorithm"],
        "difficulty": "normal",
        "missions": [
            {
                "id": "test-mission-5",
                "title": "ぷよを動かそう",
                "description": "ぷよを左右に動かす機能を実装する",
                "goalImg": "/images/goals/sample.png",
                "status": "completed"
            },
            {
                "id": "test-mission-6",
                "title": "ぷよを回転させよう",
                "description": "ぷよを回転させる機能を実装する",
                "goalImg": "/images/goals/sample.png",
                "status": "in_progress"
            },
            {
                "id": "test-mission-7",
                "title": "ぷよを落とそう",
                "description": "ぷよを下に落とす機能を実装する",
                "goalImg": "/images/goals/sample.png",
                "status": "not_started"
            },
            {
                "id": "test-mission-8",
                "title": "連鎖を実装しよう",
                "description": "ぷよが4つ以上繋がったら消える機能を実装する",
                "goalImg": "/images/goals/sample.png",
                "status": "not_started"
            },
            {
                "id": "test-mission-9",
                "title": "ゲームオーバーを実装しよう",
                "description": "ぷよが画面上部まで積み上がったらゲームオーバーになる機能を実装する",
                "goalImg": "/images/goals/sample.png",
                "status": "not_started"
            }
        ]
    },
    {
        "id": "course-3",
        "title": "JavaScript基礎コース",
        "description": "JavaScriptの基本的な文法や概念を学ぶコースです。",
        "categories": ["tool"],
        "difficulty": "normal",
        "missions": [
            {
                "id": "test-mission-10",
                "title": "変数とデータ型を理解しよう",
                "description": "JavaScriptの変数とデータ型の基本を学ぶ",
                "goalImg": "/images/goals/sample.png",
                "status": "not_started"
            },
            {
                "id": "test-mission-11",
                "title": "関数を作ってみよう",
                "description": "JavaScriptの関数の基本を学び、簡単な関数を作成する",
                "goalImg": "/images/goals/sample.png",
                "status": "not_started"
            },
            {
                "id": "test-mission-12",
                "title": "配列とオブジェクトを使ってみよう",
                "description": "JavaScriptの配列とオブジェクトの基本を学び、データ構造を理解する",
                "goalImg": "/images/goals/sample.png",
                "status": "not_started"
            },
            {
                "id": "test-mission-13",
                "title": "条件分岐とループを学ぼう",
                "description": "JavaScriptの条件分岐とループの基本を学ぶ",
                "goalImg": "/images/goals/sample.png",
                "status": "not_started"
            },
        ]
    },
    {
        "id": "course-4",
        "title": "アルゴリズムコース",
        "description": "基本的なアルゴリズムとデータ構造を学ぶコースです。",
        "categories": ["algorithm"],
        "difficulty": "hard",
        "missions": [
            {
                "id": "test-mission-14",
                "title": "線形探索を実装しよう",
                "description": "配列内の要素を順番にチェックする線形探索アルゴリズムを実装する",
                "goalImg": "/images/goals/sample.png",
                "status": "not_started"
            },
            {
                "id": "test-mission-15",
                "title": "二分探索を実装しよう",
                "description": "ソートされた配列内で要素を効率的に探す二分探索アルゴリズムを実装する",
                "goalImg": "/images/goals/sample.png",
                "status": "not_started"
            },
            {
                "id": "test-mission-16",
                "title": "バブルソートを実装しよう",
                "description": "隣接する要素を比較して並べ替えるバブルソートアルゴリズムを実装する",
                "goalImg": "/images/goals/sample.png",
                "status": "not_started"
            },
             {
                "id": "test-mission-17",
                "title": "クイックソートを実装しよう",
                "description": "分割統治法を用いて効率的に並べ替えるクイックソートアルゴリズムを実装する",
                "goalImg": "/images/goals/sample.png",
                "status": "not_started"
            },
             {
                "id": "test-mission-18",
                "title": "マージソートを実装しよう",
                "description": "分割統治法を用いて安定的に並べ替えるマージソートアルゴリズムを実装する",
                "goalImg": "/images/goals/sample.png",
                "status": "not_started"
            }
        ]
    }
]

const initialFilter: CourseFilterState = {
    category: "all",
    status: "all",
    difficulty: "all",
};

export default function CoursesPage() {
    const [filter, setFilter] = useState<CourseFilterState>(initialFilter);

    const filteredCourses = useMemo(() => {
        return courses.filter((course) => {
            const courseStatus = getCourseStatus(course);

            const matchesCategory = filter.category === "all" || course.categories.includes(filter.category);

            const matchesStatus = filter.status === "all" || courseStatus === filter.status;

            const matchesDifficulty = filter.difficulty === "all" || course.difficulty === filter.difficulty;

            return matchesCategory && matchesStatus && matchesDifficulty;
        });
    }, [courses, filter]);

    return (
        <Box sx={{ minHeight: "100vh", bgcolor: "#F7F8FC"}} >
            <AppHeader />

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
                                    <CourseAccordion key={course.id} {...course} />
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
                </Stack>
            </Container>
        </Box>
    );
};

const getCourseStatus = (course: Course) => {
    const completedCount = course.missions.filter(
        (mission) => mission.status === "completed"
    ).length;

    if (completedCount === course.missions.length) {
        return "completed";
    }

    if (
        completedCount > 0 ||
        course.missions.some((mission) => mission.status === "in_progress")
    ) {
        return "in_progress";
    }

    return "not_started";
};