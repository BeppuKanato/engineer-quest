import { ProgressStatus as PrismaProgressStatus } from "@prisma/client";

import { prisma } from "../lib/prisma";

export type HistoryEventType =
  | "activity_completed"
  | "mission_completed"
  | "course_completed"
  | "exp_gained"
  | "badge_ticket"
  | "badge_acquired"
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

const getCourseCompletedEvents = async (
  userId: string
): Promise<HistoryEvent[]> => {
  const courses = await prisma.course.findMany({
    where: { isPublished: true },
    select: {
      id: true,
      title: true,
      missions: {
        where: {
          isPublished: true,
          isRequiredForCourseCompletion: true,
        },
        select: {
          id: true,
          progresses: {
            where: {
              userId,
              status: PrismaProgressStatus.COMPLETED,
              completedAt: { not: null },
            },
            select: { completedAt: true },
          },
        },
      },
    },
  });

  return courses.flatMap((course) => {
    if (course.missions.length === 0) return [];

    const completedDates = course.missions
      .map((mission) => mission.progresses[0]?.completedAt ?? null)
      .filter((date): date is Date => date !== null);

    if (completedDates.length !== course.missions.length) return [];

    const occurredAt = new Date(
      Math.max(...completedDates.map((date) => date.getTime()))
    );

    return [
      {
        id: `course:${course.id}`,
        type: "course_completed" as const,
        title: course.title,
        description: "Courseの必須Missionをすべて完了しました。",
        occurredAt: occurredAt.toISOString(),
        href: `/courses/roadmap/${encodeURIComponent(course.id)}`,
      },
    ];
  });
};

export const getHistoryByUserId = async (userId: string) => {
  const [
    activityProgresses,
    missionProgresses,
    ticketTransactions,
    userBadges,
    userKnowledgeCards,
    userAchievements,
    userWorks,
    workReviews,
    courseCompletedEvents,
  ] = await Promise.all([
    prisma.userMissionActivityProgress.findMany({
      where: {
        userId,
        status: PrismaProgressStatus.COMPLETED,
        completedAt: { not: null },
      },
      orderBy: { completedAt: "desc" },
      take: 120,
      include: {
        activity: {
          select: {
            title: true,
            missionId: true,
            mission: { select: { title: true } },
          },
        },
      },
    }),
    prisma.userMissionProgress.findMany({
      where: {
        userId,
        status: PrismaProgressStatus.COMPLETED,
        completedAt: { not: null },
      },
      orderBy: { completedAt: "desc" },
      take: 80,
      include: {
        mission: {
          select: {
            id: true,
            title: true,
            course: { select: { title: true } },
          },
        },
      },
    }),
    prisma.badgeTicketTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 120,
    }),
    prisma.userTechIconBadge.findMany({
      where: { userId },
      orderBy: { acquiredAt: "desc" },
      take: 80,
      include: { badge: true },
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
    prisma.userWork.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 80,
      include: { createMission: { select: { title: true } } },
    }),
    prisma.userWorkReview.findMany({
      where: { userWork: { userId } },
      orderBy: { createdAt: "desc" },
      take: 80,
      include: { userWork: { select: { id: true, title: true } } },
    }),
    getCourseCompletedEvents(userId),
  ]);

  const events: HistoryEvent[] = [
    ...activityProgresses
      .filter((progress) => progress.completedAt)
      .map((progress) => ({
        id: `activity:${progress.id}`,
        type: "activity_completed" as const,
        title: progress.activity.title,
        description: `${progress.activity.mission.title} / Activity completed`,
        occurredAt: progress.completedAt!.toISOString(),
        href: `/mission/${encodeURIComponent(progress.activity.missionId)}/play`,
      })),
    ...missionProgresses
      .filter((progress) => progress.completedAt)
      .flatMap((progress) => {
        const occurredAt = progress.completedAt!.toISOString();
        const base = {
          href: `/mission/${encodeURIComponent(progress.mission.id)}/overview`,
          occurredAt,
        };

        const missionEvent: HistoryEvent = {
          id: `mission:${progress.id}`,
          type: "mission_completed",
          title: progress.mission.title,
          description: `${progress.mission.course.title} / Mission completed`,
          ...base,
        };

        const expEvent: HistoryEvent | null =
          progress.awardedExp > 0
            ? {
                id: `exp:${progress.id}`,
                type: "exp_gained",
                title: `EXP +${progress.awardedExp}`,
                description: `${progress.mission.title} の報酬EXPを獲得しました。`,
                amount: progress.awardedExp,
                ...base,
              }
            : null;

        return expEvent ? [missionEvent, expEvent] : [missionEvent];
      }),
    ...courseCompletedEvents,
    ...ticketTransactions.map((transaction) => ({
      id: `ticket:${transaction.id}`,
      type: "badge_ticket" as const,
      title:
        transaction.amount >= 0
          ? `Badge Ticket +${transaction.amount}`
          : `Badge Ticket ${transaction.amount}`,
      description: transaction.note ?? transaction.reason,
      amount: transaction.amount,
      occurredAt: transaction.createdAt.toISOString(),
      href: "/badges",
    })),
    ...userBadges.map((userBadge) => ({
      id: `badge:${userBadge.id}`,
      type: "badge_acquired" as const,
      title: userBadge.badge.name,
      description: userBadge.badge.description,
      occurredAt: userBadge.acquiredAt.toISOString(),
      href: "/collection",
    })),
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
    ...userWorks.map((work) => ({
      id: `work:${work.id}`,
      type: "work_saved" as const,
      title: work.title,
      description: `${work.createMission.title} / Work saved`,
      occurredAt: work.createdAt.toISOString(),
      href: "/my-works",
    })),
    ...workReviews.map((review) => ({
      id: `review:${review.id}`,
      type: "ai_review" as const,
      title: review.userWork.title,
      description: "AIレビューを保存しました。",
      occurredAt: review.createdAt.toISOString(),
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
