import {
  Prisma,
  QuestPostCategory,
  QuestPostStatus,
  QuestReactionType,
} from "@prisma/client";

import { AppError } from "../error/appError";
import { prisma } from "../lib/prisma";

type CreateQuestPostInput = {
  firebaseUid: string;
  category: string;
  title: string;
  body: string;
  code: string | null;
  referenceUrl: string | null;
  courseId: string | null;
  missionId: string | null;
};

type ListQuestPostsInput = {
  firebaseUid: string;
  q?: string;
  category?: string;
  courseId?: string;
  missionId?: string;
  status?: string;
  mine?: string;
};

const categoryLabels: Record<QuestPostCategory, string> = {
  QUESTION: "質問",
  ERROR_HELP: "エラー相談",
  WORK_SHARE: "作品共有",
  CODE_SHARE: "コード共有",
  MEMO: "メモ",
  REFERENCE: "参考リンク",
};

const reactionLabels: Record<QuestReactionType, string> = {
  LIKE: "いいね",
  HELPFUL: "参考になった",
  SAVED_ME: "助かった",
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

const normalizeText = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const normalizeNullableText = (value: unknown) => {
  const text = normalizeText(value);
  return text.length > 0 ? text : null;
};

const parseCategory = (value: string): QuestPostCategory => {
  if (
    Object.values(QuestPostCategory).includes(value as QuestPostCategory)
  ) {
    return value as QuestPostCategory;
  }

  throw new AppError(400, "INVALID_QUEST_POST_CATEGORY", "Invalid category");
};

const parseStatus = (value: string): QuestPostStatus => {
  if (Object.values(QuestPostStatus).includes(value as QuestPostStatus)) {
    return value as QuestPostStatus;
  }

  throw new AppError(400, "INVALID_QUEST_POST_STATUS", "Invalid status");
};

const parseReactionType = (value: string): QuestReactionType => {
  if (Object.values(QuestReactionType).includes(value as QuestReactionType)) {
    return value as QuestReactionType;
  }

  throw new AppError(400, "INVALID_QUEST_REACTION_TYPE", "Invalid reaction");
};

const assertPostPayload = ({
  title,
  body,
}: {
  title: string;
  body: string;
}) => {
  if (!title || !body) {
    throw new AppError(
      400,
      "QUEST_POST_REQUIRED_FIELDS_MISSING",
      "Title and body are required"
    );
  }
};

const validateCourseAndMission = async ({
  courseId,
  missionId,
}: {
  courseId: string | null;
  missionId: string | null;
}) => {
  if (courseId) {
    const course = await prisma.course.findFirst({
      where: { id: courseId, isPublished: true },
      select: { id: true },
    });

    if (!course) {
      throw new AppError(404, "COURSE_NOT_FOUND", "Course not found");
    }
  }

  if (missionId) {
    const mission = await prisma.mission.findFirst({
      where: { id: missionId, isPublished: true },
      select: { id: true, courseId: true },
    });

    if (!mission) {
      throw new AppError(404, "MISSION_NOT_FOUND", "Mission not found");
    }

    if (courseId && mission.courseId !== courseId) {
      throw new AppError(
        400,
        "MISSION_COURSE_MISMATCH",
        "Mission does not belong to selected course"
      );
    }
  }
};

const reactionCounts = (
  reactions: { type: QuestReactionType; userId: string }[],
  userId: string
) => {
  const byType = Object.values(QuestReactionType).reduce(
    (acc, type) => ({ ...acc, [type]: 0 }),
    {} as Record<QuestReactionType, number>
  );
  const userReactedTypes: QuestReactionType[] = [];

  reactions.forEach((reaction) => {
    byType[reaction.type] += 1;
    if (reaction.userId === userId) {
      userReactedTypes.push(reaction.type);
    }
  });

  return {
    total: reactions.length,
    byType,
    userReactedTypes,
  };
};

type QuestPostWithRelations = Prisma.QuestPostGetPayload<{
  include: {
    user: { select: { displayName: true } };
    course: { select: { title: true } };
    mission: { select: { title: true } };
    comments: { select: { id: true } };
    reactions: { select: { type: true; userId: true } };
  };
}>;

const toPostSummary = (post: QuestPostWithRelations, userId: string) => ({
  id: post.id,
  category: post.category,
  categoryLabel: categoryLabels[post.category],
  title: post.title,
  body: post.body,
  excerpt: post.body.length > 140 ? `${post.body.slice(0, 140)}...` : post.body,
  code: post.code,
  referenceUrl: post.referenceUrl,
  status: post.status,
  authorName: post.user.displayName ?? "Learner",
  courseId: post.courseId,
  courseTitle: post.course?.title ?? null,
  missionId: post.missionId,
  missionTitle: post.mission?.title ?? null,
  commentCount: post.comments.length,
  reactions: reactionCounts(post.reactions, userId),
  canResolve: post.userId === userId,
  isOwner: post.userId === userId,
  createdAt: post.createdAt.toISOString(),
  updatedAt: post.updatedAt.toISOString(),
});

export const getQuestBoardOptions = () => ({
  categories: Object.values(QuestPostCategory).map((value) => ({
    value,
    label: categoryLabels[value],
  })),
  statuses: Object.values(QuestPostStatus).map((value) => ({
    value,
    label: value === QuestPostStatus.RESOLVED ? "解決済み" : "未解決",
  })),
  reactionTypes: Object.values(QuestReactionType).map((value) => ({
    value,
    label: reactionLabels[value],
  })),
});

export const listQuestPostsByFirebaseUid = async ({
  firebaseUid,
  q,
  category,
  courseId,
  missionId,
  status,
  mine,
}: ListQuestPostsInput) => {
  const user = await getUserByFirebaseUid(firebaseUid);
  const query = normalizeText(q);
  const where: Prisma.QuestPostWhereInput = {
    visibility: "PUBLIC",
    ...(category ? { category: parseCategory(category) } : {}),
    ...(courseId ? { courseId } : {}),
    ...(missionId ? { missionId } : {}),
    ...(status ? { status: parseStatus(status) } : {}),
    ...(mine === "true" ? { userId: user.id } : {}),
    ...(query
      ? {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { body: { contains: query, mode: "insensitive" } },
            { code: { contains: query, mode: "insensitive" } },
            { course: { title: { contains: query, mode: "insensitive" } } },
            { mission: { title: { contains: query, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const posts = await prisma.questPost.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 80,
    include: {
      user: { select: { displayName: true } },
      course: { select: { title: true } },
      mission: { select: { title: true } },
      comments: { select: { id: true } },
      reactions: { select: { type: true, userId: true } },
    },
  });

  return {
    posts: posts.map((post) => toPostSummary(post, user.id)),
    options: getQuestBoardOptions(),
  };
};

export const createQuestPostByFirebaseUid = async ({
  firebaseUid,
  category,
  title,
  body,
  code,
  referenceUrl,
  courseId,
  missionId,
}: CreateQuestPostInput) => {
  const user = await getUserByFirebaseUid(firebaseUid);
  const normalizedTitle = normalizeText(title);
  const normalizedBody = normalizeText(body);
  const normalizedCategory = parseCategory(category);

  assertPostPayload({ title: normalizedTitle, body: normalizedBody });
  await validateCourseAndMission({ courseId, missionId });

  const post = await prisma.questPost.create({
    data: {
      userId: user.id,
      category: normalizedCategory,
      title: normalizedTitle,
      body: normalizedBody,
      code,
      referenceUrl,
      courseId,
      missionId,
    },
    select: { id: true },
  });

  return { postId: post.id };
};

export const getQuestPostByFirebaseUid = async ({
  firebaseUid,
  postId,
}: {
  firebaseUid: string;
  postId: string;
}) => {
  const user = await getUserByFirebaseUid(firebaseUid);
  const post = await prisma.questPost.findFirst({
    where: { id: postId, visibility: "PUBLIC" },
    include: {
      user: { select: { displayName: true } },
      course: { select: { title: true } },
      mission: { select: { title: true } },
      comments: {
        orderBy: { createdAt: "asc" },
        include: {
          user: { select: { displayName: true } },
        },
      },
      reactions: { select: { type: true, userId: true } },
    },
  });

  if (!post) {
    throw new AppError(404, "QUEST_POST_NOT_FOUND", "Quest post not found");
  }

  return {
    post: {
      ...toPostSummary(
        {
          ...post,
          comments: post.comments.map((comment) => ({ id: comment.id })),
        },
        user.id
      ),
      comments: post.comments.map((comment) => ({
        id: comment.id,
        body: comment.body,
        authorName: comment.user.displayName ?? "Learner",
        createdAt: comment.createdAt.toISOString(),
        updatedAt: comment.updatedAt.toISOString(),
      })),
    },
    options: getQuestBoardOptions(),
  };
};

export const addQuestCommentByFirebaseUid = async ({
  firebaseUid,
  postId,
  body,
}: {
  firebaseUid: string;
  postId: string;
  body: string;
}) => {
  const user = await getUserByFirebaseUid(firebaseUid);
  const normalizedBody = normalizeText(body);

  if (!normalizedBody) {
    throw new AppError(400, "QUEST_COMMENT_BODY_REQUIRED", "Body is required");
  }

  const post = await prisma.questPost.findFirst({
    where: { id: postId, visibility: "PUBLIC" },
    select: { id: true },
  });

  if (!post) {
    throw new AppError(404, "QUEST_POST_NOT_FOUND", "Quest post not found");
  }

  const comment = await prisma.questComment.create({
    data: {
      postId,
      userId: user.id,
      body: normalizedBody,
    },
    include: { user: { select: { displayName: true } } },
  });

  return {
    comment: {
      id: comment.id,
      body: comment.body,
      authorName: comment.user.displayName ?? "Learner",
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
    },
  };
};

export const toggleQuestReactionByFirebaseUid = async ({
  firebaseUid,
  postId,
  type,
}: {
  firebaseUid: string;
  postId: string;
  type: string;
}) => {
  const user = await getUserByFirebaseUid(firebaseUid);
  const reactionType = parseReactionType(type);

  const post = await prisma.questPost.findFirst({
    where: { id: postId, visibility: "PUBLIC" },
    select: { id: true },
  });

  if (!post) {
    throw new AppError(404, "QUEST_POST_NOT_FOUND", "Quest post not found");
  }

  const existing = await prisma.questReaction.findUnique({
    where: {
      postId_userId_type: {
        postId,
        userId: user.id,
        type: reactionType,
      },
    },
  });

  if (existing) {
    await prisma.questReaction.delete({ where: { id: existing.id } });
  } else {
    await prisma.questReaction.create({
      data: {
        postId,
        userId: user.id,
        type: reactionType,
      },
    });
  }

  const reactions = await prisma.questReaction.findMany({
    where: { postId },
    select: { type: true, userId: true },
  });

  return {
    reactions: reactionCounts(reactions, user.id),
  };
};

export const updateQuestPostStatusByFirebaseUid = async ({
  firebaseUid,
  postId,
  status,
}: {
  firebaseUid: string;
  postId: string;
  status: string;
}) => {
  const user = await getUserByFirebaseUid(firebaseUid);
  const nextStatus = parseStatus(status);
  const post = await prisma.questPost.findFirst({
    where: { id: postId, visibility: "PUBLIC" },
    select: { id: true, userId: true, category: true },
  });

  if (!post) {
    throw new AppError(404, "QUEST_POST_NOT_FOUND", "Quest post not found");
  }

  if (post.userId !== user.id) {
    throw new AppError(403, "QUEST_POST_NOT_OWNER", "Only owner can update status");
  }

  if (
    post.category !== QuestPostCategory.QUESTION &&
    post.category !== QuestPostCategory.ERROR_HELP
  ) {
    throw new AppError(
      400,
      "QUEST_POST_STATUS_UNSUPPORTED",
      "Only question and error help posts can be resolved"
    );
  }

  const updatedPost = await prisma.questPost.update({
    where: { id: post.id },
    data: { status: nextStatus },
    select: { status: true, updatedAt: true },
  });

  return {
    status: updatedPost.status,
    updatedAt: updatedPost.updatedAt.toISOString(),
  };
};

export const buildCreateQuestPostPayload = (body: unknown) => {
  const payload = body as Record<string, unknown> | null;

  return {
    category: normalizeText(payload?.category),
    title: normalizeText(payload?.title),
    body: normalizeText(payload?.body),
    code: normalizeNullableText(payload?.code),
    referenceUrl: normalizeNullableText(payload?.referenceUrl),
    courseId: normalizeNullableText(payload?.courseId),
    missionId: normalizeNullableText(payload?.missionId),
  };
};
