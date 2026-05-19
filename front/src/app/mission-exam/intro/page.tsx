"use client";

import React, { useState } from "react";
import { Box, Container } from "@mui/material";
import { MissionExamIntroCard } from "./components/missionExamIntroCard";
import { Difficulty, ExamIntroData } from "./type";
import { AppHeader } from "@/app/component/appHeader";

const examIntroData: ExamIntroData = {
    missionTitle: "自己紹介カードを作ろう",
    examTitle: "自己紹介カードを完成させよう",
    description:
        "見出し・文章・画像を使って、自己紹介カードのHTMLを再現します。",
    estimatedTime: "10〜15分",
    rewardExp: 120,
    thumbnailUrl: "/images/goals/sample.png",
};

export default function MissionExamIntroPage() {
    const [difficulty, setDifficulty] = useState<Difficulty>("normal");

    const handleStart = () => {
        // TODO: 実際のルーティングに合わせて変更
        // router.push(`/missions/${missionId}/exam?difficulty=${difficulty}`);
        console.log("start mission exam:", difficulty);
    };

    return (
        <Box sx={{ minHeight: "100vh", bgcolor: "#F7F8FC" }}>
            <AppHeader />

            <Box
                sx={{
                    minHeight: "calc(100vh - 64px)",
                    display: "flex",
                    alignItems: { xs: "flex-start", md: "center" },
                    py: { xs: 3, md: 4 },
                }}
            >
                <Container maxWidth="md">
                    <MissionExamIntroCard
                        data={examIntroData}
                        difficulty={difficulty}
                        onChangeDifficulty={setDifficulty}
                        onStart={handleStart}
                    />
                </Container>
            </Box>
        </Box>
    );
}