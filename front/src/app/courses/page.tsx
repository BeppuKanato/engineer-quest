"use client";

import { AppHeader } from "@/app/component/appHeader";
import { FeedbackDestination } from "@/features/feedback/FeedbackV1";
import { CoursesScreen } from "@/features/learning/catalog/CoursesScreen";

export default function CoursesPage() {
  return <CoursesScreen header={<AppHeader />} FeedbackDestination={FeedbackDestination} />;
}
