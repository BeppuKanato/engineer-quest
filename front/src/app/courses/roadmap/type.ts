import type {
    CourseCategory,
    Difficulty,
    MissionType,
    ProgressStatus,
} from "../type";

export type CourseRoadmapMission = {
    id: string;
    title: string;
    description: string;
    goalImg: string;
    order: number;
    difficulty: Difficulty;
    estimatedMinutes: number;
    status: ProgressStatus;
    type: MissionType;
    isRequiredForCourseCompletion: boolean;
    parentMissionId: string | null;
    roadmapLane: number;
    branchOrder: number;
    isLocked: boolean;
    unlockMissionId: string | null;
};

export type CourseRoadmap = {
    id: string;
    title: string;
    description: string;
    missions: CourseRoadmapMission[];
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
    nextMission: CourseRoadmapMission | null;
};
