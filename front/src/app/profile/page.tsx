"use client";

import { AppHeader } from "@/app/component/appHeader";
import { FeedbackDestination } from "@/features/feedback/FeedbackV1";
import { HexadRadarChart } from "@/features/hexad/hexadRadarChart";
import { ProfileScreen } from "@/features/profile/ProfileScreen";

export default function ProfilePage() {
  return <ProfileScreen header={<AppHeader />} FeedbackDestination={FeedbackDestination} HexadRadarChart={HexadRadarChart} />;
}
