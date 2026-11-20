/** 復習の実施日はDailyReview.reviewDate（日本時間の日付を保存したDATE）を使う。 */
export function reviewCorrectStreak(rows: readonly { reviewDate: Date; correct: boolean | null }[]) {
  const days = new Map(rows.map(row => [row.reviewDate.toISOString().slice(0, 10), row.correct]));
  const latest = [...days.keys()].sort().at(-1);
  if (!latest) return 0;
  const cursor = new Date(`${latest}T00:00:00Z`); let count = 0;
  while (days.get(cursor.toISOString().slice(0, 10)) === true) { count++; cursor.setUTCDate(cursor.getUTCDate() - 1); }
  return count;
}

/** 同時刻の提出間の前後は推定しない。初回の提出群を基準に、その後の更新を数える。 */
export function personalBestImprovements(rows: readonly { score: number; submittedAt: Date; attempt: { questId: string } }[]) {
  const quests = new Map<string, Map<number, number>>();
  for (const row of rows) {
    const timeline = quests.get(row.attempt.questId) ?? new Map<number, number>();
    const time = row.submittedAt.getTime();
    timeline.set(time, Math.max(timeline.get(time) ?? -Infinity, row.score)); quests.set(row.attempt.questId, timeline);
  }
  let improvements = 0;
  for (const timeline of quests.values()) {
    let best: number | null = null;
    for (const [, score] of [...timeline].sort((a, b) => a[0] - b[0])) {
      if (best !== null && score > best) improvements++;
      best = Math.max(best ?? -Infinity, score);
    }
  }
  return improvements;
}
