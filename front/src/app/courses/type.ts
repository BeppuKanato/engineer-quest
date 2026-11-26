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
    /** 新フロー単元のみ：完了した段階数（withLearningProgress が付ける）。 */
    completedPhases?: number;
    /** 新フロー単元のみ：段階の総数。 */
    totalPhases?: number;
    /** 新フロー単元のみ：次に学ぶ段階の名前。 */
    nextPhaseLabel?: string;
};

export type CourseFilterState =  {
    category: CourseCategory | "all";
    difficulty: Difficulty | "all";
    status: ProgressStatus | "all";
};
