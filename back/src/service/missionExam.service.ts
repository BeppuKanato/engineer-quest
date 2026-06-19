// src/service/missionExam.service.ts

import { ExamDifficulty } from "@prisma/client";

import { AppError } from "../error/appError";
import { prisma } from "../lib/prisma";

// =========================
// Types
// =========================

type MissionExamDifficultyResponse = "easy" | "normal" | "hard";

type GetMissionExamIntroServiceInput = {
  missionId: string;
  firebaseUid: string;
};

type StartMissionExamServiceInput = {
  missionId: string;
  firebaseUid: string;
  difficulty: string;
};

type GetMissionExamPlayServiceInput = {
  missionId: string;
  firebaseUid: string;
  difficulty: string;
};

type SubmitMissionExamServiceInput = {
  missionId: string;
  firebaseUid: string;
  difficulty: string;
  submittedCode: string;
};

type GetMissionExamResultServiceInput = {
  missionId: string;
  firebaseUid: string;
  difficulty: string;
};

export type MissionExamIntroDto = {
  missionTitle: string;
  examTitle: string;
  description: string;
  estimatedTime: string;
  rewardExp: number;
  thumbnailUrl: string | null;
};

export type StartMissionExamDto = {
  missionId: string;
  missionExamId: string;
  difficulty: MissionExamDifficultyResponse;
  startedAt: string | null;
  passed: boolean;
};

export type MissionExamPlayDto = {
  problem: {
    missionExamId: string;
    variantId: string;
    missionId: string;
    title: string;
    description: string;
    difficulty: MissionExamDifficultyResponse;
    thumbnailUrl: string | null;
    answerCode: string;
    initialCode: string;
    previewCss: string;
  };
  progress: {
    passed: boolean;
    startedAt: string | null;
    completedAt: string | null;
  };
};

export type SubmitMissionExamDto = {
  missionId: string;
  missionExamId: string;
  difficulty: MissionExamDifficultyResponse;
  isCorrect: boolean;
  passed: boolean;
  rewardExp: number;
  submittedAt: string;
  nextMission: {
    id: string;
    title: string;
  } | null;
};

export type MissionExamResultDto = {
  missionId: string;
  missionExamId: string;
  missionTitle: string;
  examTitle: string;
  difficulty: MissionExamDifficultyResponse;
  rewardExp: number;
  completedAt: string;
  nextMission: {
    id: string;
    title: string;
  } | null;
  clearedDifficulties: {
    easy: boolean;
    normal: boolean;
    hard: boolean;
  };
};

// =========================
// Helpers
// =========================

const toExamDifficulty = (difficulty: string): ExamDifficulty => {
  switch (difficulty) {
    case "easy":
      return ExamDifficulty.EASY;
    case "normal":
      return ExamDifficulty.NORMAL;
    case "hard":
      return ExamDifficulty.HARD;
    default:
      throw new AppError(400, "BAD_REQUEST", "Invalid difficulty");
  }
};

const toDifficultyResponse = (
  difficulty: ExamDifficulty
): MissionExamDifficultyResponse => {
  switch (difficulty) {
    case ExamDifficulty.EASY:
      return "easy";
    case ExamDifficulty.NORMAL:
      return "normal";
    case ExamDifficulty.HARD:
      return "hard";
  }
};

const findUserIdByFirebaseUid = async (firebaseUid: string): Promise<string> => {
  const user = await prisma.user.findUnique({
    where: {
      firebaseUid,
    },
    select: {
      id: true,
    },
  });

  if (!user) {
    throw new AppError(401, "UNAUTHORIZED", "User not found");
  }

  return user.id;
};

const toIsoStringOrNull = (date: Date | null | undefined): string | null => {
  return date?.toISOString() ?? null;
};

const normalizeCode = (code: string): string => {
  return code
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .trim();
};

const isCodeCorrect = (submittedCode: string, answerCode: string): boolean => {
  return normalizeCode(submittedCode) === normalizeCode(answerCode);
};

// =========================
// Services
// =========================

export const getMissionExamIntroService = async ({
  missionId,
  firebaseUid,
}: GetMissionExamIntroServiceInput): Promise<MissionExamIntroDto> => {
  await findUserIdByFirebaseUid(firebaseUid);

  const mission = await prisma.mission.findFirst({
    where: {
      id: missionId,
      isPublished: true,
    },
    select: {
      title: true,
      exam: {
        select: {
          title: true,
          description: true,
          thumbnailUrl: true,
          estimatedTime: true,
          rewardExp: true,
          variants: {
            select: {
              difficulty: true,
            },
          },
        },
      },
    },
  });

  if (!mission) {
    throw new AppError(404, "NOT_FOUND", "Mission not found");
  }

  if (!mission.exam) {
    throw new AppError(404, "NOT_FOUND", "Mission exam not found");
  }

  if (mission.exam.variants.length === 0) {
    throw new AppError(
      500,
      "INTERNAL_SERVER_ERROR",
      "Mission exam variants are not configured"
    );
  }

  return {
    missionTitle: mission.title,
    examTitle: mission.exam.title,
    description: mission.exam.description,
    estimatedTime: mission.exam.estimatedTime,
    rewardExp: mission.exam.rewardExp,
    thumbnailUrl: mission.exam.thumbnailUrl ?? null,
  };
};

