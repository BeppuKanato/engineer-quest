import {
  BadgeTicketReason,
  Prisma,
  ProgressStatus as PrismaProgressStatus,
} from "@prisma/client";
import OpenAI from "openai";

import { AppError } from "../error/appError";
import { prisma } from "../lib/prisma";
import { awardBadgeTickets } from "./badge.service";

type SaveUserWorkInput = {
  firebaseUid: string;
  createMissionId: string;
  title: string;
  description: string;
  focusPoint: string;
  technologies: string[];
  code: string;
  isFavorite?: boolean;
};

type UpdateUserWorkInput = Omit<SaveUserWorkInput, "createMissionId"> & {
  workId: string;
};

type CreateMissionWithCourse = Prisma.CreateMissionGetPayload<{
  include: {
    course: { select: { title: true } };
  };
}>;

type UserWorkWithSummary = Prisma.UserWorkGetPayload<{
  include: {
    createMission: { select: { title: true } };
    course: { select: { title: true } };
    mission: { select: { title: true } };
    reviews: true;
  };
}>;

const normalizeText = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

export const normalizeTechnologies = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return [
      ...new Set(
        value
          .map((item) => normalizeText(item))
          .filter((item) => item.length > 0)
      ),
    ].slice(0, 12);
  }

  if (typeof value === "string") {
    return [
      ...new Set(
        value
          .split(",")
          .map((item) => item.trim())
          .filter((item) => item.length > 0)
      ),
    ].slice(0, 12);
  }

  return [];
};

const assertWorkInput = ({
  title,
  description,
  focusPoint,
  technologies,
  code,
}: {
  title: string;
  description: string;
  focusPoint: string;
  technologies: string[];
  code: string;
}) => {
  if (!title || !description || !focusPoint || !code) {
    throw new AppError(
      400,
      "WORK_REQUIRED_FIELDS_MISSING",
      "Title, description, focus point and code are required"
    );
  }

  if (technologies.length === 0) {
    throw new AppError(
      400,
      "WORK_TECHNOLOGIES_REQUIRED",
      "At least one technology is required"
    );
  }
};

const getUserByFirebaseUid = async (firebaseUid: string) => {
  const user = await prisma.user.findUnique({
    where: { firebaseUid },
    select: { id: true },
  });

  if (!user) {
    throw new AppError(404, "USER_NOT_FOUND", "User not found");
  }

  return user;
};

const isCourseComplete = async (userId: string, courseId: string) => {
  const requiredMissions = await prisma.mission.findMany({
    where: {
      courseId,
      isPublished: true,
      isRequiredForCourseCompletion: true,
    },
    select: {
      id: true,
      progresses: {
        where: {
          userId,
          status: PrismaProgressStatus.COMPLETED,
        },
        select: { id: true },
      },
    },
  });

  return (
    requiredMissions.length > 0 &&
    requiredMissions.every((mission) => mission.progresses.length > 0)
  );
};

const toCreateMissionSummary = async (
  createMission: CreateMissionWithCourse,
  userId: string
) => {
  const [unlocked, workCount, latestWork] = await Promise.all([
    isCourseComplete(userId, createMission.courseId),
    prisma.userWork.count({
      where: { userId, createMissionId: createMission.id },
    }),
    prisma.userWork.findFirst({
      where: { userId, createMissionId: createMission.id },
      orderBy: { updatedAt: "desc" },
      select: { id: true, updatedAt: true },
    }),
  ]);

  return {
    id: createMission.id,
    courseId: createMission.courseId,
    courseTitle: createMission.course.title,
    title: createMission.title,
    theme: createMission.theme,
    description: createMission.description,
    minimumRequirements: createMission.minimumRequirements,
    advancedRequirements: createMission.advancedRequirements,
    suggestedTechnologies: createMission.suggestedTechnologies,
    starterCode: createMission.starterCode,
    isUnlocked: unlocked,
    workCount,
    latestWorkId: latestWork?.id ?? null,
    latestWorkUpdatedAt: latestWork?.updatedAt.toISOString() ?? null,
  };
};

const toWorkSummary = (work: UserWorkWithSummary) => {
  const latestReview = work.reviews[0] ?? null;

  return {
    id: work.id,
    createMissionId: work.createMissionId,
    createMissionTitle: work.createMission.title,
    courseId: work.courseId,
    courseTitle: work.course.title,
    missionId: work.missionId,
    missionTitle: work.mission?.title ?? null,
    title: work.title,
    description: work.description,
    focusPoint: work.focusPoint,
    technologies: work.technologies,
    code: work.code,
    isFavorite: work.isFavorite,
    createdAt: work.createdAt.toISOString(),
    updatedAt: work.updatedAt.toISOString(),
    latestReview: latestReview
      ? {
          id: latestReview.id,
          goodPoints: latestReview.goodPoints,
          improvements: latestReview.improvements,
          nextTry: latestReview.nextTry,
          rawText: latestReview.rawText,
          createdAt: latestReview.createdAt.toISOString(),
        }
      : null,
  };
};

