import { MISSION_TYPE } from "@/type";
import { Zap, Target, Award } from "lucide-react";

/**
 * ミッションタイプ別の設定（色・ラベル・アイコンなど）
 */
export const getMissionTypeConfig = (type: MISSION_TYPE) => {
  switch (type) {
    case MISSION_TYPE.MAIN:
      return { color: "#f33636ff", label: "メイン", icon: Zap };
    case MISSION_TYPE.SUB:
      return { color: "#60a5fa", label: "サブ", icon: Target };
    case MISSION_TYPE.PROMOTION:
      return { color: "#9b5de5", label: "昇進", icon: Award };
    default:
      return { color: "#6b7280", label: "未設定", icon: Target };
  }
};

/**
 * ミッションタイプバッジの見た目を提供するコンポーネント
 */
export const MissionTypeBadge = ({ type }: { type: MISSION_TYPE }) => {
  const { color, label, icon: Icon } = getMissionTypeConfig(type);

  return (
    <div
      className="px-2 py-1 rounded-full text-white flex items-center gap-1"
      style={{ backgroundColor: color }}
    >
      <Icon className="w-3 h-3" />
      <span className="text-xs font-medium">{label}</span>
    </div>
  );
};
