"use client";

import { AppHeader } from "@/app/component/appHeader";
import { FeedbackDestination } from "@/features/feedback/FeedbackV1";
import { KnowledgeCardsScreen } from "@/features/collection/KnowledgeCardsScreen";

export default function KnowledgeCardsPage() {
  return <KnowledgeCardsScreen header={<AppHeader />} FeedbackDestination={FeedbackDestination} />;
}
