import { AchievementConditionType } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { achievementCategoryLabel } from "./achievement.service";

const conditionLabel = (type: AchievementConditionType, value: number | null) => {
  const n = value ?? 0;
  const labels: Partial<Record<AchievementConditionType, string>> = {
    MISSION_COUNT: `Missionを${n}個完了`, SPECIFIC_MISSION_CLEAR: "指定Missionを完了",
    COURSE_REQUIRED_MISSION_COMPLETE: "必須Missionをすべて完了", COURSE_ALL_MISSION_COMPLETE: "全Missionを完了",
    COURSE_EXAM_HARD_CLEAR: "終了試験Hardをクリア", ACTIVITY_COUNT: `Activityを${n}個完了`,
    COURSE_COMPLETE: "指定Courseを完了", COURSE_COMPLETED_COUNT: `Courseを${n}個完了`,
    STREAK_DAYS: `${n}日連続で学習`, CREATE_QUEST_SCORE: `指定の作る課題で${n}点以上`,
    CREATE_QUEST_COMPLETED_COUNT: `作る課題を${n}個クリア`, CREATE_QUEST_OPTIONAL_REQUIREMENT_COUNT: `追加要件を累計${n}種類クリア`,
    CREATE_QUEST_PERFECT_COUNT: `作る課題で${n}回100点`, KNOWLEDGE_CARD_COUNT: `知識カードを${n}枚発見`,
  };
  return labels[type] ?? "条件を達成";
};

export const getCollectionByUser = async (user: { id: string; selectedProfileAchievementId: string | null }) => {
  const [cards, achievements] = await Promise.all([
    prisma.knowledgeCard.findMany({
      where: { isPublished: true },
      orderBy: [{ courseId: "asc" }, { catalogNumber: "asc" }],
      include: { course: { select: { title: true } }, userKnowledgeCards: { where: { userId: user.id }, select: { collectedAt: true } } },
    }),
    prisma.achievement.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: { userAchievements: { where: { userId: user.id }, select: { achievedAt: true } } },
    }),
  ]);
  const knowledgeItems = cards.map((card) => {
    const collectedAt = card.userKnowledgeCards[0]?.collectedAt ?? null;
    const unlocked = Boolean(collectedAt);
    return {
      id: card.id, courseId: card.courseId, courseTitle: card.course.title,
      catalogNumber: card.catalogNumber, label: unlocked ? card.label : "未発見",
      title: unlocked ? card.title : "???", description: unlocked ? card.description : "このコースのMissionを進めると発見できます。",
      connection: unlocked ? card.connection : null, useCase: unlocked ? card.useCase : null,
      searchKeywords: unlocked ? card.searchKeywords : [], rarity: card.rarity,
      isCollected: unlocked, collectedAt: collectedAt?.toISOString() ?? null,
    };
  });
  const achievementItems = achievements.map((a) => {
    const achievedAt = a.userAchievements[0]?.achievedAt ?? null;
    const hidden = !achievedAt && a.isSecret;
    return {
      id: a.id, category: a.category, categoryLabel: achievementCategoryLabel[a.category], rarity: a.rarity,
      iconKey: a.iconKey, status: achievedAt ? "achieved" : hidden ? "secret_locked" : "visible_locked",
      title: hidden ? "???" : a.title, description: hidden ? "条件を満たすと内容が表示されます。" : a.description,
      conditionLabel: hidden ? null : conditionLabel(a.conditionType, a.conditionValue), achievedAt: achievedAt?.toISOString() ?? null,
      isProfileSelected: Boolean(achievedAt && user.selectedProfileAchievementId === a.id),
    };
  });
  return {
    knowledgeTips: { collectedCount: knowledgeItems.filter((x) => x.isCollected).length, totalCount: knowledgeItems.length, items: knowledgeItems },
    achievements: { achievedCount: achievementItems.filter((x) => x.status === "achieved").length, totalCount: achievementItems.length, items: achievementItems },
  };
};
