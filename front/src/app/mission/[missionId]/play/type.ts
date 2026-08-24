import type { Difficulty, MissionType, ProgressStatus } from "@/app/courses/type";

import type { MissionVisualContent } from "./components/visual/type";
import type {
  ActivityContent,
  ActivityRendererData,
} from "@/features/learning/activityContent";

export type MissionActivityType =
  | "TUTORIAL"
  | "VIEW"
  | "CHOICE"
  | "MATCH"
  | "ORDERED_STEPS"
  | "SELECT_FILL"
  | "TRY_CODE";

export type MissionActivityContentData = ActivityRendererData & {
  body?: string;
  text?: string;
  summary?: string[];
  question?: string;
  choices?: ChoiceItem[];
  items?: MatchItem[];
  targets?: MatchTarget[];
  steps?: OrderedStep[];
  starterCode?: string;
  sampleCode?: string;
  answerCode?: string;
  visual?: MissionVisualContent;
  [key: string]: unknown;
};

export type MissionActivityContent = Omit<ActivityContent, "data"> & {
  data: MissionActivityContentData;
};

export type ChoiceItem = {
  id: string;
  label: string;
  isCorrect?: boolean;
  feedback?: string;
};

export type MatchItem = {
  id: string;
  label: string;
};

export type MatchTarget = {
  id: string;
  label: string;
};

export type OrderedStep = {
  id: string;
  label: string;
};

export type MissionActivity = {
  id: string;
  type: MissionActivityType;
  title: string;
  instruction: string;
  mentorMessage: string;
  content: MissionActivityContent;
  preview: Record<string, unknown> | null;
  actionLabel: string;
  order: number;
  progressStatus: ProgressStatus;
  incorrectAttemptCount: number;
};

export type MissionPlayResponse = {
  id: string;
  courseId: string;
  courseTitle: string;
  missionOrder: number;
  title: string;
  description: string;
  type: MissionType;
  difficulty: Difficulty;
  selectedExamDifficulty: Difficulty | null;
  highestClearedExamDifficulty: Difficulty | null;
  goalImg: string;
  estimatedMinutes: number;
  rewardExp: number;
  learnedItems: string[];
  isLocked: boolean;
  unlockRequirement: {
    missionId: string;
    missionTitle: string;
  } | null;
  courseExamAttempt: CourseExamAttempt | null;
  progress: {
    status: Extract<ProgressStatus, "completed" | "in_progress">;
    currentActivityId: string | null;
    completedActivityIds: string[];
  };
  activities: MissionActivity[];
};

export type CourseExamHintView = {
  hintId: string;
  title: string;
  viewedAt: string;
};

export type CourseExamTestResultLog = {
  testCaseId: string;
  passed: boolean;
  expectedOutput?: unknown;
  actualOutput?: unknown;
};

export type CourseExamTestExecution = {
  id: string;
  code: string;
  testResults: CourseExamTestResultLog[];
  runtimeError: string | null;
  executedAt: string;
};

export type CourseExamSubmission = {
  id: string;
  code: string;
  passed: boolean;
  testResults: CourseExamTestResultLog[];
  submittedAt: string;
};

export type CourseExamAttempt = {
  id: string;
  missionId: string;
  startedAt: string;
  completedAt: string | null;
  hintViews: CourseExamHintView[];
  testExecutions: CourseExamTestExecution[];
  submissions: CourseExamSubmission[];
};

export type AnswerMissionActivityResponse = {
  isCorrect: boolean | null;
  feedback?: string;
  incorrectAttemptCount: number;
};

export type CompleteMissionActivityResponse = {
  activityId: string;
  status: "completed";
  nextActivityId: string | null;
  isMissionCompleted: boolean;
};

export type ExperienceUpdate = {
  gainedExp: number;
  previousExperience: number;
  currentExperience: number;
  isNewlyAwarded: boolean;
};

export type UnlockedAchievement = {
  id: string;
  title: string;
  description: string;
  category: string;
  categoryLabel: string;
  achievedAt: string;
};

export type KnowledgeCardChoice = {
  id: string;
  label: string;
  title: string;
  description: string;
  rarity: "COMMON" | "RARE" | "EPIC" | string;
};

export type BadgeTicketReward = {
  amount: number;
  reason:
    | "MISSION_COMPLETE"
    | "CHALLENGE_COMPLETE"
    | "COURSE_COMPLETE"
    | "ACHIEVEMENT_UNLOCK"
    | "BADGE_GACHA"
    | string;
  currentTickets: number;
  transactionId: string;
  createdAt: string;
};

export type CompleteMissionResponse = {
  rewardRunId: string;
  courseExamAttemptId: string | null;
  nextPath: string;
  mission: {
    id: string;
    courseId: string;
    title: string;
    rewardExp: number;
    learnedItems: string[];
  };
  experienceUpdate: ExperienceUpdate;
  badgeTicketRewards: BadgeTicketReward[];
  unlockedAchievements: UnlockedAchievement[];
  knowledgeCardChoices: KnowledgeCardChoice[];
  nextMission: {
    id: string;
    title: string;
  } | null;
  unlockedChallenges: {
    id: string;
    title: string;
  }[];
};

export type CollectKnowledgeCardResponse = {
  knowledgeCard: KnowledgeCardChoice;
  collectedAt: string;
};
