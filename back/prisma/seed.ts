// prisma/seed.ts

import { PrismaClient } from "@prisma/client";
import { learningSeed } from "./seedData/learningSeed";

const prisma = new PrismaClient();

async function deleteExistingData() {
  // 子テーブルから削除する
  await prisma.activityAnswerLog.deleteMany();
  await prisma.missionExamSubmission.deleteMany();

  await prisma.userMissionExamProgress.deleteMany();
  await prisma.userLessonProgress.deleteMany();
  await prisma.userMissionProgress.deleteMany();

  await prisma.missionExam.deleteMany();
  await prisma.lessonActivity.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.mission.deleteMany();

  await prisma.courseCategoryMap.deleteMany();
  await prisma.courseCategory.deleteMany();
  await prisma.course.deleteMany();

  // UserはFirebase連携後に使うので、seedでは消さない方針でもOK
  // 開発初期で完全に消したいなら以下を有効化
  // await prisma.user.deleteMany();
}

async function seedLearningData() {
  const { course } = learningSeed;

  // 1. Categoryを作成
  for (const categoryName of course.categories) {
    await prisma.courseCategory.upsert({
      where: {
        name: categoryName,
      },
      update: {},
      create: {
        name: categoryName,
      },
    });
  }

  // 2. Courseを作成
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

  // 3. CourseCategoryMapを作成
  for (const categoryName of course.categories) {
    const category = await prisma.courseCategory.findUnique({
      where: {
        name: categoryName,
      },
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

  // 4. Mission / Lesson / Activity / Examを作成
  for (const mission of course.missions) {
    const createdMission = await prisma.mission.create({
      data: {
        id: mission.id,
        courseId: createdCourse.id,
        title: mission.title,
        description: mission.description,
        difficulty: mission.difficulty,
        goalImg: mission.goalImg,
        order: mission.order,
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
        },
      });

      for (const activity of lesson.activities) {
        const {
          id,
          type,
          title,
          instruction,
          mentorMessage,
          content,
          preview,
          actionLabel,
          order,
        } = activity;

        await prisma.lessonActivity.create({
          data: {
            id,
            lessonId: createdLesson.id,
            type,
            title,
            instruction,
            mentorMessage,
            content,
            preview,
            actionLabel,
            order,
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
        difficulty: mission.exam.difficulty,
        thumbnailUrl: mission.exam.thumbnailUrl,
        answerCode: mission.exam.answerCode,
        initialCode: mission.exam.initialCode,
        previewCss: mission.exam.previewCss,
        estimatedTime: mission.exam.estimatedTime,
        rewardExp: mission.exam.rewardExp,
      },
    });
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