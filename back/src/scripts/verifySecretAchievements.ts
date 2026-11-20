import assert from "node:assert/strict";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { achievementSeed } from "../../prisma/seedData/achievementSeed";
import { evaluateAchievementsForUser, getAchievementsByUser, updateTargetAchievementByUserId } from "../service/achievement.service";
import { getCollectionByUser } from "../service/collection.service";
import { personalBestImprovements, reviewCorrectStreak } from "../service/secretAchievementProgress";
import * as grants from "../service/knowledgeCardGrant.service";
const owner = "secret-owner", now = new Date("2026-11-20T03:00:00Z");
const definitions = achievementSeed.filter(a => a.isSecret);
const held = new Set<string>();
const reactions: { userId: string; post: { userId: string }; type: string }[] = [];
const reviews: { userId: string; reviewDate: Date; answeredAt: Date | null; correct: boolean | null }[] = [];
const cards: { userId: string; rarity: string }[] = [];
const submissions: { userId: string; questId: string; score: number; submittedAt: Date }[] = [];
const learning = [{ courseId: "course", phaseKey: "phase", status: "COMPLETED", completedAt: now, summary: { assessmentEvidence: { frozen: true } } }];
const beforeLearning = structuredClone(learning);
const readOnly = (model: string, methods: Record<string, unknown>) => new Proxy(methods, { get: (target, key: string) => { if (!(key in target)) throw new Error(`Forbidden ${model}.${key}`); return target[key]; } });
const db = prisma as unknown as Record<string, unknown>;
db.user = readOnly("user", { findUnique: async () => ({ id: owner }) });
db.achievement = readOnly("achievement", {
  findMany: async () => definitions.map(a => ({ ...a, userAchievements: held.has(String(a.id)) ? [{ achievedAt: now }] : [] })),
  findUnique: async () => ({ isSecret: true }),
});
db.userAchievement = { findMany: async ({ where }: Prisma.UserAchievementFindManyArgs) => { assert.equal(where?.userId, owner); return [...held].map(achievementId => ({ achievementId })); },
  upsert: async ({ create }: { create: { userId: string; achievementId: string } }) => { assert.equal(create.userId, owner); held.add(create.achievementId); return { achievement: definitions.find(a => a.id === create.achievementId)!, achievedAt: now }; } };
