import {
  AchievementCategory,
  AchievementConditionType,
  AchievementRarity,
  type Prisma,
} from "@prisma/client";

import { createQuestSeed } from "./createQuestSeed";
import { courseSeed } from "./courseSeed";
import { BFS_COURSE_ID, BUBBLE_SORT_COURSE_ID, MAZE_DIGGING_COURSE_ID, WALL_EXTENSION_COURSE_ID, knowledgeCardSeed } from "./knowledgeCardSeed";

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
  ...countSeries({ id: "ach-unit-count", title: "単元探求者", description: "{count}個の単元を完了した証です。", category: AchievementCategory.COURSE_COMPLETE, conditionType: AchievementConditionType.UNIT_COMPLETED_COUNT, values: [1, 3, 7], sortOrder: 60, iconKey: "course" }),
  { id: "ach-unit-bfs-complete", category: AchievementCategory.COURSE_COMPLETE, conditionType: AchievementConditionType.UNIT_COMPLETE, courseId: BFS_COURSE_ID, title: "幅優先探索を修得した", description: "幅優先探索（BFS）の単元を最後まで完了した証です。", rarity: AchievementRarity.RARE, iconKey: "course", isSecret: false, sortOrder: 110 },
  { id: "ach-phase-bfs-implementation-clear", category: AchievementCategory.LEARNING_ACTION, conditionType: AchievementConditionType.PHASE_COMPLETED, courseId: BFS_COURSE_ID, phaseKey: "bfs-implementation", title: "自分で実装クリア", description: "幅優先探索を自分のコードで実装し、すべてのテストを通過した証です。", rarity: AchievementRarity.RARE, iconKey: "build", isSecret: false, sortOrder: 320 },
  { id: "ach-phase-bfs-check-perfect", category: AchievementCategory.LEARNING_ACTION, conditionType: AchievementConditionType.PHASE_FIRST_ATTEMPT_PERFECT, courseId: BFS_COURSE_ID, phaseKey: "bfs-check,bfs-code-check", title: "確認問題 初回全問正解", description: "動きの確認問題とコードの確認問題の両方を、初回の回答で全問正解した証です。", rarity: AchievementRarity.EPIC, iconKey: "perfect", isSecret: false, sortOrder: 330 },
  { id: "ach-phase-bfs-consolidation-perfect", category: AchievementCategory.LEARNING_ACTION, conditionType: AchievementConditionType.PHASE_FIRST_ATTEMPT_PERFECT, courseId: BFS_COURSE_ID, phaseKey: "bfs-consolidation", title: "応用問題 初回満点", description: "応用問題を、初回の回答で満点だった証です。", rarity: AchievementRarity.EPIC, iconKey: "perfect", isSecret: false, sortOrder: 340 },
  { id: "ach-phase-bfs-implementation-nohint", category: AchievementCategory.LEARNING_ACTION, conditionType: AchievementConditionType.PHASE_NO_HINT_COMPLETE, courseId: BFS_COURSE_ID, phaseKey: "bfs-implementation", title: "ノーヒントクリア", description: "「自分で実装」をヒントなしでクリアした証です。", rarity: AchievementRarity.EPIC, iconKey: "challenge", isSecret: false, sortOrder: 350 },
  { id: "ach-bfs-card-complete", category: AchievementCategory.COLLECTION, conditionType: AchievementConditionType.KNOWLEDGE_CARD_COUNT, conditionValue: 3, courseId: BFS_COURSE_ID, title: "BFSカードコンプリート", description: "幅優先探索の知識カードをすべて集めた証です。", rarity: AchievementRarity.RARE, iconKey: "knowledge", isSecret: false, sortOrder: 410 },
  { id: "ach-unit-wall-extension-complete", category: AchievementCategory.COURSE_COMPLETE, conditionType: AchievementConditionType.UNIT_COMPLETE, courseId: WALL_EXTENSION_COURSE_ID, title: "棒倒し法を修得した", description: "棒倒し法の単元を最後まで完了した証です。", rarity: AchievementRarity.RARE, iconKey: "course", isSecret: false, sortOrder: 111 },
  { id: "ach-phase-wall-extension-implementation-clear", category: AchievementCategory.LEARNING_ACTION, conditionType: AchievementConditionType.PHASE_COMPLETED, courseId: WALL_EXTENSION_COURSE_ID, phaseKey: "wall-extension-implementation", title: "自分で実装クリア", description: "棒倒し法を自分のコードで実装し、すべてのテストを通過した証です。", rarity: AchievementRarity.RARE, iconKey: "build", isSecret: false, sortOrder: 321 },
  { id: "ach-phase-wall-extension-check-perfect", category: AchievementCategory.LEARNING_ACTION, conditionType: AchievementConditionType.PHASE_FIRST_ATTEMPT_PERFECT, courseId: WALL_EXTENSION_COURSE_ID, phaseKey: "wall-extension-check,wall-extension-code-check", title: "確認問題 初回全問正解", description: "動きの確認問題とコードの確認問題の両方を、初回の回答で全問正解した証です。", rarity: AchievementRarity.EPIC, iconKey: "perfect", isSecret: false, sortOrder: 331 },
  { id: "ach-phase-wall-extension-consolidation-perfect", category: AchievementCategory.LEARNING_ACTION, conditionType: AchievementConditionType.PHASE_FIRST_ATTEMPT_PERFECT, courseId: WALL_EXTENSION_COURSE_ID, phaseKey: "wall-extension-consolidation", title: "応用問題 初回満点", description: "応用問題を、初回の回答で満点だった証です。", rarity: AchievementRarity.EPIC, iconKey: "perfect", isSecret: false, sortOrder: 341 },
  { id: "ach-phase-wall-extension-implementation-nohint", category: AchievementCategory.LEARNING_ACTION, conditionType: AchievementConditionType.PHASE_NO_HINT_COMPLETE, courseId: WALL_EXTENSION_COURSE_ID, phaseKey: "wall-extension-implementation", title: "ノーヒントクリア", description: "「自分で実装」をヒントなしでクリアした証です。", rarity: AchievementRarity.EPIC, iconKey: "challenge", isSecret: false, sortOrder: 351 },
  { id: "ach-wall-extension-card-complete", category: AchievementCategory.COLLECTION, conditionType: AchievementConditionType.KNOWLEDGE_CARD_COUNT, conditionValue: 3, courseId: WALL_EXTENSION_COURSE_ID, title: "棒倒し法カードコンプリート", description: "棒倒し法の知識カードをすべて集めた証です。", rarity: AchievementRarity.RARE, iconKey: "knowledge", isSecret: false, sortOrder: 411 },
  { id: "ach-unit-bubble-sort-complete", category: AchievementCategory.COURSE_COMPLETE, conditionType: AchievementConditionType.UNIT_COMPLETE, courseId: BUBBLE_SORT_COURSE_ID, title: "バブルソートを修得した", description: "バブルソートの単元を最後まで完了した証です。", rarity: AchievementRarity.RARE, iconKey: "course", isSecret: false, sortOrder: 112 },
  { id: "ach-phase-bubble-sort-implementation-clear", category: AchievementCategory.LEARNING_ACTION, conditionType: AchievementConditionType.PHASE_COMPLETED, courseId: BUBBLE_SORT_COURSE_ID, phaseKey: "bubble-sort-implementation", title: "自分で実装クリア", description: "バブルソートを自分のコードで実装し、すべてのテストを通過した証です。", rarity: AchievementRarity.RARE, iconKey: "build", isSecret: false, sortOrder: 322 },
  { id: "ach-phase-bubble-sort-check-perfect", category: AchievementCategory.LEARNING_ACTION, conditionType: AchievementConditionType.PHASE_FIRST_ATTEMPT_PERFECT, courseId: BUBBLE_SORT_COURSE_ID, phaseKey: "bubble-sort-check,bubble-sort-code-check", title: "確認問題 初回全問正解", description: "動きの確認問題とコードの確認問題の両方を、初回の回答で全問正解した証です。", rarity: AchievementRarity.EPIC, iconKey: "perfect", isSecret: false, sortOrder: 332 },
  { id: "ach-phase-bubble-sort-consolidation-perfect", category: AchievementCategory.LEARNING_ACTION, conditionType: AchievementConditionType.PHASE_FIRST_ATTEMPT_PERFECT, courseId: BUBBLE_SORT_COURSE_ID, phaseKey: "bubble-sort-consolidation", title: "応用問題 初回満点", description: "応用問題を、初回の回答で満点だった証です。", rarity: AchievementRarity.EPIC, iconKey: "perfect", isSecret: false, sortOrder: 342 },
  { id: "ach-phase-bubble-sort-implementation-nohint", category: AchievementCategory.LEARNING_ACTION, conditionType: AchievementConditionType.PHASE_NO_HINT_COMPLETE, courseId: BUBBLE_SORT_COURSE_ID, phaseKey: "bubble-sort-implementation", title: "ノーヒントクリア", description: "「自分で実装」をヒントなしでクリアした証です。", rarity: AchievementRarity.EPIC, iconKey: "challenge", isSecret: false, sortOrder: 352 },
  { id: "ach-bubble-sort-card-complete", category: AchievementCategory.COLLECTION, conditionType: AchievementConditionType.KNOWLEDGE_CARD_COUNT, conditionValue: 3, courseId: BUBBLE_SORT_COURSE_ID, title: "バブルソートカードコンプリート", description: "バブルソートの知識カードをすべて集めた証です。", rarity: AchievementRarity.RARE, iconKey: "knowledge", isSecret: false, sortOrder: 412 },
  { id: "ach-unit-maze-digging-complete", category: AchievementCategory.COURSE_COMPLETE, conditionType: AchievementConditionType.UNIT_COMPLETE, courseId: MAZE_DIGGING_COURSE_ID, title: "穴掘り法を修得した", description: "穴掘り法の単元を最後まで完了した証です。", rarity: AchievementRarity.RARE, iconKey: "course", isSecret: false, sortOrder: 113 },
  { id: "ach-phase-maze-digging-implementation-clear", category: AchievementCategory.LEARNING_ACTION, conditionType: AchievementConditionType.PHASE_COMPLETED, courseId: MAZE_DIGGING_COURSE_ID, phaseKey: "maze-digging-implementation", title: "自分で実装クリア", description: "穴掘り法を自分のコードで実装し、すべてのテストを通過した証です。", rarity: AchievementRarity.RARE, iconKey: "build", isSecret: false, sortOrder: 323 },
  { id: "ach-phase-maze-digging-check-perfect", category: AchievementCategory.LEARNING_ACTION, conditionType: AchievementConditionType.PHASE_FIRST_ATTEMPT_PERFECT, courseId: MAZE_DIGGING_COURSE_ID, phaseKey: "maze-digging-check,maze-digging-code-check", title: "確認問題 初回全問正解", description: "動きの確認問題とコードの確認問題の両方を、初回の回答で全問正解した証です。", rarity: AchievementRarity.EPIC, iconKey: "perfect", isSecret: false, sortOrder: 333 },
  { id: "ach-phase-maze-digging-consolidation-perfect", category: AchievementCategory.LEARNING_ACTION, conditionType: AchievementConditionType.PHASE_FIRST_ATTEMPT_PERFECT, courseId: MAZE_DIGGING_COURSE_ID, phaseKey: "maze-digging-consolidation", title: "応用問題 初回満点", description: "応用問題を、初回の回答で満点だった証です。", rarity: AchievementRarity.EPIC, iconKey: "perfect", isSecret: false, sortOrder: 343 },
  { id: "ach-phase-maze-digging-implementation-nohint", category: AchievementCategory.LEARNING_ACTION, conditionType: AchievementConditionType.PHASE_NO_HINT_COMPLETE, courseId: MAZE_DIGGING_COURSE_ID, phaseKey: "maze-digging-implementation", title: "ノーヒントクリア", description: "「自分で実装」をヒントなしでクリアした証です。", rarity: AchievementRarity.EPIC, iconKey: "challenge", isSecret: false, sortOrder: 353 },
  { id: "ach-maze-digging-card-complete", category: AchievementCategory.COLLECTION, conditionType: AchievementConditionType.KNOWLEDGE_CARD_COUNT, conditionValue: 3, courseId: MAZE_DIGGING_COURSE_ID, title: "穴掘り法カードコンプリート", description: "穴掘り法の知識カードをすべて集めた証です。", rarity: AchievementRarity.RARE, iconKey: "knowledge", isSecret: false, sortOrder: 413 },
  ...countSeries({ id: "ach-knowledge", title: "知識の発見者", description: "知識カードを{count}枚発見した証です。", category: AchievementCategory.COLLECTION, conditionType: AchievementConditionType.KNOWLEDGE_CARD_COUNT, values: [1, knowledgeCardSeed.length], sortOrder: 400, iconKey: "knowledge" }),
];
