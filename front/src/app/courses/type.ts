export type ProgressStatus = "completed" | "in_progress" | "not_started";

export type Difficulty = "easy" | "normal" | "hard";

export type MissionType = "main" | "challenge" | "course_exam";

export type CourseCategory =
  | "game"
  | "algorithm"
  | "tool"
  | "ui"
  | "data"
  | "sort"
  | "search"
  | "graph"
  | "data_structure"
  | "dynamic_programming";

export type Course = {
    id: string;
    title: string;
    description: string;
    missions: Mission[];
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

export type Mission = {
    id: string;
    title: string;
    description: string;
    goalImg: string;
    status: ProgressStatus;
    type: MissionType;
    isRequiredForCourseCompletion: boolean;
    parentMissionId: string | null;
    roadmapLane: number;
    branchOrder: number;
    tags?: string[];
};

export type CourseFilterState =  {
    category: CourseCategory | "all";
    difficulty: Difficulty | "all";
    status: ProgressStatus | "all";
};
