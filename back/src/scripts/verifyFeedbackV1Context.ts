// Context/eligibility contract test. All database access is replaced with fixtures.
import assert from "node:assert/strict";
import { prisma } from "../lib/prisma";
import * as courses from "../service/course.service";
import * as achievements from "../service/achievement.service";
import { buildFeedbackV1Context } from "../service/feedbackV1.context";
import { analysisPrompt, selectionPrompt, validateSelection, type Analysis, type Selection } from "../service/feedbackV1.engine";

async function main() {
  const db = prisma as unknown as Record<string, Record<string, unknown>>;
  let condition = "STANDARD";
  let hasAssignment = true;
  let hasHexad = true;
  db.user.findUnique = async () => ({ id: "learner", experience: 0, selectedTargetAchievementId: "target-current", experimentAssignments: hasAssignment ? [{ condition, assignedAt: new Date(0) }] : [], hexadResponse: hasHexad ? { questionnaireVersion: "hexad-24-ja-v1", philanthropistScore: 20, socialiserScore: 8, freeSpiritScore: 24, achieverScore: 28, disruptorScore: 8, playerScore: 16 } : null });
  db.missionRewardRun.findFirst = async () => ({ missionId: "normal-1", mission: { courseId: "course-1" } });
  db.mission.findMany = async () => [{ id: "normal-1", title: "Mission", description: "概念", learnedItems: ["到達目標"], activities: [{ id: "activity-1", title: "問題", instruction: "答える", content: { body: "定義と基準" } }] }];
  db.activityAnswerLog.findMany = async () => Array.from({ length: 101 }, (_, i) => ({ id: `answer-${i}`, activityId: "activity-1", answer: { code: `raw-${i}` }, isCorrect: i === 100 }));
  db.courseExamAttempt.findMany = async () => [{ id: "exam-attempt", missionId: "exam-1", testExecutions: [{ id: "test-1", code: "code", executedAt: new Date(), testResults: [], runtimeError: null }], hintViews: [{ id: "hint-1", viewedAt: new Date(), hintId: "hint" }], submissions: [{ id: "submit-1", submittedAt: new Date(), passed: true }] }];
  db.course.findMany = async () => [{ id: "new" }, { id: "ongoing" }, { id: "done" }];
  (courses as { getCourseRoadmapByUserId: unknown }).getCourseRoadmapByUserId = async (_: string, id: string) => ({ id, status: id === "new" ? "not_started" : id === "done" ? "completed" : "in_progress", missions: [{ id: `${id}-normal`, type: "main", status: id === "done" ? "completed" : "not_started", isLocked: false }, { id: `${id}-exam`, type: "course_exam", status: "not_started", isLocked: false }, { id: `${id}-locked`, type: "main", status: "not_started", isLocked: true }] });
  db.createQuest.findMany = async () => [
    { id: "quest-new", title: "新課題", attempts: [], requirements: [], relatedCourses: [] },
    { id: "quest-started", title: "途中課題", attempts: [{ status: "IN_PROGRESS", bestScore: 20, code: "PRIVATE_OTHER_QUEST_CODE" }], requirements: [], relatedCourses: [] },
    { id: "quest-done", title: "提出済み", attempts: [{ status: "COMPLETED", bestScore: 100, code: "PRIVATE_OTHER_QUEST_CODE" }], requirements: [], relatedCourses: [] },
  ];
  db.knowledgeCard.findMany = async () => [{ id: "card-owned", title: "カード", description: "説明", connection: "関連", useCase: "用途" }];
  db.achievement.findMany = async () => [{ id: "achievement-owned", isSecret: true, userAchievements: [{ id: "acquired" }] }, { id: "target-current", isSecret: false, userAchievements: [] }, { id: "target-next", isSecret: false, userAchievements: [] }];
  (achievements as { getAchievementsByUser: unknown }).getAchievementsByUser = async () => ({ groups: [] });
  db.questPost.findMany = async () => Array.from({ length: 101 }, (_, i) => ({ id: `post-${i}`, category: "QUESTION", title: "投稿", body: `body-${i}`, userId: i === 0 ? "learner" : "other", comments: [{ id: `reply-${i}`, body: `reply-body-${i}`, userId: "other" }] }));
  db.feedbackV1.findMany = async () => [{ id: "past", status: "COMPLETED", result: { selection: { actionId: 15, targetId: "profile", purpose: "確認", reason: "学習の進展", personalizationAdjustment: { scores: "MUST_NOT_LEAK" } } }, interactions: [{ type: "PRESENTED", data: {} }] }];
  db.courseExamFeedback.findMany = async () => [];
  db.createQuestFeedback.findMany = async () => [];
  const standard = await buildFeedbackV1Context("uid", "mission", "reward-1");
  assert.equal(standard.input.actions.length, 22);
  assert(!JSON.stringify(standard.input).includes("PRIVATE_OTHER_QUEST_CODE"));
  assert(!JSON.stringify(standard.input).includes("MUST_NOT_LEAK"));
  assert(JSON.stringify(standard.input.learning).includes("raw-100"));
  assert(JSON.stringify(standard.input.state).includes("reply-body-100"));
  assert(!standard.input.actions.find(a => a.id === 22)!.targetIds.includes("post-0"));
  assert.deepEqual(standard.input.actions.find(a => a.id === 14)!.targetIds, ["target-next"]);
  assert(!Object.values(standard.input.targets).flat().some(t => t.id.endsWith("-locked")));
  const output: Selection = { nextGoal: "理解する", nextStep: "復習", actionLabel: "開く", actionId: 4, targetId: "new-locked", purpose: "確認", reason: "理解の確認", personalizationAdjustment: null };
  assert.throws(() => validateSelection(standard.input, output), /TARGET_NOT_AVAILABLE/);
  condition = "PERSONALIZED";
  const personalized = await buildFeedbackV1Context("uid", "mission", "reward-1");
  assert.equal(analysisPrompt(standard.input), analysisPrompt(personalized.input));
  const { hexad, ...common } = personalized.input;
  const { hexad: ignored, ...standardCommon } = standard.input;
  assert.equal(ignored, null);
  assert.deepEqual(common, standardCommon);
  assert.equal(hexad!.scores.Achiever, 28);
  const a: Analysis = { currentState: "状態", understood: [], needsImprovement: [], uncertain: [], evidence: [{ sourceId: "answer-100", fact: "正答", inference: false }] };
  assert(!selectionPrompt(standard.input, a).includes("raw-100"));
  assert(selectionPrompt(standard.input, a).includes("reply-body-100"));
  hasHexad = false;
  await assert.rejects(buildFeedbackV1Context("uid", "mission", "reward-1"), /HEXAD required/);
  hasAssignment = false;
  await assert.rejects(buildFeedbackV1Context("uid", "mission", "reward-1"), /Experiment assignment required/);
  console.log("PASS: all 22 action types, locked/self/current-target exclusions, full 101-answer and 101-post/reply inputs, shared context, HEXAD isolation and missing-profile guards (fixtures)");
}
void main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
