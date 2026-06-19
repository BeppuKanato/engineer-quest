"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Container,
  Grid,
} from "@mui/material";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";

import { AppHeader } from "@/app/component/appHeader";
import { getMissionExamPlay, submitMissionExam } from "@/api/mission.api";
import { auth } from "@/lib/firebase";
import { PageTransitionOverlay } from "@/app/component/pageTransitionOverlay";
import { useNavigationFeedback } from "@/hooks/useNavigationFeedback";

import { MissionExamActions } from "./components/missionExamActions";
import { MissionExamEditor } from "./components/missionExamEditor";
import { MissionExamHeaderCard } from "./components/missionExamHeaderCard";
import { MissionExamResultMessage } from "./components/missionExamResultMessage";
import { MissionExamSidePanel } from "./components/missionExamSidePanel";

import { createUserLineDiff, isCodeCorrect } from "./missionExamDiff";
import { MissionExamPlaySkeleton } from "./components/skeleton";

import type {
  MissionExamDifficulty,
  MissionExamPlayData,
  MissionExamSubmitStatus,
  MissionExamTab,
  UserDiffLine,
} from "./type";

const isMissionExamDifficulty = (
  value: string | null
): value is MissionExamDifficulty => {
  return value === "easy" || value === "normal" || value === "hard";
};

export default function MissionExamPlayPage() {
  return (
    <Suspense fallback={<MissionExamPlayLoading />}>
      <MissionExamPlayContent />
    </Suspense>
  );
}

const MissionExamPlayContent = () => {
  const params = useParams<{ missionId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { showOverlay, startNavigation, resetNavigation } =
    useNavigationFeedback();

  const missionId = params.missionId;

  const difficulty = useMemo<MissionExamDifficulty>(() => {
    const difficultyParam = searchParams.get("difficulty");

    if (isMissionExamDifficulty(difficultyParam)) {
      return difficultyParam;
    }

    return "normal";
  }, [searchParams]);

  const [problem, setProblem] = useState<MissionExamPlayData | null>(null);
  const [code, setCode] = useState("");
  const [previewCode, setPreviewCode] = useState("");
  const [activeTab, setActiveTab] = useState<MissionExamTab>("preview");
  const [submitStatus, setSubmitStatus] =
    useState<MissionExamSubmitStatus>("idle");
  const [diffLines, setDiffLines] = useState<UserDiffLine[]>([]);
  const [showDiff, setShowDiff] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        if (!isMounted) return;

        setProblem(null);
        setErrorMessage("ログイン情報を取得できませんでした。");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage(null);

        const token = await user.getIdToken();
        const data = await getMissionExamPlay(token, missionId, difficulty);

        if (!isMounted) return;

        setProblem(data.problem);
        setCode(data.problem.initialCode);
        setPreviewCode(data.problem.initialCode);
        setActiveTab("preview");
        setSubmitStatus("idle");
        setDiffLines([]);
        setShowDiff(false);
      } catch (error) {
        console.error("Failed to fetch mission exam play data:", error);

        if (!isMounted) return;

        setProblem(null);
        setErrorMessage("確認テストの問題データを取得できませんでした。");
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

  const handleShowReference = () => {
    setActiveTab("reference");
  };

  const handleUpdatePreview = () => {
    setPreviewCode(code);
    setActiveTab("preview");
  };

  const handleCheckDiff = () => {
    if (!problem) return;

    const result = createUserLineDiff(problem.answerCode, code);

    setDiffLines(result.lines);
    setShowDiff(result.hasDifference);
    setActiveTab("reference");

    setSubmitStatus(result.hasDifference ? "incorrect" : "correct");
  };

  const handleClearDiff = () => {
    setShowDiff(false);
    setDiffLines([]);
  };

  const handleSubmit = () => {
    if (!problem) return;

    if (submitStatus === "correct") {
      startNavigation(async () => {
        try {
          setErrorMessage(null);

          const token = await auth.currentUser?.getIdToken();

          if (!token) {
            setErrorMessage("ログイン情報を取得できませんでした。");
            resetNavigation();
            return;
          }

          const result = await submitMissionExam(
            token,
            missionId,
            difficulty,
            code
          );

          if (!result.isCorrect) {
            setSubmitStatus("incorrect");
            const diffResult = createUserLineDiff(problem.answerCode, code);
            setDiffLines(diffResult.lines);
            setShowDiff(diffResult.hasDifference);
            setActiveTab("reference");
            resetNavigation();
            return;
          }

          router.push(
            `/mission/${encodeURIComponent(
              missionId
            )}/exam/result?difficulty=${difficulty}`
          );
        } catch (error) {
          console.error("Failed to submit mission exam:", error);
          setErrorMessage("確認テストの完了処理に失敗しました。");
          resetNavigation();
        }
      });
      return;
    }

    const correct = isCodeCorrect(code, problem.answerCode);

    if (correct) {
      setSubmitStatus("correct");
      setShowDiff(false);
      setDiffLines([]);
      return;
    }

    const result = createUserLineDiff(problem.answerCode, code);

    setSubmitStatus("incorrect");
    setDiffLines(result.lines);
    setShowDiff(result.hasDifference);
    setActiveTab("reference");
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#F7F8FC" }}>
      <AppHeader />
      <PageTransitionOverlay
        open={showOverlay}
        message="確認テストの結果を保存しています..."
      />

      <Container maxWidth="xl" sx={{ py: { xs: 3, md: 4 } }}>
        {isLoading && <MissionExamPlaySkeleton />}

        {!isLoading && errorMessage && (
          <Alert severity="error">{errorMessage}</Alert>
        )}

        {!isLoading && !errorMessage && problem && (
          <>
            <MissionExamHeaderCard problem={problem} />

            <Grid container spacing={2.5} sx={{ mt: 2.5 }} alignItems="stretch">
              <Grid size={{ xs: 12, md: 6 }}>
                <MissionExamEditor
                  code={code}
                  onChange={(nextCode) => {
                    setCode(nextCode);

                    if (submitStatus !== "idle") {
                      setSubmitStatus("idle");
                    }

                    if (showDiff) {
                      setShowDiff(false);
                      setDiffLines([]);
                    }
                  }}
                  diffLines={diffLines}
                  showDiff={showDiff}
                  onClearDiff={handleClearDiff}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <MissionExamSidePanel
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                  problem={problem}
                  userCode={previewCode}
                />
              </Grid>
            </Grid>

            <MissionExamResultMessage status={submitStatus} />

            <MissionExamActions
              submitStatus={submitStatus}
              onShowReference={handleShowReference}
              onCheckDiff={handleCheckDiff}
              onUpdatePreview={handleUpdatePreview}
              onSubmit={handleSubmit}
            />
          </>
        )}
      </Container>
    </Box>
  );
};

const MissionExamPlayLoading = () => {
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#F7F8FC" }}>
      <AppHeader />
      <MissionExamPlaySkeleton />
    </Box>
  );
};
