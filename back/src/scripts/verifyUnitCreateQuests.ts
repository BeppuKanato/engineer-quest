import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import type { Request, Response } from "express";
import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { createQuestSeed } from "../../prisma/seedData/createQuestSeed";
import { getRelatedCreateQuestsByCourseId } from "../service/course.service";
import { getRelatedCreateQuestsController } from "../controller/course.controller";

const hiddenCourseId = "unpublished-course";
const seedExamples = createQuestSeed.map(quest => ({
  id: String(quest.id), title: String(quest.title), sortOrder: quest.sortOrder, isPublished: true,
  relatedCourses: quest.relatedCourses.map(link => ({ courseId: String(link.courseId) })),
}));
const examples = [...seedExamples, { ...seedExamples[0], id: "private-quest", isPublished: false }];
let reads = 0;
const db = prisma as unknown as Record<string, unknown>;
db.createQuest = new Proxy({ findMany: async (args: Prisma.CreateQuestFindManyArgs) => {
  reads++;
  const courseId = args.where?.relatedCourses?.some?.courseId;
  assert.equal(typeof courseId, "string");
  assert.deepEqual(args.where, { isPublished: true, relatedCourses: { some: { courseId, course: { isPublished: true } } } });
  assert.deepEqual(args.select, { id: true, title: true });
  assert.deepEqual(args.orderBy, [{ sortOrder: "asc" }, { id: "asc" }]);
  return examples.filter(quest => quest.isPublished && courseId !== hiddenCourseId && quest.relatedCourses.some(link => link.courseId === courseId))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id)).map(({ id, title }) => ({ id, title }));
} }, { get(target, key: string) { if (key !== "findMany") throw new Error(`Unexpected write/read: ${key}`); return target.findMany; } });

async function main() {
  const courseIds = [...new Set(createQuestSeed.flatMap(quest => quest.relatedCourses.map(link => link.courseId)))];
  for (const courseId of courseIds) {
    const expected = seedExamples.filter(q => q.isPublished && q.relatedCourses.some(link => link.courseId === courseId))
      .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id)).map(({ id, title }) => ({ id, title }));
    assert.deepEqual((await getRelatedCreateQuestsByCourseId(courseId)).items, expected);
  }
  for (const courseId of ["no-related-quest", "deleted-course", hiddenCourseId]) assert.deepEqual(await getRelatedCreateQuestsByCourseId(courseId), { items: [] });
  const courseId = courseIds[0];
  const first = examples.find(quest => quest.relatedCourses.some(link => link.courseId === courseId))!;
  first.title = "更新されたクエスト名";
  assert.ok((await getRelatedCreateQuestsByCourseId(courseId)).items.some(q => q.title === first.title));
  let failure: unknown, response: unknown;
  const next = (error?: unknown) => { failure = error; };
  const res = { json: (value: unknown) => { response = value; } } as Response;
  const before = reads;
  await getRelatedCreateQuestsController({ params: { courseId } } as unknown as Request, res, next);
  assert.equal((failure as { statusCode: number }).statusCode, 401); assert.equal(reads, before);
  failure = null;
  await getRelatedCreateQuestsController({ authUser: { id: "owner" }, params: { courseId: " " } } as unknown as Request, res, next);
  assert.equal((failure as { statusCode: number }).statusCode, 400); assert.equal(reads, before);
  failure = null;
  await getRelatedCreateQuestsController({ authUser: { id: "owner" }, params: { courseId }, body: { userId: "someone-else" } } as unknown as Request, res, next);
  assert.equal(failure, null); assert.deepEqual(response, await getRelatedCreateQuestsByCourseId(courseId));
  const router = fs.readFileSync(path.resolve(__dirname, "../router/course.router.ts"), "utf8");
  assert.ok(router.includes('router.get("/:courseId/create-quests", verifyFirebaseToken, getRelatedCreateQuestsController)'));
  console.log("PASS: related-course reverse lookup, public-only/minimal live titles, all seed relationships, empty/deleted/private exclusions, authenticated controller and read-only operations (in-memory adapter).");
}
main().catch(error => { console.error(error); process.exitCode = 1; });
