import {
  AchievementCategory,
  AchievementConditionType,
  AchievementRarity,
  type Prisma,
} from "@prisma/client";

import { createQuestSeed } from "./createQuestSeed";
import { BFS_COURSE_ID, BINARY_SEARCH_COURSE_ID, BUBBLE_SORT_COURSE_ID, DFS_COURSE_ID, GREEDY_COINS_COURSE_ID, MAZE_DIGGING_COURSE_ID, WALL_EXTENSION_COURSE_ID } from "./knowledgeCardSeed";

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
  { id: "ach-secret-first-saved-me", title: "はじめての「助かった」", description: "自分の掲示板の投稿に「助かった」の反応をもらった証です。", category: AchievementCategory.LEARNING_ACTION, conditionType: AchievementConditionType.BOARD_SAVED_ME_COUNT, conditionValue: 1, rarity: AchievementRarity.EPIC, iconKey: "achievement", isSecret: true, sortOrder: 900 },
  { id: "ach-secret-review-three-correct", title: "復習3連続正解", description: "今日の復習で3日連続正解した証です。", category: AchievementCategory.LEARNING_ACTION, conditionType: AchievementConditionType.DAILY_REVIEW_CORRECT_STREAK, conditionValue: 3, rarity: AchievementRarity.RARE, iconKey: "challenge", isSecret: true, sortOrder: 901 },
  { id: "ach-secret-first-epic-card", title: "エピックとの出会い", description: "エピックの知識カードを初めて手に入れた証です。", category: AchievementCategory.COLLECTION, conditionType: AchievementConditionType.EPIC_KNOWLEDGE_CARD_COUNT, conditionValue: 1, rarity: AchievementRarity.RARE, iconKey: "knowledge", isSecret: true, sortOrder: 902 },
  { id: "ach-secret-personal-best", title: "自己ベスト更新", description: "同じ作る課題への再提出で、過去の自己最高点を超えた証です。", category: AchievementCategory.CREATE_QUEST, conditionType: AchievementConditionType.CREATE_QUEST_PERSONAL_BEST, conditionValue: 1, rarity: AchievementRarity.RARE, iconKey: "build", isSecret: true, sortOrder: 903 },
  ...countSeries({ id: "ach-create-complete", title: "機能ビルダー", description: "{count}種類の作る課題で基本要件を達成した証です。", category: AchievementCategory.CREATE_QUEST, conditionType: AchievementConditionType.CREATE_QUEST_COMPLETED_COUNT, values: [1, 3, createQuestSeed.length], sortOrder: 200, iconKey: "build" }),
  ...countSeries({ id: "ach-create-optional", title: "追加要件ハンター", description: "異なる追加要件を{count}件達成した証です。", category: AchievementCategory.CREATE_QUEST, conditionType: AchievementConditionType.CREATE_QUEST_OPTIONAL_REQUIREMENT_COUNT, values: [5, 10, createQuestSeed.reduce((sum, quest) => sum + quest.requirements.filter((requirement) => requirement.kind === "OPTIONAL").length, 0)], sortOrder: 220, iconKey: "challenge" }),
  ...countSeries({ id: "ach-create-perfect", title: "パーフェクトビルダー", description: "{count}種類の作る課題で100点を獲得した証です。", category: AchievementCategory.CREATE_QUEST, conditionType: AchievementConditionType.CREATE_QUEST_PERFECT_COUNT, values: [1, 3, createQuestSeed.length], sortOrder: 240, iconKey: "perfect" }),
  ...createQuestAchievements,
  ...countSeries({ id: "ach-unit-count", title: "単元探求者", description: "{count}個の単元を完了した証です。", category: AchievementCategory.COURSE_COMPLETE, conditionType: AchievementConditionType.UNIT_COMPLETED_COUNT, values: [1, 3, 7], sortOrder: 60, iconKey: "course" }).map((achievement, index) => index === 2 ? { ...achievement, title: "全単元制覇", description: "7個の単元をすべて完了した証です。", rarity: AchievementRarity.LEGENDARY } : achievement),
  { id: "ach-unit-bfs-complete", category: AchievementCategory.COURSE_COMPLETE, conditionType: AchievementConditionType.UNIT_COMPLETE, courseId: BFS_COURSE_ID, title: "幅優先探索を修得した", description: "幅優先探索（BFS）の単元を最後まで完了した証です。", rarity: AchievementRarity.COMMON, iconKey: "course", isSecret: false, sortOrder: 110 },
  { id: "ach-phase-bfs-implementation-clear", category: AchievementCategory.LEARNING_ACTION, conditionType: AchievementConditionType.PHASE_COMPLETED, courseId: BFS_COURSE_ID, phaseKey: "bfs-implementation", title: "自分で実装クリア", description: "幅優先探索を自分のコードで実装し、すべてのテストを通過した証です。", rarity: AchievementRarity.RARE, iconKey: "build", isSecret: false, sortOrder: 320 },
  { id: "ach-phase-bfs-implementation-nohint", category: AchievementCategory.LEARNING_ACTION, conditionType: AchievementConditionType.PHASE_NO_HINT_COMPLETE, courseId: BFS_COURSE_ID, phaseKey: "bfs-implementation", title: "ノーヒントクリア", description: "「自分で実装」をヒントなしでクリアした証です。", rarity: AchievementRarity.EPIC, iconKey: "challenge", isSecret: false, sortOrder: 350 },
  { id: "ach-unit-wall-extension-complete", category: AchievementCategory.COURSE_COMPLETE, conditionType: AchievementConditionType.UNIT_COMPLETE, courseId: WALL_EXTENSION_COURSE_ID, title: "棒倒し法を修得した", description: "棒倒し法の単元を最後まで完了した証です。", rarity: AchievementRarity.COMMON, iconKey: "course", isSecret: false, sortOrder: 111 },
  { id: "ach-phase-wall-extension-implementation-clear", category: AchievementCategory.LEARNING_ACTION, conditionType: AchievementConditionType.PHASE_COMPLETED, courseId: WALL_EXTENSION_COURSE_ID, phaseKey: "wall-extension-implementation", title: "自分で実装クリア", description: "棒倒し法を自分のコードで実装し、すべてのテストを通過した証です。", rarity: AchievementRarity.RARE, iconKey: "build", isSecret: false, sortOrder: 321 },
  { id: "ach-phase-wall-extension-implementation-nohint", category: AchievementCategory.LEARNING_ACTION, conditionType: AchievementConditionType.PHASE_NO_HINT_COMPLETE, courseId: WALL_EXTENSION_COURSE_ID, phaseKey: "wall-extension-implementation", title: "ノーヒントクリア", description: "「自分で実装」をヒントなしでクリアした証です。", rarity: AchievementRarity.EPIC, iconKey: "challenge", isSecret: false, sortOrder: 351 },
  { id: "ach-unit-bubble-sort-complete", category: AchievementCategory.COURSE_COMPLETE, conditionType: AchievementConditionType.UNIT_COMPLETE, courseId: BUBBLE_SORT_COURSE_ID, title: "バブルソートを修得した", description: "バブルソートの単元を最後まで完了した証です。", rarity: AchievementRarity.COMMON, iconKey: "course", isSecret: false, sortOrder: 112 },
  { id: "ach-phase-bubble-sort-implementation-clear", category: AchievementCategory.LEARNING_ACTION, conditionType: AchievementConditionType.PHASE_COMPLETED, courseId: BUBBLE_SORT_COURSE_ID, phaseKey: "bubble-sort-implementation", title: "自分で実装クリア", description: "バブルソートを自分のコードで実装し、すべてのテストを通過した証です。", rarity: AchievementRarity.RARE, iconKey: "build", isSecret: false, sortOrder: 322 },
  { id: "ach-phase-bubble-sort-implementation-nohint", category: AchievementCategory.LEARNING_ACTION, conditionType: AchievementConditionType.PHASE_NO_HINT_COMPLETE, courseId: BUBBLE_SORT_COURSE_ID, phaseKey: "bubble-sort-implementation", title: "ノーヒントクリア", description: "「自分で実装」をヒントなしでクリアした証です。", rarity: AchievementRarity.EPIC, iconKey: "challenge", isSecret: false, sortOrder: 352 },
  { id: "ach-unit-maze-digging-complete", category: AchievementCategory.COURSE_COMPLETE, conditionType: AchievementConditionType.UNIT_COMPLETE, courseId: MAZE_DIGGING_COURSE_ID, title: "穴掘り法を修得した", description: "穴掘り法の単元を最後まで完了した証です。", rarity: AchievementRarity.COMMON, iconKey: "course", isSecret: false, sortOrder: 113 },
  { id: "ach-phase-maze-digging-implementation-clear", category: AchievementCategory.LEARNING_ACTION, conditionType: AchievementConditionType.PHASE_COMPLETED, courseId: MAZE_DIGGING_COURSE_ID, phaseKey: "maze-digging-implementation", title: "自分で実装クリア", description: "穴掘り法を自分のコードで実装し、すべてのテストを通過した証です。", rarity: AchievementRarity.RARE, iconKey: "build", isSecret: false, sortOrder: 323 },
  { id: "ach-phase-maze-digging-implementation-nohint", category: AchievementCategory.LEARNING_ACTION, conditionType: AchievementConditionType.PHASE_NO_HINT_COMPLETE, courseId: MAZE_DIGGING_COURSE_ID, phaseKey: "maze-digging-implementation", title: "ノーヒントクリア", description: "「自分で実装」をヒントなしでクリアした証です。", rarity: AchievementRarity.EPIC, iconKey: "challenge", isSecret: false, sortOrder: 353 },
  { id: "ach-unit-binary-search-complete", category: AchievementCategory.COURSE_COMPLETE, conditionType: AchievementConditionType.UNIT_COMPLETE, courseId: BINARY_SEARCH_COURSE_ID, title: "二分探索を修得した", description: "二分探索の単元を最後まで完了した証です。", rarity: AchievementRarity.COMMON, iconKey: "course", isSecret: false, sortOrder: 114 },
  { id: "ach-phase-binary-search-implementation-clear", category: AchievementCategory.LEARNING_ACTION, conditionType: AchievementConditionType.PHASE_COMPLETED, courseId: BINARY_SEARCH_COURSE_ID, phaseKey: "binary-search-implementation", title: "自分で実装クリア", description: "二分探索を自分のコードで実装し、すべてのテストを通過した証です。", rarity: AchievementRarity.RARE, iconKey: "build", isSecret: false, sortOrder: 324 },
  { id: "ach-phase-binary-search-implementation-nohint", category: AchievementCategory.LEARNING_ACTION, conditionType: AchievementConditionType.PHASE_NO_HINT_COMPLETE, courseId: BINARY_SEARCH_COURSE_ID, phaseKey: "binary-search-implementation", title: "ノーヒントクリア", description: "「自分で実装」をヒントなしでクリアした証です。", rarity: AchievementRarity.EPIC, iconKey: "challenge", isSecret: false, sortOrder: 354 },
  { id: "ach-unit-dfs-complete", category: AchievementCategory.COURSE_COMPLETE, conditionType: AchievementConditionType.UNIT_COMPLETE, courseId: DFS_COURSE_ID, title: "深さ優先探索を修得した", description: "深さ優先探索（DFS）の単元を最後まで完了した証です。", rarity: AchievementRarity.COMMON, iconKey: "course", isSecret: false, sortOrder: 115 },
  { id: "ach-phase-dfs-implementation-clear", category: AchievementCategory.LEARNING_ACTION, conditionType: AchievementConditionType.PHASE_COMPLETED, courseId: DFS_COURSE_ID, phaseKey: "dfs-implementation", title: "自分で実装クリア", description: "深さ優先探索を自分のコードで実装し、すべてのテストを通過した証です。", rarity: AchievementRarity.RARE, iconKey: "build", isSecret: false, sortOrder: 325 },
  { id: "ach-phase-dfs-implementation-nohint", category: AchievementCategory.LEARNING_ACTION, conditionType: AchievementConditionType.PHASE_NO_HINT_COMPLETE, courseId: DFS_COURSE_ID, phaseKey: "dfs-implementation", title: "ノーヒントクリア", description: "「自分で実装」をヒントなしでクリアした証です。", rarity: AchievementRarity.EPIC, iconKey: "challenge", isSecret: false, sortOrder: 355 },
  { id: "ach-unit-greedy-coins-complete", category: AchievementCategory.COURSE_COMPLETE, conditionType: AchievementConditionType.UNIT_COMPLETE, courseId: GREEDY_COINS_COURSE_ID, title: "貪欲法を修得した", description: "貪欲法（硬貨問題）の単元を最後まで完了した証です。", rarity: AchievementRarity.COMMON, iconKey: "course", isSecret: false, sortOrder: 116 },
  { id: "ach-phase-greedy-coins-implementation-clear", category: AchievementCategory.LEARNING_ACTION, conditionType: AchievementConditionType.PHASE_COMPLETED, courseId: GREEDY_COINS_COURSE_ID, phaseKey: "greedy-coins-implementation", title: "自分で実装クリア", description: "貪欲法を自分のコードで実装し、すべてのテストを通過した証です。", rarity: AchievementRarity.RARE, iconKey: "build", isSecret: false, sortOrder: 326 },
  { id: "ach-phase-greedy-coins-implementation-nohint", category: AchievementCategory.LEARNING_ACTION, conditionType: AchievementConditionType.PHASE_NO_HINT_COMPLETE, courseId: GREEDY_COINS_COURSE_ID, phaseKey: "greedy-coins-implementation", title: "ノーヒントクリア", description: "「自分で実装」をヒントなしでクリアした証です。", rarity: AchievementRarity.EPIC, iconKey: "challenge", isSecret: false, sortOrder: 356 },
  // カードプールの追加後も、既存の全体収集実績の達成条件を維持する。
  ...countSeries({ id: "ach-knowledge", title: "知識の発見者", description: "知識カードを{count}枚発見した証です。", category: AchievementCategory.COLLECTION, conditionType: AchievementConditionType.KNOWLEDGE_CARD_COUNT, values: [1, 15], sortOrder: 120, iconKey: "knowledge" }),
  { id: "ach-knowledge-all", title: "全カードコンプリート", description: "21枚の知識カードをすべて発見した証です。", category: AchievementCategory.COLLECTION, conditionType: AchievementConditionType.KNOWLEDGE_CARD_COUNT, conditionValue: 21, rarity: AchievementRarity.LEGENDARY, iconKey: "knowledge", isSecret: false, sortOrder: 122 },
  { id: "ach-unit-exploration-complete", title: "探索系コンプリート", description: "幅優先探索・深さ優先探索・二分探索・穴掘り法の4単元をすべて完了した証です。", category: AchievementCategory.COURSE_COMPLETE, conditionType: AchievementConditionType.UNIT_GROUP_COMPLETE, conditionGroupName: "探索系", conditionUnitIds: [BFS_COURSE_ID, DFS_COURSE_ID, BINARY_SEARCH_COURSE_ID, MAZE_DIGGING_COURSE_ID], rarity: AchievementRarity.EPIC, iconKey: "course", isSecret: false, sortOrder: 130 },
  ...[3, 7, 30].map((days, index) => ({ id: `ach-streak-${days}`, title: `学習継続 ${days}日`, description: `${days}日連続で学習に取り組んだ証です。`, category: AchievementCategory.STREAK, conditionType: AchievementConditionType.STREAK_DAYS, conditionValue: days, rarity: index === 0 ? AchievementRarity.RARE : AchievementRarity.EPIC, iconKey: "challenge", isSecret: false, sortOrder: 500 + index })),
];
