import {
  Achievement, AchievementCategory, AchievementConditionType, Prisma,
} from "@prisma/client";
import { AppError } from "../error/appError";
import { prisma } from "../lib/prisma";

import { currentLearningStreak, learningDayKeys } from "./learningDays.service";
import { unitGroupLabel, unitGroupProgress } from "./achievementConditions";
import { personalBestImprovements, reviewCorrectStreak } from "./secretAchievementProgress";

export type AchievementStatus = "achieved" | "visible_locked" | "secret_locked";

export const achievementCategoryLabel: Record<AchievementCategory, string> = {
  MISSION_COUNT: "Mission数", MISSION_CLEAR: "特定Mission", MISSION_COMPLETE: "Missionコンプリート",
  COURSE_EXAM: "Course終了試験", LEARNING_ACTION: "学習行動", COURSE_COMPLETE: "Course完了",
  STREAK: "継続", CREATE_QUEST: "作る課題", COLLECTION: "コレクション",
};
const categoryOrder: AchievementCategory[] = [
  AchievementCategory.MISSION_COUNT, AchievementCategory.MISSION_CLEAR,
  AchievementCategory.MISSION_COMPLETE, AchievementCategory.COURSE_EXAM,
  AchievementCategory.LEARNING_ACTION, AchievementCategory.COURSE_COMPLETE,
  AchievementCategory.CREATE_QUEST, AchievementCategory.COLLECTION, AchievementCategory.STREAK,
];

const conditionLabel = (a: Achievement) => {
  const n = a.conditionValue ?? 0;
  switch (a.conditionType) {
    case AchievementConditionType.BOARD_SAVED_ME_COUNT: return `自分の投稿に「助かった」を${n}件もらう`;
    case AchievementConditionType.DAILY_REVIEW_CORRECT_STREAK: return `今日の復習で${n}日連続正解`;
    case AchievementConditionType.EPIC_KNOWLEDGE_CARD_COUNT: return `エピックの知識カードを${n}枚獲得`;
    case AchievementConditionType.CREATE_QUEST_PERSONAL_BEST: return "同じ作る課題への再提出で自己最高点を更新";
    case AchievementConditionType.MISSION_COUNT: return `Missionを${n}個完了`;
    case AchievementConditionType.SPECIFIC_MISSION_CLEAR: return "指定されたMissionを完了";
    case AchievementConditionType.COURSE_REQUIRED_MISSION_COMPLETE: return "Course内の必須Missionをすべて完了";
    case AchievementConditionType.COURSE_ALL_MISSION_COMPLETE: return "Challengeを含むCourse内Missionをすべて完了";
    case AchievementConditionType.COURSE_EXAM_HARD_CLEAR: return "Course終了試験のHardをクリア";
    case AchievementConditionType.ACTIVITY_COUNT: return `Activityを${n}個完了`;
    case AchievementConditionType.COURSE_COMPLETE: return "指定されたCourseを完了";
    case AchievementConditionType.COURSE_COMPLETED_COUNT: return `Courseを${n}個完了`;
    case AchievementConditionType.CREATE_QUEST_SCORE: return `指定された作る課題で${n}点以上を獲得`;
    case AchievementConditionType.CREATE_QUEST_COMPLETED_COUNT: return `作る課題を${n}個クリア`;
    case AchievementConditionType.CREATE_QUEST_OPTIONAL_REQUIREMENT_COUNT: return `追加要件を累計${n}種類クリア`;
    case AchievementConditionType.CREATE_QUEST_PERFECT_COUNT: return `作る課題で${n}回100点を獲得`;
    case AchievementConditionType.KNOWLEDGE_CARD_COUNT: return `知識カードを${n}枚発見`;
    case AchievementConditionType.UNIT_COMPLETE: return "指定された単元を完了";
    case AchievementConditionType.UNIT_COMPLETED_COUNT: return `単元を${n}個完了`;
    case AchievementConditionType.PHASE_COMPLETED: return "指定されたフェーズを完了";
    case AchievementConditionType.PHASE_FIRST_ATTEMPT_PERFECT: return "確認問題を初回で全問正解";
    case AchievementConditionType.PHASE_NO_HINT_COMPLETE: return "ヒントとAIへの相談を使わずにフェーズを完了";
    case AchievementConditionType.PHASE_FULL_NO_HINT_COMPLETE: return "最終ミッションを「全部書く」で始めて、ヒントとAIへの相談を使わずに完了";
    case AchievementConditionType.STREAK_DAYS: return `${n}日連続で学習`;
    case AchievementConditionType.UNIT_GROUP_COMPLETE: return unitGroupLabel(a);
  }
};
const stripLevel = (title: string) => title.replace(/\s*Lv\.\d+\s*$/, "").trim();
const levelOf = (title: string) => Number(title.match(/Lv\.(\d+)/)?.[1] ?? 1);
const seriesKey = (a: Achievement) => [a.category, a.conditionType, a.courseId ?? "all", "all", a.createQuestId ?? "all", stripLevel(a.title)].join(":");
const targetLink = (a: Achievement) => {
  if (a.createQuestId)
    return { href: `/create/quests/${encodeURIComponent(a.createQuestId)}`, actionLabel: "対象の作る課題を見る" };
  if (a.courseId)
    return { href: "/courses", actionLabel: "対象コースを見る" };
  if (a.conditionType === AchievementConditionType.KNOWLEDGE_CARD_COUNT)
    return { href: "/collection", actionLabel: "コレクションを見る" };
  if (([AchievementConditionType.CREATE_QUEST_COMPLETED_COUNT, AchievementConditionType.CREATE_QUEST_OPTIONAL_REQUIREMENT_COUNT, AchievementConditionType.CREATE_QUEST_PERFECT_COUNT] as AchievementConditionType[]).includes(a.conditionType))
    return { href: "/create", actionLabel: "作る課題に挑戦する" };
  return { href: "/courses", actionLabel: "学習を続ける" };
};

