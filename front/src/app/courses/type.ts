export type Status = "completed" | "in_progress" | "not_started";

export type Course = {
    id: string;
    title: string;
    description: string;
    missions: Mission[];
    categories: CourseCategory[];
    difficulty: Difficulty;
}

export type Mission = {
    id: string;
    title: string;
    description: string;
    goalImg: string;
    status: Status;
    tags?: string[];
}

export type CourseCategory = "game" | "algorithm" | "tool" | "ui" | "data";

export type Difficulty = "easy" | "normal" | "hard";

export type CourseFilterState =  {
    category: CourseCategory | "all";
    difficulty: Difficulty | "all";
    status: Status | "all";
}