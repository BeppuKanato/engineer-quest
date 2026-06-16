// src/service/missionExam.service.ts

import { prisma } from "../lib/prisma";
import { AppError } from "../error/appError";
import { ExamDifficulty } from "@prisma/client";

type GetMissionExamIntroServiceInput = {
  missionId: string;
  firebaseUid: string;
};

type StartMissionExamServiceInput = {
  missionId: string;
  firebaseUid: string;
  difficulty: string;
};

export type StartMissionExamDto = {
  missionId: string;
  missionExamId: string;
  difficulty: "easy" | "normal" | "hard";
  startedAt: string | null;
  passed: boolean;
};

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
): "easy" | "normal" | "hard" => {
  switch (difficulty) {
    case ExamDifficulty.EASY:
      return "easy";
    case ExamDifficulty.NORMAL:
      return "normal";
    case ExamDifficulty.HARD:
      return "hard";
  }
};

export type MissionExamIntroDto = {
  missionTitle: string;
  examTitle: string;
  description: string;
  estimatedTime: string;
  rewardExp: number;
  thumbnailUrl: string | null;
};

export const getMissionExamIntroService = async ({
  missionId,
  firebaseUid,
}: GetMissionExamIntroServiceInput): Promise<MissionExamIntroDto> => {
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
        userId: user.id,
        missionExamId: mission.exam.id,
        difficulty: examDifficulty,
      },
    },
  });

  const progress =
    existingProgress ??
    (await prisma.userMissionExamProgress.create({
      data: {
        userId: user.id,
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
    startedAt: progress.startedAt?.toISOString() ?? null,
    passed: progress.passed,
  };
};