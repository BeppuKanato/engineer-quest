"use client";

import { AppHeader } from "@/app/component/appHeader";
import { FeedbackDestination } from "@/features/feedback/FeedbackV1";
import { HomeScreen } from "@/features/home/HomeScreen";
import { ContinueLearning } from "@/features/learning/catalog/ContinueLearning";
import { HomeUnitGrid } from "@/features/learning/catalog/HomeUnitGrid";
import { BigGoalBanner } from "@/features/learning/big-goal/BigGoalBanner";

export default function HomePage() {
  return <HomeScreen header={<AppHeader />} continueLearning={<ContinueLearning />}
    bigGoal={<BigGoalBanner />} unitGrid={<HomeUnitGrid />} FeedbackDestination={FeedbackDestination} />;
}
