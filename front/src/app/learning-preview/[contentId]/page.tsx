import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LearningPlayerPreview } from "@/features/learning/player/LearningPlayerPreview";

export const metadata: Metadata = {
  title: "学習プレイヤー プレビュー",
  robots: { index: false, follow: false },
};

export default async function LearningPreviewPage({ params }: { params: Promise<{ contentId: string }> }) {
  const { contentId } = await params;
  if (contentId !== "step-demo" && contentId !== "scene-demo") notFound();
  return <LearningPlayerPreview contentId={contentId} />;
}
