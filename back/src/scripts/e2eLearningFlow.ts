import { MissionType } from "@prisma/client";

import { learningSeed } from "../../prisma/seedData/learningSeed";
import type { ActivitySeed } from "../../prisma/seedData/learningSeedTypes";
import { prisma } from "../lib/prisma";
import { getActivityRendererDefinition } from "../type/activityRendererRegistry";

const baseUrl = process.env.E2E_BASE_URL ?? "http://localhost:8080/api";
const firebaseUid = "e2e-learning-flow-user";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const asRecord = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const api = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      "x-dev-firebase-uid": firebaseUid,
      ...init?.headers,
    },
  });
  const body = (await response.json()) as unknown;
  if (!response.ok) {
    throw new Error(`${init?.method ?? "GET"} ${path} -> ${response.status}: ${JSON.stringify(body)}`);
  }
  return body as T;
};

const getCorrectAnswer = (activity: ActivitySeed) => {
  const { answer } = getActivityRendererDefinition(activity.content.rendererKey);
  const data = activity.content.data;

  switch (answer) {
    case "NONE":
      return undefined;
    case "SINGLE_CHOICE": {
      const choice = (Array.isArray(data.choices) ? data.choices : []).find(
        (item) => asRecord(item).isCorrect === true,
      );
      const id = asRecord(choice).id;
      assert(typeof id === "string", `${activity.id}: correct choice not found`);
      return { selectedChoiceId: id };
    }
    case "ARRAY_REGION_SELECT":
      return {
        selectedRegions: Object.fromEntries(
          (Array.isArray(data.rangeDecisionQuestions) ? data.rangeDecisionQuestions : []).map(
            (item) => [asRecord(item).id, asRecord(item).correctRegion],
          ),
        ),
      };
    case "INDEX_SELECT":
      return {
        selectedIndices: Object.fromEntries(
          (Array.isArray(data.indexSelectionQuestions) ? data.indexSelectionQuestions : []).map(
            (item) => [asRecord(item).id, asRecord(item).correctIndex],
          ),
        ),
      };
    case "MATCH":
      return {
        matchPairs: Object.fromEntries(
          (Array.isArray(data.answers) ? data.answers : []).map((item) => [
            asRecord(item).targetId,
            asRecord(item).itemIds,
          ]),
        ),
      };
    case "BLOCK_ORDER":
      return { orderedIds: data.answerOrder };
    case "PAIR_DECISION":
    case "MULTI_DECISION":
    case "CODE_BLOCK_BUILDER":
    case "COMPARISON_SEQUENCE":
      return { values: data.correctAnswers };
    case "OPTION_FILL":
      return data.correctAnswers;
    case "CODE_EDITOR": {
      const testCases = Array.isArray(data.testCases) ? data.testCases : [];
      const code =
        typeof data.answerCode === "string"
          ? data.answerCode
          : typeof data.starterCode === "string"
            ? data.starterCode
            : "# e2e";
      const testResults = testCases.map((item) => ({
        testCaseId: String(asRecord(item).id),
        passed: true,
        expectedOutput: asRecord(item).expected,
        actualOutput: asRecord(item).expected,
      }));
      return {
        code,
        executionPassed: true,
        passedTestCount: testCases.length,
        totalTestCount: testCases.length,
        testResults,
      };
    }
  }
};

const getIntentionalWrongAnswer = (activity: ActivitySeed) => {
  if (activity.id === "binary-search-compare-middle-practice") {
    return {
      selectedRegions: Object.fromEntries(
        (activity.content.data.rangeDecisionQuestions as unknown[]).map((item) => [
          asRecord(item).id,
          "left",
        ]),
      ),
    };
  }
  if (activity.id === "algorithm-v2-bubble-sort-basic-decisions-v2") {
    return {
      values: Object.fromEntries(
        (activity.content.data.decisionPairs as unknown[]).map((item) => [
          asRecord(item).id,
          "keep",
        ]),
      ),
    };
  }
  return undefined;
};