type PhaseStat = { status: string; summary: unknown };
type Stats = {
  savedMeCount: number; reviewStreak: number; epicCardCount: number; personalBests: number;
  streakDays: number;
  completedCourses: Set<string>;
  completedQuests: number; perfectQuests: number; optionalRequirements: number;
  cardCount: number; questScores: Map<string, number>;
  cardsByCourse: Map<string, number>;
  completedUnits: Set<string>;
  countableUnits: Set<string>;
  phases: Map<string, PhaseStat>;
};

/**
 * フェーズ7（実装フェーズ）の summary.clears（ステージ2で記録）の1件分。
 * 実績判定はこの clear 単位で行う。解法例を見た clear は実績の対象にしない。
 */
type ImplementationClear = {
  viewedSolution: boolean;
  usedAiConsultation: boolean;
  usedHint: boolean;
  inputLevel: string;
};

/**
 * summary から clears を取り出す。clears が無い・空・形が違う場合は null を返し、
 * 呼び出し側は従来判定へフォールバックする（clears の無い単元・履歴を壊さない）。
 */
const parseImplementationClears = (summary: unknown): ImplementationClear[] | null => {
  if (!summary || typeof summary !== "object" || Array.isArray(summary)) return null;
  const clears = (summary as { clears?: unknown }).clears;
  if (!Array.isArray(clears) || clears.length === 0) return null;
  const parsed = clears.flatMap((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return [];
    const record = item as Record<string, unknown>;
    if (typeof record.viewedSolution !== "boolean" || typeof record.usedAiConsultation !== "boolean"
      || typeof record.usedHint !== "boolean" || typeof record.inputLevel !== "string") return [];
    return [{
      viewedSolution: record.viewedSolution,
      usedAiConsultation: record.usedAiConsultation,
      usedHint: record.usedHint,
      inputLevel: record.inputLevel,
    }];
  });
  return parsed.length ? parsed : null;
};

