import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import definitions from "../learning/feedback/concepts.json";
import { getAchievementsByUser } from "./achievement.service";
import { currentLearningStreak, getLearningDayKeys, learningDateKey, tokyoDate } from "./learningDays.service";

const object = (value: unknown): Record<string, unknown> => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
const groupFor = (kind: string) => ["bfs", "dfs", "binary-search"].includes(kind) ? "探索" : ["wall-extension", "maze-digging"].includes(kind) ? "迷路生成" : kind === "bubble-sort" ? "並び替え" : "最適化";

/** #459の確定記録だけを使う。週は月境界でも日本時間の日付キーで判定する。 */
export async function getHomeCalendar(userId: string, now = new Date()) {
  const keys = await getLearningDayKeys(userId), today = tokyoDate(now), todayKey = learningDateKey(now);
  const cursor = new Date(now); let continuationDays = 0;
  while (keys.has(learningDateKey(cursor))) { continuationDays++; cursor.setUTCDate(cursor.getUTCDate() - 1); }
  const weekStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - today.getUTCDay()));
  return {
    calendar: { year: today.getUTCFullYear(), month: today.getUTCMonth(), date: today.getUTCDate(),
      learnedDays: [...keys].filter(key => key.startsWith(todayKey.slice(0, 7) + "-")).map(key => Number(key.slice(8))).sort((a, b) => a - b),
      continuationDays, totalDays: keys.size, hasLearnedToday: keys.has(todayKey) },
    week: { streakDays: currentLearningStreak(keys, now), days: Array.from({ length: 7 }, (_, index) => {
      const date = new Date(weekStart.getTime() + index * 86400000), key = date.toISOString().slice(0, 10);
      return { date: key, label: ["日", "月", "火", "水", "木", "金", "土"][index], learned: keys.has(key), isToday: key === todayKey };
    }) },
  };
}

/** 生成済みの次の一歩だけを読む。フィードバックの生成・再評価は行わない。 */
export function homeFeedbackStep(result: Prisma.JsonValue | null) {
  const selection = object(object(result).selection);
  const first = Array.isArray(selection.candidates) ? object(selection.candidates[0]).nextStep : undefined;
  const value = typeof first === "string" ? first : selection.nextStep;
  return typeof value === "string" && value.trim() ? value.replace(/\s+/g, " ").trim() : null;
}

