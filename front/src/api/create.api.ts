import { fetchClientQuery, invalidateClientQueries, queryTags } from "@/lib/clientQueryCache";
import { fetcher } from "@/lib/fetcher";

export type CreateQuestRequirementKind = "BASIC" | "OPTIONAL";
export type CreateQuestRequirementCategory = "FUNCTIONAL" | "QUALITY" | "PERFORMANCE" | "IMPLEMENTATION";
export type CreateQuestHint = { id: string; title: string; body: string; courseId?: string };
export type CreateQuestRequirement = {
  id: string;
  title: string;
  description: string;
  kind: CreateQuestRequirementKind;
  category: CreateQuestRequirementCategory;
  points: number;
  order: number;
  tests: unknown[];
  hints: CreateQuestHint[];
};
export type RelatedCreateQuestCourse = { id: string; title: string; description: string; reason: string; isCompleted: boolean };
export type CreateQuestAttemptSummary = {
  id: string;
  code: string;
  selectedRequirementIds: string[];
  status: "IN_PROGRESS" | "COMPLETED";
  bestScore: number;
  updatedAt: string;
  viewedHints?: Array<{ requirementId: string; hintId: string }>;
  latestExecution?: { requirementResults: RequirementResult[] } | null;
  latestSubmission?: {
    id: string;
    score: number;
    maxScore: number;
    feedback: CreateQuestFeedbackResponse | null;
  } | null;
};
export type CreateQuest = {
  id: string;
  title: string;
  description: string;
  scenario: string;
  problemType: string;
  functionName: string;
  starterCode: string;
  estimatedMinutes: number;
  tags: string[];
  thumbnailUrl: string | null;
  previewData: {
    kind?: "SORT" | "ROUTE" | "TEXT_SEARCH" | "PRODUCT_SEARCH" | "GRAPH";
    previewTitle?: string;
    previewDescription?: string;
    guidanceTitle?: string;
    guidanceBody?: string;
    characters?: Array<{ id: string; name: string; speed: number }>;
    passages?: Record<string, string[]>;
    start?: string;
    goal?: string;
    text?: string;
    keyword?: string;
    products?: Array<{ id: number; name: string; stock: number }>;
    targetId?: number;
    graph?: Record<string, string[]>;
  };
  maxScore: number;
  basicScore: number;
  requirements: CreateQuestRequirement[];
  relatedCourses: RelatedCreateQuestCourse[];
  attempt: CreateQuestAttemptSummary | null;
};
export type RequirementResult = {
  requirementId: string;
  passed: boolean;
  testResults: Array<{
    id: string;
    label: string;
    passed: boolean;
    expected?: unknown;
    actual?: unknown;
    metric?: { comparisons?: number; maxComparisons?: number; accesses?: number; maxAccesses?: number } | null;
    error?: string;
  }>;
};
export type ExecutionResult = {
  executionId: string;
  score: number;
  maxScore: number;
  basicPassed: boolean;
  requirementResults: RequirementResult[];
};
export type CreateQuestFeedbackResponse = {
  status: "GENERATING" | "COMPLETED" | "FAILED";
  requestedAt: string;
  completedAt: string | null;
  feedback: null | { currentState: string; nextGoal: string; nextStep: string; actionType: string; actionLabel: string };
};

export const getCreateQuests = (token: string): Promise<CreateQuest[]> =>
  fetchClientQuery("create-quests", () => fetcher<CreateQuest[]>("/create-quests", { token }), {
    staleTimeMs: 30_000,
    tags: [queryTags.works],
  });
export const getCreateQuest = (token: string, questId: string): Promise<CreateQuest> =>
  fetcher<CreateQuest>(`/create-quests/${encodeURIComponent(questId)}`, { token });
export const startCreateQuestAttempt = async (token: string, questId: string) => {
  const result = await fetcher<{ attemptId: string }>(`/create-quests/${encodeURIComponent(questId)}/attempts`, { method: "POST", token });
  invalidateClientQueries([queryTags.works]);
  return result;
};
export const saveCreateQuestAttempt = (token: string, attemptId: string, code: string, selectedRequirementIds: string[]) =>
  fetcher<{ attemptId: string; savedAt: string }>(`/create-quest-attempts/${encodeURIComponent(attemptId)}`, {
    method: "PATCH", token, body: JSON.stringify({ code, selectedRequirementIds }),
  });
export const saveCreateQuestExecution = (token: string, attemptId: string, code: string, requirementResults: RequirementResult[], runtimeError: string | null) =>
  fetcher<ExecutionResult>(`/create-quest-attempts/${encodeURIComponent(attemptId)}/executions`, {
    method: "POST", token, body: JSON.stringify({ code, requirementResults, runtimeError }),
  });
export const viewCreateQuestHint = (token: string, attemptId: string, requirementId: string, hintId: string) =>
  fetcher<void>(`/create-quest-attempts/${encodeURIComponent(attemptId)}/hints/${encodeURIComponent(requirementId)}/${encodeURIComponent(hintId)}`, { method: "POST", token });
export const submitCreateQuest = async (token: string, attemptId: string, code: string, requirementResults: RequirementResult[]) => {
  const result = await fetcher<{ submissionId: string; score: number; maxScore: number; unlockedAchievements: { id: string; title: string; description: string; rarity: string }[] }>(`/create-quest-attempts/${encodeURIComponent(attemptId)}/submissions`, {
    method: "POST", token, body: JSON.stringify({ code, requirementResults }),
  });
  invalidateClientQueries([queryTags.works, queryTags.profile, queryTags.history, queryTags.achievements, queryTags.collection]);
  return result;
};
export const startCreateQuestFeedback = (token: string, submissionId: string) =>
  fetcher<CreateQuestFeedbackResponse>(`/create-quest-submissions/${encodeURIComponent(submissionId)}/feedback`, { method: "POST", token });
export const getCreateQuestFeedback = (token: string, submissionId: string) =>
  fetcher<CreateQuestFeedbackResponse>(`/create-quest-submissions/${encodeURIComponent(submissionId)}/feedback`, { token });

export type CreateQuestAttemptListItem = {
  id: string;
  questId: string;
  status: "IN_PROGRESS" | "COMPLETED";
  bestScore: number;
  updatedAt: string;
  quest: { title: string; description: string; thumbnailUrl: string | null; problemType: string };
  submissions: Array<{ id: string; score: number; maxScore: number }>;
};
export const getCreateQuestAttempts = (token: string) =>
  fetcher<CreateQuestAttemptListItem[]>("/create-quest-attempts", { token });
