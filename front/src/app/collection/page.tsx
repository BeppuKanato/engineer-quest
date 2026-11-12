"use client";

import { AppHeader } from "@/app/component/appHeader";
import { FeedbackDestination } from "@/features/feedback/FeedbackV1";
import { CollectionScreen } from "@/features/collection/CollectionScreen";

export default function CollectionPage() {
  return <CollectionScreen header={<AppHeader />} FeedbackDestination={FeedbackDestination} />;
}
