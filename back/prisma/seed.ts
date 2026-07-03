// prisma/seed.ts

import { Prisma, PrismaClient } from "@prisma/client";

import { achievementSeed } from "./seedData/achievementSeed";
import { badgeSeed } from "./seedData/badgeSeed";
import { createThemeSeed } from "./seedData/createThemeSeed";
import { knowledgeCardSeed } from "./seedData/knowledgeCardSeed";
import { learningSeed } from "./seedData/learningSeed";

const prisma = new PrismaClient();

async function seedCourseCategory(
  categoryName: (typeof learningSeed.courses)[number]["categories"][number],
) {
  await prisma.courseCategory.upsert({
    where: { name: categoryName },
    update: {},
    create: { name: categoryName },
  });
}

async function seedCourse(course: (typeof learningSeed.courses)[number]) {
  for (const categoryName of course.categories) {
    await seedCourseCategory(categoryName);
  }

  await prisma.course.upsert({
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

  for (const categoryName of course.categories) {
    const category = await prisma.courseCategory.findUnique({
      where: { name: categoryName },
    });

    if (!category) {
      throw new Error(`Category not found: ${categoryName}`);
    }

    await prisma.courseCategoryMap.upsert({
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

  for (const mission of course.missions) {
    await prisma.mission.upsert({
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

    for (const section of mission.sections) {
      await prisma.missionSection.upsert({
        where: { id: section.id },
        update: {
          missionId: mission.id,
          title: section.title,
          description: section.description ?? null,
          order: section.order,
        },
        create: {
          id: section.id,
          missionId: mission.id,
          title: section.title,
          description: section.description ?? null,
          order: section.order,
        },
      });

      for (const activity of section.activities) {
        const preview =
          activity.preview === null
            ? Prisma.JsonNull
            : (activity.preview as Prisma.InputJsonValue);

        await prisma.missionActivity.upsert({
          where: { id: activity.id },
          update: {
            missionId: mission.id,
            sectionId: section.id,
            type: activity.type,
            title: activity.title,
            instruction: activity.instruction,
            mentorMessage: activity.mentorMessage,
            content: activity.content as Prisma.InputJsonValue,
            preview,
            actionLabel: activity.actionLabel,
            order: activity.order,
            sectionOrder: activity.sectionOrder,
            isMissionCheck: activity.isMissionCheck,
          },
          create: {
            id: activity.id,
            missionId: mission.id,
            sectionId: section.id,
            type: activity.type,
            title: activity.title,
            instruction: activity.instruction,
            mentorMessage: activity.mentorMessage,
            content: activity.content as Prisma.InputJsonValue,
            preview,
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

async function seedAchievements() {
  for (const achievement of achievementSeed) {
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
  for (const card of knowledgeCardSeed) {
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
