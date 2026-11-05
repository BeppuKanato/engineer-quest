import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LearningPlayerPreview } from "@/features/learning/player/LearningPlayerPreview";
import { BfsMotivationPreview } from "@/features/learning/bfs/motivation/BfsMotivationPreview";
import { BfsExecutionPreview } from "@/features/learning/bfs/execution/BfsExecutionPreview";
import { BfsCheckPreview } from "@/features/learning/bfs/check/BfsCheckPreview";
import { BfsCodeMappingPreview } from "@/features/learning/bfs/code-mapping/BfsCodeMappingPreview";

export const metadata: Metadata = {
  title: "学習プレイヤー プレビュー",
  robots: { index: false, follow: false },
};

export default async function LearningPreviewPage({ params }: { params: Promise<{ contentId: string }> }) {
  const { contentId } = await params;
  if (contentId === "bfs-motivation") return <BfsMotivationPreview />;
  if (contentId === "bfs-execution") return <BfsExecutionPreview />;
  if (contentId === "bfs-code-mapping") return <BfsCodeMappingPreview />;
  if (contentId === "bfs-check") return <BfsCheckPreview />;
  if (contentId !== "step-demo" && contentId !== "scene-demo") notFound();
  return <LearningPlayerPreview contentId={contentId} />;
}
