import {
  Achievement,
  AchievementCategory,
  AchievementConditionType,
  ProgressStatus as PrismaProgressStatus,
} from "@prisma/client";

import { AppError } from "../error/appError";
import { prisma } from "../lib/prisma";

export type AchievementStatus = "achieved" | "visible_locked" | "secret_locked";

const categoryLabel: Record<AchievementCategory, string> = {
  MISSION_COUNT: "Mission数",
  MISSION_CLEAR: "特定Mission",
  MISSION_COMPLETE: "Missionコンプリート",
  COURSE_EXAM: "Course終了試験",
  LEARNING_ACTION: "学習行動",
  COURSE_COMPLETE: "Course完了",
  STREAK: "継続",
};

const categoryOrder: AchievementCategory[] = [
  AchievementCategory.MISSION_COUNT,
  AchievementCategory.MISSION_CLEAR,
  AchievementCategory.MISSION_COMPLETE,
  AchievementCategory.COURSE_EXAM,
  AchievementCategory.LEARNING_ACTION,
  AchievementCategory.COURSE_COMPLETE,
  AchievementCategory.STREAK,
];

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

const getCompletedMissionIds = async (userId: string) => {
  const progresses = await prisma.userMissionProgress.findMany({
    where: {
      userId,
      status: PrismaProgressStatus.COMPLETED,
    },
    select: {
      missionId: true,
    },
  });

  return new Set(progresses.map((progress) => progress.missionId));
};

const getCompletedActivityCount = async (userId: string) => {
  return prisma.userMissionActivityProgress.count({
    where: {
      userId,
      status: PrismaProgressStatus.COMPLETED,
    },
  });
};

const isCourseRequiredComplete = async (
  userId: string,
  courseId: string | null
) => {
  if (!courseId) return false;

  const requiredMissions = await prisma.mission.findMany({
    where: {
      courseId,
      isPublished: true,
      isRequiredForCourseCompletion: true,
    },
    select: {
      id: true,
      progresses: {
        where: {
          userId,
          status: PrismaProgressStatus.COMPLETED,
        },
        select: {
          id: true,
        },
      },
    },
  });

  return (
    requiredMissions.length > 0 &&
    requiredMissions.every((mission) => mission.progresses.length > 0)
  );
};

const isCourseAllMissionsComplete = async (
  userId: string,
  courseId: string | null
) => {
  if (!courseId) return false;

  const missions = await prisma.mission.findMany({
    where: {
      courseId,
      isPublished: true,
    },
    select: {
      id: true,
      progresses: {
        where: {
          userId,
          status: PrismaProgressStatus.COMPLETED,
        },
        select: {
          id: true,
        },
      },
    },
  });

  return (
    missions.length > 0 &&
    missions.every((mission) => mission.progresses.length > 0)
  );
};

const isAchievementEligible = async (
  achievement: Achievement,
  userId: string,
  completedMissionIds: Set<string>,
  completedActivityCount: number
) => {
  switch (achievement.conditionType) {
    case AchievementConditionType.MISSION_COUNT:
      return completedMissionIds.size >= (achievement.conditionValue ?? 0);
    case AchievementConditionType.SPECIFIC_MISSION_CLEAR:
      return Boolean(
        achievement.missionId && completedMissionIds.has(achievement.missionId)
      );
    case AchievementConditionType.COURSE_REQUIRED_MISSION_COMPLETE:
    case AchievementConditionType.COURSE_COMPLETE:
      return isCourseRequiredComplete(userId, achievement.courseId);
    case AchievementConditionType.COURSE_ALL_MISSION_COMPLETE:
      return isCourseAllMissionsComplete(userId, achievement.courseId);
    case AchievementConditionType.ACTIVITY_COUNT:
      return completedActivityCount >= (achievement.conditionValue ?? 0);
    case AchievementConditionType.COURSE_EXAM_HARD_CLEAR:
    case AchievementConditionType.STREAK_DAYS:
      return false;
  }
};

export const evaluateAchievementsForUser = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!user) {
    throw new AppError(404, "USER_NOT_FOUND", "User not found");
  }

  const achievements = await prisma.achievement.findMany({
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
  });
  const existingUserAchievements = await prisma.userAchievement.findMany({
    where: { userId },
    select: { achievementId: true },
  });
  const alreadyAchievedIds = new Set(
    existingUserAchievements.map((achievement) => achievement.achievementId)
  );
  const completedMissionIds = await getCompletedMissionIds(userId);
  const completedActivityCount = await getCompletedActivityCount(userId);

  const newlyUnlocked = [];

  for (const achievement of achievements) {
    if (alreadyAchievedIds.has(achievement.id)) continue;

    const isEligible = await isAchievementEligible(
      achievement,
      userId,
      completedMissionIds,
      completedActivityCount
    );

    if (!isEligible) continue;

    const userAchievement = await prisma.userAchievement.create({
      data: {
        userId,
        achievementId: achievement.id,
      },
      include: {
        achievement: true,
      },
    });

    newlyUnlocked.push({
      id: userAchievement.achievement.id,
      title: userAchievement.achievement.title,
      description: userAchievement.achievement.description,
      category: userAchievement.achievement.category,
      categoryLabel: categoryLabel[userAchievement.achievement.category],
      achievedAt: userAchievement.achievedAt.toISOString(),
    });
  }

  return newlyUnlocked;
};

export const getAchievementsByFirebaseUid = async (firebaseUid: string) => {
  const user = await prisma.user.findUnique({
    where: { firebaseUid },
    select: { id: true },
  });

  if (!user) {
    throw new AppError(404, "USER_NOT_FOUND", "User not found");
  }

  const achievements = await prisma.achievement.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: {
      userAchievements: {
        where: {
          userId: user.id,
        },
        select: {
          achievedAt: true,
        },
      },
    },
  });

  const grouped = categoryOrder.map((category) => {
    const items = achievements
      .filter((achievement) => achievement.category === category)
      .map((achievement) => {
        const achievedAt = achievement.userAchievements[0]?.achievedAt ?? null;
        const status: AchievementStatus = achievedAt
          ? "achieved"
          : achievement.isSecret
            ? "secret_locked"
            : "visible_locked";

        const isSecretLocked = status === "secret_locked";

        return {
          id: achievement.id,
          category: achievement.category,
          status,
          title: isSecretLocked ? "???" : achievement.title,
          description: isSecretLocked
            ? "条件を満たすと内容が表示されます。"
            : achievement.description,
          conditionLabel: isSecretLocked
            ? null
            : createConditionLabel(achievement),
          achievedAt: achievedAt?.toISOString() ?? null,
        };
      });

    return {
      category,
      label: categoryLabel[category],
      achievements: items,
    };
  });

  return grouped.filter((group) => group.achievements.length > 0);
};
