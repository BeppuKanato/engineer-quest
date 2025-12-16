/**
 * 難易度の型
 */
export type DifficultyLevel = "初級" | "中級" | "上級";

/**
 * 難易度ごとの設定（色・背景・ラベル・星）
 */
export const getDifficultyConfig = (difficulty: DifficultyLevel | string) => {
  switch (difficulty) {
    case "初級":
      return {
        color: "#16a34a", // green-600
        bg: "#dcfce7",    // green-100
        label: "初級",
        stars: "⭐",
      };
    case "中級":
      return {
        color: "#ca8a04", // yellow-600
        bg: "#fef9c3",    // yellow-100
        label: "中級",
        stars: "⭐⭐",
      };
    case "上級":
      return {
        color: "#dc2626", // red-600
        bg: "#fee2e2",    // red-100
        label: "上級",
        stars: "⭐⭐⭐",
      };
    default:
      return {
        color: "#4b5563", // gray-600
        bg: "#f3f4f6",    // gray-100
        label: "未設定",
        stars: "⭐",
      };
  }
};

/**
 * 難易度バッジの見た目を提供するコンポーネント
 */
export const MissionDifficultyBadge = ({ difficulty }: { difficulty: DifficultyLevel | string }) => {
  const { color, bg, label, stars } = getDifficultyConfig(difficulty);

  return (
    <div
      className="inline-flex px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap flex items-center gap-1"
      style={{ color, backgroundColor: bg }}
    >
      <span>{stars}</span>
      <span>{label}</span>
    </div>
  );
};
