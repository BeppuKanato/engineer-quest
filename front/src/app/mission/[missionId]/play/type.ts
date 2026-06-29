import type { Difficulty, ProgressStatus } from "@/app/courses/type";

import type { MissionVisualContent } from "./components/visual/type";

export type MissionActivityType =
  | "TUTORIAL"
  | "VIEW"
  | "CHOICE"
  | "MATCH"
  | "ORDERED_STEPS"
  | "SELECT_FILL"
  | "TRY_CODE"
  | "MISSION_CHECK";

export type MissionActivityContent = {
  body?: string;
  text?: string;
  summary?: string[];
  question?: string;
  choices?: ChoiceItem[];
  items?: MatchItem[];
  targets?: MatchTarget[];
  steps?: OrderedStep[];
  checkType?: "CHOICE" | "MATCH" | "ORDERED_STEPS" | "SELECT_FILL" | "TRY_CODE";
  starterCode?: string;
  sampleCode?: string;
  answerCode?: string;
  visual?: MissionVisualContent;
  [key: string]: unknown;
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

export type MissionSection = {
  id: string;
  title: string;
  description: string | null;
  order: number;
};

export type MissionActivity = {
  id: string;
  sectionId: string | null;
  type: MissionActivityType;
  title: string;
  instruction: string;
  mentorMessage: string;
  content: MissionActivityContent;
  preview: Record<string, unknown> | null;
  actionLabel: string;
  order: number;
  sectionOrder: number | null;
  isMissionCheck: boolean;
  progressStatus: ProgressStatus;
};

export type MissionPlayResponse = {
  id: string;
  courseId: string;
  courseTitle: string;
  missionOrder: number;
  title: string;
  description: string;
  difficulty: Difficulty;
  goalImg: string;
  estimatedMinutes: number;
  rewardExp: number;
  learnedItems: string[];
  isLocked: boolean;
  unlockRequirement: {
    missionId: string;
    missionTitle: string;
  } | null;
  progress: {
    status: Extract<ProgressStatus, "completed" | "in_progress">;
    currentActivityId: string | null;
    completedActivityIds: string[];
  };
  sections: MissionSection[];
  activities: MissionActivity[];
};

export type AnswerMissionActivityResponse = {
  isCorrect: boolean | null;
  feedback?: string;
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
