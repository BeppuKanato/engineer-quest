"use client";

import { AppHeader } from "@/app/component/appHeader";
import { MyWorksScreen } from "@/features/create/MyWorksScreen";

export default function MyWorksPage() {
  return <MyWorksScreen header={<AppHeader />} />;
}
