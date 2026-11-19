"use client";

import BuildIcon from "@mui/icons-material/Build";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import FlagIcon from "@mui/icons-material/Flag";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import SchoolIcon from "@mui/icons-material/School";
import StarsIcon from "@mui/icons-material/Stars";
import { Box, Stack, Typography } from "@mui/material";

import type { QuestBoardAuthorInfo } from "@/api/questBoard.api";
import { isMascotId } from "@/app/component/mascot";
import { MascotFigure } from "@/app/component/mascotFigure";

const achievementIcons = {
  build: BuildIcon, course: SchoolIcon, challenge: FlagIcon,
  perfect: StarsIcon, knowledge: MenuBookIcon,
};

/** 掲示板内だけの著者表示。プロフィールへのリンクや操作は持たない。 */
export function QuestBoardAuthor({ author, isDeleted = false }: { author: QuestBoardAuthorInfo; isDeleted?: boolean }) {
  // キャッシュ等に追加情報が残っていても、削除済み投稿では描画しない。
  if (isDeleted) return <Typography variant="body2" color="text.secondary">削除済み投稿</Typography>;
  const achievement = author.authorAchievement;
  const Icon = achievement && Object.hasOwn(achievementIcons, achievement.iconKey)
    ? achievementIcons[achievement.iconKey as keyof typeof achievementIcons] : EmojiEventsIcon;
  return <Stack data-board-author direction="row" gap={1} alignItems="center" flexWrap="wrap" sx={{ minWidth: 0, maxWidth: "100%" }}>
    <MascotFigure mascotId={isMascotId(author.authorMascotId) ? author.authorMascotId : "red-panda"}
      alt={`${author.authorName}のマスコット`} size="S" grounding="frame" presentation="circle" motion="none" />
    <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: "anywhere" }}>{author.authorName}</Typography>
    {achievement && <Box data-profile-achievement sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, px: 1, py: 0.5, borderRadius: 1.5, bgcolor: "#eaf2ff", color: "#0052d9", minWidth: 0, maxWidth: "100%" }}>
      <Icon aria-hidden sx={{ fontSize: 18, flexShrink: 0 }} />
      <Typography component="span" variant="caption" sx={{ fontWeight: 800, overflowWrap: "anywhere" }}>{achievement.title}</Typography>
    </Box>}
  </Stack>;
}
