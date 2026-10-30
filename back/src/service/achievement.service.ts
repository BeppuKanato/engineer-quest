import {
  Achievement, AchievementCategory, AchievementConditionType, CourseDifficulty,
  MissionType, Prisma, ProgressStatus,
} from "@prisma/client";
import { AppError } from "../error/appError";
import { prisma } from "../lib/prisma";

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
    case AchievementConditionType.STREAK_DAYS: return `${n}日連続で学習`;
  }
};
const stripLevel = (title: string) => title.replace(/\s*Lv\.\d+\s*$/, "").trim();
const levelOf = (title: string) => Number(title.match(/Lv\.(\d+)/)?.[1] ?? 1);
const seriesKey = (a: Achievement) => [a.category, a.conditionType, a.courseId ?? "all", a.missionId ?? "all", a.createQuestId ?? "all", stripLevel(a.title)].join(":");
const targetLink = (a: Achievement) => {
  if (a.conditionType === AchievementConditionType.SPECIFIC_MISSION_CLEAR && a.missionId)
    return { href: `/mission/${encodeURIComponent(a.missionId)}/overview`, actionLabel: "対象ミッションを見る" };
  if (a.createQuestId)
    return { href: `/create/quests/${encodeURIComponent(a.createQuestId)}`, actionLabel: "対象の作る課題を見る" };
  if (a.courseId)
    return { href: `/courses/roadmap/${encodeURIComponent(a.courseId)}`, actionLabel: "対象コースを見る" };
  if (a.conditionType === AchievementConditionType.KNOWLEDGE_CARD_COUNT)
    return { href: "/collection", actionLabel: "コレクションを見る" };
  if (([AchievementConditionType.CREATE_QUEST_COMPLETED_COUNT, AchievementConditionType.CREATE_QUEST_OPTIONAL_REQUIREMENT_COUNT, AchievementConditionType.CREATE_QUEST_PERFECT_COUNT] as AchievementConditionType[]).includes(a.conditionType))
    return { href: "/create", actionLabel: "作る課題に挑戦する" };
  return { href: "/courses", actionLabel: "学習を続ける" };
};

type Stats = {
  missions: Set<string>; activities: number; completedCourses: Set<string>;
  completedQuests: number; perfectQuests: number; optionalRequirements: number;
  cardCount: number; questScores: Map<string, number>;
};
const asResultArray = (value: Prisma.JsonValue): Array<Record<string, unknown>> =>
  Array.isArray(value) ? value.filter((v) => Boolean(v) && typeof v === "object" && !Array.isArray(v)) as Array<Record<string, unknown>> : [];

const loadStats = async (userId: string): Promise<Stats> => {
  const [missionProgress, activities, courses, attempts, submissions, cardCount] = await Promise.all([
    prisma.userMissionProgress.findMany({ where: { userId, status: ProgressStatus.COMPLETED }, select: { missionId: true } }),
    prisma.userMissionActivityProgress.count({ where: { userId, status: ProgressStatus.COMPLETED } }),
    prisma.course.findMany({ where: { isPublished: true }, select: { id: true, missions: { where: { isPublished: true, isRequiredForCourseCompletion: true }, select: { id: true, progresses: { where: { userId, status: ProgressStatus.COMPLETED }, select: { id: true } } } } } }),
    prisma.createQuestAttempt.findMany({ where: { userId }, select: { questId: true, status: true, bestScore: true } }),
    prisma.createQuestSubmission.findMany({ where: { attempt: { userId } }, select: { results: true } }),
    prisma.userKnowledgeCard.count({ where: { userId } }),
  ]);
  const optionalIds = new Set<string>();
  submissions.flatMap((s) => asResultArray(s.results)).forEach((r) => {
    if (r.kind === "OPTIONAL" && r.passed === true && typeof r.requirementId === "string") optionalIds.add(r.requirementId);
  });
  return {
    missions: new Set(missionProgress.map((p) => p.missionId)), activities,
    completedCourses: new Set(courses.filter((c) => c.missions.length > 0 && c.missions.every((m) => m.progresses.length > 0)).map((c) => c.id)),
    completedQuests: attempts.filter((a) => a.status === "COMPLETED").length,
    perfectQuests: attempts.filter((a) => a.bestScore >= 100).length,
    optionalRequirements: optionalIds.size, cardCount,
    questScores: new Map(attempts.map((a) => [a.questId, a.bestScore])),
  };
};

