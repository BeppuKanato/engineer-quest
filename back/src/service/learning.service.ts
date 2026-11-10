/**
 * 新フローの学習基盤（Issue #108）。
 * 単元・フェーズ進捗の記録、フェーズ完了に連動した知識カード付与と実績評価、
 * 学習イベントの一括投入を担う。教材コンテンツ自体は repo のデータモジュールが
 * 正本であり、ここでは courseId と phaseKey（文字列）でだけ参照する。
 */
import { LearningProgressStatus, Prisma } from "@prisma/client";

import { AppError } from "../error/appError";
import { prisma } from "../lib/prisma";
import { evaluateAchievementsForUser } from "./achievement.service";
import { evaluateBigGoalsForUser } from "./bigGoal.service";
import { toKnowledgeCardSummary } from "./knowledgeCard.service";

type AuthUser = { id: string; knowledgeCardTableNumber: number };

const getPublishedCourse = async (courseId: string) => {
  const course = await prisma.course.findFirst({
    where: { id: courseId, isPublished: true },
    select: { id: true, version: true },
  });
  if (!course) throw new AppError(404, "COURSE_NOT_FOUND", "Course not found");
  return course;
};

const unitView = (unit: {
  status: LearningProgressStatus;
  lastPhaseKey: string | null;
  startedAt: Date;
  completedAt: Date | null;
}) => ({
  status: unit.status,
  lastPhaseKey: unit.lastPhaseKey,
  startedAt: unit.startedAt.toISOString(),
  completedAt: unit.completedAt?.toISOString() ?? null,
});

const phaseView = (phase: {
  phaseKey: string;
  status: LearningProgressStatus;
  summary: Prisma.JsonValue;
  startedAt: Date;
  completedAt: Date | null;
}) => ({
  phaseKey: phase.phaseKey,
  status: phase.status,
  summary: phase.summary ?? null,
  startedAt: phase.startedAt.toISOString(),
  completedAt: phase.completedAt?.toISOString() ?? null,
});

export const getUnitProgressByUser = async (user: AuthUser, courseId: string) => {
  await getPublishedCourse(courseId);
  const [unit, phases] = await Promise.all([
    prisma.unitLearningProgress.findUnique({
      where: { userId_courseId: { userId: user.id, courseId } },
    }),
    prisma.phaseLearningProgress.findMany({
      where: { userId: user.id, courseId },
      orderBy: { startedAt: "asc" },
    }),
  ]);
  return {
    courseId,
    unit: unit ? unitView(unit) : null,
    phases: phases.map(phaseView),
  };
};

export const startUnitByUser = async (
  user: AuthUser,
  courseId: string,
  phaseKey?: string
) => {
  await getPublishedCourse(courseId);
  const unit = await prisma.unitLearningProgress.upsert({
    where: { userId_courseId: { userId: user.id, courseId } },
    update: {
      ...(phaseKey ? { lastPhaseKey: phaseKey } : {}),
    },
    create: {
      userId: user.id,
      courseId,
      status: LearningProgressStatus.IN_PROGRESS,
      lastPhaseKey: phaseKey ?? null,
    },
  });
  return { courseId, unit: unitView(unit) };
};

/** フェーズ完了時に、ユーザーのテーブル（knowledgeCardTableNumber）がそのフェーズに割り当てたカードを付与する。 */
const awardPhaseCard = async (
  tx: Prisma.TransactionClient,
  user: AuthUser,
  course: { id: string; version: number },
  phaseKey: string
) => {
  const entry = await tx.knowledgeCardPhaseScheduleEntry.findUnique({
    where: {
      courseId_courseVersion_tableNumber_phaseKey: {
        courseId: course.id,
        courseVersion: course.version,
        tableNumber: user.knowledgeCardTableNumber,
        phaseKey,
      },
    },
    include: { knowledgeCard: true },
  });
  if (!entry) return null;

  const owned = await tx.userKnowledgeCard.findUnique({
    where: {
      userId_knowledgeCardId: {
        userId: user.id,
        knowledgeCardId: entry.knowledgeCardId,
      },
    },
    select: { id: true },
  });
  if (owned) return null;

  await tx.userKnowledgeCard.create({
    data: { userId: user.id, knowledgeCardId: entry.knowledgeCardId },
  });
  return toKnowledgeCardSummary(entry.knowledgeCard);
};

