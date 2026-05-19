export type ProgressStatus = "completed" | "in_progress" | "not_started";

export type Lesson = {
    id: string;
    title: string;
    status: ProgressStatus;
};

export type MissionExam = {
    id: string;
    title: string;
    status: ProgressStatus;
};

export type Mission = {
    id: string;
    title: string;
    description: string;
    goalImg: string;
    estimatedMinutes: number;
    lessons: Lesson[];
    missionExam: MissionExam;
};