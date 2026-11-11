import { Router } from "express";
import { z } from "zod";
import { verifyFeedbackTaskIdentity } from "../service/feedbackV1.tasks";
import { processFeedbackV1Task } from "../service/feedbackV1.service";

const router = Router();
const taskSchema = z.object({
  feedbackId: z.string().min(1).max(128),
  kind: z.enum(["mission", "create", "phase", "unit"]),
  eventId: z.string().min(1).max(1024),
}).strict();

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
