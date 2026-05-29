export type ProgressStatus = "not_started" | "in_progress" | "completed";

export type MissionExamDifficulty = "easy" | "normal" | "hard";

export type MissionExamTab = "preview" | "reference";

export type MissionExamSubmitStatus = "idle" | "incorrect" | "correct";

export type MissionExamProblem = {
    id: string;
    missionId: string;
    title: string;
    description: string;
    difficulty: MissionExamDifficulty;
    thumbnailUrl: string;
    answerCode: string;
    initialCode: string;
    previewCss: string;
};

export type UserDiffLineStatus = "same" | "changed" | "extra";

export type UserDiffLine = {
    id: string;
    lineNumber: number;
    text: string;
    status: UserDiffLineStatus;
};

export type UserDiffResult = {
    lines: UserDiffLine[];
    hasDifference: boolean;
};