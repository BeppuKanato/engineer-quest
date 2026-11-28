import { listAiConsultations } from "@/api/aiConsultation.api";

/**
 * 試行開始時刻以降に、その単元で AI 相談を使ったかをステージ1の履歴 API で判定する。
 * 履歴が取れない場合は「使っていない」として記録する（学習の完了を止めない）。
 * API へ依存するため、純粋な answerReveal.ts から分けて置く。
 */
export async function checkUsedAiConsultation(getToken: () => Promise<string>, courseId: string | null, startedAt: string): Promise<boolean> {
  if (!courseId) return false;
  try {
    const token = await getToken();
    const data = await listAiConsultations(token, courseId);
    const started = Date.parse(startedAt);
    return data.consultations.some(record => Date.parse(record.createdAt) >= started);
  } catch { return false; }
}
