import conceptDefinitions from "../learning/feedback/concepts.json";
import { prisma } from "../lib/prisma";

export type HistoryEventType =
  | "phase_completed"
  | "unit_completed"
  | "activity_completed"
  | "mission_completed"
  | "course_completed"
  | "exp_gained"
  | "knowledge_tip_acquired"
  | "achievement_unlocked"
  | "work_saved"
  | "ai_review";

type HistoryEvent = {
  id: string;
  type: HistoryEventType;
  title: string;
  description: string;
  occurredAt: string;
  href: string | null;
  amount?: number;
};

const compareHistoryDesc = (left: HistoryEvent, right: HistoryEvent) =>
  new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime();

const toDateKey = (value: string) =>
  new Date(value).toLocaleDateString("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

export const getHistoryByUserId = async (userId: string) => {
  // 学習履歴はサーバーで確定した完了記録を参照する。
  const [
    completedPhases,
    completedUnits,
    userKnowledgeCards,
    userAchievements,
    createQuestSubmissions,
    createQuestFeedbacks,
  ] = await Promise.all([
    prisma.phaseLearningProgress.findMany({
      where: { userId, completedAt: { not: null } },
      orderBy: { completedAt: "desc" },
      take: 80,
      select: { id: true, courseId: true, phaseKey: true, completedAt: true, course: { select: { title: true } } },
    }),
    prisma.unitLearningProgress.findMany({
      where: { userId, completedAt: { not: null } },
      orderBy: { completedAt: "desc" },
      take: 80,
      select: { id: true, courseId: true, completedAt: true, course: { select: { title: true } } },
    }),
    prisma.userKnowledgeCard.findMany({
      where: { userId },
      orderBy: { collectedAt: "desc" },
      take: 80,
      include: { knowledgeCard: true },
    }),
    prisma.userAchievement.findMany({
      where: { userId },
      orderBy: { achievedAt: "desc" },
      take: 80,
      include: { achievement: true },
    }),
    prisma.createQuestSubmission.findMany({
      where: { attempt: { userId } },
      orderBy: { submittedAt: "desc" },
      take: 80,
      include: { attempt: { include: { quest: { select: { title: true } } } } },
    }),
    prisma.createQuestFeedback.findMany({
      where: { submission: { attempt: { userId } } },
      orderBy: { createdAt: "desc" },
      take: 80,
      include: { submission: { include: { attempt: { include: { quest: { select: { title: true } } } } } } },
    }),
  ]);

  const events: HistoryEvent[] = [
    ...completedPhases.flatMap((phase) => {
      if (!phase.completedAt) return [];
      const stageName = conceptDefinitions.find((unit) => unit.courseId === phase.courseId)
        ?.phases.find((stage) => stage.id === phase.phaseKey)?.formalName;
      return [{
        id: `phase:${phase.id}`,
        type: "phase_completed" as const,
        title: stageName ? `${phase.course.title}の「${stageName}」を完了` : `${phase.course.title}のフェーズを完了`,
        description: "学習の段階を完了しました。",
        occurredAt: phase.completedAt.toISOString(),
        href: `/courses/roadmap/${encodeURIComponent(phase.courseId)}`,
      }];
    }),
    ...completedUnits.flatMap((unit) => unit.completedAt ? [{
      id: `unit:${unit.id}`,
      type: "unit_completed" as const,
      title: `${unit.course.title}を完了`,
      description: "単元の学習を完了しました。",
      occurredAt: unit.completedAt.toISOString(),
      href: `/courses/roadmap/${encodeURIComponent(unit.courseId)}`,
    }] : []),
    ...userKnowledgeCards.map((userCard) => ({
      id: `knowledge:${userCard.id}`,
      type: "knowledge_tip_acquired" as const,
      title: userCard.knowledgeCard.title,
      description: userCard.knowledgeCard.description,
      occurredAt: userCard.collectedAt.toISOString(),
      href: "/collection",
    })),
    ...userAchievements.map((userAchievement) => ({
      id: `achievement:${userAchievement.id}`,
      type: "achievement_unlocked" as const,
      title: userAchievement.achievement.title,
      description: userAchievement.achievement.description,
      occurredAt: userAchievement.achievedAt.toISOString(),
      href: "/collection",
    })),
    ...createQuestSubmissions.map((submission) => ({
      id: `work:${submission.id}`,
      type: "work_saved" as const,
      title: submission.attempt.quest.title,
      description: `${submission.score} / ${submission.maxScore}点で提出`,
      occurredAt: submission.submittedAt.toISOString(),
      href: "/my-works",
    })),
    ...createQuestFeedbacks.map((feedback) => ({
      id: `review:${feedback.id}`,
      type: "ai_review" as const,
      title: feedback.submission.attempt.quest.title,
      description: "AIレビューを保存しました。",
      occurredAt: feedback.createdAt.toISOString(),
      href: "/my-works",
    })),
  ].sort(compareHistoryDesc);

  const groups = events.reduce<
    { date: string; events: HistoryEvent[] }[]
  >((acc, event) => {
    const date = toDateKey(event.occurredAt);
    const group = acc.find((item) => item.date === date);

    if (group) {
      group.events.push(event);
    } else {
      acc.push({ date, events: [event] });
    }

    return acc;
  }, []);

  return {
    events,
    groups,
  };
};
