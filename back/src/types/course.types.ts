export type ProgressStatus = "completed" | "in_progress" | "not_started";

export type Difficulty = "easy" | "normal" | "hard";

export type CourseCategory =
  | "game"
  | "algorithm"
  | "tool"
  | "ui"
  | "data";

export type CourseMissionSummaryResponse = {
  id: string;
  title: string;
  description: string;
  goalImg: string;
  status: ProgressStatus;
};

export type CourseListItemResponse = {
  id: string;
  title: string;
  description: string;
  missions: CourseMissionSummaryResponse[];
  categories: CourseCategory[];
  difficulty: Difficulty;

  status: ProgressStatus;
  progressRate: number;
  missionCount: number;
  completedMissionCount: number;
};

export type GetCoursesResponse = CourseListItemResponse[];