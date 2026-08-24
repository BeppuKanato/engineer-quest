import {
  Achievement,
  AchievementCategory,
  AchievementConditionType,
  CourseDifficulty,
  MissionType,
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

const stripLevelSuffix = (title: string) =>
  title.replace(/\s*Lv\.\d+\s*$/, "").trim();

const extractLevel = (title: string) => {
  const matched = title.match(/Lv\.(\d+)/);
  return matched ? Number(matched[1]) : 1;
};

const buildSeriesKey = (
  achievement: Pick<
    Achievement,
    "title" | "category" | "conditionType" | "courseId" | "missionId"
  >
) => {
  const seriesTitle = stripLevelSuffix(achievement.title);
  return [
    achievement.category,
    achievement.conditionType,
    achievement.courseId ?? "all-courses",
    achievement.missionId ?? "all-missions",
    seriesTitle,
  ].join(":");
};

const buildTargetLink = (
  achievement: Pick<Achievement, "conditionType" | "courseId" | "missionId">
) => {
  switch (achievement.conditionType) {
    case AchievementConditionType.SPECIFIC_MISSION_CLEAR:
      return achievement.missionId
        ? {
            href: `/mission/${encodeURIComponent(achievement.missionId)}/overview`,
            actionLabel: "対象ミッションを見る",
          }
        : { href: "/courses", actionLabel: "コースを選ぶ" };
    case AchievementConditionType.COURSE_REQUIRED_MISSION_COMPLETE:
    case AchievementConditionType.COURSE_ALL_MISSION_COMPLETE:
    case AchievementConditionType.COURSE_COMPLETE:
    case AchievementConditionType.COURSE_EXAM_HARD_CLEAR:
      return achievement.courseId
        ? {
            href: `/courses/roadmap/${encodeURIComponent(achievement.courseId)}`,
            actionLabel: "対象コースを見る",
          }
        : { href: "/courses", actionLabel: "コースを選ぶ" };
    case AchievementConditionType.MISSION_COUNT:
    case AchievementConditionType.ACTIVITY_COUNT:
    case AchievementConditionType.STREAK_DAYS:
      return { href: "/courses", actionLabel: "学習を続ける" };
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

const calculateAchievementProgress = async (
  achievement: Achievement,
  userId: string,
  completedMissionIds: Set<string>,
  completedActivityCount: number
) => {
  switch (achievement.conditionType) {
    case AchievementConditionType.MISSION_COUNT:
      return {
        goal: achievement.conditionValue ?? 0,
        progress: completedMissionIds.size,
      };
    case AchievementConditionType.SPECIFIC_MISSION_CLEAR:
      return {
        goal: 1,
        progress:
          achievement.missionId && completedMissionIds.has(achievement.missionId)
            ? 1
            : 0,
      };
    case AchievementConditionType.ACTIVITY_COUNT:
      return {
        goal: achievement.conditionValue ?? 0,
        progress: completedActivityCount,
      };
    case AchievementConditionType.COURSE_REQUIRED_MISSION_COMPLETE:
    case AchievementConditionType.COURSE_COMPLETE: {
      if (!achievement.courseId) return { goal: 1, progress: 0 };

      const [goal, progress] = await Promise.all([
        prisma.mission.count({
          where: {
            courseId: achievement.courseId,
            isPublished: true,
            isRequiredForCourseCompletion: true,
          },
        }),
        prisma.userMissionProgress.count({
          where: {
            userId,
            status: PrismaProgressStatus.COMPLETED,
            mission: {
              courseId: achievement.courseId,
              isPublished: true,
              isRequiredForCourseCompletion: true,
            },
          },
        }),
      ]);

      return { goal, progress };
    }
    case AchievementConditionType.COURSE_ALL_MISSION_COMPLETE: {
      if (!achievement.courseId) return { goal: 1, progress: 0 };

      const [goal, progress] = await Promise.all([
        prisma.mission.count({
          where: {
            courseId: achievement.courseId,
            isPublished: true,
          },
        }),
        prisma.userMissionProgress.count({
          where: {
            userId,
            status: PrismaProgressStatus.COMPLETED,
            mission: {
              courseId: achievement.courseId,
              isPublished: true,
            },
          },
        }),
      ]);

      return { goal, progress };
    }
    case AchievementConditionType.COURSE_EXAM_HARD_CLEAR:
      return {
        goal: 1,
        progress: (await hasHardCourseExamClear(userId, achievement.courseId))
          ? 1
          : 0,
      };
    case AchievementConditionType.STREAK_DAYS:
      return {
        goal: achievement.conditionValue ?? 0,
        progress: 0,
      };
  }
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

const hasHardCourseExamClear = async (
  userId: string,
  courseId: string | null
) => {
  if (!courseId) return false;

  const progress = await prisma.userMissionProgress.findFirst({
    where: {
      userId,
      status: PrismaProgressStatus.COMPLETED,
      highestClearedExamDifficulty: CourseDifficulty.HARD,
      mission: {
        courseId,
        type: MissionType.COURSE_EXAM,
        isPublished: true,
      },
    },
    select: { id: true },
  });

  return Boolean(progress);
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
      return hasHardCourseExamClear(userId, achievement.courseId);
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

export const getAchievementsByUser = async (user: {
  id: string;
  selectedTargetAchievementId: string | null;
}) => {
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
  const completedMissionIds = await getCompletedMissionIds(user.id);
  const completedActivityCount = await getCompletedActivityCount(user.id);
  const courseProgressPromises = new Map<string, ReturnType<typeof calculateAchievementProgress>>();

  const getProgress = (achievement: Achievement) => {
    const isCourseProgress =
      achievement.conditionType === AchievementConditionType.COURSE_COMPLETE ||
      achievement.conditionType === AchievementConditionType.COURSE_REQUIRED_MISSION_COMPLETE ||
      achievement.conditionType === AchievementConditionType.COURSE_ALL_MISSION_COMPLETE;
    const cacheKey = isCourseProgress
      ? `${achievement.conditionType}:${achievement.courseId ?? "none"}`
      : null;

    if (!cacheKey) {
      return calculateAchievementProgress(
        achievement,
        user.id,
        completedMissionIds,
        completedActivityCount
      );
    }

    const cached = courseProgressPromises.get(cacheKey);
    if (cached) return cached;

    const progress = calculateAchievementProgress(
      achievement,
      user.id,
      completedMissionIds,
      completedActivityCount
    );
    courseProgressPromises.set(cacheKey, progress);
    return progress;
  };

  const grouped = categoryOrder.map((category) => {
    const items = achievements
      .filter((achievement) => achievement.category === category)
      .map(async (achievement) => {
        const achievedAt = achievement.userAchievements[0]?.achievedAt ?? null;
        const status: AchievementStatus = achievedAt
          ? "achieved"
          : achievement.isSecret
            ? "secret_locked"
            : "visible_locked";

        const isSecretLocked = status === "secret_locked";
        const progress = await getProgress(achievement);
        const targetLink = buildTargetLink(achievement);

        return {
          id: achievement.id,
          category: achievement.category,
          conditionType: achievement.conditionType,
          conditionValue: achievement.conditionValue,
          seriesKey: buildSeriesKey(achievement),
          seriesTitle: isSecretLocked ? "???" : stripLevelSuffix(achievement.title),
          level: extractLevel(achievement.title),
          status,
          title: isSecretLocked ? "???" : achievement.title,
          description: isSecretLocked
            ? "条件を満たすと内容が表示されます。"
            : achievement.description,
          conditionLabel: isSecretLocked
            ? null
            : createConditionLabel(achievement),
          goal: progress.goal,
          progress: progress.progress,
          href: targetLink.href,
          actionLabel: targetLink.actionLabel,
          achievedAt: achievedAt?.toISOString() ?? null,
        };
      });

    return {
      category,
      label: categoryLabel[category],
      achievements: items,
    };
  });

  const groups = (await Promise.all(
    grouped.map(async (group) => ({
      ...group,
      achievements: await Promise.all(group.achievements),
    }))
  )).filter((group) => group.achievements.length > 0);

  return {
    groups,
    targetAchievementId: user.selectedTargetAchievementId,
  };
};

export const updateTargetAchievementByUserId = async (
  userId: string,
  achievementId: string | null
) => {
  if (achievementId !== null) {
    const achievement = await prisma.achievement.findUnique({
      where: { id: achievementId },
      select: { id: true, isSecret: true },
    });

    if (!achievement || achievement.isSecret) {
      throw new AppError(400, "INVALID_TARGET_ACHIEVEMENT", "Invalid target achievement");
    }

    const achieved = await prisma.userAchievement.findUnique({
      where: {
        userId_achievementId: {
          userId,
          achievementId,
        },
      },
      select: { id: true },
    });

    if (achieved) {
      throw new AppError(400, "ACHIEVEMENT_ALREADY_UNLOCKED", "Achievement already unlocked");
    }
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      selectedTargetAchievementId: achievementId,
    },
    select: {
      selectedTargetAchievementId: true,
    },
  });

  return {
    targetAchievementId: updated.selectedTargetAchievementId,
  };
};
