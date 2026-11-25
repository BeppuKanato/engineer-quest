"use client";

import BugReportRoundedIcon from "@mui/icons-material/BugReportRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CodeRoundedIcon from "@mui/icons-material/CodeRounded";
import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import FlagRoundedIcon from "@mui/icons-material/FlagRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import NoteAltRoundedIcon from "@mui/icons-material/NoteAltRounded";
import PaletteRoundedIcon from "@mui/icons-material/PaletteRounded";
import { Box, Typography } from "@mui/material";
import type { ComponentType } from "react";

import type { QuestPostCategory, QuestPostStatus } from "@/api/questBoard.api";

/** カテゴリの図像。色では区別しない（色分けは状態と行動だけに使う）。 */
export const categoryIcons: Record<QuestPostCategory, ComponentType<{ sx?: object }>> = {
  QUESTION: HelpOutlineRoundedIcon,
  ERROR_HELP: BugReportRoundedIcon,
  WORK_SHARE: PaletteRoundedIcon,
  CODE_SHARE: CodeRoundedIcon,
  MEMO: NoteAltRoundedIcon,
  REFERENCE: LinkRoundedIcon,
};

const chipBase = {
  display: "inline-flex",
  alignItems: "center",
  gap: 0.6,
  px: 1.25,
  height: 30,
  borderRadius: 999,
  whiteSpace: "nowrap" as const,
};

export function CategoryChip({ category, label }: { category: QuestPostCategory; label: string }) {
  const Icon = categoryIcons[category];
  return (
    <Box sx={{ ...chipBase, bgcolor: "#fff", border: "1px solid #cbd5e1" }}>
      <Icon sx={{ fontSize: 17, color: "#334155" }} />
      <Typography component="span" sx={{ fontSize: 14, fontWeight: 700 }}>{label}</Typography>
    </Box>
  );
}

/** 質問・エラー相談だけが持つ状態。解決済み＝緑、受付中＝青の輪郭。
 *  まだ回答が無い受付中は「回答募集中」と呼びかけの文にする。 */
export function StatusChip({ status, commentCount }: { status: QuestPostStatus; commentCount: number }) {
  if (status === "RESOLVED") {
    return (
      <Box sx={{ ...chipBase, bgcolor: "#dcfce7" }}>
        <CheckCircleRoundedIcon sx={{ fontSize: 17, color: "#16a34a" }} />
        <Typography component="span" sx={{ fontSize: 14, fontWeight: 800, color: "#166534" }}>解決済み</Typography>
      </Box>
    );
  }
  return (
    <Box sx={{ ...chipBase, bgcolor: "#eff6ff", border: "1px solid #2563eb" }}>
      <HelpOutlineRoundedIcon sx={{ fontSize: 17, color: "#2563eb" }} />
      <Typography component="span" sx={{ fontSize: 14, fontWeight: 800, color: "#2563eb" }}>
        {commentCount === 0 ? "回答募集中" : "回答受付中"}
      </Typography>
    </Box>
  );
}

export function CourseChip({ title }: { title: string }) {
  return (
    <Box sx={{ ...chipBase, bgcolor: "#f1f5f9" }}>
      <MenuBookRoundedIcon sx={{ fontSize: 17, color: "#334155" }} />
      <Typography component="span" sx={{ fontSize: 14, fontWeight: 700 }}>{title}</Typography>
    </Box>
  );
}

/** 発展ミッションへの関連付け。単元チップと並ぶ、もう一つの関連先。 */
export function MissionChip({ title }: { title: string }) {
  return (
    <Box sx={{ ...chipBase, bgcolor: "#f1f5f9" }}>
      <FlagRoundedIcon sx={{ fontSize: 17, color: "#334155" }} />
      <Typography component="span" sx={{ fontSize: 14, fontWeight: 700 }}>発展ミッション『{title}』</Typography>
    </Box>
  );
}

export const isResolvableCategory = (category: QuestPostCategory) =>
  category === "QUESTION" || category === "ERROR_HELP";
