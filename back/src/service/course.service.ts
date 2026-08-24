import {
  CourseCategoryType,
  CourseDifficulty,
  MissionType as PrismaMissionType,
  ProgressStatus as PrismaProgressStatus,
} from "@prisma/client";
import { prisma } from "../lib/prisma";
import {
  CourseCategory,
  CourseRoadmapMissionResponse,
  CourseRoadmapResponse,
  Difficulty,
  GetCoursesResponse,
  MissionType,
  ProgressStatus,
} from "../types/course.types";
import { AppError } from "../error/appError";

const toDifficulty = (difficulty: CourseDifficulty): Difficulty => {
  switch (difficulty) {
    case CourseDifficulty.EASY:
      return "easy";
    case CourseDifficulty.NORMAL:
      return "normal";
    case CourseDifficulty.HARD:
      return "hard";
  }
};

const toCourseCategory = (
  category: CourseCategoryType
): CourseCategory => {
  switch (category) {
    case CourseCategoryType.GAME:
      return "game";
    case CourseCategoryType.ALGORITHM:
      return "algorithm";
    case CourseCategoryType.TOOL:
      return "tool";
    case CourseCategoryType.UI:
      return "ui";
    case CourseCategoryType.DATA:
      return "data";
    case CourseCategoryType.SORT:
      return "sort";
    case CourseCategoryType.SEARCH:
      return "search";
    case CourseCategoryType.GRAPH:
      return "graph";
    case CourseCategoryType.DATA_STRUCTURE:
      return "data_structure";
    case CourseCategoryType.DYNAMIC_PROGRAMMING:
      return "dynamic_programming";
  }
};

const toMissionType = (type: PrismaMissionType): MissionType => {
  switch (type) {
    case PrismaMissionType.MAIN:
      return "main";
    case PrismaMissionType.CHALLENGE:
      return "challenge";
    case PrismaMissionType.COURSE_EXAM:
      return "course_exam";
  }
};

const toProgressStatus = (
  status: PrismaProgressStatus | undefined
): ProgressStatus => {
  if (status === PrismaProgressStatus.COMPLETED) {
    return "completed";
  }

  if (status === PrismaProgressStatus.IN_PROGRESS) {
    return "in_progress";
  }

  return "not_started";
};

const deriveCourseStatus = (
  missionStatuses: ProgressStatus[]
): ProgressStatus => {
  if (missionStatuses.length === 0) {
    return "not_started";
  }

  const completedCount = missionStatuses.filter(
    (status) => status === "completed"
  ).length;

  if (completedCount === missionStatuses.length) {
    return "completed";
  }

  if (
    completedCount > 0 ||
    missionStatuses.some((status) => status === "in_progress")
  ) {
    return "in_progress";
  }

  return "not_started";
};

const calculateProgressRate = (
  missionCount: number,
  completedMissionCount: number
): number => {
  if (missionCount === 0) {
    return 0;
  }

  return Math.round((completedMissionCount / missionCount) * 100);
};

type CourseMissionForSummary = {
  id: string;
  title: string;
  description: string;
  goalImg: string;
  order: number;
  difficulty: CourseDifficulty;
  estimatedMinutes: number;
  rewardExp: number;
  type: PrismaMissionType;
  isRequiredForCourseCompletion: boolean;
  parentMissionId: string | null;
  roadmapLane: number;
  branchOrder: number;
  progresses: {
    status: PrismaProgressStatus;
  }[];
};

type CourseForSummary = {
  id: string;
  title: string;
  description: string;
  difficulty: CourseDifficulty;
  categories: {
    category: {
      name: CourseCategoryType;
    };
  }[];
  missions: CourseMissionForSummary[];
};

const mapMissionSummary = (mission: CourseMissionForSummary) => {
  const progress = mission.progresses[0];

  return {
    id: mission.id,
    title: mission.title,
    description: mission.description,
    goalImg: mission.goalImg,
    status: toProgressStatus(progress?.status),
    type: toMissionType(mission.type),
    isRequiredForCourseCompletion: mission.isRequiredForCourseCompletion,
    parentMissionId: mission.parentMissionId,
    roadmapLane: mission.roadmapLane,
    branchOrder: mission.branchOrder,
  };
};

const buildCourseSummary = (course: CourseForSummary) => {
  const missions = course.missions.map(mapMissionSummary);

  const requiredMissions = missions.filter(
    (mission) => mission.isRequiredForCourseCompletion
  );
  const challengeMissions = missions.filter(
    (mission) => mission.type === "challenge"
  );
  const missionStatuses = requiredMissions.map((mission) => mission.status);
  const totalMissionCount = missions.length;
  const requiredMissionCount = requiredMissions.length;
  const challengeMissionCount = challengeMissions.length;

  const completedMissionCount = missionStatuses.filter(
    (status) => status === "completed"
  ).length;
  const completedRequiredMissionCount = completedMissionCount;
  const completedChallengeMissionCount = challengeMissions.filter(
    (mission) => mission.status === "completed"
  ).length;

  return {
    id: course.id,
    title: course.title,
    description: course.description,
    missions,
    categories: course.categories.map((categoryMap) =>
      toCourseCategory(categoryMap.category.name)
    ),
    difficulty: toDifficulty(course.difficulty),

    status: deriveCourseStatus(missionStatuses),
    progressRate: calculateProgressRate(
      requiredMissionCount,
      completedRequiredMissionCount
    ),
    missionCount: requiredMissionCount,
    completedMissionCount,
    totalMissionCount,
    requiredMissionCount,
    completedRequiredMissionCount,
    challengeMissionCount,
    completedChallengeMissionCount,
  };
};

