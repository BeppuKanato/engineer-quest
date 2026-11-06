import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LearningPlayerPreview } from "@/features/learning/player/LearningPlayerPreview";
import { BfsMotivationPreview } from "@/features/learning/bfs/motivation/BfsMotivationPreview";
import { BfsExecutionPreview } from "@/features/learning/bfs/execution/BfsExecutionPreview";
import { BfsCheckPreview } from "@/features/learning/bfs/check/BfsCheckPreview";
import { BfsCodeMappingPreview } from "@/features/learning/bfs/code-mapping/BfsCodeMappingPreview";
import { BfsCodeCheckPreview } from "@/features/learning/bfs/code-check/BfsCodeCheckPreview";
import { BfsConsolidationPreview } from "@/features/learning/bfs/consolidation/BfsConsolidationPreview";
import { BfsImplementationPreview } from "@/features/learning/bfs/implementation/BfsImplementationPreview";
import { BfsUnitPreview } from "@/features/learning/bfs/unit/BfsUnitPreview";
import { DfsMotivationPreview } from "@/features/learning/dfs/motivation/DfsMotivationPreview";
import { DfsExecutionPreview } from "@/features/learning/dfs/execution/DfsExecutionPreview";
import { DfsCheckPreview } from "@/features/learning/dfs/check/DfsCheckPreview";
import { DfsCodeMappingPreview } from "@/features/learning/dfs/code-mapping/DfsCodeMappingPreview";
import { WallExtensionMotivationPreview } from "@/features/learning/wall-extension/motivation/WallExtensionMotivationPreview";
import { WallExtensionExecutionPreview } from "@/features/learning/wall-extension/execution/WallExtensionExecutionPreview";
import { WallExtensionCheckPreview } from "@/features/learning/wall-extension/check/WallExtensionCheckPreview";
import { WallExtensionCodeMappingPreview } from "@/features/learning/wall-extension/code-mapping/WallExtensionCodeMappingPreview";
import { WallExtensionCodeCheckPreview } from "@/features/learning/wall-extension/code-check/WallExtensionCodeCheckPreview";
import { WallExtensionConsolidationPreview } from "@/features/learning/wall-extension/consolidation/WallExtensionConsolidationPreview";
import { WallExtensionImplementationPreview } from "@/features/learning/wall-extension/implementation/WallExtensionImplementationPreview";
import { BubbleSortMotivationPreview } from "@/features/learning/bubble-sort/motivation/BubbleSortMotivationPreview";
import { BubbleSortExecutionPreview } from "@/features/learning/bubble-sort/execution/BubbleSortExecutionPreview";
import { BubbleSortCheckPreview } from "@/features/learning/bubble-sort/check/BubbleSortCheckPreview";
import { BubbleSortCodeMappingPreview } from "@/features/learning/bubble-sort/code-mapping/BubbleSortCodeMappingPreview";
import { BubbleSortCodeCheckPreview } from "@/features/learning/bubble-sort/code-check/BubbleSortCodeCheckPreview";
import { BubbleSortConsolidationPreview } from "@/features/learning/bubble-sort/consolidation/BubbleSortConsolidationPreview";
import { BubbleSortImplementationPreview } from "@/features/learning/bubble-sort/implementation/BubbleSortImplementationPreview";
import { BubbleSortUnitPreview } from "@/features/learning/bubble-sort/unit/BubbleSortUnitPreview";

export const metadata: Metadata = {
  title: "学習プレイヤー プレビュー",
  robots: { index: false, follow: false },
};

export default async function LearningPreviewPage({ params }: { params: Promise<{ contentId: string }> }) {
  const { contentId } = await params;
  if (contentId === "bubble-sort-unit") return <BubbleSortUnitPreview />;
  if (contentId === "bubble-sort-motivation") return <BubbleSortMotivationPreview />;
  if (contentId === "bubble-sort-execution") return <BubbleSortExecutionPreview />;
  if (contentId === "bubble-sort-check") return <BubbleSortCheckPreview />;
  if (contentId === "bubble-sort-code-mapping") return <BubbleSortCodeMappingPreview />;
  if (contentId === "bubble-sort-code-check") return <BubbleSortCodeCheckPreview />;
  if (contentId === "bubble-sort-consolidation") return <BubbleSortConsolidationPreview />;
  if (contentId === "bubble-sort-implementation") return <BubbleSortImplementationPreview />;
  if (contentId === "wall-extension-motivation") return <WallExtensionMotivationPreview />;
  if (contentId === "wall-extension-execution") return <WallExtensionExecutionPreview />;
  if (contentId === "wall-extension-check") return <WallExtensionCheckPreview />;
  if (contentId === "wall-extension-code-mapping") return <WallExtensionCodeMappingPreview />;
  if (contentId === "wall-extension-code-check") return <WallExtensionCodeCheckPreview />;
  if (contentId === "wall-extension-consolidation") return <WallExtensionConsolidationPreview />;
  if (contentId === "wall-extension-implementation") return <WallExtensionImplementationPreview />;
  if (contentId === "dfs-motivation") return <DfsMotivationPreview />;
  if (contentId === "dfs-execution") return <DfsExecutionPreview />;
  if (contentId === "dfs-check") return <DfsCheckPreview />;
  if (contentId === "dfs-code-mapping") return <DfsCodeMappingPreview />;
  if (contentId === "bfs-unit") return <BfsUnitPreview />;
  if (contentId === "bfs-motivation") return <BfsMotivationPreview />;
  if (contentId === "bfs-execution") return <BfsExecutionPreview />;
  if (contentId === "bfs-consolidation") return <BfsConsolidationPreview />;
  if (contentId === "bfs-implementation") return <BfsImplementationPreview />;
  if (contentId === "bfs-code-check") return <BfsCodeCheckPreview />;
  if (contentId === "bfs-code-mapping") return <BfsCodeMappingPreview />;
  if (contentId === "bfs-check") return <BfsCheckPreview />;
  if (contentId !== "step-demo" && contentId !== "scene-demo") notFound();
  return <LearningPlayerPreview contentId={contentId} />;
}
