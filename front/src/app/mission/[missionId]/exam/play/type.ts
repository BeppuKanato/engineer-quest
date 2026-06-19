export type MissionExamDifficulty = "easy" | "normal" | "hard";

export type MissionExamTab = "preview" | "reference";

export type MissionExamSubmitStatus = "idle" | "incorrect" | "correct";

export type MissionExamPlayData = {
  missionExamId: string;
  variantId: string;
  missionId: string;

  title: string;
  description: string;
  difficulty: MissionExamDifficulty;

  thumbnailUrl: string | null;

  answerCode: string;
  initialCode: string;

  /**
   * API側で null を "" に変換して返す想定。
   * createPreviewSrcDoc にそのまま渡すため、フロントでは string にしておく。
   */
  previewCss: string;
};

export type MissionExamProgressData = {
  passed: boolean;
  startedAt: string | null;
  completedAt: string | null;
};

export type MissionExamPlayResponse = {
  problem: MissionExamPlayData;
  progress: MissionExamProgressData;
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