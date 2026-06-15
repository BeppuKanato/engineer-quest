import { prisma } from "../lib/prisma";
import { AppError } from "../error/appError";

type GetMissionOverviewServiceInput = {
  missionId: string;
  firebaseUid: string;
};

type ApiProgressStatus = "completed" | "in_progress" | "not_started";
type ApiDifficulty = "easy" | "normal" | "hard";

const toProgressStatus = (
  status?: "COMPLETED" | "IN_PROGRESS" | null
): ApiProgressStatus => {
  switch (status) {
    case "COMPLETED":
      return "completed";
    case "IN_PROGRESS":
      return "in_progress";
    default:
      return "not_started";
  }
};

const toExamProgressStatus = (
  progress?: {
    passed: boolean;
    completedAt: Date | null;
  } | null
): ApiProgressStatus => {
  if (!progress) {
    return "not_started";
  }

  if (progress.passed) {
    return "completed";
  }

  return "in_progress";
};

const toDifficulty = (
  difficulty?: "EASY" | "NORMAL" | "HARD" | null
): ApiDifficulty => {
  switch (difficulty) {
    case "EASY":
      return "easy";
    case "NORMAL":
      return "normal";
    case "HARD":
      return "hard";
    default:
      return "easy";
  }
};

const ensureMissionInProgress = async (
  userId: string,
  missionId: string
) => {
  await prisma.userMissionProgress.upsert({
    where: {
      userId_missionId: {
        userId,
        missionId,
      },
    },
    update: {},
    create: {
      userId,
      missionId,
      status: "IN_PROGRESS",
      startedAt: new Date(),
    },
  });
};

export const getMissionOverviewService = async ({
  missionId,
  firebaseUid,
}: GetMissionOverviewServiceInput) => {
  const user = await prisma.user.findUnique({
    where: {
      firebaseUid,
    },
    select: {
      id: true,
    },
  });

  if (!user) {
    throw new AppError(404, "USER_NOT_FOUND", "User not found");
  }

  const mission = await prisma.mission.findFirst({
    where: {
      id: missionId,
      isPublished: true,
      course: {
        isPublished: true,
      },
    },
    include: {
      lessons: {
        orderBy: {
          order: "asc",
        },
        include: {
          progresses: {
            where: {
              userId: user.id,
            },
            select: {
              status: true,
            },
          },
        },
      },
      exam: {
        include: {
          progresses: {
            where: {
              userId: user.id,
            },
            select: {
              passed: true,
              completedAt: true,
            },
          },
        },
      },
    },
  });

  if (!mission) {
    throw new AppError(404, "MISSION_NOT_FOUND", "Mission not found");
  }

  if (!mission.exam) {
    throw new AppError(
      404,
      "MISSION_EXAM_NOT_FOUND",
      "Mission exam not found"
    );
  }

  await ensureMissionInProgress(user.id, mission.id);

  let previousLessonCompleted = true;

  const lessons = mission.lessons.map((lesson) => {
    const progress = lesson.progresses[0];
    const status = toProgressStatus(progress?.status);
    const isLocked = !previousLessonCompleted;

    previousLessonCompleted = status === "completed";

    return {
      id: lesson.id,
      title: lesson.title,
      status,
      isLocked,
      rewardExp: lesson.rewardExp,
    };
  });

  const isAllLessonsCompleted =
    lessons.length > 0 &&
    lessons.every((lesson) => lesson.status === "completed");

  const examProgress = mission.exam.progresses[0];
  const examStatus = toExamProgressStatus(examProgress);

  const missionExam = {
    id: mission.exam.id,
    title: mission.exam.title,
    status: examStatus,
    isLocked: !isAllLessonsCompleted,
    rewardExp: mission.exam.rewardExp,
  };

  return {
    id: mission.id,
    title: mission.title,
    description: mission.description,
    goalImg: mission.goalImg,
    difficulty: toDifficulty(mission.difficulty),
    estimatedMinutes: mission.estimatedMinutes,
    lessons,
    missionExam,
  };
};