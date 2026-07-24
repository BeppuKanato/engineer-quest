import type {
  CourseCategoryType,
  CourseDifficulty,
  MissionActivityType,
  MissionType,
} from "@prisma/client";
import type { MissionVisualContent } from "../../src/type/missionVisual";

export type ActivitySeed = {
  id: string;
  type: MissionActivityType;
  title: string;
  instruction: string;
  mentorMessage: string;
  content: Record<string, unknown> & { visual?: MissionVisualContent };
  preview: Record<string, unknown> | null;
  actionLabel: string;
  order: number;
  sectionOrder: number | null;
  isMissionCheck: boolean;
};

export type SectionSeed = {
  id: string;
  title: string;
  description?: string;
  order: number;
  activities: ActivitySeed[];
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
  sections: SectionSeed[];
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
