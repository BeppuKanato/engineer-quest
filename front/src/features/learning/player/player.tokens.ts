/**
 * 教材専用。アプリの success/primary 等には接続しない。
 * 正本: docs/concept/learning-player-ui.md §2・4。
 */
export const playerTokens = {
  text: "#111827",
  surface: "#ffffff",
  background: "#ffffff",
  control: "#111827",
  focus: "#2563eb",
  transitionMs: 600,
  // 自動再生の最小間隔。コンテンツが短く指定してもプレイヤー側でこの下限を守る（UI定義 §4）。
  autoplayFloorMs: 2500,
  states: {
    idle: { fill: "#ffffff", stroke: "#9ca3af", label: "未処理" },
    processing: { fill: "#2563eb", stroke: "#1d4ed8", label: "処理中" },
    queued: { fill: "#f5e7c1", stroke: "#c9a227", label: "キュー待ち" },
    completed: { fill: "#e5e7eb", stroke: "#9ca3af", label: "完了" },
  },
  // 層の背景と状態の輪郭を別の視覚チャンネルにする。
  layers: { layer0: "#f3f4f6", layer1: "#e5e7eb", layer2: "#f3f4f6" },
} as const;

export type PlayerStatus = keyof typeof playerTokens.states;
export type PlayerLayer = keyof typeof playerTokens.layers;
