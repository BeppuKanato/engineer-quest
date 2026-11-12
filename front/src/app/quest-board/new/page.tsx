"use client";

import { AppHeader } from "@/app/component/appHeader";
import { FeedbackDestination } from "@/features/feedback/FeedbackV1";
import { NewQuestPostScreen } from "@/features/quest-board/NewQuestPostScreen";

export default function NewQuestPostPage() {
  return <NewQuestPostScreen header={<AppHeader />} FeedbackDestination={FeedbackDestination} />;
}
