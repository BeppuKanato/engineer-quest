/**
 * Prisma seedの実行入口。
 * `seedData/courseSeed.ts`を正としてCourse（単元）をupsertし、再実行可能性を保つ。
 * 旧フローのMission/Activityと知識カードのスケジュールは削除済み（カードは #78 で作り直す）。
 */

import { Prisma, PrismaClient } from "@prisma/client";

import { achievementSeed } from "./seedData/achievementSeed";
import { courseSeed } from "./seedData/courseSeed";
import { createQuestSeed } from "./seedData/createQuestSeed";
import { assertPreservingSeedOperation } from "./preservingSeedPolicy";

const prisma = new PrismaClient();
const activeCourseIds = courseSeed.map((course) => course.id);
const activeCourseIdSet = new Set(activeCourseIds);
const courseIdArgument = process.argv.find((argument) => argument.startsWith("--course-id="));
const selectedCourseId = courseIdArgument?.slice("--course-id=".length);
const preserveExisting = process.argv.includes("--preserve-existing");
const createQuestsOnly = process.argv.includes("--create-quests-only");

async function seedCourse(
  client: Prisma.TransactionClient,
  course: (typeof courseSeed)[number],
) {
  for (const categoryName of course.categories) {
    await client.courseCategory.upsert({
      where: { name: categoryName },
      update: {},
      create: { name: categoryName },
    });
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
  if (!preserveExisting) await client.courseCategoryMap.deleteMany({
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
}

async function seedLearningData() {
  await prisma.$transaction(
    async (client) => {
        for (const course of courseSeed) {
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

async function seedAchievements(client: Prisma.TransactionClient = prisma) {
  const activeAchievementIds = achievementSeed.map((achievement) => String(achievement.id));
  if (!preserveExisting) await client.achievement.deleteMany({
    where: { id: { notIn: activeAchievementIds } },
  });

  for (const achievement of achievementSeed) {
    await client.achievement.upsert({
      where: { id: achievement.id },
      update: achievement,
      create: achievement,
    });
  }
}

async function seedCreateQuests(client: Prisma.TransactionClient = prisma) {
  const activeQuestIds = createQuestSeed.map((quest) => quest.id);

  if (!preserveExisting) await client.createQuest.deleteMany({ where: { id: { notIn: activeQuestIds } } });
  for (const quest of createQuestSeed) {
    await client.createQuest.upsert({
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

    if (!preserveExisting) await client.createQuestRequirement.deleteMany({ where: { questId: quest.id } });
    if (!preserveExisting) await client.createQuestCourse.deleteMany({ where: { questId: quest.id } });
    for (const requirement of quest.requirements) {
      await client.createQuestRequirement.upsert({
        where: { id: requirement.id },
        update: {
          questId: quest.id, title: requirement.title, description: requirement.description, kind: requirement.kind, category: requirement.category, points: requirement.points, order: requirement.order,
          tests: requirement.tests as unknown as Prisma.InputJsonValue, hints: requirement.hints as unknown as Prisma.InputJsonValue,
        },
        create: {
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
      await client.createQuestCourse.upsert({
        where: { questId_courseId: { questId: quest.id, courseId: relatedCourse.courseId } },
        update: relatedCourse,
        create: { questId: quest.id, ...relatedCourse },
      });
    }
  }
}

async function main() {
  if (preserveExisting) {
    if (selectedCourseId || createQuestsOnly) throw new Error("Preservation mode requires a full master-data update");
    const guarded = prisma.$extends({ query: { $allModels: {
      $allOperations({ model, operation, args, query }) {
        assertPreservingSeedOperation(model, operation);
        return query(args);
      },
    } } });
    await guarded.$transaction(async (guardedTransaction) => {
      // Query-only extensions retain the standard transaction operations at runtime.
      const client = guardedTransaction as unknown as Prisma.TransactionClient;
      for (const course of courseSeed) await seedCourse(client, course);
      await seedCreateQuests(client);
      await seedAchievements(client);
    }, { maxWait: 10_000, timeout: 900_000 });
    console.log("Preserving seed completed: master rows upserted; no deletions or learner/progress/assignment writes.");
    return;
  }
  if (createQuestsOnly) {
    console.log("Start seeding Create quests...");
    await seedCreateQuests();
    console.log("Create quest seeding finished.");
    return;
  }
  if (courseIdArgument && (!selectedCourseId || !activeCourseIdSet.has(selectedCourseId))) {
    throw new Error("--course-id must name an existing courseSeed course");
  }
  console.log("Start seeding...");

  await seedLearningData();
  if (selectedCourseId) {
    console.log(`Seeded only ${selectedCourseId}. Other courses and rewards were not changed.`);
    return;
  }
  await seedCreateQuests();
  await seedAchievements();

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
