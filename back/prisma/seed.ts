// prisma/seed.ts

import { Prisma, PrismaClient, ProgressStatus } from "@prisma/client";

import { achievementSeed } from "./seedData/achievementSeed";
import { badgeSeed } from "./seedData/badgeSeed";
import { createThemeSeed } from "./seedData/createThemeSeed";
import { knowledgeCardSeed } from "./seedData/knowledgeCardSeed";
import { learningSeed } from "./seedData/learningSeed";
import { parseActivityContent } from "../src/type/activityContent";

const prisma = new PrismaClient();
const activeCourseIds = learningSeed.courses.map((course) => course.id);
const activeCourseIdSet = new Set(activeCourseIds);

async function seedCourseCategory(
  client: Prisma.TransactionClient,
  categoryName: (typeof learningSeed.courses)[number]["categories"][number],
) {
  await client.courseCategory.upsert({
    where: { name: categoryName },
    update: {},
    create: { name: categoryName },
  });
}

async function seedCourse(
  client: Prisma.TransactionClient,
  course: (typeof learningSeed.courses)[number],
) {
  for (const categoryName of course.categories) {
    await seedCourseCategory(client, categoryName);
  }

  await client.course.upsert({
    where: { id: course.id },
    update: {
      title: course.title,
      description: course.description,
      difficulty: course.difficulty,
      isInitiallyUnlocked: course.isInitiallyUnlocked,
      isPublished: course.isPublished,
      version: course.version,
    },
    create: {
      id: course.id,
      title: course.title,
      description: course.description,
      difficulty: course.difficulty,
      isInitiallyUnlocked: course.isInitiallyUnlocked,
      isPublished: course.isPublished,
      version: course.version,
    },
  });

  const activeCategories = await client.courseCategory.findMany({
    where: { name: { in: course.categories } },
    select: { id: true },
  });
  await client.courseCategoryMap.deleteMany({
    where: {
      courseId: course.id,
      categoryId: { notIn: activeCategories.map((category) => category.id) },
    },
  });

  for (const categoryName of course.categories) {
    const category = await client.courseCategory.findUnique({
      where: { name: categoryName },
    });

    if (!category) {
      throw new Error(`Category not found: ${categoryName}`);
    }

    await client.courseCategoryMap.upsert({
      where: {
        courseId_categoryId: {
          courseId: course.id,
          categoryId: category.id,
        },
      },
      update: {},
      create: {
        courseId: course.id,
        categoryId: category.id,
      },
    });
  }

  const activeMissionIds = course.missions.map((mission) => mission.id);
  await client.mission.updateMany({
    where: { courseId: course.id },
    data: { order: { increment: 10_000 } },
  });

  for (const mission of course.missions) {
    await client.mission.upsert({
      where: { id: mission.id },
      update: {
        courseId: course.id,
        title: mission.title,
        description: mission.description,
        difficulty: mission.difficulty,
        goalImg: mission.goalImg,
        estimatedMinutes: mission.estimatedMinutes,
        order: mission.order,
        type: mission.type,
        isRequiredForCourseCompletion: mission.isRequiredForCourseCompletion,
        parentMissionId: mission.parentMissionId,
        roadmapLane: mission.roadmapLane,
        branchOrder: mission.branchOrder,
        rewardExp: mission.rewardExp,
        learnedItems: mission.learnedItems,
        isPublished: mission.isPublished,
      },
      create: {
        id: mission.id,
        courseId: course.id,
        title: mission.title,
        description: mission.description,
        difficulty: mission.difficulty,
        goalImg: mission.goalImg,
        estimatedMinutes: mission.estimatedMinutes,
        order: mission.order,
        type: mission.type,
        isRequiredForCourseCompletion: mission.isRequiredForCourseCompletion,
        parentMissionId: mission.parentMissionId,
        roadmapLane: mission.roadmapLane,
        branchOrder: mission.branchOrder,
        rewardExp: mission.rewardExp,
        learnedItems: mission.learnedItems,
        isPublished: mission.isPublished,
      },
    });

    const activeActivityIds = mission.activities.map((activity) => activity.id);

    // Free every mission-local order slot before upserting. Stale rows may still
    // occupy an order used by a newly inserted activity until synchronization ends.
    await client.missionActivity.updateMany({
      where: { missionId: mission.id },
      data: {
        order: { increment: 10_000 },
      },
    });

    for (const activity of mission.activities) {
      const content = parseActivityContent(activity.content, activity.type);
      const preview =
        activity.preview == null
          ? Prisma.JsonNull
          : (activity.preview as Prisma.InputJsonValue);

      await client.missionActivity.upsert({
          where: { id: activity.id },
          update: {
            missionId: mission.id,
            type: activity.type,
            title: activity.title,
            instruction: activity.instruction,
            mentorMessage: activity.mentorMessage,
            content: content as Prisma.InputJsonValue,
            preview,
            actionLabel: activity.actionLabel,
            order: activity.order,
          },
          create: {
            id: activity.id,
            missionId: mission.id,
            type: activity.type,
            title: activity.title,
            instruction: activity.instruction,
            mentorMessage: activity.mentorMessage,
            content: content as Prisma.InputJsonValue,
            preview,
            actionLabel: activity.actionLabel,
            order: activity.order,
          },
      });
    }

    const staleActivities = await client.missionActivity.findMany({
      where: {
        missionId: mission.id,
        id: { notIn: activeActivityIds },
      },
      select: { id: true },
    });

    if (staleActivities.length > 0) {
      const staleActivityIds = staleActivities.map((activity) => activity.id);
      await client.userMissionProgress.updateMany({
        where: {
          missionId: mission.id,
          currentActivityId: { in: staleActivityIds },
        },
        data: { currentActivityId: activeActivityIds[0] ?? null },
      });
      await client.missionActivity.deleteMany({
        where: { id: { in: staleActivityIds } },
      });
    }

    const completedMissionProgresses = await client.userMissionProgress.findMany({
      where: {
        missionId: mission.id,
        status: ProgressStatus.COMPLETED,
      },
      select: { userId: true },
    });

    if (completedMissionProgresses.length > 0) {
      const completedUserIds = completedMissionProgresses.map((progress) => progress.userId);
      const completedActivityProgresses = await client.userMissionActivityProgress.findMany({
        where: {
          userId: { in: completedUserIds },
          activityId: { in: activeActivityIds },
          status: ProgressStatus.COMPLETED,
        },
        select: { userId: true, activityId: true },
      });
      const completedActivityIdsByUser = new Map<string, Set<string>>();

      for (const progress of completedActivityProgresses) {
        const completedIds = completedActivityIdsByUser.get(progress.userId) ?? new Set<string>();
        completedIds.add(progress.activityId);
        completedActivityIdsByUser.set(progress.userId, completedIds);
      }

      for (const progress of completedMissionProgresses) {
        const completedIds = completedActivityIdsByUser.get(progress.userId) ?? new Set<string>();
        const firstIncompleteActivityId = mission.activities.find(
          (activity) => !completedIds.has(activity.id)
        )?.id;

        if (!firstIncompleteActivityId) continue;

        await client.userMissionProgress.update({
          where: {
            userId_missionId: {
              userId: progress.userId,
              missionId: mission.id,
            },
          },
          data: {
            status: ProgressStatus.IN_PROGRESS,
            currentActivityId: firstIncompleteActivityId,
            completedAt: null,
          },
        });
      }
    }

  }

  await client.mission.deleteMany({
    where: {
      courseId: course.id,
      id: { notIn: activeMissionIds },
    },
  });
}

