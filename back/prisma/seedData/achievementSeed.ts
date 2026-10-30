import {
  AchievementCategory,
  AchievementConditionType,
  AchievementRarity,
  type Prisma,
} from "@prisma/client";

import { createQuestSeed } from "./createQuestSeed";
import { learningSeed } from "./learningSeed";

const levelRarity = [
  AchievementRarity.COMMON,
  AchievementRarity.RARE,
  AchievementRarity.EPIC,
  AchievementRarity.LEGENDARY,
] as const;

const countSeries = ({
  id,
  title,
  description,
  category,
  conditionType,
  values,
  sortOrder,
  iconKey,
}: {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  conditionType: AchievementConditionType;
  values: number[];
  sortOrder: number;
  iconKey: string;
}): Prisma.AchievementUncheckedCreateInput[] =>
  values.map((conditionValue, index) => ({
    id: `${id}-lv${index + 1}`,
    title: `${title} Lv.${index + 1}`,
    description: description.replace("{count}", String(conditionValue)),
    category,
    conditionType,
    conditionValue,
    rarity: levelRarity[Math.min(index, levelRarity.length - 1)],
    iconKey,
    isSecret: false,
    sortOrder: sortOrder + index,
  }));

const courseAchievements: Prisma.AchievementUncheckedCreateInput[] =
  learningSeed.courses.map((course, index) => ({
    id: `ach-course-${course.id.replace("course-algorithm-", "")}-complete`,
    category: AchievementCategory.COURSE_COMPLETE,
    conditionType: AchievementConditionType.COURSE_REQUIRED_MISSION_COMPLETE,
    courseId: course.id,
    title: `${course.title}を修得した`,
    description: `${course.title}の必須ミッションをすべて完了した証です。`,
    rarity: AchievementRarity.RARE,
    iconKey: "course",
    isSecret: false,
    sortOrder: 100 + index,
  }));

const createQuestAchievements: Prisma.AchievementUncheckedCreateInput[] =
  createQuestSeed.flatMap((quest, index) => [
    {
      id: `ach-create-${quest.id}-advanced`,
      category: AchievementCategory.CREATE_QUEST,
      conditionType: AchievementConditionType.CREATE_QUEST_SCORE,
      conditionValue: 75,
      createQuestId: quest.id,
      title: `${quest.title}・発展達成`,
      description: `${quest.title}で75点以上を獲得し、追加要件にも対応した証です。`,
      rarity: AchievementRarity.RARE,
      iconKey: "build",
      isSecret: false,
      sortOrder: 300 + index * 2,
    },
    {
      id: `ach-create-${quest.id}-perfect`,
      category: AchievementCategory.CREATE_QUEST,
      conditionType: AchievementConditionType.CREATE_QUEST_SCORE,
      conditionValue: 100,
      createQuestId: quest.id,
      title: `${quest.title}・完全達成`,
      description: `${quest.title}の全要件を満たし、100点を獲得した証です。`,
      rarity: AchievementRarity.EPIC,
      iconKey: "perfect",
      isSecret: false,
      sortOrder: 301 + index * 2,
    },
  ]);

export const achievementSeed: Prisma.AchievementUncheckedCreateInput[] = [
  ...countSeries({ id: "ach-mission-clear", title: "ミッション挑戦者", description: "{count}個のミッションを完了した証です。", category: AchievementCategory.MISSION_COUNT, conditionType: AchievementConditionType.MISSION_COUNT, values: [1, 10, 25, 49], sortOrder: 10, iconKey: "mission" }),
  ...countSeries({ id: "ach-activity-clear", title: "学習ステップ", description: "{count}個のアクティビティを完了した証です。", category: AchievementCategory.LEARNING_ACTION, conditionType: AchievementConditionType.ACTIVITY_COUNT, values: [25, 100, 200], sortOrder: 30, iconKey: "steps" }),
  ...countSeries({ id: "ach-course-count", title: "アルゴリズム探究者", description: "{count}種類のコースを完了した証です。", category: AchievementCategory.COURSE_COMPLETE, conditionType: AchievementConditionType.COURSE_COMPLETED_COUNT, values: [1, 3, learningSeed.courses.length], sortOrder: 50, iconKey: "course" }),
  ...courseAchievements,
  ...countSeries({ id: "ach-create-complete", title: "機能ビルダー", description: "{count}種類の作る課題で基本要件を達成した証です。", category: AchievementCategory.CREATE_QUEST, conditionType: AchievementConditionType.CREATE_QUEST_COMPLETED_COUNT, values: [1, 3, createQuestSeed.length], sortOrder: 200, iconKey: "build" }),
  ...countSeries({ id: "ach-create-optional", title: "追加要件ハンター", description: "異なる追加要件を{count}件達成した証です。", category: AchievementCategory.CREATE_QUEST, conditionType: AchievementConditionType.CREATE_QUEST_OPTIONAL_REQUIREMENT_COUNT, values: [5, 10, createQuestSeed.reduce((sum, quest) => sum + quest.requirements.filter((requirement) => requirement.kind === "OPTIONAL").length, 0)], sortOrder: 220, iconKey: "challenge" }),
  ...countSeries({ id: "ach-create-perfect", title: "パーフェクトビルダー", description: "{count}種類の作る課題で100点を獲得した証です。", category: AchievementCategory.CREATE_QUEST, conditionType: AchievementConditionType.CREATE_QUEST_PERFECT_COUNT, values: [1, 3, createQuestSeed.length], sortOrder: 240, iconKey: "perfect" }),
  ...createQuestAchievements,
  ...countSeries({ id: "ach-knowledge", title: "知識の発見者", description: "知識カードを{count}枚発見した証です。", category: AchievementCategory.COLLECTION, conditionType: AchievementConditionType.KNOWLEDGE_CARD_COUNT, values: [1, 10, learningSeed.courses.length * 5], sortOrder: 400, iconKey: "knowledge" }),
];
