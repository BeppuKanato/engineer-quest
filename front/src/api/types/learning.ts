import type { ImplementationInputLevel } from "@/types/implementation";

/** フェーズ完了APIへ保存する回答の根拠。設問本文や解答自体は含めない。 */
export type AssessmentEvidence = {
  version: 1;
  assessmentId: string;
  sessionId: string;
  startedAt: number;
  records: { questionId: string; attempts: { number: number; correct: boolean }[] }[];
};

/** APIと学習フローで共有する完了時点の記録。未観測の項目は省略する。 */
export type LearningPhaseSummary = {
  assessmentEvidence?: AssessmentEvidence;
  firstAttemptCorrect?: number;
  totalQuestions?: number;
  testRuns?: number;
  hintUsage?: readonly number[];
  inputLevel?: ImplementationInputLevel;
};