const hasSolutionUnseenClear = (clears: ImplementationClear[]) => clears.some((c) => !c.viewedSolution);
const hasNoHintClear = (clears: ImplementationClear[]) =>
  clears.some((c) => !c.viewedSolution && !c.usedHint && !c.usedAiConsultation);
const hasFullNoHintClear = (clears: ImplementationClear[]) =>
  clears.some((c) => !c.viewedSolution && !c.usedHint && !c.usedAiConsultation && c.inputLevel === "full");
const asResultArray = (value: Prisma.JsonValue): Array<Record<string, unknown>> =>
  Array.isArray(value) ? value.filter((v) => Boolean(v) && typeof v === "object" && !Array.isArray(v)) as Array<Record<string, unknown>> : [];

const loadStats = async (userId: string, conditions: ReadonlySet<AchievementConditionType>): Promise<Stats> => {
  const [savedMeCount, reviews, epicCardCount, personalSubmissions] = await Promise.all([
    conditions.has(AchievementConditionType.BOARD_SAVED_ME_COUNT) ? prisma.questReaction.count({ where: { post: { userId }, type: "SAVED_ME", userId: { not: userId } } }) : 0,
    conditions.has(AchievementConditionType.DAILY_REVIEW_CORRECT_STREAK) ? prisma.dailyReview.findMany({ where: { userId, answeredAt: { not: null } }, select: { reviewDate: true, correct: true } }) : [],
    conditions.has(AchievementConditionType.EPIC_KNOWLEDGE_CARD_COUNT) ? prisma.userKnowledgeCard.count({ where: { userId, knowledgeCard: { rarity: "EPIC" } } }) : 0,
    conditions.has(AchievementConditionType.CREATE_QUEST_PERSONAL_BEST) ? prisma.createQuestSubmission.findMany({ where: { attempt: { userId } }, select: { score: true, submittedAt: true, attempt: { select: { questId: true } } } }) : [],
  ]);
  const [attempts, submissions, cards, unitProgress, phaseProgress] = await Promise.all([
    prisma.createQuestAttempt.findMany({ where: { userId }, select: { questId: true, status: true, bestScore: true } }),
    prisma.createQuestSubmission.findMany({ where: { attempt: { userId } }, select: { results: true, submittedAt: true } }),
    prisma.userKnowledgeCard.findMany({ where: { userId }, select: { knowledgeCard: { select: { courseId: true } } } }),
    prisma.unitLearningProgress.findMany({ where: { userId }, select: { courseId: true, status: true, completedAt: true } }),
    prisma.phaseLearningProgress.findMany({ where: { userId }, select: { courseId: true, phaseKey: true, status: true, summary: true, completedAt: true } }),
  ]);
  const optionalIds = new Set<string>();
  const cardsByCourse = new Map<string, number>();
  for (const { knowledgeCard: { courseId } } of cards) {
    cardsByCourse.set(courseId, (cardsByCourse.get(courseId) ?? 0) + 1);
  }
  submissions.flatMap((s) => asResultArray(s.results)).forEach((r) => {
    if (r.kind === "OPTIONAL" && r.passed === true && typeof r.requirementId === "string") optionalIds.add(r.requirementId);
  });
  const phases = new Map(phaseProgress.map((p) => [`${p.courseId}:${p.phaseKey}`, { status: p.status, summary: p.summary }]));
  const completedUnitIds = unitProgress.filter((u) => u.status === "COMPLETED").map((u) => u.courseId);
  // 実績として数えられる単元の集合。実装フェーズに clears がある単元では、
  // 解法例を見ていない clear がある単元だけを数える。clears が無い単元・履歴は
  // 従来どおり単元完了だけで数える（grandfather）。進行上の完了とは切り離す。
  const countableUnits = new Set<string>();
  for (const courseId of completedUnitIds) {
    let clears: ImplementationClear[] | null = null;
    for (const [key, stat] of phases) {
      const separator = key.indexOf(":");
      if (key.slice(0, separator) === courseId && key.slice(separator + 1).endsWith("-implementation")) {
        clears = parseImplementationClears(stat.summary);
      }
    }
    if (!clears || hasSolutionUnseenClear(clears)) countableUnits.add(courseId);
  }
  return {
    savedMeCount, reviewStreak: reviewCorrectStreak(reviews), epicCardCount, personalBests: personalBestImprovements(personalSubmissions),
    streakDays: currentLearningStreak(learningDayKeys([...submissions.map(row => row.submittedAt), ...unitProgress.map(row => row.completedAt), ...phaseProgress.map(row => row.completedAt)])),
    // Course completion on the new flow means unit completion (#78 / #108).
    completedCourses: new Set(completedUnitIds),
    completedUnits: new Set(completedUnitIds),
    countableUnits,
    phases,
    completedQuests: attempts.filter((a) => a.status === "COMPLETED").length,
    perfectQuests: attempts.filter((a) => a.bestScore >= 100).length,
    optionalRequirements: optionalIds.size, cardCount: cards.length, cardsByCourse,
    questScores: new Map(attempts.map((a) => [a.questId, a.bestScore])),
  };
};

