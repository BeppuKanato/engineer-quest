import {
  CourseCategoryType,
  CourseDifficulty,
  ProgressStatus as PrismaProgressStatus,
} from "@prisma/client";
import { prisma } from "../lib/prisma";
import {
  CourseCategory,
  Difficulty,
  GetCoursesResponse,
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

  return courses.map((course) => {
    const missions = course.missions.map((mission) => {
      const progress = mission.progresses[0];

      return {
        id: mission.id,
        title: mission.title,
        description: mission.description,
        goalImg: mission.goalImg,
        status: toProgressStatus(progress?.status),
      };
    });

    const missionStatuses = missions.map((mission) => mission.status);
    const missionCount = missions.length;

    const completedMissionCount = missionStatuses.filter(
      (status) => status === "completed"
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
        missionCount,
        completedMissionCount
      ),
      missionCount,
      completedMissionCount,
    };
  });
};

export const getCoursesByFirebaseUid = async (
  firebaseUid: string
): Promise<GetCoursesResponse> => {
  const user = await prisma.user.findUnique({
    where: {
      firebaseUid,
    },
    select: {
      id: true,
    },
  });

  console.log(firebaseUid)

  if (!user) {
    throw new AppError(404, "USER_NOT_FOUND", "User not found");
  }

  return getCoursesByUserId(user.id);
};