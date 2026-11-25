"use client";

// 目標の旗トグル（2026-11-23）：同じ役割のものは同じUIにするため、コース一覧の
// カードと単元画面の帯で同じ部品を使う。オフ＝白丸に旗の輪郭、オン＝主色のピルに
// 旗＋「目標」の文字（状態をアイコンだけにしない）。目標は1つだけ（goalStore）。
import { Box, Tooltip } from "@mui/material";
import FlagIcon from "@mui/icons-material/Flag";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";

import { goalStore, useGoalCourseId } from "./goalStore";

const PRIMARY = "#2563eb";
const TEXT = "#111827";
const BORDER = "#dbe3ef";

export const GoalFlag: React.FC<{
  courseId: string;
  title: string;
  /** カード上など、右上に絶対配置する場合に使う。 */
  absolute?: boolean;
  onToggle?: (nowGoal: boolean) => void;
}> = ({ courseId, title, absolute = false, onToggle }) => {
  const goalCourseId = useGoalCourseId();
  const isGoal = goalCourseId === courseId;
  const toggle = () => {
    goalStore.toggle(courseId);
    onToggle?.(!isGoal);
  };
  return (
    <Tooltip title={isGoal ? "目標を外す" : "目標にする"}>
      <Box
        component="span"
        role="button"
        aria-label={isGoal ? `${title}の目標を外す` : `${title}を目標にする`}
        aria-pressed={isGoal}
        tabIndex={0}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          toggle();
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            event.stopPropagation();
            toggle();
          }
        }}
        sx={{
          ...(absolute ? { position: "absolute", top: 12, right: 12, zIndex: 2 } : {}),
          display: "inline-flex",
          alignItems: "center",
          gap: 0.5,
          height: 40,
          px: isGoal ? 1.5 : 0,
          width: isGoal ? "auto" : 40,
          justifyContent: "center",
          borderRadius: 999,
          bgcolor: isGoal ? PRIMARY : "#fff",
          color: isGoal ? "#fff" : TEXT,
          border: isGoal ? `1px solid ${PRIMARY}` : `1px solid ${BORDER}`,
          boxShadow: "0 2px 6px rgba(15, 40, 90, 0.25)",
          cursor: "pointer",
          fontSize: 14,
          fontWeight: 800,
          lineHeight: 1,
          flexShrink: 0,
        }}
      >
        {isGoal ? <FlagIcon sx={{ fontSize: 18 }} /> : <FlagOutlinedIcon sx={{ fontSize: 20 }} />}
        {isGoal && "目標"}
      </Box>
    </Tooltip>
  );
};