const progressFor = async (a: Achievement, userId: string, s: Stats) => {
  const goal = a.conditionValue ?? 1;
  switch (a.conditionType) {
    case AchievementConditionType.BOARD_SAVED_ME_COUNT: return { goal, progress: s.savedMeCount };
    case AchievementConditionType.DAILY_REVIEW_CORRECT_STREAK: return { goal, progress: s.reviewStreak };
    case AchievementConditionType.EPIC_KNOWLEDGE_CARD_COUNT: return { goal, progress: s.epicCardCount };
    case AchievementConditionType.CREATE_QUEST_PERSONAL_BEST: return { goal, progress: s.personalBests };
    case AchievementConditionType.UNIT_COMPLETE: return { goal: 1, progress: a.courseId && s.countableUnits.has(a.courseId) ? 1 : 0 };
    case AchievementConditionType.UNIT_COMPLETED_COUNT: return { goal, progress: s.countableUnits.size };
    case AchievementConditionType.PHASE_COMPLETED: {
      if (!a.courseId || !a.phaseKey) return { goal: 1, progress: 0 };
      const phase = s.phases.get(`${a.courseId}:${a.phaseKey}`);
      if (phase?.status !== "COMPLETED") return { goal: 1, progress: 0 };
      // clears がある単元では、解法例を見ていない clear がある場合だけ対象にする。
      const clears = parseImplementationClears(phase.summary);
      return { goal: 1, progress: !clears || hasSolutionUnseenClear(clears) ? 1 : 0 };
    }
    case AchievementConditionType.PHASE_FIRST_ATTEMPT_PERFECT: {
      if (!a.courseId || !a.phaseKey) return { goal: 1, progress: 0 };
      const keys = a.phaseKey.split(",").map((k) => k.trim()).filter(Boolean);
      const perfect = keys.length > 0 && keys.every((key) => {
        const summary = s.phases.get(`${a.courseId}:${key}`)?.summary as { firstAttemptCorrect?: number; totalQuestions?: number } | null | undefined;
        return typeof summary?.totalQuestions === "number" && summary.totalQuestions > 0 && summary.firstAttemptCorrect === summary.totalQuestions;
      });
      return { goal: 1, progress: perfect ? 1 : 0 };
    }
    case AchievementConditionType.PHASE_NO_HINT_COMPLETE: {
      if (!a.courseId || !a.phaseKey) return { goal: 1, progress: 0 };
      const phase = s.phases.get(`${a.courseId}:${a.phaseKey}`);
      if (phase?.status !== "COMPLETED") return { goal: 1, progress: 0 };
      // clears がある単元では clears を正とし、ヒント・AI相談・解法例の
      // いずれも使っていない clear がある場合だけ対象にする（レベルは不問）。
      const clears = parseImplementationClears(phase.summary);
      if (clears) return { goal: 1, progress: hasNoHintClear(clears) ? 1 : 0 };
      const hintUsage = (phase.summary as { hintUsage?: number[] } | null | undefined)?.hintUsage;
      const noHint = !hintUsage || hintUsage.every((count) => count === 0);
      return { goal: 1, progress: noHint ? 1 : 0 };
    }
    case AchievementConditionType.PHASE_FULL_NO_HINT_COMPLETE: {
      if (!a.courseId || !a.phaseKey) return { goal: 1, progress: 0 };
      const phase = s.phases.get(`${a.courseId}:${a.phaseKey}`);
      if (phase?.status !== "COMPLETED") return { goal: 1, progress: 0 };
      // clears が無い単元・履歴では判定材料が無いため獲得できない。
      const clears = parseImplementationClears(phase.summary);
      return { goal: 1, progress: clears && hasFullNoHintClear(clears) ? 1 : 0 };
    }
    // Legacy mission/activity/exam-based conditions can no longer progress.
    case AchievementConditionType.MISSION_COUNT:
    case AchievementConditionType.SPECIFIC_MISSION_CLEAR:
    case AchievementConditionType.ACTIVITY_COUNT:
    case AchievementConditionType.COURSE_COMPLETE: return { goal: 1, progress: a.courseId && s.completedCourses.has(a.courseId) ? 1 : 0 };
    case AchievementConditionType.COURSE_REQUIRED_MISSION_COMPLETE:
    case AchievementConditionType.COURSE_ALL_MISSION_COMPLETE:
    case AchievementConditionType.COURSE_EXAM_HARD_CLEAR: return { goal, progress: 0 };
    case AchievementConditionType.COURSE_COMPLETED_COUNT: return { goal, progress: s.completedCourses.size };
    case AchievementConditionType.CREATE_QUEST_SCORE: return { goal, progress: a.createQuestId ? s.questScores.get(a.createQuestId) ?? 0 : 0 };
    case AchievementConditionType.CREATE_QUEST_COMPLETED_COUNT: return { goal, progress: s.completedQuests };
    case AchievementConditionType.CREATE_QUEST_OPTIONAL_REQUIREMENT_COUNT: return { goal, progress: s.optionalRequirements };
    case AchievementConditionType.CREATE_QUEST_PERFECT_COUNT: return { goal, progress: s.perfectQuests };
    case AchievementConditionType.KNOWLEDGE_CARD_COUNT: return { goal, progress: a.courseId ? s.cardsByCourse.get(a.courseId) ?? 0 : s.cardCount };
    case AchievementConditionType.STREAK_DAYS: return { goal, progress: s.streakDays };
    case AchievementConditionType.UNIT_GROUP_COMPLETE: return unitGroupProgress(a, s.countableUnits);
  }
};

