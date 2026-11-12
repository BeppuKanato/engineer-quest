"use client";

import { AppHeader } from "@/app/component/appHeader";
import { FeedbackDestination } from "@/features/feedback/FeedbackV1";
import { CreateScreen } from "@/features/create/CreateScreen";

export default function CreatePage() {
  return <CreateScreen header={<AppHeader />} FeedbackDestination={FeedbackDestination} />;
}