export const getCreateMissionsByFirebaseUid = async (firebaseUid: string) => {
  const user = await getUserByFirebaseUid(firebaseUid);
  const createMissions = await prisma.createMission.findMany({
    where: {
      isPublished: true,
      course: { isPublished: true },
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: {
      course: { select: { title: true } },
    },
  });

  return Promise.all(
    createMissions.map((createMission) =>
      toCreateMissionSummary(createMission, user.id)
    )
  );
};

export const getCreateMissionByFirebaseUid = async ({
  firebaseUid,
  createMissionId,
}: {
  firebaseUid: string;
  createMissionId: string;
}) => {
  const user = await getUserByFirebaseUid(firebaseUid);
  const createMission = await prisma.createMission.findFirst({
    where: {
      id: createMissionId,
      isPublished: true,
      course: { isPublished: true },
    },
    include: {
      course: { select: { title: true } },
    },
  });

  if (!createMission) {
    throw new AppError(
      404,
      "CREATE_MISSION_NOT_FOUND",
      "Create Mission not found"
    );
  }

  return toCreateMissionSummary(createMission, user.id);
};

export const saveUserWorkByFirebaseUid = async ({
  firebaseUid,
  createMissionId,
  title,
  description,
  focusPoint,
  technologies,
  code,
  isFavorite = false,
}: SaveUserWorkInput) => {
  const user = await getUserByFirebaseUid(firebaseUid);
  const createMission = await prisma.createMission.findFirst({
    where: { id: createMissionId, isPublished: true },
    select: { id: true, courseId: true, missionId: true, title: true },
  });

  if (!createMission) {
    throw new AppError(
      404,
      "CREATE_MISSION_NOT_FOUND",
      "Create Mission not found"
    );
  }

  const isUnlocked = await isCourseComplete(user.id, createMission.courseId);

  if (!isUnlocked) {
    throw new AppError(
      403,
      "CREATE_MISSION_LOCKED",
      "Course completion is required"
    );
  }

  assertWorkInput({ title, description, focusPoint, technologies, code });

  const result = await prisma.$transaction(async (tx) => {
    const work = await tx.userWork.create({
      data: {
        userId: user.id,
        createMissionId: createMission.id,
        courseId: createMission.courseId,
        missionId: createMission.missionId,
        title,
        description,
        focusPoint,
        technologies,
        code,
        isFavorite,
      },
    });

    const ticketReward = await awardBadgeTickets(tx, {
      userId: user.id,
      amount: 1,
      reason: BadgeTicketReason.CREATE_WORK_SAVE,
      sourceId: work.id,
      note: work.title,
    });

    return { work, ticketReward };
  });

  return {
    workId: result.work.id,
    ticketReward: result.ticketReward,
  };
};

export const getUserWorksByFirebaseUid = async (firebaseUid: string) => {
  const user = await getUserByFirebaseUid(firebaseUid);
  const works = await prisma.userWork.findMany({
    where: { userId: user.id },
    orderBy: [{ isFavorite: "desc" }, { updatedAt: "desc" }],
    include: {
      createMission: { select: { title: true } },
      course: { select: { title: true } },
      mission: { select: { title: true } },
      reviews: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  return works.map(toWorkSummary);
};

export const getUserWorkByFirebaseUid = async ({
  firebaseUid,
  workId,
}: {
  firebaseUid: string;
  workId: string;
}) => {
  const user = await getUserByFirebaseUid(firebaseUid);
  const work = await prisma.userWork.findFirst({
    where: { id: workId, userId: user.id },
    include: {
      createMission: { select: { title: true } },
      course: { select: { title: true } },
      mission: { select: { title: true } },
      reviews: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!work) {
    throw new AppError(404, "WORK_NOT_FOUND", "Work not found");
  }

  return {
    ...toWorkSummary({ ...work, reviews: work.reviews.slice(0, 1) }),
    reviews: work.reviews.map((review) => ({
      id: review.id,
      goodPoints: review.goodPoints,
      improvements: review.improvements,
      nextTry: review.nextTry,
      rawText: review.rawText,
      createdAt: review.createdAt.toISOString(),
    })),
  };
};

export const updateUserWorkByFirebaseUid = async ({
  firebaseUid,
  workId,
  title,
  description,
  focusPoint,
  technologies,
  code,
  isFavorite = false,
}: UpdateUserWorkInput) => {
  const user = await getUserByFirebaseUid(firebaseUid);
  assertWorkInput({ title, description, focusPoint, technologies, code });

  const work = await prisma.userWork.findFirst({
    where: { id: workId, userId: user.id },
    select: { id: true },
  });

  if (!work) {
    throw new AppError(404, "WORK_NOT_FOUND", "Work not found");
  }

  const updatedWork = await prisma.userWork.update({
    where: { id: work.id },
    data: {
      title,
      description,
      focusPoint,
      technologies,
      code,
      isFavorite,
    },
  });

  return { workId: updatedWork.id };
};

export const deleteUserWorkByFirebaseUid = async ({
  firebaseUid,
  workId,
}: {
  firebaseUid: string;
  workId: string;
}) => {
  const user = await getUserByFirebaseUid(firebaseUid);
  const work = await prisma.userWork.findFirst({
    where: { id: workId, userId: user.id },
    select: { id: true },
  });

  if (!work) {
    throw new AppError(404, "WORK_NOT_FOUND", "Work not found");
  }

  await prisma.userWork.delete({ where: { id: work.id } });
};

const createFallbackReview = () => ({
  goodPoints:
    "作品名、説明、こだわりポイント、コードが整理されていて、何を作ったのかを振り返りやすい形で記録できています。",
  improvements:
    "次に見返す自分のために、コードのどの部分を工夫したのかをコメントや説明文でもう少し具体化すると改善しやすくなります。",
  nextTry:
    "小さな見た目の調整や機能追加を1つ決めて、改善版として再保存してみましょう。",
});

const parseReviewJson = (text: string) => {
  try {
    const parsed = JSON.parse(text) as Partial<ReturnType<typeof createFallbackReview>>;

    if (
      typeof parsed.goodPoints === "string" &&
      typeof parsed.improvements === "string" &&
      typeof parsed.nextTry === "string"
    ) {
      return {
        goodPoints: parsed.goodPoints,
        improvements: parsed.improvements,
        nextTry: parsed.nextTry,
      };
    }
  } catch {
    return null;
  }

  return null;
};

const generateAiReview = async (work: {
  title: string;
  description: string;
  focusPoint: string;
  technologies: string[];
  code: string;
}) => {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return {
      ...createFallbackReview(),
      rawText:
        "OPENAI_API_KEY is not configured. Returned fallback beginner-friendly review.",
    };
  }

  const openai = new OpenAI({ apiKey });
  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    temperature: 0.4,
    messages: [
      {
        role: "system",
        content:
          "あなたは初心者向けプログラミング学習アプリのコードレビュー支援AIです。採点、合否判定、点数評価、完成コードの丸ごと生成は禁止です。良い点、改善できる点、次に試すとよいことを日本語で短く具体的に返してください。必ずJSONだけを返してください。",
      },
      {
        role: "user",
        content: JSON.stringify({
          responseFormat: {
            goodPoints: "良い点を1段落",
            improvements: "改善できる点を1段落",
            nextTry: "次に試すとよいことを1段落",
          },
          work,
        }),
      },
    ],
  });
  const rawText = completion.choices[0]?.message.content ?? "";
  const parsed = parseReviewJson(rawText) ?? createFallbackReview();

  return {
    ...parsed,
    rawText,
  };
};

export const reviewUserWorkByFirebaseUid = async ({
  firebaseUid,
  workId,
}: {
  firebaseUid: string;
  workId: string;
}) => {
  const user = await getUserByFirebaseUid(firebaseUid);
  const work = await prisma.userWork.findFirst({
    where: { id: workId, userId: user.id },
    select: {
      id: true,
      title: true,
      description: true,
      focusPoint: true,
      technologies: true,
      code: true,
    },
  });

  if (!work) {
    throw new AppError(404, "WORK_NOT_FOUND", "Work not found");
  }

  const review = await generateAiReview(work);

  const result = await prisma.$transaction(async (tx) => {
    const createdReview = await tx.userWorkReview.create({
      data: {
        userWorkId: work.id,
        goodPoints: review.goodPoints,
        improvements: review.improvements,
        nextTry: review.nextTry,
        rawText: review.rawText,
      },
    });

    const ticketReward = await awardBadgeTickets(tx, {
      userId: user.id,
      amount: 1,
      reason: BadgeTicketReason.CREATE_WORK_REVIEW,
      sourceId: work.id,
      note: work.title,
    });

    return { createdReview, ticketReward };
  });

  return {
    review: {
      id: result.createdReview.id,
      goodPoints: result.createdReview.goodPoints,
      improvements: result.createdReview.improvements,
      nextTry: result.createdReview.nextTry,
      rawText: result.createdReview.rawText,
      createdAt: result.createdReview.createdAt.toISOString(),
    },
    ticketReward: result.ticketReward,
  };
};
