import assert from "node:assert/strict";
import { assertPreservingSeedOperation } from "../../prisma/preservingSeedPolicy";

for (const model of ["User", "HexadResponse", "ExperimentAssignment", "UserMissionProgress", "UserMissionActivityProgress", "ActivityAnswerLog", "CourseExamHintView", "CreateQuestHintView", "UserAchievement", "UserKnowledgeCard", "FeedbackV1"]) {
  for (const operation of ["create", "createMany", "update", "updateMany", "upsert", "delete", "deleteMany"]) {
    assert.throws(() => assertPreservingSeedOperation(model, operation), /Preserving seed blocked/);
  }
  assert.doesNotThrow(() => assertPreservingSeedOperation(model, "findMany"));
}
for (const model of ["Course", "Mission", "MissionActivity", "Achievement", "KnowledgeCard", "KnowledgeCardScheduleEntry", "CreateQuest", "CreateQuestRequirement", "CreateQuestCourse"]) {
  assert.doesNotThrow(() => assertPreservingSeedOperation(model, "upsert"));
  assert.throws(() => assertPreservingSeedOperation(model, "deleteMany"));
  assert.throws(() => assertPreservingSeedOperation(model, "delete"));
}
console.log("PASS: preservation guard allows master upserts and rejects deletions and learner/assignment/log writes.");
