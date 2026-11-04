/**
 * 教材専用。アプリの success/primary 等には接続しない。
 * 正本は同じ意味への同じ色と同期強調を要求するが、具体的な状態色は未指定。
 * 以下の配色は #68 の暫定割り当て（README / PR に判断点を記録）。
 */
export const playerTokens = {
  text: "#111827",
  surface: "#ffffff",
  background: "#f8fafc",
  control: "#334155",
  states: {
    idle: { fill: "#ffffff", stroke: "#64748b", label: "未処理", marker: "○" },
    processing: { fill: "#fef3c7", stroke: "#92400e", label: "処理中", marker: "▶" },
    queued: { fill: "#dbeafe", stroke: "#1e40af", label: "キュー待ち", marker: "…" },
    completed: { fill: "#dcfce7", stroke: "#166534", label: "完了", marker: "✓" },
  },
  // 層の背景と状態の輪郭を別の視覚チャンネルにする。
  layers: { layer0: "#f1f5f9", layer1: "#ede9fe", layer2: "#fce7f3" },
} as const;

export type PlayerStatus = keyof typeof playerTokens.states;
export type PlayerLayer = keyof typeof playerTokens.layers;
