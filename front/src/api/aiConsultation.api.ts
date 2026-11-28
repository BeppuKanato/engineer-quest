import { fetcher } from "@/lib/fetcher";

export type AiConsultationRecord = {
  id: string;
  courseId: string;
  phaseKey: string | null;
  userMessage: string;
  assistantMessage: string;
  blocked: boolean;
  createdAt: string;
};

export type AiConsultationContext = {
  /** 現在書いているコード（フェーズ7の下書きなど）。概念レベルの指摘にだけ使われる。 */
  code?: string;
  /** 直近のテスト結果の要約。 */
  testSummary?: string;
};

export const listAiConsultations = (token: string, courseId: string) =>
  fetcher<{ consultations: AiConsultationRecord[] }>(
    `/ai-consultations?courseId=${encodeURIComponent(courseId)}`,
    { token }
  );

export const createAiConsultation = (
  token: string,
  input: { courseId: string; phaseKey?: string | null; message: string; context?: AiConsultationContext }
) =>
  fetcher<{ consultation: AiConsultationRecord; reply: string; blocked: boolean }>("/ai-consultations", {
    token,
    method: "POST",
    body: JSON.stringify(input),
  });