const main = async () => {
  await prisma.user.deleteMany({ where: { firebaseUid } });
  const user = await prisma.user.create({
    data: { firebaseUid, displayName: "Learning E2E" },
  });

  const retriedActivityIds: string[] = [];
  let answeredActivityCount = 0;
  let completedActivityCount = 0;
  let completedMissionCount = 0;

  try {
    const initialCourses = await api<Array<{ id: string; progressRate: number }>>("/courses");
    assert(initialCourses.length === learningSeed.courses.length, "course list count mismatch");
    assert(initialCourses.every((course) => course.progressRate === 0), "fresh user course progress must be 0%");

    for (const course of learningSeed.courses) {
      const initialRoadmap = await api<{ missions: Array<{ id: string; isLocked: boolean }> }>(
        `/courses/${course.id}`,
      );
      assert(initialRoadmap.missions.length === course.missions.length, `${course.title}: roadmap mission count mismatch`);
      assert(initialRoadmap.missions[0]?.isLocked === false, `${course.title}: first mission must be unlocked`);

      for (let missionIndex = 0; missionIndex < course.missions.length; missionIndex += 1) {
        const mission = course.missions[missionIndex];
        let attemptId: string | null = null;

        if (mission.type === MissionType.COURSE_EXAM) {
          const attempt = await api<{ id: string }>(
            `/missions/${mission.id}/course-exam/attempt`,
            { method: "POST" },
          );
          attemptId = attempt.id;
        }

        const play = await api<{
          activities: Array<{ id: string }>;
          progress: { status: string; completedActivityIds: string[] };
        }>(`/missions/${mission.id}/play`);
        assert(play.activities.length === mission.activities.length, `${mission.id}: play activity count mismatch`);

        for (const activity of mission.activities) {
          const answer = getCorrectAnswer(activity);
          if (answer !== undefined) {
            const wrongAnswer = getIntentionalWrongAnswer(activity);
            if (wrongAnswer !== undefined) {
              const wrongResult = await api<{ isCorrect: boolean; incorrectAttemptCount: number }>(
                `/missions/${mission.id}/activities/${activity.id}/answer`,
                { method: "POST", body: JSON.stringify({ answer: wrongAnswer }) },
              );
              assert(wrongResult.isCorrect === false, `${activity.id}: intentional wrong answer was accepted`);
              assert(wrongResult.incorrectAttemptCount === 1, `${activity.id}: incorrect attempt count mismatch`);
              retriedActivityIds.push(activity.id);
            }

            if (mission.type === MissionType.COURSE_EXAM) {
              assert(attemptId !== null, `${mission.id}: course exam attempt was not started`);
              const answerRecord = asRecord(answer);
              await api(
                `/missions/${mission.id}/course-exam/attempts/${attemptId}/test-executions`,
                {
                  method: "POST",
                  body: JSON.stringify({
                    code: answerRecord.code,
                    testResults: answerRecord.testResults,
                    runtimeError: null,
                  }),
                },
              );
            }

            const result = await api<{ isCorrect: boolean }>(
              `/missions/${mission.id}/activities/${activity.id}/answer`,
              { method: "POST", body: JSON.stringify({ answer }) },
            );
            assert(result.isCorrect === true, `${activity.id}: correct answer was rejected`);
            answeredActivityCount += 1;
          }

          await api(`/missions/${mission.id}/activities/${activity.id}/complete`, { method: "POST" });
          completedActivityCount += 1;
        }

        const completion = await api<{
          mission: { id: string; rewardExp: number };
          experienceUpdate: { gainedExp: number };
        }>(`/missions/${mission.id}/complete`, { method: "POST" });
        assert(completion.mission.id === mission.id, `${mission.id}: completion response mismatch`);
        assert(completion.experienceUpdate.gainedExp === mission.rewardExp, `${mission.id}: EXP reward mismatch`);
        completedMissionCount += 1;

        if (mission.type !== MissionType.COURSE_EXAM) {
          const persistedPlay = await api<{ progress: { status: string; completedActivityIds: string[] } }>(
            `/missions/${mission.id}/play`,
          );
          assert(persistedPlay.progress.status === "completed", `${mission.id}: completed progress did not persist`);
          assert(
            persistedPlay.progress.completedActivityIds.length === mission.activities.length,
            `${mission.id}: completed activity progress did not persist`,
          );
        }

        const roadmap = await api<{ missions: Array<{ id: string; isLocked: boolean; status: string }> }>(
          `/courses/${course.id}`,
        );
        const current = roadmap.missions.find((item) => item.id === mission.id);
        assert(current?.status === "completed", `${mission.id}: roadmap status did not update`);
        const nextMission = course.missions[missionIndex + 1];
        if (nextMission) {
          const next = roadmap.missions.find((item) => item.id === nextMission.id);
          assert(next?.isLocked === false, `${nextMission.id}: next mission was not unlocked`);
        }
        console.log(`Passed ${course.title} / ${mission.title}`);
      }
    }

    const finalCourses = await api<Array<{ id: string; progressRate: number; status: string }>>("/courses");
    assert(finalCourses.every((course) => course.progressRate === 100), "completed course progress must be 100%");
    assert(finalCourses.every((course) => course.status === "completed"), "completed course status mismatch");

    const expectedExp = learningSeed.courses.flatMap((course) => course.missions).reduce(
      (sum, mission) => sum + mission.rewardExp,
      0,
    );
    const storedUser = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: { experience: true },
    });
    assert(storedUser.experience === expectedExp, `user EXP mismatch: expected ${expectedExp}, got ${storedUser.experience}`);

    for (const activityId of retriedActivityIds) {
      const logs = await prisma.activityAnswerLog.findMany({
        where: { userId: user.id, activityId },
        orderBy: { answeredAt: "asc" },
        select: { isCorrect: true },
      });
      assert(
        logs.length === 2 && logs[0]?.isCorrect === false && logs[1]?.isCorrect === true,
        `${activityId}: retry answer logs were not saved in order`,
      );
    }

    console.log(
      `Learning HTTP E2E passed: ${learningSeed.courses.length} courses, ${completedMissionCount} missions, ${completedActivityCount} activities, ${answeredActivityCount} answered activities.`,
    );
    console.log(`Retry paths passed: ${retriedActivityIds.join(", ")}.`);
    console.log(`Course exam test-case submissions passed for both courses. Total EXP: ${storedUser.experience}.`);
  } finally {
    await prisma.user.deleteMany({ where: { firebaseUid } });
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
