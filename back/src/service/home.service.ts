import {
  Achievement,
  AchievementConditionType,
  CourseDifficulty,
  Mission,
  MissionType,
  ProgressStatus as PrismaProgressStatus,
} from "@prisma/client";

import { AppError } from "../error/appError";
import { prisma } from "../lib/prisma";

type HomeMission = {
  id: string;
  title: string;
  difficulty: number;
  goalImg: string;
  description: string;
  progress: number;
  estimatedMinutes: number;
  rewardExp: number;
  activityCount: number;
  ctaLabel: string;
  badgeLabel: string;
  reason: string;
  href: string;
};

const rankThresholds = [
  { name: "Junior", requiredCompletedMissionCount: 0 },
  { name: "Senior", requiredCompletedMissionCount: 6 },
  { name: "Lead", requiredCompletedMissionCount: 14 },
  { name: "Master", requiredCompletedMissionCount: 24 },
];

const requiredExperienceForLevel = (level: number): number => {
  if (level <= 0) return 0;
  return Math.floor(100 * Math.pow(level, 1.5));
};

const deriveLevelStatus = (experience: number) => {
  let level = 1;

  while (experience >= requiredExperienceForLevel(level + 1)) {
    level += 1;
  }

  return {
    level,
    requireNextLevelExp: requiredExperienceForLevel(level + 1),
  };
};

const toDifficultyValue = (difficulty: CourseDifficulty) => {
  switch (difficulty) {
    case CourseDifficulty.EASY:
      return 1;
    case CourseDifficulty.NORMAL:
      return 2;
    case CourseDifficulty.HARD:
      return 3;
  }
};

const buildRankStatus = (completedMissionCount: number) => {
  const currentRank =
    [...rankThresholds]
      .reverse()
      .find(
        (rank) => completedMissionCount >= rank.requiredCompletedMissionCount
      ) ?? rankThresholds[0];
  const currentIndex = rankThresholds.findIndex(
    (rank) => rank.name === currentRank.name
  );
  const nextRank = rankThresholds[currentIndex + 1] ?? null;

  if (!nextRank) {
    return {
      rank: currentRank.name,
      nextRank: null,
      conditions: {
        mission: [
          {
            title: `${currentRank.name}ランクに到達済み`,
            status: "complete" as const,
          },
        ],
      },
    };
  }

  return {
    rank: currentRank.name,
    nextRank: { name: nextRank.name },
    conditions: {
      mission: Array.from(
        { length: nextRank.requiredCompletedMissionCount },
        (_, index) => ({
          title: `Mission ${index + 1}個完了`,
          status:
            completedMissionCount >= index + 1
              ? ("complete" as const)
              : ("incomplete" as const),
        })
      ),
    },
  };
};

const calculateMissionProgress = async (userId: string, missionId: string) => {
  const [activityCount, completedActivityCount] = await Promise.all([
    prisma.missionActivity.count({
      where: { missionId },
    }),
    prisma.userMissionActivityProgress.count({
      where: {
        userId,
        status: PrismaProgressStatus.COMPLETED,
        activity: { missionId },
      },
    }),
  ]);

  if (activityCount === 0) return 0;
  return Math.round((completedActivityCount / activityCount) * 100);
};

const toHomeMission = async (
  mission: Mission,
  userId: string,
  badgeLabel: string,
  ctaLabel: string,
  reason: string
): Promise<HomeMission> => {
  const [progress, activityCount] = await Promise.all([
    calculateMissionProgress(userId, mission.id),
    prisma.missionActivity.count({ where: { missionId: mission.id } }),
  ]);

  return {
    id: mission.id,
    title: mission.title,
    difficulty: toDifficultyValue(mission.difficulty),
    goalImg: mission.goalImg,
    description: mission.description,
    progress,
    estimatedMinutes: mission.estimatedMinutes,
    rewardExp: mission.rewardExp,
    activityCount,
    ctaLabel,
    badgeLabel,
    reason,
    href: `/mission/${encodeURIComponent(mission.id)}/play`,
  };
};

const getResumeMission = async (userId: string) => {
  const progress = await prisma.userMissionProgress.findFirst({
    where: {
      userId,
      status: PrismaProgressStatus.IN_PROGRESS,
      mission: {
        isPublished: true,
        course: { isPublished: true },
      },
    },
    orderBy: { updatedAt: "desc" },
    include: {
      mission: true,
    },
  });

  if (!progress) return null;

  return toHomeMission(progress.mission, userId, "前回の続き", "続きから始める", "前回の続き");
};