const courseAllProgress = async (userId: string, courseId: string | null, requiredOnly: boolean) => {
  if (!courseId) return { goal: 1, progress: 0 };
  const missions = await prisma.mission.findMany({
    where: { courseId, isPublished: true, ...(requiredOnly ? { isRequiredForCourseCompletion: true } : {}) },
    select: { progresses: { where: { userId, status: ProgressStatus.COMPLETED }, select: { id: true } } },
  });
  return { goal: Math.max(1, missions.length), progress: missions.filter((m) => m.progresses.length).length };
};
const hardExam = async (userId: string, courseId: string | null) => Boolean(courseId && await prisma.userMissionProgress.findFirst({ where: { userId, status: ProgressStatus.COMPLETED, highestClearedExamDifficulty: CourseDifficulty.HARD, mission: { courseId, type: MissionType.COURSE_EXAM, isPublished: true } }, select: { id: true } }));

const progressFor = async (a: Achievement, userId: string, s: Stats) => {
  const goal = a.conditionValue ?? 1;
  switch (a.conditionType) {
    case AchievementConditionType.MISSION_COUNT: return { goal, progress: s.missions.size };
    case AchievementConditionType.SPECIFIC_MISSION_CLEAR: return { goal: 1, progress: a.missionId && s.missions.has(a.missionId) ? 1 : 0 };
    case AchievementConditionType.ACTIVITY_COUNT: return { goal, progress: s.activities };
    case AchievementConditionType.COURSE_REQUIRED_MISSION_COMPLETE:
    case AchievementConditionType.COURSE_COMPLETE: return courseAllProgress(userId, a.courseId, true);
    case AchievementConditionType.COURSE_ALL_MISSION_COMPLETE: return courseAllProgress(userId, a.courseId, false);
    case AchievementConditionType.COURSE_EXAM_HARD_CLEAR: return { goal: 1, progress: await hardExam(userId, a.courseId) ? 1 : 0 };
    case AchievementConditionType.COURSE_COMPLETED_COUNT: return { goal, progress: s.completedCourses.size };
    case AchievementConditionType.CREATE_QUEST_SCORE: return { goal, progress: a.createQuestId ? s.questScores.get(a.createQuestId) ?? 0 : 0 };
    case AchievementConditionType.CREATE_QUEST_COMPLETED_COUNT: return { goal, progress: s.completedQuests };
    case AchievementConditionType.CREATE_QUEST_OPTIONAL_REQUIREMENT_COUNT: return { goal, progress: s.optionalRequirements };
    case AchievementConditionType.CREATE_QUEST_PERFECT_COUNT: return { goal, progress: s.perfectQuests };
    case AchievementConditionType.KNOWLEDGE_CARD_COUNT: return { goal, progress: s.cardCount };
    case AchievementConditionType.STREAK_DAYS: return { goal, progress: 0 };
  }
};

export const evaluateAchievementsForUser = async (userId: string) => {
  if (!await prisma.user.findUnique({ where: { id: userId }, select: { id: true } })) throw new AppError(404, "USER_NOT_FOUND", "User not found");
  const [achievements, owned, stats] = await Promise.all([
    prisma.achievement.findMany({ orderBy: [{ category: "asc" }, { sortOrder: "asc" }] }),
    prisma.userAchievement.findMany({ where: { userId }, select: { achievementId: true } }), loadStats(userId),
  ]);
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
  const [achievements, stats] = await Promise.all([
    prisma.achievement.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], include: { userAchievements: { where: { userId: user.id }, select: { achievedAt: true } } } }),
    loadStats(user.id),
  ]);
  const groups = (await Promise.all(categoryOrder.map(async (category) => ({
    category, label: achievementCategoryLabel[category],
    achievements: await Promise.all(achievements.filter((a) => a.category === category).map(async (a) => {
      const achievedAt = a.userAchievements[0]?.achievedAt ?? null;
      const status: AchievementStatus = achievedAt ? "achieved" : a.isSecret ? "secret_locked" : "visible_locked";
      const hidden = status === "secret_locked";
      const p = await progressFor(a, user.id, stats); const link = targetLink(a);
      return { id: a.id, category: a.category, conditionType: a.conditionType, conditionValue: a.conditionValue,
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
