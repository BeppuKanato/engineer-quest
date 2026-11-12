"use client";

import { useParams } from "next/navigation";

import { AppHeader } from "@/app/component/appHeader";
import { FeedbackDestination, FeedbackObservation } from "@/features/feedback/FeedbackV1";
import { CreateQuestWorkScreen } from "@/features/create/CreateQuestWorkScreen";

export default function CreateQuestWorkPage() {
  const { questId } = useParams<{ questId: string }>();
  return <CreateQuestWorkScreen questId={questId} header={<AppHeader />} FeedbackDestination={FeedbackDestination} FeedbackObservation={FeedbackObservation} />;
}
