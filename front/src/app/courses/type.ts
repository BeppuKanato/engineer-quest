export type ProgressStatus = "completed" | "in_progress" | "not_started";

export type Course = {
    id: string;
    title: string;
    description: string;
    missions: Mission[];
    categories: CourseCategory[];
    difficulty: Difficulty;
    status: ProgressStatus;
    progressRate: number;
    missionCount: number,
    completedMissionCount: number
}

export type Mission = {
    id: string;
    title: string;
    description: string;
    goalImg: string;
    status: ProgressStatus;
    tags?: string[];
}

export type CourseCategory = "game" | "algorithm" | "tool" | "ui" | "data";

export type Difficulty = "easy" | "normal" | "hard";

export type CourseFilterState =  {
    category: CourseCategory | "all";
    difficulty: Difficulty | "all";
    status: ProgressStatus | "all";
}