import { isDeepStrictEqual } from "node:util";

import { PrismaClient } from "@prisma/client";

import { learningSeed } from "../../prisma/seedData/learningSeed";

const prisma = new PrismaClient();

const assertEqual = (actual: unknown, expected: unknown, label: string) => {
  if (!isDeepStrictEqual(actual, expected)) {
    throw new Error(`${label} does not match the learning seed`);
  }
};

const main = async () => {
  const courses = await prisma.course.findMany({
    orderBy: { id: "asc" },
    include: {
      categories: { include: { category: true } },
      missions: {
        orderBy: { order: "asc" },
        include: { activities: { orderBy: { order: "asc" } } },
      },
    },
  });

  assertEqual(
    courses.map((course) => course.id).sort(),
    learningSeed.courses.map((course) => course.id).sort(),
    "Course ids",
  );

  for (const expectedCourse of learningSeed.courses) {
    const course = courses.find((item) => item.id === expectedCourse.id);
    if (!course) throw new Error(`Course not found: ${expectedCourse.id}`);

    assertEqual(course.title, expectedCourse.title, `${course.id}.title`);
    assertEqual(course.description, expectedCourse.description, `${course.id}.description`);
    assertEqual(
      course.categories.map((item) => item.category.name).sort(),
      [...expectedCourse.categories].sort(),
      `${course.id}.categories`,
    );
    assertEqual(
      course.missions.map((mission) => mission.id),
      expectedCourse.missions.map((mission) => mission.id),
      `${course.id}.missions`,
    );

    for (const expectedMission of expectedCourse.missions) {
      const mission = course.missions.find((item) => item.id === expectedMission.id);
      if (!mission) throw new Error(`Mission not found: ${expectedMission.id}`);

      assertEqual(mission.order, expectedMission.order, `${mission.id}.order`);
      assertEqual(mission.title, expectedMission.title, `${mission.id}.title`);
      assertEqual(mission.estimatedMinutes, expectedMission.estimatedMinutes, `${mission.id}.estimatedMinutes`);
      assertEqual(mission.rewardExp, expectedMission.rewardExp, `${mission.id}.rewardExp`);
      assertEqual(
        mission.activities.map((activity) => activity.id),
        expectedMission.activities.map((activity) => activity.id),
        `${mission.id}.activities`,
      );

      for (const expectedActivity of expectedMission.activities) {
        const activity = mission.activities.find((item) => item.id === expectedActivity.id);
        if (!activity) throw new Error(`Activity not found: ${expectedActivity.id}`);
        assertEqual(activity.order, expectedActivity.order, `${activity.id}.order`);
        assertEqual(activity.type, expectedActivity.type, `${activity.id}.type`);
        assertEqual(activity.title, expectedActivity.title, `${activity.id}.title`);
        assertEqual(activity.content, expectedActivity.content, `${activity.id}.content`);
      }
    }
  }

  const missionCount = courses.reduce((total, course) => total + course.missions.length, 0);
  const activityCount = courses.reduce(
    (total, course) => total + course.missions.reduce(
      (missionTotal, mission) => missionTotal + mission.activities.length,
      0,
    ),
    0,
  );
  console.log(`Seeded learning data verified: ${courses.length} courses, ${missionCount} missions, ${activityCount} activities.`);
  for (const course of courses) {
    const minutes = course.missions.reduce((total, mission) => total + mission.estimatedMinutes, 0);
    const exp = course.missions.reduce((total, mission) => total + mission.rewardExp, 0);
    console.log(`${course.title}: ${minutes} minutes, ${exp} EXP`);
  }
};

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
