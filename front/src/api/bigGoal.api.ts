import { fetcher } from "@/lib/fetcher";

/**
 * 大目標 API のクライアント（Issue #366 の /api/big-goals、G3 #367 が利用）。
 * レスポンス形は back の bigGoalProposal.service.ts の返却形を正とする。
 * 進捗（progress / evaluation）はサーバ側のコード計算の結果であり、
 * フロントでは再計算しない。
 */
export type BigGoalType =
  | "UNIT_COMPLETION"
  | "ACHIEVEMENT"
  | "CREATE_QUEST"
  | "INTEGRATION"
  | "SHARING"
  | "RETENTION";

export type BigGoalStatus =
  | "PROPOSED"
  | "ACTIVE"
  | "ACHIEVED"
  | "CLOSED_UNMET"
  | "REVISED";

export type BigGoalCandidate = {
  candidateKey: string;
  type: BigGoalType;
  params: Record<string, unknown>;
  displayText: string;
  score: number | null;
  rationale: string | null;
};

export type BigGoalProposal = {
  id: string;
  timing: "UNIT_START" | "ON_ACHIEVEMENT";
  startCourseId: string | null;
  status: "GENERATING" | "GENERATED" | "FAILED";
  failureCode: string | null;
  candidates: BigGoalCandidate[] | null;
  recommendedCandidateKey: string | null;
  selectedCandidateKey: string | null;
  createdAt: string;
  generatedAt: string | null;
};

export type BigGoalRequirement = {
  id: string;
  label: string;
  status: "met" | "ongoing" | "unobserved" | "not_met" | "unavailable";
  current?: number;
  target?: number;
  unit?: string;
};

export type BigGoalEvaluation = {
  outcome: "ACHIEVED" | "UNMET_CLOSED" | "ONGOING" | "NOT_INSTRUMENTED";
  fraction: number | null;
  detail: Record<string, unknown>;
  requirements?: BigGoalRequirement[];
};

export type BigGoal = {
  id: string;
  type: BigGoalType;
  params: Record<string, unknown>;
  displayText: string;
  status: BigGoalStatus;
  confirmedAt: string | null;
  /** 達成条件の部分充足（0〜1）。定義できない型は null */
  progress: number | null;
  evaluation: BigGoalEvaluation | null;
  evaluatedAt: string | null;
  closedAt: string | null;
  createdAt: string;
};

const base = "/big-goals";

export const requestBigGoalProposal = (
  token: string,
  input: { timing: "UNIT_START"; startCourseId: string } | { timing: "ON_ACHIEVEMENT"; achievedGoalId: string }
) =>
  fetcher<BigGoalProposal>(`${base}/proposals`, {
    token,
    method: "POST",
    body: JSON.stringify(input),
  });

export const getBigGoalProposal = (token: string, proposalId: string) =>
  fetcher<BigGoalProposal>(`${base}/proposals/${encodeURIComponent(proposalId)}`, { token });

export const confirmBigGoalProposal = (token: string, proposalId: string, candidateKey: string) =>
  fetcher<{ goal: BigGoal; proposalId: string }>(
    `${base}/proposals/${encodeURIComponent(proposalId)}/confirm`,
    { token, method: "POST", body: JSON.stringify({ candidateKey }) }
  );

export const getCurrentBigGoal = (token: string) =>
  fetcher<{ goal: BigGoal | null }>(`${base}/current`, { token });

export const getBigGoalHistory = (token: string) =>
  fetcher<{ goals: BigGoal[] }>(`${base}/history`, { token });
