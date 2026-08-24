import { ProgressStatus as PrismaProgressStatus } from "@prisma/client";

import { AppError } from "../error/appError";
import { prisma } from "../lib/prisma";

const mascotIds = ["red-panda", "penguin", "owl"] as const;

export type MascotId = (typeof mascotIds)[number];

export const isMascotId = (value: string): value is MascotId =>
  mascotIds.includes(value as MascotId);

type ProfileHistoryType =
  | "mission_completed"
  | "achievement_unlocked"
  | "activity_completed"
  | "badge_acquired";

type ProfileHistoryItem = {
  id: string;
  type: ProfileHistoryType;
  title: string;
  description: string;
  occurredAt: string;
  href: string | null;
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

const deriveLevel = (experience: number) => {
  let level = 1;

  while (experience >= requiredExperienceForLevel(level + 1)) {
    level += 1;
  }

  return level;
};

const deriveRank = (completedMissionCount: number) =>
  [...rankThresholds]
    .reverse()
    .find((rank) => completedMissionCount >= rank.requiredCompletedMissionCount)
    ?.name ?? rankThresholds[0].name;

const calculateCompletedCourseCount = async (userId: string) => {
  const courses = await prisma.course.findMany({
    where: { isPublished: true },
    select: {
      id: true,
      missions: {
        where: {
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
            select: { id: true },
          },
        },
      },
    },
  });

  return courses.filter(
    (course) =>
      course.missions.length > 0 &&
      course.missions.every((mission) => mission.progresses.length > 0)
  ).length;
};

const compareHistoryDesc = (
  left: ProfileHistoryItem,
  right: ProfileHistoryItem
) =>
  new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime();

