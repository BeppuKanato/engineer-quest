import { fetcher } from "@/lib/fetcher";

export type CourseResultActionType =
  | "RETRY_COURSE_EXAM"
  | "SOLVE_PRACTICE_PROBLEM"
  | "CREATE_LEARNING_MEMO"
  | "CREATE_QUESTION_POST"
  | "CREATE_ERROR_HELP_POST"
  | "CREATE_WORK_POST"
  | "VIEW_BOARD_POSTS"
  | "ANSWER_BOARD_POST"
  | "REVIEW_KNOWLEDGE_CARDS"
  | "VIEW_ACHIEVEMENTS"
  | "SET_TARGET_ACHIEVEMENT"
  | "USE_BADGE_TICKET"
  | "VIEW_BADGE_COLLECTION"
  | "SET_PROFILE_BADGE"
  | "VIEW_PROFILE"
  | "NO_APP_ACTION";

export type CourseResultResponse = {
  id: string;
  mission: { id: string; title: string };
  course: { id: string; title: string };
  completedAt: string;
  attempt: {
    id: string;
    startedAt: string;
    completedAt: string | null;
    hintViews: {
      hintId: string;
      title: string;
      viewedAt: string;
    }[];
  } | null;
  rewards: {
    experience: number;
    badgeTickets: number;
    unlockedAchievementCount: number;
  };
  unlockedAchievements: {
    id: string;
    title: string;
    description: string;
    category: string;
    categoryLabel: string;
  }[];
  summary: {
    passedTests: number;
    totalTests: number;
    submissionCount: number;
    hintUsageCount: number;
    durationSeconds: number;
  };
  presentation: {
    masteryTitle: string;
    description: string;
    learningOutcome: string;
  };
};

export type CourseResultFeedbackResponse = {
  status: "GENERATING" | "COMPLETED" | "FAILED";
  source: "GENERATED";
  requestedAt: string;
  completedAt: string | null;
  feedback: null | {
    currentState: string;
    nextGoal: string;
    nextStep: string;
    actionType: CourseResultActionType;
    actionLabel: string;
    learningAnalysis: {
      achieved: string[];
      likelyDifficulties: {
        description: string;
        evidence: string[];
        confidence: "high" | "medium" | "low";
      }[];
      learningProcess: string;
      nextLearningNeed: string;
    };
    selectionAnalysis: {
      consideredActions: { action: string; reason: string }[];
      selectedActionReason: string;
      usedAppState: string[];
      personalizationAdjustment: string | null;
    };
  };
};

export type CourseResultEventType =
  | "COURSE_RESULT_VIEWED"
  | "FEEDBACK_GENERATION_COMPLETED"
  | "FEEDBACK_VIEW_CLICKED"
  | "FEEDBACK_VIEW_STARTED"
  | "FEEDBACK_VIEW_DURATION"
  | "NEXT_ACTION_SHOWN"
  | "NEXT_ACTION_CLICKED"
  | "COURSE_RESULT_LEFT";

export const getCourseResult = (token: string, rewardRunId: string) =>
  fetcher<CourseResultResponse>(
    `/course-results/${encodeURIComponent(rewardRunId)}`,
    { method: "GET", token }
  );

export const startCourseResultFeedback = (token: string, rewardRunId: string) =>
  fetcher<CourseResultFeedbackResponse>(
    `/course-results/${encodeURIComponent(rewardRunId)}/feedback`,
    { method: "POST", token }
  );

export const getCourseResultFeedback = (token: string, rewardRunId: string) =>
  fetcher<CourseResultFeedbackResponse>(
    `/course-results/${encodeURIComponent(rewardRunId)}/feedback`,
    { method: "GET", token }
  );

export const recordCourseResultEvent = (
  token: string,
  rewardRunId: string,
  event: {
    eventId: string;
    eventType: CourseResultEventType;
    occurredAt: string;
    durationMs?: number;
  }
) =>
  fetcher<{ accepted: boolean; duplicate: boolean }>(
    `/course-results/${encodeURIComponent(rewardRunId)}/events`,
    {
      method: "POST",
      token,
      body: JSON.stringify(event),
      keepalive: true,
    }
  );
