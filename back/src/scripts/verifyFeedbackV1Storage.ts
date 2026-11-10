// Service contract test with an in-memory Prisma adapter; not a PostgreSQL test.
import { Prisma } from "@prisma/client";
import assert from "node:assert/strict";
import { prisma } from "../lib/prisma";
import { feedbackV1 } from "../service/feedbackV1.service";
import { generate, type Input } from "../service/feedbackV1.engine";
import * as contextModule from "../service/feedbackV1.context";

async function main() {
  const db = prisma as unknown as Record<string, Record<string, unknown>>;
  type Row = { id: string; eventKey: string; userId: string; status: string; input: Input; createdAt: Date; generatedAt: Date | null; result: unknown };
  const rows = new Map<string, Row>();
  const calls: { data: { stage: string } }[] = [];
  const interactions: { type: string }[] = [];
  const input: Input = { learning: { id: "a1" }, state: {}, actions: [{ id: 15, label: "XP確認", purpose: "達成の実感", condition: "表示可能", targetIds: ["profile"] }], targets: { 15: [{ id: "profile", href: "/profile" }] }, hexad: null, bigGoal: null };
  (contextModule as { buildFeedbackV1Context: unknown }).buildFeedbackV1Context = async () => ({ userId: "pseudonym-1", condition: "STANDARD", input });
  db.user.findUnique = async () => ({ id: "pseudonym-1" });
  db.createQuestFeedback.findFirst = async () => null;
  db.feedbackV1.findUnique = async ({ where }: { where: { eventKey: string } }) => rows.get(where.eventKey) ?? null;
  db.feedbackV1.findUniqueOrThrow = db.feedbackV1.findUnique;
  db.feedbackV1.create = async ({ data }: { data: Omit<Row, "id" | "createdAt" | "generatedAt" | "result"> }) => {
    if (rows.has(data.eventKey)) throw new Prisma.PrismaClientKnownRequestError("duplicate create", { code: "P2002", clientVersion: "5.22.0" });
    const row = { ...data, id: data.eventKey, createdAt: new Date(), generatedAt: null, result: null };
    rows.set(data.eventKey, row); return row;
  };
  db.feedbackV1.update = async ({ where, data }: { where: { id: string }; data: Partial<Row> }) => { const row = rows.get(where.id)!; Object.assign(row, data); return row; };
  db.feedbackV1Call.create = async ({ data }: { data: { data: { stage: string } } }) => { calls.push(data); return data; };
  db.feedbackV1Interaction.create = async ({ data }: { data: { type: string } }) => { interactions.push(data); return data; };
  let llmCalls = 0;
  const generator: typeof generate = (i, _, log) => generate(i, async stage => {
    llmCalls++;
    return { model: "fixture", responseId: `r-${llmCalls}`, usage: { input_tokens: 100, output_tokens: 100 }, output: stage === "analysis" ? { currentState: "完了した", understood: [], needsImprovement: [], uncertain: ["未観測"], evidence: [{ sourceId: "a1", fact: "完了", inference: false }] } : { nextGoal: "進展を確認する", nextStep: "XPを確認する", actionId: 15, targetId: "profile", actionLabel: "XPを確認", purpose: "達成の実感", reason: "完了を振り返る", personalizationAdjustment: null } };
  }, log);
  for (const kind of ["mission", "create"] as const) {
    const id = kind === "mission" ? "reward-run-1" : "submission-1";
    await Promise.all([feedbackV1("uid", kind, id, true, generator), feedbackV1("uid", kind, id, true, generator)]);
    for (let i = 0; i < 20 && rows.get(`${kind}:${id}`)!.status === "GENERATING"; i++) await new Promise(resolve => setImmediate(resolve));
    const first = await feedbackV1("uid", kind, id);
    assert.equal(first.status, "COMPLETED");
    const before = llmCalls;
    const reloaded = await feedbackV1("uid", kind, id, true, generator);
    assert.deepEqual(first.feedback, reloaded.feedback);
    assert.equal(llmCalls, before);
    assert.equal(rows.get(`${kind}:${id}`)!.input.hexad, null);
  }
  db.user.findUnique = async () => ({ id: "someone-else" });
  await assert.rejects(feedbackV1("outsider", "mission", "reward-run-1"), /Event not found/);
  db.user.findUnique = async () => ({ id: "pseudonym-1" });
  assert.equal(rows.size, 2);
  assert.equal(llmCalls, 4);
  assert.equal(calls.filter(c => c.data.stage === "analysis").length, 2);
  assert.equal(calls.filter(c => c.data.stage === "selection").length, 2);
  assert.equal(interactions.filter(i => i.type === "REUSED").length, 2);
  console.log("PASS: mission/submission event identity, input/output and stage-log persistence, reload reuse without LLM calls (in-memory adapter)");
}
void main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
