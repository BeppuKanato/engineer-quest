"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
    Box,
    Container
} from "@mui/material";
import { missionExamProblems } from "./tempData";
import {
    MissionExamDifficulty,
    MissionExamSubmitStatus,
    MissionExamTab,
    UserDiffResult,
} from "./type";
import {
    createUserLineDiff,
    isCodeCorrect,
} from "./missionExamDiff";
import { MissionExamActions } from "./components/missionExamActions";
import { MissionExamEditor } from "./components/missionExamEditor";
import { MissionExamHeaderCard } from "./components/missionExamHeaderCard";
import { MissionExamSidePanel } from "./components/missionExamSidePanel";
import { MissionExamResultMessage } from "./components/missionExamResultMessage";
import { AppHeader } from "@/app/component/appHeader";

const isMissionExamDifficulty = (
    value: string | null,
): value is MissionExamDifficulty => {
    return value === "easy" || value === "normal" || value === "hard";
};

const emptyDiffResult: UserDiffResult = {
    lines: [],
    hasDifference: false,
};

export default function MissionExamPage() {
    const searchParams = useSearchParams();

    const difficultyParam = searchParams.get("difficulty");

    const selectedDifficulty: MissionExamDifficulty =
        isMissionExamDifficulty(difficultyParam) ? difficultyParam : "normal";

    const problem = missionExamProblems[selectedDifficulty];

    const [userCode, setUserCode] = useState("");
    const [activeTab, setActiveTab] = useState<MissionExamTab>("preview");
    const [diffResult, setDiffResult] =
        useState<UserDiffResult>(emptyDiffResult);
    const [showDiffInEditor, setShowDiffInEditor] = useState(false);
    const [submitStatus, setSubmitStatus] =
        useState<MissionExamSubmitStatus>("idle");

    const storageKey = problem
        ? `mission-exam:${problem.id}:${problem.difficulty}`
        : "";

    useEffect(() => {
        if (!problem) {
            return;
        }

        const savedCode = window.localStorage.getItem(storageKey);

        if (savedCode !== null) {
            setUserCode(savedCode);
            return;
        }

        setUserCode(problem.initialCode);
    }, [problem, storageKey]);

    useEffect(() => {
        if (!problem || !storageKey) {
            return;
        }

        window.localStorage.setItem(storageKey, userCode);
    }, [problem, storageKey, userCode]);

    const previewCode = useMemo(() => userCode, [userCode]);

    if (!problem) {
        return (
            <Box sx={{ minHeight: "100vh", bgcolor: "#F7F8FC" }}>
                <AppHeader />
                <Container maxWidth="xl" sx={{ pt: 4 }}>
                    問題が見つかりませんでした。
                </Container>
            </Box>
        );
    }

    const handleShowReference = () => {
        setActiveTab("reference");
    };

    const handleCheckDiff = () => {
        const nextDiffResult = createUserLineDiff(
            problem.answerCode,
            userCode,
        );

        setDiffResult(nextDiffResult);
        setShowDiffInEditor(true);
        setSubmitStatus("idle");
        setActiveTab("reference");
    };

    const handleUpdatePreview = () => {
        setShowDiffInEditor(false);
        setActiveTab("preview");
    };

    const handleSubmit = () => {
        if (isCodeCorrect(userCode, problem.answerCode)) {
            setSubmitStatus("correct");
            setShowDiffInEditor(false);

            // TODO:
            // 報酬画面ができたらここで遷移
            // router.push(`/mission-exam/result?missionId=${problem.missionId}`);
            return;
        }

        const nextDiffResult = createUserLineDiff(
            problem.answerCode,
            userCode,
        );

        setDiffResult(nextDiffResult);
        setShowDiffInEditor(true);
        setSubmitStatus("incorrect");
        setActiveTab("reference");
    };

    return (
        <Box sx={{ minHeight: "100vh", bgcolor: "#F7F8FC" }}>
            <AppHeader />

            <Container
                maxWidth="xl"
                sx={{
                    pt: { xs: 2.5, md: 4 },
                    pb: { xs: 3, md: 5 },
                }}
            >
                <MissionExamHeaderCard problem={problem} />

                {/* {submitStatus === "incorrect" && (
                    <Alert
                        severity="warning"
                        sx={{
                            mt: 2,
                            borderRadius: 3,
                            fontWeight: 800,
                        }}
                    >
                        まだ違いがあります。色が付いた行をお手本コードと見比べて修正してください。
                    </Alert>
                )}

                {showDiffInEditor && submitStatus !== "incorrect" && (
                    <Alert
                        severity="info"
                        sx={{
                            mt: 2,
                            borderRadius: 3,
                            fontWeight: 800,
                        }}
                    >
                        色が付いた行を、お手本コードと見比べて修正してください。
                    </Alert>
                )} */}

                <Box
                    sx={{
                        mt: 2,
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", lg: "1.05fr 0.95fr" },
                        gap: 2,
                        alignItems: "stretch",
                    }}
                >
                    <MissionExamEditor
                        code={userCode}
                        onChange={(nextCode) => {
                            setUserCode(nextCode);
                            setSubmitStatus("idle");
                            // setShowDiffInEditor(false);
                        }}
                        diffLines={diffResult.lines}
                        showDiff={showDiffInEditor}
                        onClearDiff={() => {
                            setShowDiffInEditor(false);
                            setSubmitStatus("idle");
                        }}
                    />

                    <MissionExamSidePanel
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                        problem={problem}
                        userCode={previewCode}
                    />
                </Box>

                <MissionExamActions
                    submitStatus={submitStatus}
                    onShowReference={handleShowReference}
                    onCheckDiff={handleCheckDiff}
                    onUpdatePreview={handleUpdatePreview}
                    onSubmit={handleSubmit} 
                />

                <MissionExamResultMessage status={submitStatus} />
            </Container>
        </Box>
    );
}