import {
  AchievementCategory,
  AchievementConditionType,
  AchievementRarity,
  type Prisma,
} from "@prisma/client";

import { createQuestSeed } from "./createQuestSeed";
import { courseSeed } from "./courseSeed";

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
  ...countSeries({ id: "ach-create-complete", title: "機能ビルダー", description: "{count}種類の作る課題で基本要件を達成した証です。", category: AchievementCategory.CREATE_QUEST, conditionType: AchievementConditionType.CREATE_QUEST_COMPLETED_COUNT, values: [1, 3, createQuestSeed.length], sortOrder: 200, iconKey: "build" }),
  ...countSeries({ id: "ach-create-optional", title: "追加要件ハンター", description: "異なる追加要件を{count}件達成した証です。", category: AchievementCategory.CREATE_QUEST, conditionType: AchievementConditionType.CREATE_QUEST_OPTIONAL_REQUIREMENT_COUNT, values: [5, 10, createQuestSeed.reduce((sum, quest) => sum + quest.requirements.filter((requirement) => requirement.kind === "OPTIONAL").length, 0)], sortOrder: 220, iconKey: "challenge" }),
  ...countSeries({ id: "ach-create-perfect", title: "パーフェクトビルダー", description: "{count}種類の作る課題で100点を獲得した証です。", category: AchievementCategory.CREATE_QUEST, conditionType: AchievementConditionType.CREATE_QUEST_PERFECT_COUNT, values: [1, 3, createQuestSeed.length], sortOrder: 240, iconKey: "perfect" }),
  ...createQuestAchievements,
  ...countSeries({ id: "ach-knowledge", title: "知識の発見者", description: "知識カードを{count}枚発見した証です。", category: AchievementCategory.COLLECTION, conditionType: AchievementConditionType.KNOWLEDGE_CARD_COUNT, values: [1, 10, courseSeed.length * 5], sortOrder: 400, iconKey: "knowledge" }),
];
