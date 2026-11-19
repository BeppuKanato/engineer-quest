import { LearningProgressStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { FIXED_CARD_SCHEDULE } from "../learning/knowledgeCardSchedule";

/** 完了済みフェーズを変更せず、過去の配布テーブルで欠落したカードだけを補う。 */
export async function restoreCompletedPhaseCards(userId: string): Promise<number> {
  const phases = await prisma.phaseLearningProgress.findMany({
    where: { userId, status: LearningProgressStatus.COMPLETED },
    select: { courseId: true, phaseKey: true, course: { select: { version: true } } },
  });
  if (phases.length === 0) return 0;
  const schedules = await prisma.knowledgeCardPhaseScheduleEntry.findMany({
    where: {
      tableNumber: FIXED_CARD_SCHEDULE,
      knowledgeCard: { isPublished: true },
      OR: phases.map(phase => ({ courseId: phase.courseId, courseVersion: phase.course.version, phaseKey: phase.phaseKey })),
    },
    select: { knowledgeCardId: true },
  });
  const ids = [...new Set(schedules.map(entry => entry.knowledgeCardId))];
  if (ids.length === 0) return 0;
  const result = await prisma.userKnowledgeCard.createMany({ data: ids.map(knowledgeCardId => ({ userId, knowledgeCardId })), skipDuplicates: true });
  return result.count;
}
