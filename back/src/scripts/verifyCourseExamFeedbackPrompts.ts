import { FeedbackCondition } from "@prisma/client";

import {
  buildCommonCourseExamFeedbackPrompt,
  buildCourseExamFeedbackPrompt,
} from "../service/courseExamFeedback.prompt";

const commonInput = {
  learningLog: { attemptId: "verification-attempt", submissions: [] },
  appState: { experience: 10 },
  availableActions: [{ actionType: "VIEW_PROFILE" }],
};
const common = buildCommonCourseExamFeedbackPrompt(commonInput);
const standard = buildCourseExamFeedbackPrompt({
  ...commonInput,
  condition: FeedbackCondition.STANDARD,
  hexadProfile: null,
});
const personalized = buildCourseExamFeedbackPrompt({
  ...commonInput,
  condition: FeedbackCondition.PERSONALIZED,
  hexadProfile: {
    Philanthropist: 20,
    Socialiser: 18,
    "Free Spirit": 22,
    Achiever: 24,
    Disruptor: 12,
    Player: 17,
  },
});
const forbiddenInStandard = [
  "HEXAD",
  "Philanthropist",
  "Socializer",
  "Socialiser",
  "Free Spirit",
  "Achiever",
  "Disruptor",
  "Player",
  "STANDARD",
  "PERSONALIZED",
];
const leaks = forbiddenInStandard.filter((term) => standard.includes(term));

if (standard !== common) throw new Error("STANDARD differs from common prompt");
if (!personalized.startsWith(`${common}\n\n`)) {
  throw new Error("PERSONALIZED does not preserve the exact common prefix");
}
if (leaks.length > 0) {
  throw new Error(`STANDARD contains prohibited terms: ${leaks.join(", ")}`);
}

console.info({
  standardEqualsCommon: true,
  personalizedSharesExactCommonPrefix: true,
  standardForbiddenTermLeaks: leaks,
  standardLength: standard.length,
  personalizedLength: personalized.length,
});
