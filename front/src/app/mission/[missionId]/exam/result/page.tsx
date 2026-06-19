"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { Alert, Box, Container } from "@mui/material";
import { onAuthStateChanged } from "firebase/auth";
import { useParams, useRouter, useSearchParams } from "next/navigation";

import { getMissionExamResult } from "@/api/mission.api";
import { AppHeader } from "@/app/component/appHeader";
import { auth } from "@/lib/firebase";

import { MissionExamDifficulty } from "../play/type";
import { MissionExamCompleteCard } from "./components/resultCard";
import { MissionExamResultSkeleton } from "./components/skeleton";
import { MissionExamResultLog } from "./type";

const isMissionExamDifficulty = (
  value: string | null
): value is MissionExamDifficulty => {
  return value === "easy" || value === "normal" || value === "hard";
};

function MissionExamResultContent() {
  const params = useParams<{ missionId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();

  const missionId = params.missionId;

  const difficulty = useMemo<MissionExamDifficulty>(() => {
    const difficultyParam = searchParams.get("difficulty");

    if (isMissionExamDifficulty(difficultyParam)) {
      return difficultyParam;
    }

    return "normal";
  }, [searchParams]);

  const [result, setResult] = useState<MissionExamResultLog | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        if (!isMounted) return;

        setResult(null);
        setErrorMessage("ログイン情報を取得できませんでした。");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage(null);

        const token = await user.getIdToken();
        const data = await getMissionExamResult(token, missionId, difficulty);

        if (!isMounted) return;

        setResult(data);
      } catch (error) {
        console.error("Failed to fetch mission exam result:", error);

        if (!isMounted) return;

        setResult(null);
        setErrorMessage("確認テストの結果を取得できませんでした。");
      } finally {
        if (!isMounted) return;

        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [missionId, difficulty]);

  const handleClickNextMission = () => {
    if (result?.nextMission) {
      router.push(`/mission/${result.nextMission.id}/overview`);
      return;
    }

    router.push("/courses");
  };

  const handleClickMissionMap = () => {
    router.push(`/courses`);
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
          {isLoading && <MissionExamResultSkeleton />}

          {!isLoading && errorMessage && (
            <Alert severity="error">{errorMessage}</Alert>
          )}

          {!isLoading && !errorMessage && result && (
            <MissionExamCompleteCard
              result={result}
              nextMission={result.nextMission}
              onClickNextMission={handleClickNextMission}
              onClickMissionMap={handleClickMissionMap}
            />
          )}
        </Container>
      </Box>
    </Box>
  );
}

export default function MissionExamResultPage() {
  return (
    <Suspense fallback={<MissionExamResultPageFallback />}>
      <MissionExamResultContent />
    </Suspense>
  );
}

const MissionExamResultPageFallback = () => {
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#F7F8FC" }}>
      <AppHeader />
      <Box
        component="main"
        sx={{
          minHeight: "calc(100vh - 64px)",
          py: { xs: 4, md: 6 },
        }}
      >
        <Container maxWidth="md">
          <MissionExamResultSkeleton />
        </Container>
      </Box>
    </Box>
  );
};
