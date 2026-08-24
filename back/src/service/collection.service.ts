import {
  Achievement,
  AchievementCategory,
  AchievementConditionType,
} from "@prisma/client";

import { prisma } from "../lib/prisma";

const achievementCategoryLabel: Record<AchievementCategory, string> = {
  MISSION_COUNT: "Mission数",
  MISSION_CLEAR: "特定Mission",
  MISSION_COMPLETE: "Missionコンプリート",
  COURSE_EXAM: "Course終了試験",
  LEARNING_ACTION: "学習行動",
  COURSE_COMPLETE: "Course完了",
  STREAK: "継続",
};

const createConditionLabel = (achievement: Pick<
  Achievement,
  "conditionType" | "conditionValue"
>) => {
  switch (achievement.conditionType) {
    case AchievementConditionType.MISSION_COUNT:
      return `Missionを${achievement.conditionValue ?? 0}個完了`;
    case AchievementConditionType.SPECIFIC_MISSION_CLEAR:
      return "指定されたMissionを完了";
    case AchievementConditionType.COURSE_REQUIRED_MISSION_COMPLETE:
      return "Course内の必須Missionをすべて完了";
    case AchievementConditionType.COURSE_ALL_MISSION_COMPLETE:
      return "Challengeを含むCourse内Missionをすべて完了";
    case AchievementConditionType.COURSE_EXAM_HARD_CLEAR:
      return "Course終了試験のHardをクリア";
    case AchievementConditionType.ACTIVITY_COUNT:
      return `Activityを${achievement.conditionValue ?? 0}個完了`;
    case AchievementConditionType.COURSE_COMPLETE:
      return "Courseを完了";
    case AchievementConditionType.STREAK_DAYS:
      return `${achievement.conditionValue ?? 0}日連続で学習`;
  }
};

export const getCollectionByUser = async (user: {
  id: string;
  badgeTickets: number;
  selectedTechIconBadgeId: string | null;
}) => {
  const [badges, knowledgeCards, achievements] = await Promise.all([
    prisma.techIconBadge.findMany({
      where: { isPublished: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: {
        userTechIconBadges: {
          where: { userId: user.id },
          select: { acquiredAt: true },
        },
      },
    }),
    prisma.knowledgeCard.findMany({
      where: { isPublished: true },
      orderBy: [{ courseId: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
      include: {
        course: { select: { title: true } },
        userKnowledgeCards: {
          where: { userId: user.id },
          select: { collectedAt: true },
        },
      },
    }),
    prisma.achievement.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: {
        userAchievements: {
          where: { userId: user.id },
          select: { achievedAt: true },
        },
      },
    }),
  ]);

  const badgeItems = badges.map((badge) => {
    const acquiredAt = badge.userTechIconBadges[0]?.acquiredAt ?? null;
    const isOwned = Boolean(acquiredAt);

    return {
      id: badge.id,
      name: isOwned ? badge.name : "???",
      description: isOwned
        ? badge.description
        : "まだ獲得していないTech Icon Badgeです。",
      iconUrl: badge.iconUrl,
      rarity: badge.rarity,
      isOwned,
      acquiredAt: acquiredAt?.toISOString() ?? null,
      isSelected: isOwned && badge.id === user.selectedTechIconBadgeId,
    };
  });

  const knowledgeItems = knowledgeCards.map((card) => {
    const collectedAt = card.userKnowledgeCards[0]?.collectedAt ?? null;
    const isCollected = Boolean(collectedAt);

    return {
      id: card.id,
      courseId: card.courseId,
      courseTitle: card.course.title,
      label: isCollected ? card.label : "???",
      title: isCollected ? card.title : "???",
      description: isCollected
        ? card.description
        : "Mission完了時に発見できるKnowledge Tipです。",
      rarity: card.rarity,
      isCollected,
      collectedAt: collectedAt?.toISOString() ?? null,
    };
  });

  const achievementItems = achievements.map((achievement) => {
    const achievedAt = achievement.userAchievements[0]?.achievedAt ?? null;
    const isSecretLocked = !achievedAt && achievement.isSecret;

    return {
      id: achievement.id,
      category: achievement.category,
      categoryLabel: achievementCategoryLabel[achievement.category],
      status: achievedAt
        ? "achieved"
        : achievement.isSecret
          ? "secret_locked"
          : "visible_locked",
      title: isSecretLocked ? "???" : achievement.title,
      description: isSecretLocked
        ? "条件を満たすと内容が表示されます。"
        : achievement.description,
      conditionLabel: isSecretLocked ? null : createConditionLabel(achievement),
      achievedAt: achievedAt?.toISOString() ?? null,
    };
  });

  const selectedBadge = badges.find(
    (badge) =>
      badge.id === user.selectedTechIconBadgeId &&
      badge.userTechIconBadges.length > 0
  );

  return {
    badges: {
      ticketBalance: user.badgeTickets,
      selectedBadge: selectedBadge
        ? {
            id: selectedBadge.id,
            name: selectedBadge.name,
            description: selectedBadge.description,
            iconUrl: selectedBadge.iconUrl,
            rarity: selectedBadge.rarity,
          }
        : null,
      ownedCount: badgeItems.filter((badge) => badge.isOwned).length,
      totalCount: badgeItems.length,
      items: badgeItems,
    },
    knowledgeTips: {
      collectedCount: knowledgeItems.filter((card) => card.isCollected).length,
      totalCount: knowledgeItems.length,
      items: knowledgeItems,
    },
    achievements: {
      achievedCount: achievementItems.filter(
        (achievement) => achievement.status === "achieved"
      ).length,
      totalCount: achievementItems.length,
      items: achievementItems,
    },
  };
};
