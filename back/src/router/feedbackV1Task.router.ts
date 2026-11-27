import { Router } from "express";
import { z } from "zod";
import { verifyFeedbackTaskIdentity } from "../service/feedbackV1.tasks";
import { processFeedbackV1Task } from "../service/feedbackV1.service";

const router = Router();
// The payload Cloud Tasks actually delivers always carries retryCount (the
// service includes it in every enqueue, and processFeedbackV1Task uses it to
// reject stale deliveries). The schema must accept it: with .strict() and no
// retryCount field, every dispatched task failed validation and generation
// never ran (dev, 2026-11-27).
export const feedbackTaskSchema = z.object({
  feedbackId: z.string().min(1).max(128),
  kind: z.enum(["mission", "create", "phase", "unit"]),
  eventId: z.string().min(1).max(1024),
  retryCount: z.number().int().nonnegative().optional(),
}).strict();
const taskSchema = feedbackTaskSchema;

router.post("/generate", async (req, res, next) => {
  try {
    await verifyFeedbackTaskIdentity(req.headers.authorization);
    const payload = taskSchema.parse(req.body);
    const result = await processFeedbackV1Task(payload);
    // An explicit retry status keeps transient failures in the Cloud Tasks queue.
    res.status(result === "retry" ? 503 : 200).json({ status: result });
  } catch (error) {
    next(error);
  }
});
export default router;