export const getHomeByUser = async (user: {
  id: string; displayName: string | null; selectedMascotId: string; selectedTargetAchievementId: string | null;
}) => {
  const now = new Date(), courseIds = definitions.map(unit => unit.courseId);
  const [courses, units, phases, cards, achievementData, dates, feedback, completedAchievementCount] = await Promise.all([
    prisma.course.findMany({ where: { id: { in: courseIds }, isPublished: true }, select: { id: true, title: true } }),
    prisma.unitLearningProgress.findMany({ where: { userId: user.id }, select: { courseId: true, status: true, lastPhaseKey: true, updatedAt: true, startedAt: true } }),
    prisma.phaseLearningProgress.findMany({ where: { userId: user.id }, select: { courseId: true, phaseKey: true, status: true, updatedAt: true } }),
    prisma.knowledgeCard.findMany({ where: { isPublished: true, courseId: { in: courseIds }, course: { isPublished: true } }, select: { courseId: true, label: true, title: true, rarity: true, userKnowledgeCards: { where: { userId: user.id }, select: { id: true, collectedAt: true } } } }),
    getAchievementsByUser(user), getHomeCalendar(user.id, now),
    prisma.feedbackV1.findFirst({ where: { userId: user.id, status: "COMPLETED" }, orderBy: [{ generatedAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }, { id: "desc" }], select: { result: true } }),
    prisma.userAchievement.count({ where: { userId: user.id } }),
  ]);
  // ホームの掲示板欄は「学んだ知識を活かそう」（2026-11-25 決定）：新着順ではなく、
  // 自分が修了した単元の未解決の質問を、回答が少ない順に出す。自分の投稿は除く。
  const completedCourseIds = units.filter(row => row.status === "COMPLETED").map(row => row.courseId);
  const questionRows = completedCourseIds.length ? await prisma.questPost.findMany({
    where: { category: "QUESTION", status: "OPEN", visibility: "PUBLIC", courseId: { in: completedCourseIds }, userId: { not: user.id } },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 10,
    select: { id: true, title: true, body: true, createdAt: true, course: { select: { title: true } }, user: { select: { displayName: true } }, _count: { select: { comments: true } } },
  }) : [];
  const questions = questionRows
    .sort((a, b) => a._count.comments - b._count.comments || b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 3)
    .map(question => ({ id: question.id, title: question.title, excerpt: question.body.replace(/\s+/g, " ").trim().slice(0, 120),
      courseTitle: question.course?.title ?? null, commentCount: question._count.comments, authorName: question.user.displayName,
      createdAt: question.createdAt.toISOString(), href: `/quest-board/${encodeURIComponent(question.id)}` }));
  // 最近手に入れた知識カード（ホームの知識カード欄の代表1枚）。
  const heldCards = cards.flatMap(card => card.userKnowledgeCards.map(held => ({ card, collectedAt: held.collectedAt })))
    .sort((a, b) => b.collectedAt.getTime() - a.collectedAt.getTime());
  const latestHeld = heldCards[0];
  const latestCard = latestHeld ? { title: latestHeld.card.title, label: latestHeld.card.label, rarity: latestHeld.card.rarity,
    courseTitle: courses.find(course => course.id === latestHeld.card.courseId)?.title ?? null } : null;
  const overviewUnits = definitions.flatMap(definition => {
    const course = courses.find(row => row.id === definition.courseId); if (!course) return [];
    const progress = units.find(row => row.courseId === course.id);
    const completePhases = new Set(phases.filter(row => row.courseId === course.id && row.status === "COMPLETED").map(row => row.phaseKey));
    const inProgressPhase = phases.filter(row => row.courseId === course.id && row.status === "IN_PROGRESS" && definition.phases.some(phase => phase.id === row.phaseKey)).sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0];
    const last = definition.phases.find(phase => phase.id === (inProgressPhase?.phaseKey ?? progress?.lastPhaseKey) && !completePhases.has(phase.id));
    const firstIncomplete = definition.phases.find(phase => !completePhases.has(phase.id));
    const next = last && firstIncomplete && last.phase <= firstIncomplete.phase ? last : firstIncomplete;
    const base = `/courses/roadmap/${encodeURIComponent(course.id)}`;
    const held = cards.filter(card => card.courseId === course.id && card.userKnowledgeCards.length > 0).length;
    return [{ id: course.id, title: course.title, group: groupFor(definition.kind), status: progress?.status ?? "NOT_STARTED",
      completedPhases: definition.phases.filter(phase => completePhases.has(phase.id)).length, totalPhases: definition.phases.length,
      collectedCards: held, totalCards: cards.filter(card => card.courseId === course.id).length,
      href: base, resumeHref: next ? `${base}/learn?phase=${encodeURIComponent(next.id)}` : `${base}/learn`, nextPhase: next?.formalName ?? null,
    }];
  });
  // 再開順は開始時刻ではなく、単元・フェーズの保存更新日時を使う。
  const lastTouched = (courseId: string) => Math.max(0, ...units.filter(row => row.courseId === courseId).map(row => row.updatedAt.getTime()), ...phases.filter(row => row.courseId === courseId).map(row => row.updatedAt.getTime()));
  const active = overviewUnits.filter(unit => unit.status === "IN_PROGRESS").sort((a, b) => lastTouched(b.id) - lastTouched(a.id) || a.id.localeCompare(b.id));
  const resume = active[0] ?? null;
  const recommended = resume ?? overviewUnits.find(unit => unit.status === "NOT_STARTED") ?? null;
  const achievements = achievementData.groups.flatMap(group => group.achievements);
  const nearAchievements = achievements.filter(item => item.status === "visible_locked" && item.progress > 0 && item.progress < item.goal)
    .sort((a, b) => Math.min(1, b.progress / b.goal) - Math.min(1, a.progress / a.goal) || (a.id === user.selectedTargetAchievementId ? -1 : b.id === user.selectedTargetAchievementId ? 1 : a.id.localeCompare(b.id))).slice(0, 2);
  // 進みかけの実績が無い（初回など）場合も「次の実績」の置き場所は消さない（2026-11-27 の空状態方針：
  // 場所と目標は常設し、空なら促す形にする）。進捗0の未達成実績から、目標に設定したものを優先して出す。
  if (nearAchievements.length === 0) {
    nearAchievements.push(...achievements.filter(item => item.status === "visible_locked" && item.progress < item.goal)
      .sort((a, b) => (a.id === user.selectedTargetAchievementId ? -1 : b.id === user.selectedTargetAchievementId ? 1 : a.id.localeCompare(b.id))).slice(0, 2));
  }
  const selected = achievements.find(item => item.id === user.selectedTargetAchievementId && item.status === "visible_locked");
  return {
    user: { displayName: user.displayName, selectedMascotId: user.selectedMascotId, completedMissionNum: 0, completedAchievementNum: completedAchievementCount,
      todayCompletedMissionCount: 0, dailyMissionGoal: 5, continuationDays: dates.calendar.continuationDays, totalDays: dates.calendar.totalDays },
    // 旧クライアント互換。現在のUIはoverview/today/resumeを使う。
    missions: { resume: null, recommended: null, recommendedList: [] },
    targetAchievement: selected ? { title: selected.title, href: selected.href, actionLabel: selected.actionLabel, factor: [{ name: selected.conditionLabel ?? selected.title, goal: selected.goal, progress: selected.progress }] } : null,
    ...dates,
    overview: { completedUnits: overviewUnits.filter(unit => unit.status === "COMPLETED").length, totalUnits: overviewUnits.length,
      collectedCards: overviewUnits.reduce((sum, unit) => sum + unit.collectedCards, 0), totalCards: overviewUnits.reduce((sum, unit) => sum + unit.totalCards, 0), units: overviewUnits },
    today: { recommended, nearAchievements: nearAchievements.map(({ id, title, progress, goal, href, conditionLabel }) => ({ id, title, progress, goal, href, conditionLabel: conditionLabel ?? null })),
      nearCards: overviewUnits.filter(unit => unit.collectedCards > 0 && unit.collectedCards === unit.totalCards - 1) },
    resume: resume ? { ...resume, nextStep: feedback ? homeFeedbackStep(feedback.result) : null } : null,
    hasInProgressUnit: active.length > 0,
    latestCard,
    questions,
  };
};
