export type ProgressStatus = "completed" | "in_progress" | "not_started";

export type Difficulty = "easy" | "normal" | "hard";

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
    categories: CourseCategory[];
    difficulty: Difficulty;
    status: ProgressStatus;
    progressRate: number;
};

export type CourseFilterState =  {
    category: CourseCategory | "all";
    difficulty: Difficulty | "all";
    status: ProgressStatus | "all";
};
