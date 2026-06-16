"use client";

import React, { useMemo, useState } from "react";
import { Alert, Box, Container, Grid } from "@mui/material";
import { useParams, useRouter, useSearchParams } from "next/navigation";

import { AppHeader } from "@/app/component/appHeader";

import { MissionExamActions } from "./components/missionExamActions";
import { MissionExamEditor } from "./components/missionExamEditor";
import { MissionExamHeaderCard } from "./components/missionExamHeaderCard";
import { MissionExamResultMessage } from "./components/missionExamResultMessage";
import { MissionExamSidePanel } from "./components/missionExamSidePanel";

import {
  createUserLineDiff,
  isCodeCorrect,
} from "./missionExamDiff";

import { missionExamProblems } from "./tempData";
import type {
  MissionExamDifficulty,
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
  const params = useParams<{ missionId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  const missionId = params.missionId;

  const difficulty = useMemo<MissionExamDifficulty>(() => {
    const difficultyParam = searchParams.get("difficulty");

    if (isMissionExamDifficulty(difficultyParam)) {
      return difficultyParam;
    }

    return "normal";
  }, [searchParams]);

  const problem = missionExamProblems[difficulty];

  const [code, setCode] = useState(problem.initialCode);
  const [previewCode, setPreviewCode] = useState(problem.initialCode);
  const [activeTab, setActiveTab] = useState<MissionExamTab>("preview");
  const [submitStatus, setSubmitStatus] =
    useState<MissionExamSubmitStatus>("idle");
  const [diffLines, setDiffLines] = useState<UserDiffLine[]>([]);
  const [showDiff, setShowDiff] = useState(false);

  const handleShowReference = () => {
    setActiveTab("reference");
  };

  const handleUpdatePreview = () => {
    setPreviewCode(code);
    setActiveTab("preview");
  };

  const handleCheckDiff = () => {
    const result = createUserLineDiff(problem.answerCode, code);

    setDiffLines(result.lines);
    setShowDiff(result.hasDifference);
    setActiveTab("reference");

    if (!result.hasDifference) {
      setSubmitStatus("correct");
    } else {
      setSubmitStatus("incorrect");
    }
  };

  const handleClearDiff = () => {
    setShowDiff(false);
    setDiffLines([]);
  };

  const handleSubmit = () => {
    if (submitStatus === "correct") {
      router.push(`/mission/${encodeURIComponent(missionId)}/exam/result`);
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

  if (!problem) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "#F7F8FC" }}>
        <AppHeader />

        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Alert severity="error">
            確認テストの問題データを取得できませんでした。
          </Alert>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#F7F8FC" }}>
      <AppHeader />

      <Container maxWidth="xl" sx={{ py: { xs: 3, md: 4 } }}>
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
      </Container>
    </Box>
  );
}