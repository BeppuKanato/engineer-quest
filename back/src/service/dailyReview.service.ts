import { DailyReview, LearningProgressStatus, Prisma } from "@prisma/client";
import { AppError } from "../error/appError";
import { prisma } from "../lib/prisma";
import { conceptDefinitions, evidenceSchema } from "./feedbackConcepts";
import { learningDateKey } from "./learningDays.service";

const DAY_MS = 24 * 60 * 60 * 1000;
const identity = (question: { courseId: string; phaseKey: string; assessmentId: string; questionId: string }) =>
  JSON.stringify([question.courseId, question.phaseKey, question.assessmentId, question.questionId]);
const todayScope = (userId: string, now: Date) => ({ userId, reviewDate: new Date(`${learningDateKey(now)}T00:00:00Z`) });
const reviewView = (review: DailyReview) => ({
  id: review.id,
  date: review.reviewDate.toISOString().slice(0, 10),
  courseId: review.courseId,
  phaseKey: review.phaseKey,
  assessmentId: review.assessmentId,
  questionId: review.questionId,
  selectedAt: review.selectedAt.toISOString(),
  answeredAt: review.answeredAt?.toISOString() ?? null,
  correct: review.correct,
});

/** 保存済みの評価証拠を読むだけ。復習から学習サービスや概念到達判定は呼ばない。 */
export async function getTodayReviewByUser(user: { id: string }, now = new Date()) {
  const scope = todayScope(user.id, now);
  const where = { userId_reviewDate: scope };
  const existing = await prisma.dailyReview.findUnique({ where });
  if (existing) return { review: reviewView(existing) };

  const dayStart = new Date(`${learningDateKey(now)}T00:00:00+09:00`);
  const [phases, successes] = await Promise.all([
    prisma.phaseLearningProgress.findMany({
      where: { userId: user.id, status: LearningProgressStatus.COMPLETED, completedAt: { lt: dayStart } },
      select: { courseId: true, phaseKey: true, completedAt: true, summary: true },
    }),
    prisma.dailyReview.findMany({
      where: { userId: user.id, correct: true, answeredAt: { gt: new Date(now.getTime() - 30 * DAY_MS) } },
      select: { courseId: true, phaseKey: true, assessmentId: true, questionId: true },
    }),
  ]);
  const excluded = new Set(successes.map(identity));
  const candidates = phases.flatMap((phase) => {
    if (!phase.completedAt) return [];
    const unit = conceptDefinitions.find((definition) => definition.courseId === phase.courseId);
    if (!unit?.phases.some((entry) => entry.id === phase.phaseKey && [3, 5, 6].includes(entry.phase))) return [];
    const summary = phase.summary && typeof phase.summary === "object" && !Array.isArray(phase.summary) ? phase.summary : {};
    const parsed = evidenceSchema.safeParse(summary.assessmentEvidence);
    const evidence = parsed.success ? parsed.data : null;
    return unit.concepts.flatMap((concept) => concept.questions)
      .filter((question) => question.phaseKey === phase.phaseKey)
      .map((question) => ({
        courseId: phase.courseId, phaseKey: phase.phaseKey, assessmentId: question.assessmentId, questionId: question.questionId,
        completedAt: phase.completedAt!,
        firstMiss: evidence?.assessmentId === question.assessmentId && evidence.records.find((record) => record.questionId === question.questionId)?.attempts[0]?.correct === false,
      }))
      .filter((question) => !excluded.has(identity(question)));
  });
  // 初回ミス、古い完了日時、固定ID順。requiresの有無は選出に影響させない。
  candidates.sort((left, right) => Number(right.firstMiss) - Number(left.firstMiss)
    || left.completedAt.getTime() - right.completedAt.getTime() || identity(left).localeCompare(identity(right)));
  const candidate = candidates[0];
  if (!candidate) {
    // 別要求が同時に選出済みなら、その日の固定問題を優先する。
    const concurrent = await prisma.dailyReview.findUnique({ where });
    return { review: concurrent ? reviewView(concurrent) : null };
  }
  const { courseId, phaseKey, assessmentId, questionId } = candidate;
  try {
    const review = await prisma.dailyReview.upsert({
      where, update: {}, create: { ...scope, courseId, phaseKey, assessmentId, questionId, selectedAt: now },
    });
    return { review: reviewView(review) };
  } catch (error) {
    // Prismaがupsertを複数クエリに分けた場合にも、日次unique競合を同じ結果へ収束させる。
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") throw error;
    const concurrent = await prisma.dailyReview.findUnique({ where });
    if (!concurrent) throw error;
    return { review: reviewView(concurrent) };
  }
}

/** 初回回答だけを原子的に保存。同じ結果の再送は許容し、異なる結果での上書きは禁止する。 */
export async function answerTodayReviewByUser(user: { id: string }, reviewId: string, correct: boolean, now = new Date()) {
  const scope = todayScope(user.id, now);
  const where = { userId_reviewDate: scope };
  const selected = await prisma.dailyReview.findUnique({ where });
  if (!selected || selected.id !== reviewId) throw new AppError(404, "DAILY_REVIEW_NOT_FOUND", "今日の復習が見つかりません。");
  await prisma.dailyReview.updateMany({
    where: { ...scope, id: reviewId, answeredAt: null }, data: { answeredAt: now, correct },
  });
  const saved = await prisma.dailyReview.findUnique({ where });
  if (!saved || saved.id !== reviewId) throw new AppError(404, "DAILY_REVIEW_NOT_FOUND", "今日の復習が見つかりません。");
  if (saved.correct !== correct) throw new AppError(409, "DAILY_REVIEW_ALREADY_ANSWERED", "この復習には回答済みです。");
  return { review: reviewView(saved) };
}
