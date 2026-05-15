export type Difficulty = "easy" | "normal" | "hard";

export type ExamIntroData = {
    missionTitle: string;
    examTitle: string;
    description: string;
    estimatedTime: string;
    rewardExp: number;
    thumbnailUrl?: string;
};
