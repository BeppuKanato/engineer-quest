import type {
  CourseCategoryType,
  CourseDifficulty,
  MissionActivityType,
  MissionType,
} from "@prisma/client";
import type { MissionVisualContent } from "../../src/type/missionVisual";
import type { ActivityContent } from "../../src/type/activityContent";

export type ActivitySeed = {
  id: string;
  type: MissionActivityType;
  title: string;
  instruction: string;
  mentorMessage: string;
  content: ActivityContent & { data: Record<string, unknown> & { visual?: MissionVisualContent } };
  preview?: Record<string, unknown> | null;
  actionLabel: string;
  order: number;
};

export type MissionSeed = {
  id: string;
  title: string;
  description: string;
  difficulty: CourseDifficulty;
  goalImg: string;
  estimatedMinutes: number;
  order: number;
  type: MissionType;
  isRequiredForCourseCompletion: boolean;
  parentMissionId: string | null;
  roadmapLane: number;
  branchOrder: number;
  rewardExp: number;
  learnedItems: string[];
  isPublished: boolean;
  activities: ActivitySeed[];
};

export type CourseSeed = {
  id: string;
  title: string;
  description: string;
  difficulty: CourseDifficulty;
  isInitiallyUnlocked: boolean;
  isPublished: boolean;
  version: number;
  categories: CourseCategoryType[];
  missions: MissionSeed[];
};