async function seedLearningData() {
  await prisma.$transaction(
    async (client) => {
      for (const course of learningSeed.courses) {
        await seedCourse(client, course);
      }

      await client.course.deleteMany({
        where: {
          id: { notIn: activeCourseIds },
        },
      });
      await client.courseCategory.deleteMany({
        where: {
          courses: { none: {} },
        },
      });
    },
    { maxWait: 10_000, timeout: 120_000 },
  );
}

async function seedAchievements() {
  const obsoleteAchievementIds = achievementSeed
    .filter(
      (achievement) =>
        typeof achievement.courseId === "string" &&
        !activeCourseIdSet.has(achievement.courseId),
    )
    .flatMap((achievement) =>
      typeof achievement.id === "string" ? [achievement.id] : [],
    );

  await prisma.achievement.deleteMany({
    where: { id: { in: obsoleteAchievementIds } },
  });

  for (const achievement of achievementSeed.filter(
    (item) =>
      typeof item.courseId !== "string" || activeCourseIdSet.has(item.courseId),
  )) {
    await prisma.achievement.upsert({
      where: { id: achievement.id },
      update: achievement,
      create: achievement,
    });
  }
}

async function seedTechIconBadges() {
  for (const badge of badgeSeed) {
    await prisma.techIconBadge.upsert({
      where: { id: badge.id },
      update: badge,
      create: badge,
    });
  }
}

async function seedKnowledgeCards() {
  for (const card of knowledgeCardSeed.filter((item) =>
    activeCourseIdSet.has(item.courseId),
  )) {
    await prisma.knowledgeCard.upsert({
      where: { id: card.id },
      update: card,
      create: card,
    });
  }
}

async function seedCreateThemes() {
  for (const [index, theme] of createThemeSeed.entries()) {
    await prisma.createTheme.upsert({
      where: { id: theme.id },
      update: {
        title: theme.title,
        description: theme.description,
        category: theme.category,
        difficulty: theme.difficulty,
        estimatedMinutes: theme.estimatedMinutes,
        tags: [...theme.tags],
        defaultThumbnailUrl: theme.defaultThumbnailUrl,
        sortOrder: index + 1,
        isPublished: true,
      },
      create: {
        id: theme.id,
        title: theme.title,
        description: theme.description,
        category: theme.category,
        difficulty: theme.difficulty,
        estimatedMinutes: theme.estimatedMinutes,
        tags: [...theme.tags],
        defaultThumbnailUrl: theme.defaultThumbnailUrl,
        sortOrder: index + 1,
        isPublished: true,
      },
    });

    await prisma.createThemeRequirement.deleteMany({ where: { themeId: theme.id } });
    await prisma.createThemeChallenge.deleteMany({ where: { themeId: theme.id } });

    for (const [requirementIndex, label] of theme.requirements.entries()) {
      await prisma.createThemeRequirement.create({
        data: {
          themeId: theme.id,
          label,
          order: requirementIndex + 1,
        },
      });
    }

    for (const [challengeIndex, label] of theme.challenges.entries()) {
      await prisma.createThemeChallenge.create({
        data: {
          themeId: theme.id,
          label,
          order: challengeIndex + 1,
        },
      });
    }
  }
}

async function main() {
  console.log("Start seeding...");

  await seedLearningData();
  await seedAchievements();
  await seedTechIconBadges();
  await seedKnowledgeCards();
  await seedCreateThemes();

  console.log("Seeding finished.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("Seeding failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
