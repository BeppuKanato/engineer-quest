import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError } from "../error/appError";
import { buildFeedbackV1Context } from "./feedbackV1.context";
import { generate, validateSelection, type Input } from "./feedbackV1.engine";
import { enqueueFeedbackTask, tasksEnabled, type FeedbackTaskPayload } from "./feedbackV1.tasks";
const json = (v: unknown): Prisma.InputJsonValue => JSON.parse(JSON.stringify(v));

export type FeedbackV1Kind = "mission" | "create" | "phase" | "unit";

// New-flow events are identified by the progress row plus its completion time,
// so re-completing the same phase/unit later is a distinct feedback event.
async function resolveEventKey(userId: string, kind: FeedbackV1Kind, eventId: string): Promise<string> {
  if (kind === "phase") {
    const [courseId, phaseKey] = eventId.split(":");
    const row = courseId && phaseKey ? await prisma.phaseLearningProgress.findUnique({ where: { userId_courseId_phaseKey: { userId, courseId, phaseKey } } }) : null;
    if (!row || row.status !== "COMPLETED" || !row.completedAt) throw new AppError(404, "EVENT_NOT_FOUND", "Completion event not found");
    return `phase:${row.id}:${row.completedAt.toISOString()}`;
  }
  if (kind === "unit") {
    const row = await prisma.unitLearningProgress.findUnique({ where: { userId_courseId: { userId, courseId: eventId } } });
    if (!row || row.status !== "COMPLETED" || !row.completedAt) throw new AppError(404, "EVENT_NOT_FOUND", "Completion event not found");
    return `unit:${row.id}:${row.completedAt.toISOString()}`;
  }
  return `${kind}:${eventId}`;
}

export async function feedbackV1(firebaseUid: string, kind: FeedbackV1Kind, eventId: string, start = false, generator: typeof generate = generate) {
  const user = await prisma.user.findUnique({ where: { firebaseUid }, select: { id: true } });
  if (!user) throw new AppError(404, "USER_NOT_FOUND", "User not found");
  // Previously generated results remain immutable; v1 applies to new events.
  if (kind === "create") {
    const legacy = await prisma.createQuestFeedback.findFirst({ where: { submissionId: eventId, submission: { attempt: { userId: user.id } }, status: "COMPLETED" } });
    if (legacy) return { conceptSnapshot: null, id: undefined, status: legacy.status, source: "GENERATED", requestedAt: legacy.createdAt.toISOString(), completedAt: legacy.generatedAt?.toISOString() ?? null, feedback: { currentState: legacy.currentState, nextGoal: legacy.nextGoal, nextStep: legacy.nextStep, actionType: legacy.actionType, actionLabel: legacy.actionLabel } };
  }
  const key = await resolveEventKey(user.id, kind, eventId);
  let row = await prisma.feedbackV1.findUnique({ where: { eventKey: key } });
  let created = false;
  if (row && row.userId !== user.id) throw new AppError(404, "EVENT_NOT_FOUND", "Event not found");
  if (row?.status === "GENERATING" && Date.now() - row.createdAt.getTime() > (tasksEnabled() ? 35 : 10) * 60_000) {
    await prisma.feedbackV1.updateMany({ where: { id: row.id, status: "GENERATING" }, data: { status: "FAILED", failureCode: "GENERATION_INTERRUPTED_OR_TIMEOUT" } });
    row = await prisma.feedbackV1.findUniqueOrThrow({ where: { eventKey: key } });
  }
  if (row?.status === "COMPLETED" && start) {
    await prisma.feedbackV1Interaction.create({ data: { id: crypto.randomUUID(), feedbackId: row.id, type: "REUSED", data: { occurredAt: new Date().toISOString() } } });
  }
  if (!row && start) {
    const context = await buildFeedbackV1Context(firebaseUid, kind, eventId);
    if (await resolveEventKey(user.id, kind, eventId) !== key) throw new AppError(409, "COMPLETION_CHANGED", "Completion changed; retry feedback request");
    try {
      row = await prisma.feedbackV1.create({ data: { userId: user.id, eventKey: key, condition: context.condition, status: "GENERATING", input: json(context.input) } });
      created = true;
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") throw error;
      row = await prisma.feedbackV1.findUniqueOrThrow({ where: { eventKey: key } });
    }
  }
  if (tasksEnabled() && start && row?.status === "GENERATING") {
    // Repeated POST is safe: deterministic Cloud Tasks names deduplicate dispatch.
    // If enqueueing fails the row remains retryable on the next POST.
    try {
      await enqueueFeedbackTask({ feedbackId: row.id, kind, eventId });
    } catch (error) {
      console.error("feedback_v1_enqueue_failed", { id: row.id, error });
      throw new AppError(503, "FEEDBACK_QUEUE_UNAVAILABLE", "Unable to enqueue feedback");
    }
  } else if (created && row && !tasksEnabled()) {
    const id = row.id;
    const context = { input: row.input as unknown as Input };
    void (async () => {
      try {
        const result = await generator(context.input, undefined, async data => {
          await prisma.feedbackV1Call.create({ data: { feedbackId: id, data: json(data) } });
        });
        // Recheck access and execution constraints after generation; never trust a model URL.
        const fresh = await buildFeedbackV1Context(firebaseUid, kind, eventId);
        result.validation = validateSelection({ ...fresh.input, hexad: context.input.hexad }, result.selection);
        await prisma.feedbackV1.update({ where: { id, status: "GENERATING" }, data: { status: "COMPLETED", result: json(result), generatedAt: new Date() } });
      } catch (error) {
        await prisma.feedbackV1.update({ where: { id }, data: { status: "FAILED", failureCode: error instanceof Error ? error.message : "GENERATION_FAILED" } });
      }
    })().catch(error => console.error("feedback_v1_persistence_failed", { id, error }));
  }
  if (!row) throw new AppError(404, "FEEDBACK_NOT_FOUND", "Feedback not found");
  return response(row);
}

