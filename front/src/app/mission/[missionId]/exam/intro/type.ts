export type Difficulty = "easy" | "normal" | "hard";

export type ExamIntroData = {
  missionTitle: string;
  examTitle: string;
  description: string;
  estimatedTime: string;
  rewardExp: number;
  thumbnailUrl: string | null;
};

export type DifficultyMeta = {
  label: string;
  title: string;
  inputAmount: string;
  hintAmount: string;
  description: string;
  color: "success" | "primary" | "error";
};