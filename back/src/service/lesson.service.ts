import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError } from "../error/appError";

type LessonActivityContent = {
  choices?: unknown;
  blankArea?: unknown;
  blanks?: unknown;
  blankChoices?: unknown;
  input?: unknown;
  summary?: unknown;
  starterCode?: unknown;
  sampleCode?: unknown;
  correctFeedback?: unknown;
  incorrectFeedback?: unknown;
};

const toObject = (value: Prisma.JsonValue): Record<string, unknown> => {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
};

export const getLessonPlayById = async (
  firebaseUid: string,
  lessonId: string
) => {
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

  const lesson = await prisma.lesson.findUnique({
    where: {
      id: lessonId,
    },
    include: {
      mission: {
        include: {
          course: true,
        },
      },
      activities: {
        orderBy: {
          order: "asc",
        },
      },
    },
  });

  if (!lesson) {
    throw new AppError(404, "LESSON_NOT_FOUND", "Lesson not found");
  }

  if (!lesson.mission.isPublished || !lesson.mission.course.isPublished) {
    throw new AppError(404, "LESSON_NOT_FOUND", "Lesson not found");
  }

  /**
   * いったん lesson/play に入った時点で開始扱いにする。
   * すでに progress がある場合は何もしない。
   */
  await prisma.userLessonProgress.upsert({
    where: {
      userId_lessonId: {
        userId: user.id,
        lessonId: lesson.id,
      },
    },
    update: {},
    create: {
      userId: user.id,
      lessonId: lesson.id,
      status: "IN_PROGRESS",
      startedAt: new Date(),
    },
  });

  const activities = lesson.activities.map((activity) => {
    const content = toObject(activity.content);
    const preview = toObject(activity.preview);

    return {
      id: activity.id,
      type: activity.type,
      title: activity.title,
      instruction: activity.instruction,
      mentorMessage: activity.mentorMessage,

      ...content,

      preview,
      actionLabel: activity.actionLabel,
    };
  });

  return {
    id: lesson.id,
    missionId: lesson.missionId,
    courseId: lesson.mission.courseId,
    courseTitle: lesson.mission.course.title,
    title: lesson.title,
    description: lesson.description,
    activities,
  };
};

export const completeLessonById = async (
  firebaseUid: string,
  lessonId: string
) => {
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

  const lesson = await prisma.lesson.findUnique({
    where: {
      id: lessonId,
    },
    include: {
      mission: {
        include: {
          course: true,
        },
      },
    },
  });

  if (!lesson) {
    throw new AppError(404, "LESSON_NOT_FOUND", "Lesson not found");
  }

  if (!lesson.mission.isPublished || !lesson.mission.course.isPublished) {
    throw new AppError(404, "LESSON_NOT_FOUND", "Lesson not found");
  }

  const now = new Date();

  const lessonProgress = await prisma.userLessonProgress.upsert({
    where: {
      userId_lessonId: {
        userId: user.id,
        lessonId: lesson.id,
      },
    },
    update: {
      status: "COMPLETED",
      completedAt: now,
    },
    create: {
      userId: user.id,
      lessonId: lesson.id,
      status: "COMPLETED",
      startedAt: now,
      completedAt: now,
    },
  });

  return {
    lessonId: lesson.id,
    missionId: lesson.missionId,
    status:
      lessonProgress.status === "COMPLETED"
        ? "completed"
        : "in_progress",
    completedAt: lessonProgress.completedAt,
  };
};