const getRecommendedMission = async (
  userId: string,
  completedMissionIds: Set<string>
) => {
  const courses = await prisma.course.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: "asc" },
    include: {
      missions: {
        where: {
          isPublished: true,
          type: MissionType.MAIN,
          isRequiredForCourseCompletion: true,
        },
        orderBy: { order: "asc" },
      },
    },
  });

  for (const course of courses) {
    const nextMission = course.missions.find(
      (mission, index) =>
        !completedMissionIds.has(mission.id) &&
        (index === 0 || completedMissionIds.has(course.missions[index - 1].id))
    );

    if (nextMission) {
      return toHomeMission(nextMission, userId, "次におすすめ", "学習を始める", "現在のコースで次に進めるミッション");
    }
  }

  const challengeMission = await prisma.mission.findFirst({
    where: {
      isPublished: true,
      type: MissionType.CHALLENGE,
      parentMissionId: { in: [...completedMissionIds] },
      progresses: {
        none: {
          userId,
          status: PrismaProgressStatus.COMPLETED,
        },
      },
    },
    orderBy: [{ courseId: "asc" }, { branchOrder: "asc" }],
  });

  return challengeMission
    ? toHomeMission(challengeMission, userId, "挑戦ミッション", "挑戦する", "解放済みの挑戦ミッション")
    : null;
};

