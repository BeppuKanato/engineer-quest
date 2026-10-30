import { ProgressStatus } from "@prisma/client";
import { AppError } from "../error/appError";
import { prisma } from "../lib/prisma";

const mascotIds = ["red-panda", "penguin", "owl"] as const;
export type MascotId = (typeof mascotIds)[number];
export const isMascotId = (value: string): value is MascotId => mascotIds.includes(value as MascotId);
const requiredExp = (level: number) => Math.floor(100 * Math.pow(level, 1.5));
const deriveLevel = (exp: number) => { let level = 1; while (exp >= requiredExp(level + 1)) level += 1; return level; };
const deriveRank = (n: number) => n >= 24 ? "Master" : n >= 14 ? "Lead" : n >= 6 ? "Senior" : "Junior";

const completedCourses = async (userId: string) => {
  const courses = await prisma.course.findMany({ where: { isPublished: true }, select: { missions: { where: { isPublished: true, isRequiredForCourseCompletion: true }, select: { progresses: { where: { userId, status: ProgressStatus.COMPLETED }, select: { id: true } } } } } });
  return courses.filter((c) => c.missions.length > 0 && c.missions.every((m) => m.progresses.length)).length;
};

export const getProfileByUser = async (user: { id: string; displayName: string | null; experience: number; selectedMascotId: string; selectedProfileAchievementId: string | null }) => {
  const [hexad, missions, achievements, activities, works, courseCount, missionCount, achievementCount, cardCount, selectedAchievement] = await Promise.all([
    prisma.hexadResponse.findUnique({ where: { userId: user.id } }),
    prisma.userMissionProgress.findMany({ where: { userId: user.id, status: ProgressStatus.COMPLETED, completedAt: { not: null } }, orderBy: { completedAt: "desc" }, take: 30, include: { mission: { select: { id: true, title: true, course: { select: { title: true } } } } } }),
    prisma.userAchievement.findMany({ where: { userId: user.id }, orderBy: { achievedAt: "desc" }, take: 30, include: { achievement: true } }),
    prisma.userMissionActivityProgress.findMany({ where: { userId: user.id, status: ProgressStatus.COMPLETED, completedAt: { not: null } }, orderBy: { completedAt: "desc" }, take: 30, include: { activity: { select: { title: true, missionId: true, mission: { select: { title: true } } } } } }),
    prisma.createQuestAttempt.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" }, take: 3, select: { id: true, bestScore: true, updatedAt: true, quest: { select: { title: true, description: true } } } }),
    completedCourses(user.id), prisma.userMissionProgress.count({ where: { userId: user.id, status: ProgressStatus.COMPLETED } }),
    prisma.userAchievement.count({ where: { userId: user.id } }), prisma.userKnowledgeCard.count({ where: { userId: user.id } }),
    user.selectedProfileAchievementId ? prisma.userAchievement.findUnique({ where: { userId_achievementId: { userId: user.id, achievementId: user.selectedProfileAchievementId } }, include: { achievement: true } }) : Promise.resolve(null),
  ]);
  const history = [
    ...missions.map((p) => ({ id: `mission:${p.id}`, type: "mission_completed", title: p.mission.title, description: `${p.mission.course.title} / Mission完了`, occurredAt: p.completedAt!.toISOString(), href: `/mission/${encodeURIComponent(p.mission.id)}/overview` })),
    ...achievements.map((x) => ({ id: `achievement:${x.id}`, type: "achievement_unlocked", title: x.achievement.title, description: x.achievement.description, occurredAt: x.achievedAt.toISOString(), href: "/achievements" })),
    ...activities.map((p) => ({ id: `activity:${p.id}`, type: "activity_completed", title: p.activity.title, description: `${p.activity.mission.title} / Activity完了`, occurredAt: p.completedAt!.toISOString(), href: `/mission/${encodeURIComponent(p.activity.missionId)}/play` })),
  ].sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt)).slice(0, 50);
  return {
    user: { displayName: user.displayName, rank: deriveRank(missionCount), level: deriveLevel(user.experience), exp: user.experience,
      completedCourseCount: courseCount, completedMissionCount: missionCount, achievementCount, knowledgeCardCount: cardCount,
      selectedMascotId: isMascotId(user.selectedMascotId) ? user.selectedMascotId : "red-panda" },
    selectedAchievement: selectedAchievement ? { id: selectedAchievement.achievement.id, title: selectedAchievement.achievement.title, description: selectedAchievement.achievement.description, rarity: selectedAchievement.achievement.rarity, iconKey: selectedAchievement.achievement.iconKey } : null,
    hexadProfile: hexad ? { questionnaireVersion: hexad.questionnaireVersion, scores: { philanthropist: hexad.philanthropistScore, socialiser: hexad.socialiserScore, freeSpirit: hexad.freeSpiritScore, achiever: hexad.achieverScore, disruptor: hexad.disruptorScore, player: hexad.playerScore }, completedAt: hexad.completedAt.toISOString() } : null,
    recentWorks: works.map((w) => ({ id: w.id, title: w.quest.title, description: `${w.quest.description}（自己ベスト ${w.bestScore}点）`, createMissionTitle: "作る課題", isFavorite: false, updatedAt: w.updatedAt.toISOString(), href: "/my-works" })),
    history,
  };
};

export const updateMascotByUserId = async (userId: string, mascotId: string) => {
  if (!isMascotId(mascotId)) throw new AppError(400, "INVALID_MASCOT", "Invalid mascot id");
  const user = await prisma.user.update({ where: { id: userId }, data: { selectedMascotId: mascotId }, select: { selectedMascotId: true } });
  return { selectedMascotId: user.selectedMascotId };
};
