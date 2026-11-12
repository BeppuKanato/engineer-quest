"use client";

import { AppHeader } from "@/app/component/appHeader";
import { FeedbackDestination } from "@/features/feedback/FeedbackV1";
import { AchievementsScreen } from "@/features/collection/AchievementsScreen";

export default function AchievementsPage() {
  return <AchievementsScreen header={<AppHeader />} FeedbackDestination={FeedbackDestination} />;
}