export const evaluateAchievementsForUser = async (userId: string) => {
  if (!await prisma.user.findUnique({ where: { id: userId }, select: { id: true } })) throw new AppError(404, "USER_NOT_FOUND", "User not found");
  const [achievements, owned] = await Promise.all([
    prisma.achievement.findMany({ orderBy: [{ category: "asc" }, { sortOrder: "asc" }] }),
    prisma.userAchievement.findMany({ where: { userId }, select: { achievementId: true } }),
  ]);
  const stats = await loadStats(userId, new Set(achievements.map(a => a.conditionType)));
  const ownedIds = new Set(owned.map((x) => x.achievementId));
  const unlocked = [];
  for (const achievement of achievements) {
    if (ownedIds.has(achievement.id)) continue;
    const p = await progressFor(achievement, userId, stats);
    if (p.progress < p.goal) continue;
    const row = await prisma.userAchievement.upsert({
      where: { userId_achievementId: { userId, achievementId: achievement.id } }, update: {},
      create: { userId, achievementId: achievement.id }, include: { achievement: true },
    });
    unlocked.push({ id: row.achievement.id, title: row.achievement.title, description: row.achievement.description,
      category: row.achievement.category, categoryLabel: achievementCategoryLabel[row.achievement.category],
      rarity: row.achievement.rarity, iconKey: row.achievement.iconKey, achievedAt: row.achievedAt.toISOString() });
  }
  return unlocked;
};

