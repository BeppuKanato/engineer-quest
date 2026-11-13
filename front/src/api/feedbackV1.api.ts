import { fetcher } from "@/lib/fetcher";

type AnswerEvidence = { sourceId: string; sessionId: string; number: number; correct: boolean };
export type ConceptSnapshot = {
  id: string; version: 1; courseId: string; title: string; relation: "unit-components";
  missingCompletionEvidence?: {sourceId:string;phaseKey:string|null}[];
  concepts: {
    conceptId: string; label: string; kind: string; state: "unobserved" | "confirmed" | "needs_check";
    attemptedQuestions: number; totalQuestions: number;
    evidence: { phaseKey: string; assessmentId: string; questionId: string; tags: string[]; stageLabel?: string; questionLabel?: string;
      first: AnswerEvidence | null; latest: AnswerEvidence | null; retried: boolean; sessions: number }[];
    implementation: null | { completed: true | "unknown"; testsPassed: boolean | "unknown"; testRuns: number | "unknown"; hintUsage: unknown; inputLevel: string };
  }[];
};
export type FeedbackCandidate = { candidateId: string; nextStep: string; reason: string; actionLabel: string; actionHref: string | null };
export type FeedbackGoalSnapshot = {
  displayText: string;
  status: string;
  progress: number | null;
  requirements?: Array<{
    id: string; label: string;
    status: "met" | "ongoing" | "unobserved" | "not_met" | "unavailable";
    current?: number; target?: number; unit?: string;
  }>;
};
export type FeedbackV1Result = { id: string; status: string; conceptSnapshot?: ConceptSnapshot | null;
  goalSnapshot?: FeedbackGoalSnapshot | null;
  feedback: null | { currentState: string; nextGoal: string; nextStep: string; reason: string; actionLabel: string; actionHref: string | null; recommendations?: FeedbackCandidate[] } };
export const getFeedbackV1 = (token: string, kind: string, eventId: string, method: string) =>
  fetcher<FeedbackV1Result>(`/feedback-v1/${kind}/${encodeURIComponent(eventId)}`, { token, method });
export const feedbackCandidates = (f: NonNullable<FeedbackV1Result["feedback"]>): FeedbackCandidate[] =>
  f.recommendations ?? [{ candidateId: "candidate-1", nextStep: f.nextStep, reason: f.reason, actionLabel: f.actionLabel, actionHref: f.actionHref }];