db.questReaction = readOnly("questReaction", { count: async ({ where }: Prisma.QuestReactionCountArgs) => {
  assert.deepEqual(where, { post: { userId: owner }, type: "SAVED_ME", userId: { not: owner } });
  return reactions.filter(row => row.post.userId === owner && row.userId !== owner && row.type === "SAVED_ME").length;
} });
db.dailyReview = readOnly("dailyReview", { findMany: async ({ where }: Prisma.DailyReviewFindManyArgs) => {
  assert.deepEqual(where, { userId: owner, answeredAt: { not: null } }); return reviews.filter(row => row.userId === owner && row.answeredAt !== null);
} });
db.userKnowledgeCard = readOnly("userKnowledgeCard", { count: async ({ where }: Prisma.UserKnowledgeCardCountArgs) => { assert.deepEqual(where, { userId: owner, knowledgeCard: { rarity: "EPIC" } }); return cards.filter(row => row.userId === owner && row.rarity === "EPIC").length; },
  findMany: async () => cards.filter(row => row.userId === owner).map(() => ({ knowledgeCard: { courseId: "course" } })),
});
db.knowledgeCard = readOnly("knowledgeCard", { findMany: async () => [] });
db.createQuestSubmission = readOnly("createQuestSubmission", { findMany: async ({ where, select }: Prisma.CreateQuestSubmissionFindManyArgs) => {
  assert.deepEqual(where, { attempt: { userId: owner } });
  return submissions.filter(row => row.userId === owner).map(row => select?.attempt ? { ...row, attempt: { questId: row.questId } } : { results: [], submittedAt: row.submittedAt });
} });
db.createQuestAttempt = readOnly("createQuestAttempt", { findMany: async () => [] });
db.unitLearningProgress = readOnly("unitLearningProgress", { findMany: async () => [] });
db.phaseLearningProgress = readOnly("phaseLearningProgress", { findMany: async () => learning });
db.learningEvent = readOnly("learningEvent", {});
(grants as { restoreCompletedPhaseCards: unknown }).restoreCompletedPhaseCards = async () => 0;
const user = { id: owner, selectedTargetAchievementId: null, selectedProfileAchievementId: null };
const evaluate = () => evaluateAchievementsForUser(owner);
const review = (date: string, correct: boolean | null, userId = owner) => ({ userId, reviewDate: new Date(date + "T00:00:00Z"), answeredAt: correct === null ? null : now, correct });
const submit = (questId: string, score: number, second: number, userId = owner) => ({ userId, questId, score, submittedAt: new Date(now.getTime() + second * 1000) });
async function main() {
  assert.equal(definitions.length, 4);
  assert.deepEqual(await evaluate(), []);
  assert.deepEqual((await getAchievementsByUser(user)).groups, []);
  assert.equal((await getCollectionByUser(user)).achievements.totalCount, 0, "未解除は存在と件数も非開示");
  await assert.rejects(() => updateTargetAchievementByUserId(owner, String(definitions[0].id)), { code: "INVALID_TARGET_ACHIEVEMENT" });
  reactions.push({ userId: owner, post: { userId: "other" }, type: "SAVED_ME" }, { userId: "other", post: { userId: owner }, type: "LIKE" }, { userId: "other", post: { userId: owner }, type: "HELPFUL" }, { userId: owner, post: { userId: owner }, type: "SAVED_ME" });
  assert.deepEqual(await evaluate(), []);
  reactions.push({ userId: "other", post: { userId: owner }, type: "SAVED_ME" });
  assert.deepEqual((await evaluate()).map(a => a.id), ["ach-secret-first-saved-me"]);
  cards.push({ userId: "other", rarity: "EPIC" }, { userId: owner, rarity: "RARE" }); assert.deepEqual(await evaluate(), []);
  cards.push({ userId: owner, rarity: "EPIC" }); assert.deepEqual((await evaluate()).map(a => a.id), ["ach-secret-first-epic-card"]);
  reviews.push(review("2026-11-15", true), review("2026-11-17", true), review("2026-11-18", false), review("2026-11-19", null), review("2026-11-20", true, "other"));
  assert.deepEqual(await evaluate(), []);
  reviews.push(review("2026-11-19", true), review("2026-11-20", true)); assert.deepEqual(await evaluate(), []);
  reviews.push(review("2026-11-21", true)); assert.deepEqual((await evaluate()).map(a => a.id), ["ach-secret-review-three-correct"]);
  submissions.push(submit("q1", 80, 1), submit("q1", 60, 2), submit("q1", 80, 3), submit("q2", 100, 4), submit("q1", 100, 5, "other")); assert.deepEqual(await evaluate(), []);
  submissions.push(submit("q1", 90, 6)); assert.deepEqual((await evaluate()).map(a => a.id), ["ach-secret-personal-best"]);
  reactions.length = 0; cards.length = 0; reviews.push(review("2026-11-22", false)); submissions.push(submit("q1", 50, 7));
  assert.deepEqual(await evaluate(), [], "解除後も保持し、重複付与しない"); assert.equal(held.size, 4);
  const achievements = (await getAchievementsByUser(user)).groups.flatMap(group => group.achievements);
  assert.equal(achievements.length, 4); assert.ok(achievements.every(a => a.status === "achieved" && a.conditionLabel && a.title !== "???"));
  const collection = await getCollectionByUser(user); assert.equal(collection.achievements.totalCount, 4); assert.ok(collection.achievements.items.every(a => a.status === "achieved"));
  assert.deepEqual(learning, beforeLearning, "復習実績の評価は学習進捗・評価証拠を書き換えない");
  assert.equal(reviewCorrectStreak([review("2027-12-31", true), review("2028-01-01", true), review("2028-01-02", true)]), 3);
  assert.equal(reviewCorrectStreak([review("2028-02-28", true), review("2028-02-29", true), review("2028-03-01", true)]), 3);
  assert.equal(reviewCorrectStreak([review("2026-01-01", true), review("2026-01-03", true)]), 1);
  const proof = (rows: ReturnType<typeof submit>[]) => personalBestImprovements(rows.map(row => ({ ...row, attempt: { questId: row.questId } })));
  assert.equal(proof([submit("q", 0, 1), submit("q", 10, 2)]), 1);
  assert.equal(proof([submit("q", 80, 1), submit("q", 90, 1)]), 0, "同時刻の初回群だけでは前後を推測しない");
  assert.equal(proof([submit("q", 90, 1), submit("q", 80, 2), submit("q", 85, 3)]), 0);
  console.log("PASS: four secret achievements, owner-only received SAVED_ME (not self/other/LIKE/HELPFUL), answered review-date streak with gaps/wrong/year/leap boundaries, owned epic card, per-quest historical best, first/tie/lower/same-time exclusion, retained awards, hidden rows/counts, Japanese labels and no learning/evidence writes.");
}
main().catch(error => { console.error(error); process.exitCode = 1; });
