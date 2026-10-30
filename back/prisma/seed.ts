/**
 * Prisma seedの実行入口。
 * `seedData/learningSeed.ts`を正としてCourse・Mission・Activityをupsertし、再実行可能性を保つ。
 */

import { Prisma, PrismaClient, ProgressStatus } from "@prisma/client";

import { achievementSeed } from "./seedData/achievementSeed";
import { createQuestSeed } from "./seedData/createQuestSeed";
import {
  knowledgeCardScheduleSeed,
  knowledgeCardSeed,
} from "./seedData/knowledgeCardSeed";
import { learningSeed } from "./seedData/learningSeed";
import { parseActivityContent } from "../src/learning/activity-content/activityContentSchema";

const prisma = new PrismaClient();
const activeCourseIds = learningSeed.courses.map((course) => course.id);
const activeCourseIdSet = new Set(activeCourseIds);
const courseIdArgument = process.argv.find((argument) => argument.startsWith("--course-id="));
const selectedCourseId = courseIdArgument?.slice("--course-id=".length);
const createQuestsOnly = process.argv.includes("--create-quests-only");

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
          if (selectedCourseId && course.id !== selectedCourseId) continue;
          await seedCourse(client, course);
        }

        // A targeted update must never prune unrelated courses or categories.
        if (selectedCourseId) return;

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
  const activeAchievementIds = achievementSeed.map((achievement) => String(achievement.id));
  await prisma.achievement.deleteMany({
    where: { id: { notIn: activeAchievementIds } },
  });

  for (const achievement of achievementSeed) {
    await prisma.achievement.upsert({
      where: { id: achievement.id },
      update: achievement,
      create: achievement,
    });
  }
}

async function seedKnowledgeCards() {
  const activeCardIds = knowledgeCardSeed.map((card) => String(card.id));
  const activeScheduleIds = knowledgeCardScheduleSeed.map((entry) => entry.id);

  await prisma.knowledgeCardScheduleEntry.deleteMany({
    where: { id: { notIn: activeScheduleIds } },
  });
  await prisma.knowledgeCard.deleteMany({
    where: { id: { notIn: activeCardIds } },
  });

  for (const card of knowledgeCardSeed) {
    await prisma.knowledgeCard.upsert({
      where: { id: card.id },
      update: card,
      create: card,
    });
  }

  for (const entry of knowledgeCardScheduleSeed) {
    await prisma.knowledgeCardScheduleEntry.upsert({
      where: { id: entry.id },
      update: entry,
      create: entry,
    });
  }
}

async function seedCreateQuests() {
  const activeQuestIds = createQuestSeed.map((quest) => quest.id);

  await prisma.createQuest.deleteMany({ where: { id: { notIn: activeQuestIds } } });
  for (const quest of createQuestSeed) {
    await prisma.createQuest.upsert({
      where: { id: quest.id },
      update: {
        title: quest.title,
        description: quest.description,
        scenario: quest.scenario,
        problemType: quest.problemType,
        functionName: quest.functionName,
        starterCode: quest.starterCode,
        estimatedMinutes: quest.estimatedMinutes,
        tags: [...quest.tags],
        thumbnailUrl: quest.thumbnailUrl,
        previewData: quest.previewData as Prisma.InputJsonValue,
        sortOrder: quest.sortOrder,
        isPublished: true,
      },
      create: {
        id: quest.id,
        title: quest.title,
        description: quest.description,
        scenario: quest.scenario,
        problemType: quest.problemType,
        functionName: quest.functionName,
        starterCode: quest.starterCode,
        estimatedMinutes: quest.estimatedMinutes,
        tags: [...quest.tags],
        thumbnailUrl: quest.thumbnailUrl,
        previewData: quest.previewData as Prisma.InputJsonValue,
        sortOrder: quest.sortOrder,
        isPublished: true,
      },
    });

    await prisma.createQuestRequirement.deleteMany({ where: { questId: quest.id } });
    await prisma.createQuestCourse.deleteMany({ where: { questId: quest.id } });
    for (const requirement of quest.requirements) {
      await prisma.createQuestRequirement.create({
        data: {
          id: requirement.id,
          questId: quest.id,
          title: requirement.title,
          description: requirement.description,
          kind: requirement.kind,
          category: requirement.category,
          points: requirement.points,
          order: requirement.order,
          tests: requirement.tests as unknown as Prisma.InputJsonValue,
          hints: requirement.hints as unknown as Prisma.InputJsonValue,
        },
      });
    }
    for (const relatedCourse of quest.relatedCourses) {
      await prisma.createQuestCourse.create({
        data: { questId: quest.id, ...relatedCourse },
      });
    }
  }
}

async function main() {
  if (createQuestsOnly) {
    console.log("Start seeding Create quests...");
    await seedCreateQuests();
    console.log("Create quest seeding finished.");
    return;
  }
  if (courseIdArgument && (!selectedCourseId || !activeCourseIdSet.has(selectedCourseId))) {
    throw new Error("--course-id must name an existing learningSeed course");
  }
  console.log("Start seeding...");

  await seedLearningData();
  if (selectedCourseId) {
    console.log(`Seeded only ${selectedCourseId}. Other courses and rewards were not changed.`);
    return;
  }
  await seedCreateQuests();
  await seedAchievements();
  await seedKnowledgeCards();

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
