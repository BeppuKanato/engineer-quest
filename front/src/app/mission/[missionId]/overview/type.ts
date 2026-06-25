export type {
  MissionActivity,
  MissionActivityContent,
  MissionActivityType,
  MissionPlayResponse as MissionOverviewResponse,
  MissionSection,
} from "../play/type";

export type ProgressStatus = "completed" | "in_progress" | "not_started";
export type MissionDifficulty = "easy" | "normal" | "hard";

export type Lesson = {
  id: string;
  title: string;
  status: ProgressStatus;
  isLocked: boolean;
  rewardExp: number;
};

export type MissionExam = {
  id: string;
  title: string;
  status: ProgressStatus;
  isLocked: boolean;
  rewardExp: number;
};

export type Mission = {
  id: string;
  title: string;
  description: string;
  goalImg: string;
  difficulty: MissionDifficulty;
  estimatedMinutes: number;
  lessons: Lesson[];
  missionExam: MissionExam;
};
