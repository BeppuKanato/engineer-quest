import { learningSeed } from "../../prisma/seedData/learningSeed";
import {
  estimateMissionMinutes,
  expectedMissionRewardExp,
} from "../../prisma/seedData/learningSeedPolicy";
import { parseActivityContent } from "../type/activityContent";

const assertSequentialOrders = (
  label: string,
  values: { order: number }[],
) => {
  values.forEach((value, index) => {
    const expected = index + 1;
    if (value.order !== expected) {
      throw new Error(`${label} order must be sequential: expected ${expected}, got ${value.order}`);
    }
  });
};

const ids = new Set<string>();
let missionCount = 0;
let activityCount = 0;

for (const course of learningSeed.courses) {
  if (ids.has(course.id)) throw new Error(`Duplicate seed id: ${course.id}`);
  ids.add(course.id);
  assertSequentialOrders(`${course.id} missions`, course.missions);

  for (const mission of course.missions) {
    missionCount += 1;
    if (ids.has(mission.id)) throw new Error(`Duplicate seed id: ${mission.id}`);
    ids.add(mission.id);
    assertSequentialOrders(`${mission.id} activities`, mission.activities);
    const expectedMinutes = estimateMissionMinutes(mission);
    if (mission.estimatedMinutes !== expectedMinutes) {
      throw new Error(`${mission.id} estimatedMinutes must be ${expectedMinutes}, got ${mission.estimatedMinutes}`);
    }
    const expectedRewardExp = expectedMissionRewardExp(mission);
    if (mission.rewardExp !== expectedRewardExp) {
      throw new Error(`${mission.id} rewardExp must be ${expectedRewardExp}, got ${mission.rewardExp}`);
    }

    for (const activity of mission.activities) {
      activityCount += 1;
      if (ids.has(activity.id)) throw new Error(`Duplicate seed id: ${activity.id}`);
      ids.add(activity.id);
      parseActivityContent(activity.content, activity.type);
    }
  }
}

console.log(
  `Learning seed is valid: ${learningSeed.courses.length} courses, ${missionCount} missions, ${activityCount} activities.`,
);
