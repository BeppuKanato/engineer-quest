/** DBへ書き込まず、ID・order・時間・EXP・renderer dataを静的検証するseed検証入口。 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { MissionType } from "@prisma/client";

import { learningSeed } from "../../prisma/seedData/learningSeed";
import {
  estimateMissionMinutes,
  expectedMissionRewardExp,
} from "../../prisma/seedData/learningSeedPolicy";
import { parseActivityContent } from "../learning/activity-content/activityContentSchema";
import { getActivityRendererDefinition } from "../learning/activity-content/activityRendererRegistry";

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
const publishedPlaceholderMissionIds: string[] = [];

const legacyCourseIdsWithoutDesignDocument = new Set([
  "course-algorithm-bubble-sort-v2",
  "course-algorithm-binary-search-v1",
]);

const designDocumentPath = (courseId: string) => {
  const candidates = [
    resolve(process.cwd(), "docs", "course-designs", `${courseId}.md`),
    resolve(process.cwd(), "..", "docs", "course-designs", `${courseId}.md`),
  ];
  return candidates.find(existsSync);
};

const requiredDesignDocumentSections = [
  "## 想定する学習者",
  "## 与える体験と学習価値",
  "## 前提知識",
  "## 概念の依存順序",
  "## 用語の導入順",
  "## 想定する誤解とフィードバック",
  "## このコースで扱わないこと",
  "## 成功条件",
  "## スターターコード",
  "## 正解コード",
  "## 生成テスト",
];

const learnerFacingMetaPatterns = [
  /画面を直接開いても/,
  /前(?:の|Activity|アクティビティ|画面).*覚えて/,
  /ガイドライン/,
  /自由入力.*(?:最後|まだ|Course Mission)/,
  /このMissionでは新しい/,
  /この画面内に.*再掲/,
  /独立した転移課題/,
  /回答前.*表示しません/,
  /すべて再掲済み/,
];

const collectStrings = (value: unknown): string[] => {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(collectStrings);
  if (value && typeof value === "object") return Object.values(value).flatMap(collectStrings);
  return [];
};

for (const course of learningSeed.courses) {
  if (ids.has(course.id)) throw new Error(`Duplicate seed id: ${course.id}`);
  ids.add(course.id);
  assertSequentialOrders(`${course.id} missions`, course.missions);
  const courseMissions = course.missions.filter((mission) => mission.type === MissionType.COURSE_EXAM);
  if (courseMissions.length !== 1 || course.missions.at(-1)?.type !== MissionType.COURSE_EXAM) {
    throw new Error(`${course.id} must end with exactly one Course Mission`);
  }
  const lastBasicMission = [...course.missions].reverse().find((mission) => mission.type !== MissionType.COURSE_EXAM);
  const requiresCurrentGuidelineChecks = !legacyCourseIdsWithoutDesignDocument.has(course.id);
  if (requiresCurrentGuidelineChecks) {
    const documentPath = designDocumentPath(course.id);
    if (!documentPath) {
      throw new Error(`${course.id}: docs/course-designs/${course.id}.md is required`);
    }
    const document = readFileSync(documentPath, "utf8");
    for (const section of requiredDesignDocumentSections) {
      if (!document.includes(section)) {
        throw new Error(`${course.id}: course design document is missing ${section}`);
      }
    }
  }

  for (const mission of course.missions) {
    missionCount += 1;
    if (ids.has(mission.id)) throw new Error(`Duplicate seed id: ${mission.id}`);
    ids.add(mission.id);
    if (mission.isPublished && mission.goalImg.includes("placehold.co")) {
      publishedPlaceholderMissionIds.push(mission.id);
    }
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
      const content = parseActivityContent(activity.content, activity.type);
      const renderer = getActivityRendererDefinition(content.rendererKey);

      if (requiresCurrentGuidelineChecks) {
        if (/KMP|BUBBLE|BINARY|MISSION[_-]?\d/i.test(content.rendererKey)) {
          throw new Error(`${activity.id}: rendererKey must describe a reusable role, not a course or Mission`);
        }
        const learnerText = collectStrings({
          title: activity.title,
          instruction: activity.instruction,
          mentorMessage: activity.mentorMessage,
          data: content.data,
        }).join("\n");
        const forbiddenMeta = learnerFacingMetaPatterns.find((pattern) => pattern.test(learnerText));
        if (forbiddenMeta) {
          throw new Error(`${activity.id}: learner-facing text contains implementation meta wording (${forbiddenMeta})`);
        }

        const sequenceQuestions = Array.isArray(content.data.sequenceQuestions)
          ? content.data.sequenceQuestions as Array<Record<string, unknown>>
          : [];
        sequenceQuestions.forEach((question, questionIndex) => {
          const options = Array.isArray(question.options) ? question.options : [];
          if (options.length < 3) {
            throw new Error(`${activity.id}: sequential question ${questionIndex + 1} requires at least 3 options`);
          }
        });

        const feedbackText = collectStrings({
          correctFeedback: content.data.correctFeedback,
          incorrectFeedback: content.data.incorrectFeedback,
          questionFeedback: sequenceQuestions.map((question) => ({
            correctFeedback: question.correctFeedback,
            incorrectFeedback: question.incorrectFeedback,
          })),
        }).filter(Boolean);
        const promptText = collectStrings({
          body: content.data.body,
          question: content.data.question,
          questions: sequenceQuestions.map((question) => question.question),
          visualizationStates: content.data.visualizationStates,
        }).join("\n");
        feedbackText.forEach((feedback) => {
          if (feedback.length >= 8 && promptText.includes(feedback)) {
            throw new Error(`${activity.id}: feedback text must not be displayed on the prompt surface`);
          }
        });
      }

      if (
        (content.learningRole === "ORIENTATION" || content.learningRole === "EXPLANATION") &&
        renderer.answer !== "NONE"
      ) {
        throw new Error(`${activity.id}: explanation activities must not contain graded answers`);
      }
      if (renderer.answer !== "NONE" && content.feedbackPolicy.mode !== "RETRY_WITH_HINT") {
        throw new Error(`${activity.id}: graded activities must use retry feedback`);
      }
      if (content.rendererKey === "CODE_EDITOR" && mission.type !== MissionType.COURSE_EXAM) {
        throw new Error(`${activity.id}: free-input editor is only allowed in Course Mission`);
      }
      if (lastBasicMission?.id === mission.id && content.rendererKey === "CODE_EDITOR") {
        throw new Error(`${activity.id}: the last basic Mission must integrate code without free input`);
      }
      if ("activityType" in content.data || "activityPattern" in content.data) {
        throw new Error(`${activity.id}: legacy ActivityContent keys are not allowed`);
      }
      if (mission.type === MissionType.COURSE_EXAM) {
        if (content.learningRole !== "COURSE_EXAM" || content.rendererKey !== "CODE_EDITOR") {
          throw new Error(`${activity.id}: Course Mission must use COURSE_EXAM and CODE_EDITOR`);
        }
        const tests = Array.isArray(content.data.testCases) ? content.data.testCases : [];
        const hints = Array.isArray(content.data.hints) ? content.data.hints : [];
        if (tests.length === 0 || hints.length === 0 || typeof content.data.functionName !== "string") {
          throw new Error(`${activity.id}: Course Mission requires functionName, tests, and hints`);
        }
        if (tests.length < 5 || tests.length > 7) {
          throw new Error(`${activity.id}: Course Mission requires 5-7 tests, got ${tests.length}`);
        }
        if (requiresCurrentGuidelineChecks) {
          const forbiddenCode = Array.isArray(content.data.forbiddenCode) ? content.data.forbiddenCode : [];
          if (forbiddenCode.length === 0) {
            throw new Error(`${activity.id}: Course Mission must declare forbiddenCode for completed shortcuts`);
          }
          if (typeof content.data.answerCode !== "string" || content.data.answerCode.trim() === "") {
            throw new Error(`${activity.id}: Course Mission must include answerCode for generated-test verification`);
          }
        }
      }
    }
  }
}

if (publishedPlaceholderMissionIds.length > 0) {
  console.warn(
    `Published Mission placeholder images: ${publishedPlaceholderMissionIds.length} (${publishedPlaceholderMissionIds.join(", ")})`,
  );
}

console.log(
  `Learning seed is valid: ${learningSeed.courses.length} courses, ${missionCount} missions, ${activityCount} activities.`,
);
