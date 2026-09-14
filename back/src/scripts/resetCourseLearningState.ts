/** Course内容の改訂時に、対象Courseだけの学習状態を安全に初期化する。 */
import { ProgressStatus } from "@prisma/client";

import { prisma } from "../lib/prisma";

const courseIdArgument = process.argv.find((argument) => argument.startsWith("--course-id="));
const courseId = courseIdArgument?.slice("--course-id=".length).trim();
const confirmed = process.argv.includes("--confirm");

if (!courseId) {
  throw new Error("--course-id=<exact course id> is required");
}

const main = async () => {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: {
      id: true,
      title: true,
      missions: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          activities: {
            orderBy: { order: "asc" },
            select: { id: true },
          },
        },
      },
    },
  });

  if (!course) throw new Error(`Course not found: ${courseId}`);

  const missionIds = course.missions.map((mission) => mission.id);
  const activityIds = course.missions.flatMap((mission) => mission.activities.map((activity) => activity.id));
  const [missionProgresses, activityProgresses, answerLogs, examAttempts] = await Promise.all([
    prisma.userMissionProgress.count({ where: { missionId: { in: missionIds } } }),
    prisma.userMissionActivityProgress.count({ where: { activityId: { in: activityIds } } }),
    prisma.activityAnswerLog.count({ where: { activityId: { in: activityIds } } }),
    prisma.courseExamAttempt.count({ where: { missionId: { in: missionIds } } }),
  ]);

  console.log(JSON.stringify({
    course: { id: course.id, title: course.title },
    targets: { missionProgresses, activityProgresses, answerLogs, examAttempts },
    mode: confirmed ? "reset" : "dry-run",
  }, null, 2));

  if (!confirmed) {
    console.log("No data changed. Add --confirm after verifying the exact Course and counts.");
    return;
  }

  await prisma.$transaction(async (transaction) => {
    await transaction.courseExamAttempt.deleteMany({ where: { missionId: { in: missionIds } } });
    await transaction.activityAnswerLog.deleteMany({ where: { activityId: { in: activityIds } } });
    await transaction.userMissionActivityProgress.deleteMany({ where: { activityId: { in: activityIds } } });

    for (const mission of course.missions) {
      await transaction.userMissionProgress.updateMany({
        where: { missionId: mission.id },
        data: {
          status: ProgressStatus.IN_PROGRESS,
          currentActivityId: mission.activities[0]?.id ?? null,
          selectedExamDifficulty: null,
          highestClearedExamDifficulty: null,
          examAttemptCount: 0,
          examHintCount: 0,
          startedAt: null,
          completedAt: null,
        },
      });
    }
  });

  console.log(`Reset learning state for ${course.title} (${course.id}). Reward balances and awardedExp were preserved.`);
};

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