const getRecommendedMissions = async (
  userId: string,
  completedMissionIds: Set<string>,
  limit = 3
) => {
  const recommendations: HomeMission[] = [];
  const pushedMissionIds = new Set<string>();

  const pushMission = async (
    mission: Mission,
    badgeLabel: string,
    ctaLabel: string,
    reason: string
  ) => {
    if (pushedMissionIds.has(mission.id) || recommendations.length >= limit) {
      return;
    }

    pushedMissionIds.add(mission.id);
    recommendations.push(await toHomeMission(mission, userId, badgeLabel, ctaLabel, reason));
  };

  const courses = await prisma.course.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: "asc" },
    include: {
      missions: {
        where: {
          isPublished: true,
          type: MissionType.MAIN,
          isRequiredForCourseCompletion: true,
        },
        orderBy: { order: "asc" },
      },
    },
  });

  for (const course of courses) {
    const nextMission = course.missions.find(
      (mission, index) =>
        !completedMissionIds.has(mission.id) &&
        (index === 0 || completedMissionIds.has(course.missions[index - 1].id))
    );

    if (nextMission) {
      await pushMission(nextMission, "次におすすめ", "学習を始める", "現在のコースで次に進めるミッション");
    }

    if (recommendations.length >= limit) {
      return recommendations;
    }
  }

  const challengeMissions = await prisma.mission.findMany({
    where: {
      isPublished: true,
      type: MissionType.CHALLENGE,
      parentMissionId: { in: [...completedMissionIds] },
      progresses: {
        none: {
          userId,
          status: PrismaProgressStatus.COMPLETED,
        },
      },
    },
    orderBy: [{ courseId: "asc" }, { branchOrder: "asc" }],
    take: limit,
  });

  for (const mission of challengeMissions) {
    await pushMission(mission, "挑戦ミッション", "挑戦する", "解放済みの挑戦ミッション");
  }

  return recommendations;
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
        name: `Missionを${achievement.conditionValue ?? 0}個完了`,
        goal: achievement.conditionValue ?? 0,
        progress: completedMissionIds.size,
      };
    case AchievementConditionType.SPECIFIC_MISSION_CLEAR:
      return {
        name: "指定Missionを完了",
        goal: 1,
        progress:
          achievement.missionId && completedMissionIds.has(achievement.missionId)
            ? 1
            : 0,
      };
    case AchievementConditionType.ACTIVITY_COUNT:
      return {
        name: `Activityを${achievement.conditionValue ?? 0}個完了`,
        goal: achievement.conditionValue ?? 0,
        progress: completedActivityCount,
      };
    case AchievementConditionType.COURSE_COMPLETE:
    case AchievementConditionType.COURSE_REQUIRED_MISSION_COMPLETE: {
      if (!achievement.courseId) {
        return { name: "Courseを完了", goal: 1, progress: 0 };
      }

      const [requiredCount, completedRequiredCount] = await Promise.all([
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

      return {
        name: "Course内の必須Missionを完了",
        goal: requiredCount,
        progress: completedRequiredCount,
      };
    }
    case AchievementConditionType.COURSE_ALL_MISSION_COMPLETE: {
      if (!achievement.courseId) {
        return { name: "Course内Missionをすべて完了", goal: 1, progress: 0 };
      }

      const [missionCount, completedCount] = await Promise.all([
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

      return {
        name: "Challengeを含めたMissionを完了",
        goal: missionCount,
        progress: completedCount,
      };
    }
    case AchievementConditionType.COURSE_EXAM_HARD_CLEAR:
      return { name: "Course終了試験Hardをクリア", goal: 1, progress: 0 };
    case AchievementConditionType.STREAK_DAYS:
      return {
        name: `${achievement.conditionValue ?? 0}日連続で学習`,
        goal: achievement.conditionValue ?? 0,
        progress: 0,
      };
  }
};

const buildAchievementTargetLink = (
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

const getTargetAchievement = async (
  userId: string,
  selectedTargetAchievementId: string | null,
  completedMissionIds: Set<string>,
  completedActivityCount: number
) => {
  if (!selectedTargetAchievementId) return null;

  const achievement = await prisma.achievement.findFirst({
    where: {
      id: selectedTargetAchievementId,
      isSecret: false,
      userAchievements: {
        none: {
          userId,
        },
      },
    },
  });

  if (!achievement) return null;

  const factor = await calculateAchievementProgress(
    achievement,
    userId,
    completedMissionIds,
    completedActivityCount
  );
  const targetLink = buildAchievementTargetLink(achievement);

  return {
    title: achievement.title,
    href: targetLink.href,
    actionLabel: targetLink.actionLabel,
    factor: [factor],
  };
};

const toDateKey = (date: Date) => date.toISOString().slice(0, 10);

const buildLearningCalendar = async (userId: string) => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 1);

  const completedActivities = await prisma.userMissionActivityProgress.findMany({
    where: {
      userId,
      status: PrismaProgressStatus.COMPLETED,
      completedAt: { not: null },
    },
    select: {
      completedAt: true,
    },
  });

  const learnedDateKeys = new Set(
    completedActivities
      .map((progress) => progress.completedAt)
      .filter((date): date is Date => date !== null)
      .map(toDateKey)
  );
  const learnedDaysInMonth = completedActivities
    .map((progress) => progress.completedAt)
    .filter(
      (date): date is Date =>
        date !== null && date >= monthStart && date < monthEnd
    )
    .map((date) => date.getDate());

  let continuationDays = 0;
  const cursor = new Date(today);

  while (learnedDateKeys.has(toDateKey(cursor))) {
    continuationDays += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return {
    year,
    month,
    date: today.getDate(),
    learnedDays: [...new Set(learnedDaysInMonth)].sort((a, b) => a - b),
    continuationDays,
    totalDays: learnedDateKeys.size,
    hasLearnedToday: learnedDateKeys.has(toDateKey(today)),
  };
};

export const getHomeByFirebaseUid = async (firebaseUid: string) => {
  const user = await prisma.user.findUnique({
    where: { firebaseUid },
    select: {
      id: true,
      displayName: true,
      experience: true,
      selectedMascotId: true,
      selectedTargetAchievementId: true,
    },
  });

  if (!user) {
    throw new AppError(404, "USER_NOT_FOUND", "User not found");
  }

  const completedProgresses = await prisma.userMissionProgress.findMany({
    where: {
      userId: user.id,
      status: PrismaProgressStatus.COMPLETED,
    },
    select: {
      missionId: true,
    },
  });
  const completedMissionIds = new Set(
    completedProgresses.map((progress) => progress.missionId)
  );
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(todayStart.getDate() + 1);
  const [completedAchievementCount, completedActivityCount] = await Promise.all([
    prisma.userAchievement.count({ where: { userId: user.id } }),
    prisma.userMissionActivityProgress.count({
      where: {
        userId: user.id,
        status: PrismaProgressStatus.COMPLETED,
      },
    }),
  ]);
  const todayCompletedMissionCount = await prisma.userMissionProgress.count({
    where: {
      userId: user.id,
      status: PrismaProgressStatus.COMPLETED,
      completedAt: {
        gte: todayStart,
        lt: tomorrowStart,
      },
    },
  });
  const levelStatus = deriveLevelStatus(user.experience);
  const rankStatus = buildRankStatus(completedMissionIds.size);
  const [
    resumeMission,
    recommendedMission,
    recommendedList,
    targetAchievement,
    calendar,
  ] =
    await Promise.all([
      getResumeMission(user.id),
      getRecommendedMission(user.id, completedMissionIds),
      getRecommendedMissions(user.id, completedMissionIds, 3),
      getTargetAchievement(
        user.id,
        user.selectedTargetAchievementId,
        completedMissionIds,
        completedActivityCount
      ),
      buildLearningCalendar(user.id),
    ]);

  const fallbackMission = resumeMission ?? recommendedMission;

  return {
    user: {
      displayName: user.displayName,
      rank: rankStatus.rank,
      level: levelStatus.level,
      requireNextLevelExp: levelStatus.requireNextLevelExp,
      exp: user.experience,
      selectedMascotId: user.selectedMascotId,
      completedMissionNum: completedMissionIds.size,
      completedAchievementNum: completedAchievementCount,
      todayCompletedMissionCount,
      dailyMissionGoal: 5,
      continuationDays: calendar.continuationDays,
      totalDays: calendar.totalDays,
    },
    missions: {
      resume: resumeMission ?? fallbackMission,
      recommended: recommendedMission ?? fallbackMission,
      recommendedList,
    },
    nextRank: rankStatus.nextRank,
    nextRankCondition: rankStatus.conditions,
    targetAchievement,
    calendar,
  };
};