export const startMissionExamService = async ({
  missionId,
  firebaseUid,
  difficulty,
}: StartMissionExamServiceInput): Promise<StartMissionExamDto> => {
  const examDifficulty = toExamDifficulty(difficulty);
  const userId = await findUserIdByFirebaseUid(firebaseUid);

  const mission = await prisma.mission.findFirst({
    where: {
      id: missionId,
      isPublished: true,
    },
    select: {
      id: true,
      exam: {
        select: {
          id: true,
          variants: {
            where: {
              difficulty: examDifficulty,
            },
            select: {
              id: true,
            },
          },
        },
      },
    },
  });

  if (!mission) {
    throw new AppError(404, "NOT_FOUND", "Mission not found");
  }

  if (!mission.exam) {
    throw new AppError(404, "NOT_FOUND", "Mission exam not found");
  }

  if (mission.exam.variants.length === 0) {
    throw new AppError(404, "NOT_FOUND", "Mission exam variant not found");
  }

  const existingProgress = await prisma.userMissionExamProgress.findUnique({
    where: {
      userId_missionExamId_difficulty: {
        userId,
        missionExamId: mission.exam.id,
        difficulty: examDifficulty,
      },
    },
  });

  const progress =
    existingProgress ??
    (await prisma.userMissionExamProgress.create({
      data: {
        userId,
        missionExamId: mission.exam.id,
        difficulty: examDifficulty,
        passed: false,
        startedAt: new Date(),
      },
    }));

  return {
    missionId: mission.id,
    missionExamId: mission.exam.id,
    difficulty: toDifficultyResponse(progress.difficulty),
    startedAt: toIsoStringOrNull(progress.startedAt),
    passed: progress.passed,
  };
};

export const getMissionExamPlayService = async ({
  missionId,
  firebaseUid,
  difficulty,
}: GetMissionExamPlayServiceInput): Promise<MissionExamPlayDto> => {
  const examDifficulty = toExamDifficulty(difficulty);
  const userId = await findUserIdByFirebaseUid(firebaseUid);

  const mission = await prisma.mission.findFirst({
    where: {
      id: missionId,
      isPublished: true,
    },
    select: {
      id: true,
      exam: {
        select: {
          id: true,
          title: true,
          description: true,
          thumbnailUrl: true,
          previewCss: true,
          variants: {
            where: {
              difficulty: examDifficulty,
            },
            select: {
              id: true,
              difficulty: true,
              initialCode: true,
              answerCode: true,
            },
          },
          progresses: {
            where: {
              userId,
              difficulty: examDifficulty,
            },
            select: {
              passed: true,
              startedAt: true,
              completedAt: true,
            },
            take: 1,
          },
        },
      },
    },
  });

  if (!mission) {
    throw new AppError(404, "NOT_FOUND", "Mission not found");
  }

  if (!mission.exam) {
    throw new AppError(404, "NOT_FOUND", "Mission exam not found");
  }

  const variant = mission.exam.variants[0];

  if (!variant) {
    throw new AppError(404, "NOT_FOUND", "Mission exam variant not found");
  }

  const progress = mission.exam.progresses[0] ?? null;

  return {
    problem: {
      missionExamId: mission.exam.id,
      variantId: variant.id,
      missionId: mission.id,
      title: mission.exam.title,
      description: mission.exam.description,
      difficulty: toDifficultyResponse(variant.difficulty),
      thumbnailUrl: mission.exam.thumbnailUrl ?? null,
      answerCode: variant.answerCode,
      initialCode: variant.initialCode,
      previewCss: mission.exam.previewCss ?? "",
    },
    progress: {
      passed: progress?.passed ?? false,
      startedAt: toIsoStringOrNull(progress?.startedAt),
      completedAt: toIsoStringOrNull(progress?.completedAt),
    },
  };
};