// Cloud Tasks runs this in a dedicated authenticated HTTP request. The database
// claim is atomic across Cloud Run instances, unlike the former fire-and-forget promise.
export async function processFeedbackV1Task(
  payload: FeedbackTaskPayload,
  generator: typeof generate = generate,
): Promise<"done" | "retry"> {
  const row = await prisma.feedbackV1.findUnique({
    where: { id: payload.feedbackId },
    include: { user: { select: { firebaseUid: true } } },
  });
  if (!row || row.status !== "GENERATING") return "done";
  if (Date.now() - row.createdAt.getTime() > 35 * 60_000) {
    await prisma.feedbackV1.updateMany({ where: { id: row.id, status: "GENERATING" }, data: { status: "FAILED", failureCode: "GENERATION_EXPIRED" } });
    return "done";
  }
  if (row.runExpiresAt && row.runExpiresAt.getTime() > Date.now()) {
    // If the original Cloud Run instance dies, ordinary Cloud Tasks retries
    // would be exhausted before its lease expires. Schedule one follow-up
    // after the lease deadline; a completed job will simply acknowledge it.
    await enqueueFeedbackTask(payload, row.runAttempts, new Date(row.runExpiresAt.getTime() + 5000));
    return "done";
  }
  if (row.runAttempts >= 3) {
    await prisma.feedbackV1.updateMany({ where: { id: row.id, status: "GENERATING" }, data: { status: "FAILED", failureCode: "MAX_GENERATION_ATTEMPTS" } });
    return "done";
  }
  const token = crypto.randomUUID();
  const acquired = await prisma.feedbackV1.updateMany({
    where: { id: row.id, status: "GENERATING", OR: [{ runExpiresAt: null }, { runExpiresAt: { lte: new Date() } }] },
    data: { runToken: token, runExpiresAt: new Date(Date.now() + 300_000), runAttempts: { increment: 1 } },
  });
  if (acquired.count !== 1) {
    const active = await prisma.feedbackV1.findUnique({ where: { id: row.id } });
    if (active?.status === "GENERATING" && active.runExpiresAt) {
      await enqueueFeedbackTask(payload, active.runAttempts, new Date(active.runExpiresAt.getTime() + 5000));
    }
    return "done";
  }

  const owned = { id: row.id, status: "GENERATING" as const, runToken: token };
  try {
    // Fail closed if an event has been re-completed since the request was made.
    if (await resolveEventKey(row.userId, payload.kind, payload.eventId) !== row.eventKey) {
      throw new Error("COMPLETION_CHANGED");
    }
    const savedInput = row.input as unknown as Input;
    const result = await generator(savedInput, undefined, async data => {
      await prisma.feedbackV1Call.create({ data: { feedbackId: row.id, data: json(data) } });
    });
    const fresh = await buildFeedbackV1Context(row.user.firebaseUid, payload.kind, payload.eventId);
    result.validation = validateSelection({ ...fresh.input, hexad: savedInput.hexad }, result.selection);
    const updated = await prisma.feedbackV1.updateMany({
      where: owned,
      data: { status: "COMPLETED", result: json(result), generatedAt: new Date(), runToken: null, runExpiresAt: null, failureCode: null },
    });
    if (updated.count !== 1) console.warn("feedback_v1_claim_lost", { id: row.id });
    return "done";
  } catch (error) {
    const message = error instanceof Error ? error.message : "GENERATION_FAILED";
    const nonRetryable = /^(UNSUPPORTED_|UNKNOWN_EVIDENCE_SOURCE|MISSING_CONCEPT_CLAIMS|INVALID_|ACTION_NOT_ALLOWED|TARGET_NOT_AVAILABLE|STANDARD_HEXAD_LEAK|HEXAD_|COMPLETION_CHANGED|EVENT_NOT_FOUND|HEXAD_RESPONSE_REQUIRED)/.test(message);
    if (!nonRetryable && row.runAttempts + 1 < 3) {
      await prisma.feedbackV1.updateMany({
        where: owned,
        data: { runToken: null, runExpiresAt: null, failureCode: message.slice(0, 1000) },
      });
      console.warn("feedback_v1_retryable_failure", { id: row.id, attempt: row.runAttempts + 1, error: message });
      return "retry";
    }
    await prisma.feedbackV1.updateMany({
      where: owned,
      data: { status: "FAILED", failureCode: message.slice(0, 1000), runToken: null, runExpiresAt: null },
    });
    console.error("feedback_v1_terminal_failure", { id: row.id, error: message });
    return "done";
  }
}