export const getAchievementsByUser = async (user: { id: string; selectedTargetAchievementId: string | null; selectedProfileAchievementId?: string | null }) => {
  const achievements = await prisma.achievement.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], include: { userAchievements: { where: { userId: user.id }, select: { achievedAt: true } } } });
  const stats = await loadStats(user.id, new Set(achievements.map(a => a.conditionType)));
  const groups = (await Promise.all(categoryOrder.map(async (category) => ({
    category, label: achievementCategoryLabel[category],
    achievements: await Promise.all(achievements.filter((a) => a.category === category && (!a.isSecret || a.userAchievements.length > 0)).map(async (a) => {
      const achievedAt = a.userAchievements[0]?.achievedAt ?? null;
      const status: AchievementStatus = achievedAt ? "achieved" : a.isSecret ? "secret_locked" : "visible_locked";
      const hidden = status === "secret_locked";
      const p = await progressFor(a, user.id, stats); const link = targetLink(a);
      return { id: a.id, category: a.category, conditionType: a.conditionType, conditionValue: a.conditionValue, courseId: a.courseId,
        seriesKey: seriesKey(a), seriesTitle: hidden ? "???" : stripLevel(a.title), level: levelOf(a.title), status,
        title: hidden ? "???" : a.title, description: hidden ? "条件を満たすと内容が表示されます。" : a.description,
        conditionLabel: hidden ? null : conditionLabel(a), goal: p.goal, progress: p.progress,
        href: link.href, actionLabel: link.actionLabel, achievedAt: achievedAt?.toISOString() ?? null,
        rarity: a.rarity, iconKey: a.iconKey, isProfileSelected: achievedAt !== null && user.selectedProfileAchievementId === a.id };
    })),
  })))).filter((g) => g.achievements.length > 0);
  return { groups, targetAchievementId: user.selectedTargetAchievementId, profileAchievementId: user.selectedProfileAchievementId ?? null };
};

export const updateTargetAchievementByUserId = async (userId: string, achievementId: string | null) => {
  if (achievementId) {
    const a = await prisma.achievement.findUnique({ where: { id: achievementId }, select: { isSecret: true } });
    if (!a || a.isSecret) throw new AppError(400, "INVALID_TARGET_ACHIEVEMENT", "Invalid target achievement");
    if (await prisma.userAchievement.findUnique({ where: { userId_achievementId: { userId, achievementId } } })) throw new AppError(400, "ACHIEVEMENT_ALREADY_UNLOCKED", "Achievement already unlocked");
  }
  const updated = await prisma.user.update({ where: { id: userId }, data: { selectedTargetAchievementId: achievementId }, select: { selectedTargetAchievementId: true } });
  return { targetAchievementId: updated.selectedTargetAchievementId };
};

export const updateProfileAchievementByUserId = async (userId: string, achievementId: string | null) => {
  if (achievementId && !await prisma.userAchievement.findUnique({ where: { userId_achievementId: { userId, achievementId } }, select: { id: true } }))
    throw new AppError(400, "ACHIEVEMENT_NOT_UNLOCKED", "獲得済みの実績だけプロフィールに設定できます。");
  const updated = await prisma.user.update({ where: { id: userId }, data: { selectedProfileAchievementId: achievementId }, select: { selectedProfileAchievementId: true } });
  return { profileAchievementId: updated.selectedProfileAchievementId };
};
