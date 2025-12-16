/**
 * 試験タイプの型
 */
export type ExamType = "REPRODUCTION" | "FREE_CREATION" | "HYBRID";

/**
 * 試験タイプごとの設定（色・背景・アイコン・ラベル）
 */
export const getExamTypeConfig = (type: ExamType | string) => {
  switch (type) {
    case "REPRODUCTION":
      return {
        color: "#2563eb", // blue-600
        bg: "#dbeafe",    // blue-100
        icon: "🧩",        // or <CodeIcon />など
        label: "再現形式",
        description: "サンプル画面を再現する試験",
      };
    case "FREE_CREATION":
      return {
        color: "#16a34a", // green-600
        bg: "#dcfce7",    // green-100
        icon: "💡",
        label: "自由制作",
        description: "要件に沿って自由に作成する試験",
      };
    case "HYBRID":
      return {
        color: "#ca8a04", // yellow-600
        bg: "#fef9c3",    // yellow-100
        icon: "⚙️",
        label: "複合形式",
        description: "サンプルと要件の両方を満たす試験",
      };
    default:
      return {
        color: "#4b5563",
        bg: "#f3f4f6",
        icon: "❓",
        label: "不明な形式",
        description: "",
      };
  }
};

/**
 * 試験タイプバッジの見た目を提供するコンポーネント
 */
export const MissionExamTypeBadge = ({ type }: { type: ExamType | string }) => {
  const { color, bg, icon, label } = getExamTypeConfig(type);

  return (
    <div
      className="px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap flex items-center gap-1"
      style={{ color, backgroundColor: bg }}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </div>
  );
};
