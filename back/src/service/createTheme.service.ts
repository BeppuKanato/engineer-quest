import {
  CreateWorkStatus,
  CreateWorkVisibility,
  Prisma,
} from "@prisma/client";

import { AppError } from "../error/appError";
import { prisma } from "../lib/prisma";

const MAX_WORKS_PER_USER = 10;

type WorkPayload = {
  title: string;
  description: string;
  learnedNote?: string | null;
  techStack: string[];
  publicUrl?: string | null;
  repositoryUrl?: string | null;
  imageUrl?: string | null;
  status: CreateWorkStatus;
  requirementIds: string[];
  challengeIds: string[];
};

type WorkWithRelations = Prisma.UserCreateWorkGetPayload<{
  include: {
    theme: {
      include: {
        requirements: { orderBy: { order: "asc" } };
        challenges: { orderBy: { order: "asc" } };
      };
    };
    requirementChecks: true;
    challengeChecks: true;
  };
}>;

const normalizeText = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

export const normalizeStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return [...new Set(value.map(normalizeText).filter(Boolean))].slice(0, 12);
  }

  if (typeof value === "string") {
    return [
      ...new Set(
        value
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      ),
    ].slice(0, 12);
  }

  return [];
};

export const parseWorkPayload = (body: unknown): WorkPayload => {
  const source = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const rawStatus = normalizeText(source.status);

  return {
    title: normalizeText(source.title),
    description: normalizeText(source.description),
    learnedNote: normalizeText(source.learnedNote) || null,
    techStack: normalizeStringArray(source.techStack),
    publicUrl: normalizeText(source.publicUrl) || null,
    repositoryUrl: normalizeText(source.repositoryUrl) || null,
    imageUrl: normalizeText(source.imageUrl) || null,
    status: rawStatus === "COMPLETED" ? CreateWorkStatus.COMPLETED : CreateWorkStatus.DRAFT,
    requirementIds: normalizeStringArray(source.requirementIds),
    challengeIds: normalizeStringArray(source.challengeIds),
  };
};

