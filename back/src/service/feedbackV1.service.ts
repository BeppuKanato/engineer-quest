import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError } from "../error/appError";
import { buildFeedbackV1Context } from "./feedbackV1.context";
import { generate, validateSelection } from "./feedbackV1.engine";
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
    if (legacy) return { id: undefined, status: legacy.status, source: "GENERATED", requestedAt: legacy.createdAt.toISOString(), completedAt: legacy.generatedAt?.toISOString() ?? null, feedback: { currentState: legacy.currentState, nextGoal: legacy.nextGoal, nextStep: legacy.nextStep, actionType: legacy.actionType, actionLabel: legacy.actionLabel } };
  }
  const key = await resolveEventKey(user.id, kind, eventId);
  let row = await prisma.feedbackV1.findUnique({ where: { eventKey: key } });
  if (row && row.userId !== user.id) throw new AppError(404, "EVENT_NOT_FOUND", "Event not found");
  if (row?.status === "GENERATING" && Date.now() - row.createdAt.getTime() > 10 * 60_000) {
    await prisma.feedbackV1.updateMany({ where: { id: row.id, status: "GENERATING" }, data: { status: "FAILED", failureCode: "GENERATION_INTERRUPTED_OR_TIMEOUT" } });
    row = await prisma.feedbackV1.findUniqueOrThrow({ where: { eventKey: key } });
  }
  if (row?.status === "COMPLETED" && start) {
    await prisma.feedbackV1Interaction.create({ data: { id: crypto.randomUUID(), feedbackId: row.id, type: "REUSED", data: { occurredAt: new Date().toISOString() } } });
  }
  if (!row && start) {
    const context = await buildFeedbackV1Context(firebaseUid, kind, eventId);
    try {
      row = await prisma.feedbackV1.create({ data: { userId: user.id, eventKey: key, condition: context.condition, status: "GENERATING", input: json(context.input) } });
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") throw error;
      row = await prisma.feedbackV1.findUniqueOrThrow({ where: { eventKey: key } });
      return response(row);
    }
    const id = row.id;
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

function response(row: { id: string; status: string; createdAt: Date; generatedAt: Date | null; result: Prisma.JsonValue | null }) {
  const result = row.result as unknown as Awaited<ReturnType<typeof generate>> | null;
  return { id: row.id, status: row.status, source: "GENERATED", requestedAt: row.createdAt.toISOString(), completedAt: row.generatedAt?.toISOString() ?? null,
    feedback: result ? { currentState: result.analysis.currentState, nextGoal: result.selection.nextGoal, nextStep: result.selection.nextStep, reason: result.selection.reason, actionType: "V1_ACTION", actionLabel: result.selection.actionLabel, actionHref: result.validation.actionHref, recommendation: result.selection } : null };
}
