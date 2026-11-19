import { fetcher } from "@/lib/fetcher";
export type DailyReview = {
  id: string; date: string; courseId: string; phaseKey: string; assessmentId: string; questionId: string;
  selectedAt: string; answeredAt: string | null; correct: boolean | null;
};
export type DailyReviewResponse = { review: DailyReview | null };
// 日付や回答状態をキャッシュしない。記録先は復習専用APIだけ。
export const getDailyReview = (token: string) => fetcher<DailyReviewResponse>("/daily-review/today", { token });
export const answerDailyReview = (token: string, reviewId: string, correct: boolean) =>
  fetcher<DailyReviewResponse>("/daily-review/today/answer", { token, method: "POST", body: JSON.stringify({ reviewId, correct }) });
