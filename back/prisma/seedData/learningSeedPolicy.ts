import { MissionType } from "@prisma/client";

import { getActivityRendererDefinition } from "../../src/type/activityRendererRegistry";
import type { ActivitySeed, MissionSeed } from "./learningSeedTypes";

export const LEARNING_REWARD_POLICY = {
  basicExpPerMinute: 10,
  expRoundingUnit: 10,
  courseMissionMinutes: 15,
  courseMissionExp: 150,
} as const;

const countItems = (value: unknown) => Array.isArray(value) ? value.length : 0;

export const estimateActivityMinutes = (activity: ActivitySeed): number => {
  const { rendererKey, data } = activity.content;
  const answerRenderer = getActivityRendererDefinition(rendererKey).answer;

  if (answerRenderer === "CODE_EDITOR") return LEARNING_REWARD_POLICY.courseMissionMinutes;
  if (rendererKey === "TEXT") return 1;
  if (rendererKey === "LEARNING_ROADMAP" || rendererKey === "SORT_OVERVIEW") return 2;
  if (rendererKey === "ARRAY_TRACE") return 2;

  switch (answerRenderer) {
    case "PAIR_DECISION":
      return Math.max(2, Math.ceil(countItems(data.decisionPairs) * 0.75));
    case "ARRAY_REGION_SELECT":
      return Math.max(2, countItems(data.rangeDecisionQuestions));
    case "INDEX_SELECT":
      return Math.max(2, countItems(data.indexSelectionQuestions));
    case "COMPARISON_SEQUENCE":
      return Math.max(2, countItems(data.sequenceQuestions));
    case "MATCH":
    case "BLOCK_ORDER":
    case "CODE_BLOCK_BUILDER":
    case "MULTI_DECISION":
      return 3;
    case "SINGLE_CHOICE":
    case "OPTION_FILL":
      return 2;
    case "NONE":
      return 2;
    default:
      return 2;
  }
};

export const estimateMissionMinutes = (mission: MissionSeed): number =>
  mission.activities.reduce(
    (total, activity) => total + estimateActivityMinutes(activity),
    0,
  );

export const expectedMissionRewardExp = (mission: MissionSeed): number =>
  mission.type === MissionType.COURSE_EXAM
    ? LEARNING_REWARD_POLICY.courseMissionExp
    : Math.round(
        estimateMissionMinutes(mission) *
        LEARNING_REWARD_POLICY.basicExpPerMinute /
        LEARNING_REWARD_POLICY.expRoundingUnit,
      ) * LEARNING_REWARD_POLICY.expRoundingUnit;
