import type { Metadata } from "next";

import { BinarySearchMotivationPreview } from "@/features/learning/binary-search/motivation/BinarySearchMotivationPreview";

export const metadata: Metadata = {
  title: "学習プレイヤー プレビュー",
  robots: { index: false, follow: false },
};

/**
 * 二分探索単元の単体プレビュー。フェーズ2以降のプレビューはこのページへ追加していく。
 * 現時点ではフェーズ1（導入）のみを表示する。
 */
export default function BinarySearchUnitPreviewPage() {
  return <BinarySearchMotivationPreview />;
}
