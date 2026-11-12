"use client";

import { useParams } from "next/navigation";

import { AppHeader } from "@/app/component/appHeader";
import { FeedbackDestination } from "@/features/feedback/FeedbackV1";
import { CreateQuestDetailScreen } from "@/features/create/CreateQuestDetailScreen";

export default function CreateQuestDetailPage() {
  const { questId } = useParams<{ questId: string }>();
  return <CreateQuestDetailScreen questId={questId} header={<AppHeader />} FeedbackDestination={FeedbackDestination} />;
}
