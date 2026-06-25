// prisma/seed.ts

import { Prisma, PrismaClient } from "@prisma/client";
import { learningSeed } from "./seedData/learningSeed";

const prisma = new PrismaClient();

async function deleteExistingData() {
  // Logs / Progress
  await prisma.activityAnswerLog.deleteMany();
  await prisma.userMissionActivityProgress.deleteMany();
  await prisma.userMissionProgress.deleteMany();

  // Master data
  await prisma.missionActivity.deleteMany();
  await prisma.missionSection.deleteMany();
  await prisma.mission.deleteMany();

  await prisma.courseCategoryMap.deleteMany();
  await prisma.courseCategory.deleteMany();
  await prisma.course.deleteMany();
}

async function seedCourse(course: (typeof learningSeed.courses)[number]) {
  for (const categoryName of course.categories) {
    await prisma.courseCategory.upsert({
      where: { name: categoryName },
      update: {},
      create: { name: categoryName },
    });
  }

  const createdCourse = await prisma.course.create({
    data: {
      id: course.id,
      title: course.title,
      description: course.description,
      difficulty: course.difficulty,
      isInitiallyUnlocked: course.isInitiallyUnlocked,
      isPublished: course.isPublished,
      version: course.version,
    },
  });

  for (const categoryName of course.categories) {
    const category = await prisma.courseCategory.findUnique({
      where: { name: categoryName },
    });

    if (!category) {
      throw new Error(`Category not found: ${categoryName}`);
    }

    await prisma.courseCategoryMap.create({
      data: {
        courseId: createdCourse.id,
        categoryId: category.id,
      },
    });
  }

  for (const mission of course.missions) {
    const createdMission = await prisma.mission.create({
      data: {
        id: mission.id,
        courseId: createdCourse.id,
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

    for (const section of mission.sections) {
      const createdSection = await prisma.missionSection.create({
        data: {
          id: section.id,
          missionId: createdMission.id,
          title: section.title,
          description: section.description ?? null,
          order: section.order,
        },
      });

      for (const activity of section.activities) {
        await prisma.missionActivity.create({
          data: {
            id: activity.id,
            missionId: createdMission.id,
            sectionId: createdSection.id,
            type: activity.type,
            title: activity.title,
            instruction: activity.instruction,
            mentorMessage: activity.mentorMessage,
            content: activity.content as Prisma.InputJsonValue,
            preview:
              activity.preview === null
                ? Prisma.JsonNull
                : (activity.preview as Prisma.InputJsonValue),
            actionLabel: activity.actionLabel,
            order: activity.order,
            sectionOrder: activity.sectionOrder,
            isMissionCheck: activity.isMissionCheck,
          },
        });
      }
    }
  }
}

async function seedLearningData() {
  for (const course of learningSeed.courses) {
    await seedCourse(course);
  }
}

async function main() {
  console.log("Start seeding...");

  await deleteExistingData();
  await seedLearningData();

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
