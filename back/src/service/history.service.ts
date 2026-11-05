import { prisma } from "../lib/prisma";

export type HistoryEventType =
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
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

export const getHistoryByUserId = async (userId: string) => {
  // Legacy mission/activity history sources were removed with the old flow;
  // new-flow learning events join history in #78.
  const [
    userKnowledgeCards,
    userAchievements,
    createQuestSubmissions,
    createQuestFeedbacks,
  ] = await Promise.all([
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