function response(row: { id: string; status: string; createdAt: Date; generatedAt: Date | null; result: Prisma.JsonValue | null; input?: Prisma.JsonValue }) {
  const result = row.result as unknown as Awaited<ReturnType<typeof generate>> | null;
  const learning = (row.input as unknown as { learning?: { conceptSnapshot?: unknown } } | undefined)?.learning;
  return { conceptSnapshot: learning?.conceptSnapshot ?? null, id: row.id, status: row.status, source: "GENERATED", requestedAt: row.createdAt.toISOString(), completedAt: row.generatedAt?.toISOString() ?? null,
    feedback: result ? { currentState: result.analysis.currentState, nextGoal: result.selection.nextGoal, nextStep: result.selection.nextStep, reason: result.selection.reason, actionType: "V1_ACTION", actionLabel: result.selection.actionLabel, actionHref: result.validation.actionHref, recommendations: (result.selection.candidates ?? [result.selection]).map((candidate, index) => ({
      candidateId: result.validation.candidates?.[index]?.candidateId ?? `candidate-${index+1}`,
      nextStep: candidate.nextStep, reason: candidate.reason, actionLabel: candidate.actionLabel,
      actionHref: result.validation.candidates?.[index]?.actionHref ?? (index === 0 ? result.validation.actionHref : null),
    })), recommendation: result.selection } : null };
}