export const completePhaseByUser = async (
  user: AuthUser,
  courseId: string,
  phaseKey: string,
  summary?: Record<string, unknown>
) => {
  const course = await getPublishedCourse(courseId);
  const now = new Date();

  const { phase, awardedCard } = await prisma.$transaction(async (tx) => {
    const phase = await tx.phaseLearningProgress.upsert({
      where: {
        userId_courseId_phaseKey: { userId: user.id, courseId, phaseKey },
      },
      update: {
        status: LearningProgressStatus.COMPLETED,
        completedAt: now,
        ...(summary !== undefined
          ? { summary: summary as Prisma.InputJsonValue }
          : {}),
      },
      create: {
        userId: user.id,
        courseId,
        phaseKey,
        status: LearningProgressStatus.COMPLETED,
        completedAt: now,
        ...(summary !== undefined
          ? { summary: summary as Prisma.InputJsonValue }
          : {}),
      },
    });
    await tx.unitLearningProgress.upsert({
      where: { userId_courseId: { userId: user.id, courseId } },
      update: { lastPhaseKey: phaseKey },
      create: {
        userId: user.id,
        courseId,
        status: LearningProgressStatus.IN_PROGRESS,
        lastPhaseKey: phaseKey,
      },
    });
    const awardedCard = await awardPhaseCard(tx, user, course, phaseKey);
    return { phase, awardedCard };
  });

  const unlockedAchievements = await evaluateAchievementsForUser(user.id);
  // 大目標の達成判定も、実績評価と同じ保存タイミングで再評価する（#365）。
  await evaluateBigGoalsForUser(user.id);
  return {
    courseId,
    phase: phaseView(phase),
    awardedCard,
    unlockedAchievements,
  };
};

export const completeUnitByUser = async (user: AuthUser, courseId: string) => {
  await getPublishedCourse(courseId);
  const now = new Date();
  const unit = await prisma.unitLearningProgress.upsert({
    where: { userId_courseId: { userId: user.id, courseId } },
    update: { status: LearningProgressStatus.COMPLETED, completedAt: now },
    create: {
      userId: user.id,
      courseId,
      status: LearningProgressStatus.COMPLETED,
      completedAt: now,
    },
  });
  const unlockedAchievements = await evaluateAchievementsForUser(user.id);
  // 大目標の達成判定も、実績評価と同じ保存タイミングで再評価する（#365）。
  await evaluateBigGoalsForUser(user.id);
  return { courseId, unit: unitView(unit), unlockedAchievements };
};

export type LearningEventInput = {
  eventType: string;
  courseId?: string;
  phaseKey?: string;
  targetId?: string;
  payload?: Record<string, unknown>;
  clientTimestamp: string;
};

/**
 * 学習イベントの一括投入。受け取ったら検証して一括 append し、件数だけ返す。
 * 呼び出し側は fire-and-forget 前提（学習操作に同期させない）。
 */
export const ingestLearningEvents = async (
  user: AuthUser,
  sessionId: string,
  events: LearningEventInput[]
) => {
  if (events.length === 0) return { accepted: 0 };
  const rows = events.map((event) => {
    const clientTimestamp = new Date(event.clientTimestamp);
    if (Number.isNaN(clientTimestamp.getTime())) {
      throw new AppError(400, "INVALID_EVENT_TIMESTAMP", "Invalid clientTimestamp");
    }
    return {
      userId: user.id,
      sessionId,
      eventType: event.eventType,
      courseId: event.courseId ?? null,
      phaseKey: event.phaseKey ?? null,
      targetId: event.targetId ?? null,
      payload:
        event.payload !== undefined
          ? (event.payload as Prisma.InputJsonValue)
          : undefined,
      clientTimestamp,
    };
  });
  const result = await prisma.learningEvent.createMany({ data: rows });
  return { accepted: result.count };
};
