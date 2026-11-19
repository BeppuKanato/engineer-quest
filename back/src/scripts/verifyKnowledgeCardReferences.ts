import assert from "node:assert/strict";
import { Prisma } from "@prisma/client";
import type { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { knowledgeCardSeed } from "../../prisma/seedData/knowledgeCardSeed";
import { getPublishedCardQuests, getQuestKnowledgeCards, getUnitCardKeywords } from "../service/knowledgeCardReference.service";
import { getCollectionByUser } from "../service/collection.service";
import { getQuestKnowledgeCardsController } from "../controller/collection.controller";
import * as grants from "../service/knowledgeCardGrant.service";

const questId = "create-quest-dungeon-route-v1", owner = "owner";
const ownedId = "knowledge-card-bfs-shortest-path";
const db = prisma as unknown as Record<string, unknown>;
const readOnly = (methods: Record<string, unknown>) => new Proxy(methods, { get: (target, operation: string) => {
  if (!(operation in target)) throw new Error(`Unexpected DB operation: ${operation}`);
  return target[operation];
} });
db.createQuest = readOnly({
  findFirst: async ({ where }: Prisma.CreateQuestFindFirstArgs) => {
    assert.equal(where?.isPublished, true); return where.id === questId ? { id: questId } : null;
  },
  findMany: async ({ where, select }: Prisma.CreateQuestFindManyArgs) => {
    assert.equal(where?.isPublished, true); assert.deepEqual(select, { id: true, title: true });
    const ids = (where.id as Prisma.StringFilter).in ?? [];
    return ids.includes(questId) ? [{ id: questId, title: "更新後のクエスト名" }] : [];
  },
});
db.knowledgeCard = readOnly({ findMany: async ({ where }: Prisma.KnowledgeCardFindManyArgs) => {
  assert.equal(where?.isPublished, true);
  if (where.relatedCreateQuestIds) assert.deepEqual(where.relatedCreateQuestIds, { has: questId });
  if (where.userKnowledgeCards) {
    assert.deepEqual(where.userKnowledgeCards, { some: { userId: owner } });
    assert.deepEqual(where.course, { isPublished: true });
    assert.equal(where.courseId, knowledgeCardSeed[0].courseId);
    return [{ id: ownedId, title: "所持カード", searchKeywords: ["最短経路", "幅優先探索"] }];
  }
  return knowledgeCardSeed.filter(card => !where.relatedCreateQuestIds || card.relatedCreateQuestIds.includes(questId)).map(card => ({
    ...card, course: { title: "単元名" }, userKnowledgeCards: card.id === ownedId ? [{ id: "holding", collectedAt: new Date("2026-11-19") }] : [],
  }));
} });
db.achievement = readOnly({ findMany: async () => [] });
(grants as { restoreCompletedPhaseCards: unknown }).restoreCompletedPhaseCards = async () => 0;

async function main() {
  const reference = await getQuestKnowledgeCards(owner, questId);
  assert.ok(reference.items.length > 1);
  const owned = reference.items.find(card => card.id === ownedId);
  assert.ok(owned?.isCollected && owned.title && owned.description && owned.useCase);
  for (const hidden of reference.items.filter(card => !card.isCollected)) {
    assert.deepEqual(Object.keys(hidden).sort(), ["id", "isCollected", "rarity"]);
    assert.ok(!JSON.stringify(hidden).includes("searchKeywords"));
  }
  // 所持情報の問い合わせは常に認証済み本人の条件を使う。
  let scopedReads = 0;
  const model = db.knowledgeCard as { findMany: (args: Prisma.KnowledgeCardFindManyArgs) => Promise<unknown> };
  const findMany = model.findMany;
  model.findMany = async args => {
    if (args.select?.userKnowledgeCards) {
      assert.deepEqual(args.select.userKnowledgeCards, { where: { userId: owner }, select: { id: true } }); scopedReads++;
    }
    return findMany(args);
  };
  await getQuestKnowledgeCards(owner, questId); assert.equal(scopedReads, 1);
  const keywords = await getUnitCardKeywords(owner, knowledgeCardSeed[0].courseId);
  assert.equal(keywords.items.length, 1); assert.equal(keywords.items[0].id, ownedId);
  const links = await getPublishedCardQuests([{ relatedCreateQuestIds: [questId, "deleted", questId, "private"] }]);
  assert.deepEqual(links, [{ id: questId, title: "更新後のクエスト名" }]);
  assert.deepEqual(await getPublishedCardQuests([]), []);
  const collection = await getCollectionByUser({ id: owner, selectedProfileAchievementId: null });
  assert.deepEqual(collection.knowledgeTips.items.find(card => card.id === ownedId)?.relatedQuests, links);
  assert.ok(collection.knowledgeTips.items.filter(card => !card.isCollected).every(card => card.relatedQuests.length === 0 && card.searchKeywords.length === 0));
  await assert.rejects(() => getQuestKnowledgeCards(owner, "private"), { statusCode: 404 });
  let failure: unknown;
  await getQuestKnowledgeCardsController({ params: { questId } } as unknown as Request, {} as Response, error => { failure = error; });
  assert.equal((failure as { statusCode: number }).statusCode, 401);
  await getQuestKnowledgeCardsController({ authUser: { id: owner }, params: { questId: "" } } as unknown as Request, {} as Response, error => { failure = error; });
  assert.equal((failure as { statusCode: number }).statusCode, 400);
  console.log("PASS: data-driven card references, owner-scoped holdings, server-side hidden-card redaction, public live quest titles, unit-owned keywords, empty/deleted/private references and authenticated read-only endpoints (in-memory adapter).");
}
main().catch(error => { console.error(error); process.exitCode = 1; });
