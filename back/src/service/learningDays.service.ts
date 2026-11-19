import { prisma } from "../lib/prisma";

// Asia/Tokyo は UTC+9（夏時間なし）。ホストのタイムゾーンに依存させない。
export const tokyoDate = (date: Date) => new Date(date.getTime() + 9 * 60 * 60 * 1000);
export const learningDateKey = (date: Date) => tokyoDate(date).toISOString().slice(0, 10);
export const learningDayKeys = (dates: readonly (Date | null | undefined)[]) =>
  new Set(dates.filter((date): date is Date => date instanceof Date).map(learningDateKey));

/** 今日未学習でも昨日までの継続を保持する。昨日にも記録がなければ0日。 */
export function currentLearningStreak(keys: ReadonlySet<string>, now = new Date()) {
  const cursor = new Date(now);
  if (!keys.has(learningDateKey(cursor))) cursor.setUTCDate(cursor.getUTCDate() - 1);
  let days = 0;
  while (keys.has(learningDateKey(cursor))) {
    days += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return days;
}

/** A1: クライアントイベントではなく、本人の確定済み完了・提出を学習日とする。 */
export async function getLearningDayKeys(userId: string) {
  const [phases, units, submissions] = await Promise.all([
    prisma.phaseLearningProgress.findMany({ where: { userId, completedAt: { not: null } }, select: { completedAt: true } }),
    prisma.unitLearningProgress.findMany({ where: { userId, completedAt: { not: null } }, select: { completedAt: true } }),
    prisma.createQuestSubmission.findMany({ where: { attempt: { userId } }, select: { submittedAt: true } }),
  ]);
  return learningDayKeys([...phases.map(row => row.completedAt), ...units.map(row => row.completedAt), ...submissions.map(row => row.submittedAt)]);
}
