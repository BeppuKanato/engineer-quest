// prisma/seed.ts

import { PrismaClient } from "@prisma/client";
import { learningSeed } from "./seedData/learningSeed";

const prisma = new PrismaClient();

async function deleteExistingData() {
  await prisma.activityAnswerLog.deleteMany();
  await prisma.missionExamSubmission.deleteMany();

  await prisma.userMissionExamProgress.deleteMany();
  await prisma.userLessonProgress.deleteMany();
  await prisma.userMissionProgress.deleteMany();

  await prisma.missionExamVariant.deleteMany();
  await prisma.missionExam.deleteMany();

  await prisma.lessonActivity.deleteMany();
  await prisma.lesson.deleteMany();
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
        isPublished: mission.isPublished,
      },
    });

    for (const lesson of mission.lessons) {
      const createdLesson = await prisma.lesson.create({
        data: {
          id: lesson.id,
          missionId: createdMission.id,
          title: lesson.title,
          description: lesson.description,
          order: lesson.order,
          rewardExp: lesson.rewardExp,
          learnedItems: lesson.learnedItems,
        },
      });

      for (const activity of lesson.activities) {
        await prisma.lessonActivity.create({
          data: {
            id: activity.id,
            lessonId: createdLesson.id,
            type: activity.type,
            title: activity.title,
            instruction: activity.instruction,
            mentorMessage: activity.mentorMessage,
            content: activity.content,
            preview: activity.preview,
            actionLabel: activity.actionLabel,
            order: activity.order,
          },
        });
      }
    }

    await prisma.missionExam.create({
      data: {
        id: mission.exam.id,
        missionId: createdMission.id,
        title: mission.exam.title,
        description: mission.exam.description,
        thumbnailUrl: mission.exam.thumbnailUrl,
        previewCss: mission.exam.previewCss,
        estimatedTime: mission.exam.estimatedTime,
        rewardExp: mission.exam.rewardExp,
        variants: {
          create: mission.exam.variants.map((variant) => ({
            difficulty: variant.difficulty,
            initialCode: variant.initialCode,
            answerCode: variant.answerCode,
          })),
        },
      },
    });
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
