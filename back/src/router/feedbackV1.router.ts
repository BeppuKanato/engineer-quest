import { Router } from "express";
import { z } from "zod";
import { verifyFirebaseToken } from "../middleware/authMiddleware";
import { feedbackV1 } from "../service/feedbackV1.service";
import { prisma } from "../lib/prisma";
import { AppError } from "../error/appError";
const router = Router();
router.use(verifyFirebaseToken);
router.all("/:kind/:eventId", async (req, res, next) => {
  try {
    const kind = z.enum(["mission", "create"]).parse(req.params.kind);
    const uid = req.authUser?.firebaseUid;
    if (!uid) throw new AppError(401, "UNAUTHORIZED", "Unauthorized");
    if (req.method !== "GET" && req.method !== "POST") { res.sendStatus(405); return; }
    res.json(await feedbackV1(uid, kind, req.params.eventId, req.method === "POST"));
  } catch (error) { next(error); }
});
router.post("/:id/interactions/log", async (req, res, next) => {
  try {
    const data = z.object({ id: z.string().uuid(), type: z.enum(["PRESENTED", "VIEWED", "CLICKED", "VISIBLE_DURATION", "REUSED", "NAVIGATION_SELECTED", "ARRIVED", "ARRIVAL_FAILED"]), data: z.record(z.unknown()) }).parse(req.body);
    const row = await prisma.feedbackV1.findFirst({ where: { id: req.params.id, userId: (await prisma.user.findUnique({ where: { firebaseUid: req.authUser?.firebaseUid }, select: { id: true } }))?.id ?? "" } });
    if (!row) throw new AppError(404, "FEEDBACK_NOT_FOUND", "Feedback not found");
    await prisma.feedbackV1Interaction.upsert({ where: { id: data.id }, create: { id: data.id, feedbackId: row.id, type: data.type, data: JSON.parse(JSON.stringify(data.data)) }, update: {} });
    res.json({ accepted: true });
  } catch (error) { next(error); }
});
export default router;
