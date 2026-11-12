"use client";

import { AppHeader } from "@/app/component/appHeader";
import { FeedbackDestination } from "@/features/feedback/FeedbackV1";
import { QuestBoardScreen } from "@/features/quest-board/QuestBoardScreen";

export default function QuestBoardPage() {
  return <QuestBoardScreen header={<AppHeader />} FeedbackDestination={FeedbackDestination} />;
}