const buildRoadmapMissions = (
  missions: CourseMissionForSummary[]
): CourseRoadmapMissionResponse[] => {
  const statusByMissionId = new Map(
    missions.map((mission) => [
      mission.id,
      toProgressStatus(mission.progresses[0]?.status),
    ])
  );

  const requiredMissions = missions
    .filter((mission) => mission.isRequiredForCourseCompletion)
    .sort((a, b) => a.order - b.order);

  const previousRequiredMissionIdByMissionId = new Map<string, string | null>();

  requiredMissions.forEach((mission, index) => {
    previousRequiredMissionIdByMissionId.set(
      mission.id,
      requiredMissions[index - 1]?.id ?? null
    );
  });

  return missions.map((mission) => {
    const status = toProgressStatus(mission.progresses[0]?.status);
    const missionType = toMissionType(mission.type);
    const previousRequiredMissionId =
      previousRequiredMissionIdByMissionId.get(mission.id) ?? null;

    const requiredParentStatus = mission.parentMissionId
      ? statusByMissionId.get(mission.parentMissionId)
      : undefined;
    const previousRequiredStatus = previousRequiredMissionId
      ? statusByMissionId.get(previousRequiredMissionId)
      : undefined;

    const isAlreadyStarted = status !== "not_started";
    const isMainUnlocked =
      missionType === "main" &&
      (previousRequiredMissionId === null ||
        previousRequiredStatus === "completed");
    const isCourseExamUnlocked =
      missionType === "course_exam" &&
      (previousRequiredMissionId === null ||
        previousRequiredStatus === "completed");
    const isChallengeUnlocked =
      missionType === "challenge" &&
      requiredParentStatus === "completed";

    const isLocked = !(
      isAlreadyStarted ||
      isMainUnlocked ||
      isCourseExamUnlocked ||
      isChallengeUnlocked
    );

    return {
      id: mission.id,
      title: mission.title,
      description: mission.description,
      goalImg: mission.goalImg,
      order: mission.order,
      difficulty: toDifficulty(mission.difficulty),
      estimatedMinutes: mission.estimatedMinutes,
      rewardExp: mission.rewardExp,
      status,
      type: missionType,
      isRequiredForCourseCompletion: mission.isRequiredForCourseCompletion,
      parentMissionId: mission.parentMissionId,
      roadmapLane: mission.roadmapLane,
      branchOrder: mission.branchOrder,
      isLocked,
      unlockMissionId:
        missionType === "challenge"
          ? mission.parentMissionId
          : previousRequiredMissionId,
    };
  });
};

const findNextMission = (
  missions: CourseRoadmapMissionResponse[]
): CourseRoadmapMissionResponse | null => {
  const inProgressMain = missions.find(
    (mission) =>
      mission.isRequiredForCourseCompletion &&
      mission.status === "in_progress" &&
      !mission.isLocked
  );

  if (inProgressMain) {
    return inProgressMain;
  }

  return (
    missions.find(
      (mission) =>
        mission.isRequiredForCourseCompletion &&
        mission.status !== "completed" &&
        !mission.isLocked
    ) ?? null
  );
};

export const getCoursesByUserId = async (
  userId: string
): Promise<GetCoursesResponse> => {
  const courses = await prisma.course.findMany({
    where: {
      isPublished: true,
    },
    orderBy: {
      createdAt: "asc",
    },
    include: {
      categories: {
        include: {
          category: true,
        },
      },
      missions: {
        where: {
          isPublished: true,
        },
        orderBy: {
          order: "asc",
        },
        include: {
          progresses: {
            where: {
              userId,
            },
            select: {
              status: true,
            },
          },
        },
      },
    },
  });

  return courses.map(buildCourseSummary);
};

export const getCourseRoadmapByUserId = async (
  userId: string,
  courseId: string
): Promise<CourseRoadmapResponse> => {
  const course = await prisma.course.findFirst({
    where: {
      id: courseId,
      isPublished: true,
    },
    include: {
      categories: {
        include: {
          category: true,
        },
      },
      missions: {
        where: {
          isPublished: true,
        },
        orderBy: {
          order: "asc",
        },
        include: {
          progresses: {
            where: {
              userId,
            },
            select: {
              status: true,
            },
          },
        },
      },
    },
  });

  if (!course) {
    throw new AppError(404, "COURSE_NOT_FOUND", "Course not found");
  }

  const summary = buildCourseSummary(course);
  const missions = buildRoadmapMissions(course.missions);

  return {
    ...summary,
    missions,
    nextMission: findNextMission(missions),
  };
};
