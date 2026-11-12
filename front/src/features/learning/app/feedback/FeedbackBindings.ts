import type { ComponentType } from "react";
import type { FeedbackCandidate, FeedbackV1Result } from "@/api/feedbackV1.api";

/** 学習フローが必要とする接続。実体はappがfeedback機能から渡す。 */
export type FeedbackBindings = {
  useFeedback: (kind: "phase" | "unit", eventId: string) => { result: FeedbackV1Result | null; error: boolean; unavailable: boolean };
  Observation: ComponentType<{ id: string; href?: string | null; candidates?: FeedbackCandidate[] }>;
  Candidates: ComponentType<{ candidates: FeedbackCandidate[]; onAction?: (href: string | null) => boolean }>;
  Destination: ComponentType<{ ready: boolean; targetId?: string | null; failed?: boolean; actualRoute?: string }>;
};