export const getProfileByUser = async (user: {
  id: string;
  displayName: string | null;
  experience: number;
  badgeTickets: number;
  selectedMascotId: string;
  selectedTechIconBadgeId: string | null;
}) => {
  const [
    selectedTechIconBadge,
    hexadResponse,
    missionProgresses,
    userAchievements,
    activityProgresses,
    userBadges,
    recentWorks,
    completedCourseCount,
    completedMissionCount,
    badgeCount,
  ] = await Promise.all([
      user.selectedTechIconBadgeId
        ? prisma.techIconBadge.findUnique({
            where: { id: user.selectedTechIconBadgeId },
          })
        : Promise.resolve(null),
      prisma.hexadResponse.findUnique({
        where: { userId: user.id },
        select: {
          questionnaireVersion: true,
          philanthropistScore: true,
          socialiserScore: true,
          freeSpiritScore: true,
          achieverScore: true,
          disruptorScore: true,
          playerScore: true,
          completedAt: true,
        },
      }),
      prisma.userMissionProgress.findMany({
        where: {
          userId: user.id,
          status: PrismaProgressStatus.COMPLETED,
          completedAt: { not: null },
        },
        orderBy: { completedAt: "desc" },
        take: 30,
        include: {
          mission: {
            select: {
              id: true,
              title: true,
              description: true,
              course: {
                select: {
                  title: true,
                },
              },
            },
          },
        },
      }),
      prisma.userAchievement.findMany({
        where: {
          userId: user.id,
        },
        orderBy: { achievedAt: "desc" },
        take: 30,
        include: {
          achievement: {
            select: {
              id: true,
              title: true,
              description: true,
            },
          },
        },
      }),
      prisma.userMissionActivityProgress.findMany({
        where: {
          userId: user.id,
          status: PrismaProgressStatus.COMPLETED,
          completedAt: { not: null },
        },
        orderBy: { completedAt: "desc" },
        take: 30,
        include: {
          activity: {
            select: {
              id: true,
              title: true,
              missionId: true,
              mission: {
                select: {
                  title: true,
                },
              },
            },
          },
        },
      }),
      prisma.userTechIconBadge.findMany({
        where: {
          userId: user.id,
        },
        orderBy: { acquiredAt: "desc" },
        take: 30,
        include: {
          badge: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
        },
      }),
      prisma.userWork.findMany({
        where: { userId: user.id },
        orderBy: [{ isFavorite: "desc" }, { updatedAt: "desc" }],
        take: 3,
        select: {
          id: true,
          title: true,
          description: true,
          isFavorite: true,
          updatedAt: true,
          createMission: {
            select: { title: true },
          },
        },
      }),
      calculateCompletedCourseCount(user.id),
      prisma.userMissionProgress.count({
        where: {
          userId: user.id,
          status: PrismaProgressStatus.COMPLETED,
        },
      }),
      prisma.userTechIconBadge.count({ where: { userId: user.id } }),
    ]);

  const missionHistory: ProfileHistoryItem[] = missionProgresses
    .filter((progress) => progress.completedAt !== null)
    .map((progress) => ({
      id: `mission:${progress.id}`,
      type: "mission_completed",
      title: progress.mission.title,
      description: `${progress.mission.course.title} / Mission完了`,
      occurredAt: progress.completedAt!.toISOString(),
      href: `/mission/${encodeURIComponent(progress.mission.id)}/overview`,
    }));

  const achievementHistory: ProfileHistoryItem[] = userAchievements.map(
    (userAchievement) => ({
      id: `achievement:${userAchievement.id}`,
      type: "achievement_unlocked",
      title: userAchievement.achievement.title,
      description: userAchievement.achievement.description,
      occurredAt: userAchievement.achievedAt.toISOString(),
      href: "/achievements",
    })
  );

  const activityHistory: ProfileHistoryItem[] = activityProgresses
    .filter((progress) => progress.completedAt !== null)
    .map((progress) => ({
      id: `activity:${progress.id}`,
      type: "activity_completed",
      title: progress.activity.title,
      description: `${progress.activity.mission.title} / Activity完了`,
      occurredAt: progress.completedAt!.toISOString(),
      href: `/mission/${encodeURIComponent(progress.activity.missionId)}/play`,
    }));

  const badgeHistory: ProfileHistoryItem[] = userBadges.map((userBadge) => ({
    id: `badge:${userBadge.id}`,
    type: "badge_acquired",
    title: userBadge.badge.name,
    description: userBadge.badge.description,
    occurredAt: userBadge.acquiredAt.toISOString(),
    href: "/badges",
  }));

  return {
    user: {
      displayName: user.displayName,
      rank: deriveRank(completedMissionCount),
      level: deriveLevel(user.experience),
      exp: user.experience,
      completedCourseCount,
      completedMissionCount,
      badgeCount,
      selectedMascotId: isMascotId(user.selectedMascotId)
        ? user.selectedMascotId
        : "red-panda",
    },
    ticketBalance: user.badgeTickets,
    selectedBadge: selectedTechIconBadge
      ? {
          id: selectedTechIconBadge.id,
          name: selectedTechIconBadge.name,
          description: selectedTechIconBadge.description,
          iconUrl: selectedTechIconBadge.iconUrl,
          rarity: selectedTechIconBadge.rarity,
        }
      : null,
    hexadProfile: hexadResponse
      ? {
          questionnaireVersion: hexadResponse.questionnaireVersion,
          scores: {
            philanthropist: hexadResponse.philanthropistScore,
            socialiser: hexadResponse.socialiserScore,
            freeSpirit: hexadResponse.freeSpiritScore,
            achiever: hexadResponse.achieverScore,
            disruptor: hexadResponse.disruptorScore,
            player: hexadResponse.playerScore,
          },
          completedAt: hexadResponse.completedAt.toISOString(),
        }
      : null,
    recentWorks: recentWorks.map((work) => ({
      id: work.id,
      title: work.title,
      description: work.description,
      createMissionTitle: work.createMission.title,
      isFavorite: work.isFavorite,
      updatedAt: work.updatedAt.toISOString(),
      href: "/my-works",
    })),
    history: [
      ...missionHistory,
      ...achievementHistory,
      ...activityHistory,
      ...badgeHistory,
    ]
      .sort(compareHistoryDesc)
      .slice(0, 50),
  };
};

export const updateMascotByUserId = async (
  userId: string,
  mascotId: string
) => {
  if (!isMascotId(mascotId)) {
    throw new AppError(400, "INVALID_MASCOT", "Invalid mascot id");
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { selectedMascotId: mascotId },
    select: {
      selectedMascotId: true,
    },
  });

  return {
    selectedMascotId: user.selectedMascotId,
  };
};
