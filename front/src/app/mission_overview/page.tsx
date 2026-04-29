import { Box, Container, Grid } from "@mui/material";
import { AppHeader } from "../component/appHeader";
import { LessonRoadmap } from "./component/lessonRoadmap";
import { MissionSummaryCard } from "./component/MissionSummaryCard";
import { Lesson, Mission, MissionExam } from "./type";

const tempMissionExam: MissionExam = {
    id: "mission-exam-1",
    title: "ミッション確認テスト",
    status: "not_started",
};

const tempLessonsData: Lesson[] = [
    {
        id: "lesson-1",
        title: "カードの土台を作る",
        status: "completed",
    },
    {
        id: "lesson-2",
        title: "画像と文章を配置する",
        status: "in_progress",
    },
    {
        id: "lesson-3",
        title: "余白と角丸を整える",
        status: "not_started",
    },
    {
        id: "lesson-4",
        title: "ボタンを追加する",
        status: "not_started",
    },
    {
        id: "lesson-5",
        title: "小テストで確認する",
        status: "not_started",
    },
];

const tempMission: Mission = {
    id: "mission-1",
    title: "自己紹介カードを作ろう",
    description: "見出し・文章・画像を並べたカードUIを作成する",
    goalImg: "/images/goals/sample.png",
    estimatedMinutes: 25,
    lessons: tempLessonsData,
    missionExam: tempMissionExam,
};

export default function MissionOverviewPage() {
    return (
        <Box sx={{ minHeight: "100vh", bgcolor: "#F7F8FC" }}>
            <AppHeader />

            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Grid container spacing={3} alignItems="flex-start">
                    <Grid size={{ xs: 12, md: 4 }}>
                        <MissionSummaryCard mission={tempMission} />
                    </Grid>

                    <Grid size={{ xs: 12, md: 8 }}>
                        <LessonRoadmap
                            lessons={tempMission.lessons}
                            missionExam={tempMission.missionExam}
                        />
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
}