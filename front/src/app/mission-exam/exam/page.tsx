"use client";

import { Suspense, useEffect, useState } from "react";
import { Box, Container } from "@mui/material";
import { useRouter, useSearchParams } from "next/navigation";

import { AppHeader } from "@/app/component/appHeader";
import { missionExamProblems } from "../exam/tempData";
// import { MissionExamCompleteCard } from "./components";
import { MissionExamDifficulty } from "../exam/type";
import { MissionExamResultLog, NextMission } from "../result/type";
import { MissionExamCompleteCard } from "../result/components/resultCard";

const isMissionExamDifficulty = (
  value: string | null
): value is MissionExamDifficulty => {
  return value === "easy" || value === "normal" || value === "hard";
};

const createFallbackResult = (
  difficulty: MissionExamDifficulty
): MissionExamResultLog => ({
  difficulty,
  exp: 120,
  submitCount: 1,
  diffCheckCount: 0,
  clearedAt: new Date().toISOString(),
});

const tempNextMission: NextMission | null = {
  id: "mission_2",
  title: "画像と文章を配置する",
};

function MissionExamResultContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const difficultyParam = searchParams.get("difficulty");

  const difficulty: MissionExamDifficulty =
    isMissionExamDifficulty(difficultyParam) ? difficultyParam : "normal";

  const problem = missionExamProblems[difficulty];

  const [result, setResult] = useState<MissionExamResultLog>(
    createFallbackResult(difficulty)
  );

  useEffect(() => {
    const resultKey = `mission-exam-result:${problem.id}:${problem.difficulty}`;
    const savedResult = window.localStorage.getItem(resultKey);

    if (!savedResult) {
      setResult(createFallbackResult(difficulty));
      return;
    }

    try {
      setResult(JSON.parse(savedResult) as MissionExamResultLog);
    } catch {
      setResult(createFallbackResult(difficulty));
    }
  }, [difficulty, problem.difficulty, problem.id]);

  const handleClickNextMission = () => {
    if (tempNextMission) {
      router.push("/mission-overview");
      return;
    }

    router.push("/mission-overview");
  };

  const handleClickMissionMap = () => {
    router.push("/mission-overview");
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
          <MissionExamCompleteCard
            result={result}
            nextMission={tempNextMission}
            onClickNextMission={handleClickNextMission}
            onClickMissionMap={handleClickMissionMap}
          />
        </Container>
      </Box>
    </Box>
  );
}

export default function MissionExamResultPage() {
  return (
    <Suspense
      fallback={
        <Box
          sx={{
            minHeight: "100vh",
            bgcolor: "#F7F8FC",
          }}
        />
      }
    >
      <MissionExamResultContent />
    </Suspense>
  );
}