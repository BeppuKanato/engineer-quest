"use client";

import { AppHeader } from "@/app/component/appHeader";
import { FeedbackDestination } from "@/features/feedback/FeedbackV1";
import { HistoryScreen } from "@/features/history/HistoryScreen";

export default function HistoryPage() {
  return <HistoryScreen header={<AppHeader />} FeedbackDestination={FeedbackDestination} />;
}