export const submitMissionExamService = async ({
  missionId,
  firebaseUid,
  difficulty,
  submittedCode,
}: SubmitMissionExamServiceInput): Promise<SubmitMissionExamDto> => {
  const examDifficulty = toExamDifficulty(difficulty);
  const userId = await findUserIdByFirebaseUid(firebaseUid);

  const mission = await prisma.mission.findFirst({
    where: {
      id: missionId,
      isPublished: true,
      course: {
        isPublished: true,
      },
    },
    select: {
      id: true,
      courseId: true,
      order: true,
      exam: {
        select: {
          id: true,
          rewardExp: true,
          variants: {
            where: {
              difficulty: examDifficulty,
            },
            select: {
              answerCode: true,
              difficulty: true,
            },
          },
        },
      },
    },
  });

  if (!mission) {
    throw new AppError(404, "NOT_FOUND", "Mission not found");
  }

  if (!mission.exam) {
    throw new AppError(404, "NOT_FOUND", "Mission exam not found");
  }

  const variant = mission.exam.variants[0];

  if (!variant) {
    throw new AppError(404, "NOT_FOUND", "Mission exam variant not found");
  }

  const submittedAt = new Date();
  const correct = isCodeCorrect(submittedCode, variant.answerCode);

  if (!correct) {
    return {
      missionId: mission.id,
      missionExamId: mission.exam.id,
      difficulty: toDifficultyResponse(variant.difficulty),
      isCorrect: false,
      passed: false,
      rewardExp: 0,
      submittedAt: submittedAt.toISOString(),
      nextMission: null,
    };
  }

  const nextMission = await prisma.$transaction(async (tx) => {
    await tx.userMissionExamProgress.upsert({
      where: {
        userId_missionExamId_difficulty: {
          userId,
          missionExamId: mission.exam!.id,
          difficulty: examDifficulty,
        },
      },
      update: {
        passed: true,
        completedAt: submittedAt,
      },
      create: {
        userId,
        missionExamId: mission.exam!.id,
        difficulty: examDifficulty,
        passed: true,
        startedAt: submittedAt,
        completedAt: submittedAt,
      },
    });

    await tx.userMissionProgress.upsert({
      where: {
        userId_missionId: {
          userId,
          missionId: mission.id,
        },
      },
      update: {
        status: "COMPLETED",
        completedAt: submittedAt,
      },
      create: {
        userId,
        missionId: mission.id,
        status: "COMPLETED",
        startedAt: submittedAt,
        completedAt: submittedAt,
      },
    });

    return tx.mission.findFirst({
      where: {
        courseId: mission.courseId,
        order: {
          gt: mission.order,
        },
        isPublished: true,
      },
      orderBy: {
        order: "asc",
      },
      select: {
        id: true,
        title: true,
      },
    });
  });

  return {
    missionId: mission.id,
    missionExamId: mission.exam.id,
    difficulty: toDifficultyResponse(variant.difficulty),
    isCorrect: true,
    passed: true,
    rewardExp: mission.exam.rewardExp,
    submittedAt: submittedAt.toISOString(),
    nextMission,
  };
};

export const getMissionExamResultService = async ({
  missionId,
  firebaseUid,
  difficulty,
}: GetMissionExamResultServiceInput): Promise<MissionExamResultDto> => {
  const examDifficulty = toExamDifficulty(difficulty);
  const userId = await findUserIdByFirebaseUid(firebaseUid);

  const mission = await prisma.mission.findFirst({
    where: {
      id: missionId,
      isPublished: true,
      course: {
        isPublished: true,
      },
    },
    select: {
      id: true,
      title: true,
      courseId: true,
      order: true,
      exam: {
        select: {
          id: true,
          title: true,
          rewardExp: true,
          progresses: {
            where: {
              userId,
            },
            select: {
              difficulty: true,
              passed: true,
              completedAt: true,
            },
          },
        },
      },
    },
  });

  if (!mission) {
    throw new AppError(404, "NOT_FOUND", "Mission not found");
  }

  if (!mission.exam) {
    throw new AppError(404, "NOT_FOUND", "Mission exam not found");
  }

  const targetProgress = mission.exam.progresses.find(
    (progress) => progress.difficulty === examDifficulty
  );

  if (!targetProgress?.passed || !targetProgress.completedAt) {
    throw new AppError(
      403,
      "RESULT_NOT_AVAILABLE",
      "Mission exam result is not available"
    );
  }

  const nextMission = await prisma.mission.findFirst({
    where: {
      courseId: mission.courseId,
      order: {
        gt: mission.order,
      },
      isPublished: true,
    },
    orderBy: {
      order: "asc",
    },
    select: {
      id: true,
      title: true,
    },
  });

  const clearedDifficulties = mission.exam.progresses.reduce(
    (result, progress) => {
      if (progress.passed) {
        result[toDifficultyResponse(progress.difficulty)] = true;
      }

      return result;
    },
    {
      easy: false,
      normal: false,
      hard: false,
    } as MissionExamResultDto["clearedDifficulties"]
  );

  return {
    missionId: mission.id,
    missionExamId: mission.exam.id,
    missionTitle: mission.title,
    examTitle: mission.exam.title,
    difficulty: toDifficultyResponse(examDifficulty),
    rewardExp: mission.exam.rewardExp,
    completedAt: targetProgress.completedAt.toISOString(),
    nextMission,
    clearedDifficulties,
  };
};
