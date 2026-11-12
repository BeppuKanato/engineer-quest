"use client";

import { useParams } from "next/navigation";
import { AppHeader } from "@/app/component/appHeader";
import { FeedbackDestination } from "@/features/feedback/FeedbackV1";
import { QuestPostDetailScreen } from "@/features/quest-board/QuestPostDetailScreen";

export default function QuestPostDetailPage() {
  const { postId } = useParams<{ postId: string }>();
  return <QuestPostDetailScreen postId={postId} header={<AppHeader />} FeedbackDestination={FeedbackDestination} />;
}
