"use client";

import { AppHeader } from "@/app/component/appHeader";
import { LearningScreen } from "@/features/learning/screens/LearningScreen";
import type { FeedbackBindings } from "@/features/learning/feedback/FeedbackBindings";
import { FeedbackCandidates, FeedbackDestination, FeedbackObservation, useFeedbackV1 } from "@/features/feedback/FeedbackV1";

const feedback = {
  useFeedback: useFeedbackV1, Observation: FeedbackObservation,
  Candidates: FeedbackCandidates, Destination: FeedbackDestination,
} satisfies FeedbackBindings;

export function LearningPageComposition({ courseId, reviewPhaseKey }: { courseId: string; reviewPhaseKey?: string }) {
  return <LearningScreen courseId={courseId} reviewPhaseKey={reviewPhaseKey} header={<AppHeader />} feedback={feedback} />;
}
