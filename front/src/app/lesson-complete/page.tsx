"use client";

import { Box, Container } from "@mui/material";
import { useRouter } from "next/navigation";

import { AppHeader } from "../component/appHeader";
import { Lesson, NextLesson } from "./type";
import { LessonCompleteCard } from "./component/LessonCompleteCard";

const tempLesson: Lesson = {
  id: "lesson_1",
  title: "HTMLの基本",
  exp: 40,
  learnedItems: [
    "HTMLはWebページの内容と構造を書く",
    "<h1> は大きな見出しを表す",
    "<p> は文章を表す",
  ],
};

const tempNextLesson: NextLesson | null = {
  id: "lesson_2",
  title: "画像と文章を配置する",
//   description: "次は画像を追加して、文章と一緒に並べる練習をします。",
};

export default function LessonCompletePage() {
  const router = useRouter();

  const handleClickNextLesson = () => {
    if (tempNextLesson) {
      router.push(`/lessonStep/${tempNextLesson.id}`);
      return;
    }

    router.push("/missionExam");
  };

  const handleClickLessonMap = () => {
    router.push("/mission-overview");
  };

  const handleClickReview = () => {
    router.push(`/lesson/${tempLesson.id}`);
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
          <LessonCompleteCard
            lesson={tempLesson}
            nextLesson={tempNextLesson}
            completedLessonCount={1}
            totalLessonCount={5}
            onClickNextLesson={handleClickNextLesson}
            onClickLessonMap={handleClickLessonMap}
            onClickReview={handleClickReview}
          />
        </Container>
      </Box>
    </Box>
  );
}