const assertWorkPayload = (payload: WorkPayload) => {
  if (!payload.title || !payload.description) {
    throw new AppError(400, "WORK_REQUIRED_FIELDS_MISSING", "Title and description are required");
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

const toThemeSummary = (theme: Prisma.CreateThemeGetPayload<{
  include: { requirements: true; challenges: true; _count: { select: { works: true } } };
}>) => ({
  id: theme.id,
  title: theme.title,
  description: theme.description,
  category: theme.category,
  difficulty: theme.difficulty,
  estimatedMinutes: theme.estimatedMinutes,
  tags: theme.tags,
  defaultThumbnailUrl: theme.defaultThumbnailUrl,
  workCount: theme._count.works,
  requirements: theme.requirements
    .sort((a, b) => a.order - b.order)
    .map((item) => ({ id: item.id, label: item.label, description: item.description })),
  challenges: theme.challenges
    .sort((a, b) => a.order - b.order)
    .map((item) => ({ id: item.id, label: item.label, description: item.description })),
});

const toWorkDetail = (work: WorkWithRelations) => {
  const checkedRequirementIds = new Set(
    work.requirementChecks.filter((item) => item.checked).map((item) => item.requirementId)
  );
  const checkedChallengeIds = new Set(
    work.challengeChecks.filter((item) => item.checked).map((item) => item.challengeId)
  );

  return {
    id: work.id,
    themeId: work.themeId,
    themeTitle: work.theme.title,
    title: work.title,
    description: work.description,
    learnedNote: work.learnedNote,
    techStack: work.techStack,
    publicUrl: work.publicUrl,
    repositoryUrl: work.repositoryUrl,
    imageUrl: work.imageUrl,
    status: work.status,
    visibility: work.visibility,
    createdAt: work.createdAt.toISOString(),
    updatedAt: work.updatedAt.toISOString(),
    sharedAt: work.sharedAt?.toISOString() ?? null,
    theme: toThemeSummary({ ...work.theme, _count: { works: 0 } }),
    checkedRequirementIds: [...checkedRequirementIds],
    checkedChallengeIds: [...checkedChallengeIds],
  };
};

const includeWorkRelations = {
  theme: {
    include: {
      requirements: { orderBy: { order: "asc" } },
      challenges: { orderBy: { order: "asc" } },
    },
  },
  requirementChecks: true,
  challengeChecks: true,
} satisfies Prisma.UserCreateWorkInclude;

export const getCreateThemesByFirebaseUid = async (firebaseUid: string) => {
  const user = await getUserByFirebaseUid(firebaseUid);
  const themes = await prisma.createTheme.findMany({
    where: { isPublished: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: {
      requirements: true,
      challenges: true,
      _count: { select: { works: { where: { userId: user.id } } } },
    },
  });

  return themes.map(toThemeSummary);
};

export const getCreateThemeByFirebaseUid = async ({
  firebaseUid,
  themeId,
}: {
  firebaseUid: string;
  themeId: string;
}) => {
  await getUserByFirebaseUid(firebaseUid);
  const theme = await prisma.createTheme.findFirst({
    where: { id: themeId, isPublished: true },
    include: {
      requirements: true,
      challenges: true,
      _count: { select: { works: true } },
    },
  });

  if (!theme) {
    throw new AppError(404, "CREATE_THEME_NOT_FOUND", "Create theme not found");
  }

  return toThemeSummary(theme);
};

export const getUserCreateWorksByFirebaseUid = async (firebaseUid: string) => {
  const user = await getUserByFirebaseUid(firebaseUid);
  const works = await prisma.userCreateWork.findMany({
    where: { userId: user.id },
    orderBy: [{ updatedAt: "desc" }],
    include: includeWorkRelations,
  });

  return works.map(toWorkDetail);
};

export const getUserCreateWorkByFirebaseUid = async ({
  firebaseUid,
  workId,
}: {
  firebaseUid: string;
  workId: string;
}) => {
  const user = await getUserByFirebaseUid(firebaseUid);
  const work = await prisma.userCreateWork.findFirst({
    where: { id: workId, userId: user.id },
    include: includeWorkRelations,
  });

  if (!work) {
    throw new AppError(404, "CREATE_WORK_NOT_FOUND", "Create work not found");
  }

  return toWorkDetail(work);
};

export const createUserCreateWorkByFirebaseUid = async ({
  firebaseUid,
  themeId,
  payload,
}: {
  firebaseUid: string;
  themeId: string;
  payload: WorkPayload;
}) => {
  const user = await getUserByFirebaseUid(firebaseUid);
  assertWorkPayload(payload);

  const theme = await prisma.createTheme.findFirst({
    where: { id: themeId, isPublished: true },
    include: { requirements: true, challenges: true },
  });

  if (!theme) {
    throw new AppError(404, "CREATE_THEME_NOT_FOUND", "Create theme not found");
  }

  const workCount = await prisma.userCreateWork.count({ where: { userId: user.id } });
  if (workCount >= MAX_WORKS_PER_USER) {
    throw new AppError(400, "CREATE_WORK_LIMIT_REACHED", "You can save up to 10 works");
  }

  const validRequirementIds = new Set(theme.requirements.map((item) => item.id));
  const validChallengeIds = new Set(theme.challenges.map((item) => item.id));

  const work = await prisma.$transaction(async (tx) => {
    const created = await tx.userCreateWork.create({
      data: {
        userId: user.id,
        themeId: theme.id,
        courseId: theme.recommendedCourseId,
        title: payload.title,
        description: payload.description,
        learnedNote: payload.learnedNote,
        techStack: payload.techStack,
        publicUrl: payload.publicUrl,
        repositoryUrl: payload.repositoryUrl,
        imageUrl: payload.imageUrl ?? theme.defaultThumbnailUrl,
        status: payload.status,
      },
    });

    await tx.userCreateWorkRequirementCheck.createMany({
      data: payload.requirementIds
        .filter((id) => validRequirementIds.has(id))
        .map((requirementId) => ({ workId: created.id, requirementId, checked: true })),
      skipDuplicates: true,
    });
    await tx.userCreateWorkChallengeCheck.createMany({
      data: payload.challengeIds
        .filter((id) => validChallengeIds.has(id))
        .map((challengeId) => ({ workId: created.id, challengeId, checked: true })),
      skipDuplicates: true,
    });

    return created;
  });

  return { workId: work.id };
};

export const updateUserCreateWorkByFirebaseUid = async ({
  firebaseUid,
  workId,
  payload,
}: {
  firebaseUid: string;
  workId: string;
  payload: WorkPayload;
}) => {
  const user = await getUserByFirebaseUid(firebaseUid);
  assertWorkPayload(payload);

  const work = await prisma.userCreateWork.findFirst({
    where: { id: workId, userId: user.id },
    include: { theme: { include: { requirements: true, challenges: true } } },
  });

  if (!work) {
    throw new AppError(404, "CREATE_WORK_NOT_FOUND", "Create work not found");
  }

  const validRequirementIds = new Set(work.theme.requirements.map((item) => item.id));
  const validChallengeIds = new Set(work.theme.challenges.map((item) => item.id));

  await prisma.$transaction(async (tx) => {
    await tx.userCreateWork.update({
      where: { id: work.id },
      data: {
        title: payload.title,
        description: payload.description,
        learnedNote: payload.learnedNote,
        techStack: payload.techStack,
        publicUrl: payload.publicUrl,
        repositoryUrl: payload.repositoryUrl,
        imageUrl: payload.imageUrl ?? work.theme.defaultThumbnailUrl,
        status: payload.status,
      },
    });
    await tx.userCreateWorkRequirementCheck.deleteMany({ where: { workId: work.id } });
    await tx.userCreateWorkChallengeCheck.deleteMany({ where: { workId: work.id } });
    await tx.userCreateWorkRequirementCheck.createMany({
      data: payload.requirementIds
        .filter((id) => validRequirementIds.has(id))
        .map((requirementId) => ({ workId: work.id, requirementId, checked: true })),
      skipDuplicates: true,
    });
    await tx.userCreateWorkChallengeCheck.createMany({
      data: payload.challengeIds
        .filter((id) => validChallengeIds.has(id))
        .map((challengeId) => ({ workId: work.id, challengeId, checked: true })),
      skipDuplicates: true,
    });
  });

  return { workId: work.id };
};

export const deleteUserCreateWorkByFirebaseUid = async ({
  firebaseUid,
  workId,
}: {
  firebaseUid: string;
  workId: string;
}) => {
  const user = await getUserByFirebaseUid(firebaseUid);
  const work = await prisma.userCreateWork.findFirst({
    where: { id: workId, userId: user.id },
    select: { id: true },
  });

  if (!work) {
    throw new AppError(404, "CREATE_WORK_NOT_FOUND", "Create work not found");
  }

  await prisma.userCreateWork.delete({ where: { id: work.id } });
};

export const shareUserCreateWorkByFirebaseUid = async ({
  firebaseUid,
  workId,
}: {
  firebaseUid: string;
  workId: string;
}) => {
  const user = await getUserByFirebaseUid(firebaseUid);
  const work = await prisma.userCreateWork.findFirst({
    where: { id: workId, userId: user.id },
    select: { id: true },
  });

  if (!work) {
    throw new AppError(404, "CREATE_WORK_NOT_FOUND", "Create work not found");
  }

  await prisma.userCreateWork.update({
    where: { id: work.id },
    data: { visibility: CreateWorkVisibility.SHARED, sharedAt: new Date() },
  });

  return { workId: work.id };
};

export const unshareUserCreateWorkByFirebaseUid = async ({
  firebaseUid,
  workId,
}: {
  firebaseUid: string;
  workId: string;
}) => {
  const user = await getUserByFirebaseUid(firebaseUid);
  const work = await prisma.userCreateWork.findFirst({
    where: { id: workId, userId: user.id },
    select: { id: true },
  });

  if (!work) {
    throw new AppError(404, "CREATE_WORK_NOT_FOUND", "Create work not found");
  }

  await prisma.userCreateWork.update({
    where: { id: work.id },
    data: { visibility: CreateWorkVisibility.PRIVATE, sharedAt: null },
  });

  return { workId: work.id };
};

export const getSharedCreateWorks = async () => {
  const works = await prisma.userCreateWork.findMany({
    where: { visibility: CreateWorkVisibility.SHARED },
    orderBy: [{ sharedAt: "desc" }, { updatedAt: "desc" }],
    take: 30,
    include: includeWorkRelations,
  });

  return works.map(toWorkDetail);
};
