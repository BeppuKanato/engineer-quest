import { fetcher } from "@/lib/fetcher";
export type ConceptProgress = {
  conceptId: string; label: string; state: "reached" | "in_progress" | "unconfirmed";
  reachedQuestions: number; totalQuestions: number; answeredQuestions: number;
  firstAttemptCorrect: number; firstAttemptQuestions: number; firstAttemptRate: number | null;
};
export type ConceptProgressResponse = { courseId: string; concepts: ConceptProgress[] };
export const getConceptProgress = (token: string, courseId: string) =>
  fetcher<ConceptProgressResponse>(`/learning/units/${encodeURIComponent(courseId)}/concept-progress`, { token });
