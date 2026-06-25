export type ProgressStatus = "completed" | "in_progress" | "not_started";

export type Difficulty = "easy" | "normal" | "hard";

export type MissionType = "main" | "challenge";

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
  order?: number;
  difficulty?: Difficulty;
  estimatedMinutes?: number;
  status: ProgressStatus;
  type: MissionType;
  isRequiredForCourseCompletion: boolean;
  parentMissionId: string | null;
  roadmapLane: number;
  branchOrder: number;
  isLocked?: boolean;
  unlockMissionId?: string | null;
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
  totalMissionCount: number;
  requiredMissionCount: number;
  completedRequiredMissionCount: number;
  challengeMissionCount: number;
  completedChallengeMissionCount: number;
};

export type GetCoursesResponse = CourseListItemResponse[];

export type CourseRoadmapMissionResponse = Required<
  Pick<
    CourseMissionSummaryResponse,
    | "id"
    | "title"
    | "description"
    | "goalImg"
    | "order"
    | "difficulty"
    | "estimatedMinutes"
    | "status"
    | "type"
    | "isRequiredForCourseCompletion"
    | "parentMissionId"
    | "roadmapLane"
    | "branchOrder"
    | "isLocked"
  >
> & {
  unlockMissionId: string | null;
};

export type CourseRoadmapResponse = Omit<
  CourseListItemResponse,
  "missions"
> & {
  missions: CourseRoadmapMissionResponse[];
  nextMission: CourseRoadmapMissionResponse | null;
};
