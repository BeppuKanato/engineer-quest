"use client";

import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import CloseIcon from "@mui/icons-material/Close";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogContent,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useEffect } from "react";

import type { MissionRewardRunResponse } from "@/api/missionRewards.api";
import { getMascotImagePath, type MascotId } from "@/app/component/mascot";

import { AchievementUnlockCard, RewardSparkles } from "./rewardVisuals";

type Achievement = MissionRewardRunResponse["unlockedAchievements"][number];

export const AchievementUnlockModal = ({
  open,
  achievement,
  currentIndex,
  total,
  mascotId,
  isClosing,
  onNext,
}: {
  open: boolean;
  achievement: Achievement | null;
  currentIndex: number;
  total: number;
  mascotId: MascotId;
  isClosing: boolean;
  onNext: () => void;
}) => (
  <Dialog
    open={open}
    onClose={(_, reason) => {
      if (reason === "backdropClick" || reason === "escapeKeyDown") return;
    }}
    disableEscapeKeyDown
    fullWidth
    maxWidth="md"
    aria-labelledby="achievement-unlock-title"
    slotProps={{
      backdrop: {
        sx: { bgcolor: "rgba(7, 27, 77, 0.72)", backdropFilter: "blur(2px)" },
      },
      paper: {
        sx: {
          maxHeight: "calc(100dvh - 24px)",
          overflow: "hidden",
          borderRadius: { xs: 3, md: 5 },
          bgcolor: "rgba(255, 251, 235, 0.98)",
        },
      },
    }}
  >
    <DialogContent sx={{ position: "relative", overflowY: "auto", p: { xs: 2, sm: 3 } }}>
      <RewardSparkles />
      <Stack sx={{ position: "relative", zIndex: 1 }} spacing={2} alignItems="center">
        <Typography
          id="achievement-unlock-title"
          variant="h3"
          fontWeight={900}
          textAlign="center"
          color="#92400e"
          sx={{ fontSize: { xs: 30, sm: 42 } }}
        >
          実績解除！
        </Typography>

        <Box
          sx={{
            width: "100%",
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "180px minmax(0, 1fr)" },
            gap: 2,
            alignItems: "center",
          }}
        >
          <Stack alignItems="center" spacing={1}>
            <Box
              component="img"
              src={getMascotImagePath(mascotId, "happy")}
              alt="実績解除を祝うマスコット"
              sx={{ width: { xs: 110, md: 170 }, height: { xs: 110, md: 170 }, objectFit: "contain" }}
            />
            <Typography
              textAlign="center"
              fontWeight={900}
              color="#0f4bb8"
              sx={{ lineHeight: 1.7 }}
            >
              おめでとう！
              <br />
              新しい実績を達成したよ！
            </Typography>
          </Stack>

          {achievement && (
            <AchievementUnlockCard
              key={achievement.id}
              title={achievement.title}
              description={achievement.description}
              categoryLabel={achievement.categoryLabel}
              progressLabel={`${currentIndex + 1} / ${total}`}
              compact
            />
          )}
        </Box>

        <Button
          variant="contained"
          endIcon={<NavigateNextIcon />}
          disabled={isClosing}
          onClick={onNext}
          sx={{ minHeight: 52, px: 7, fontWeight: 900, borderRadius: 3 }}
        >
          {currentIndex >= total - 1 ? "次へ" : "次の実績"}
        </Button>
      </Stack>
    </DialogContent>
  </Dialog>
);

export const AchievementUnlockSnackbar = ({
  achievements,
  visibleAchievementIds,
  onClose,
}: {
  achievements: Achievement[];
  visibleAchievementIds: string[];
  onClose: (achievementId: string) => void;
}) => {
  const visibleAchievements = achievements.filter((achievement) =>
    visibleAchievementIds.includes(achievement.id)
  );

  if (visibleAchievements.length === 0) return null;

  return (
  <Stack
    role="region"
    aria-label="実績解除通知"
    spacing={1}
    sx={{
      position: "fixed",
      zIndex: (theme) => theme.zIndex.snackbar,
      right: { xs: 1.5, sm: 3 },
      bottom: { xs: 1.5, sm: 3 },
      width: { xs: "calc(100vw - 24px)", sm: 420 },
      maxHeight: "calc(100dvh - 96px)",
      overflowY: "auto",
      flexDirection: "column-reverse",
      scrollbarWidth: "none",
      "&::-webkit-scrollbar": { display: "none" },
    }}
  >
    {visibleAchievements.map((achievement) => (
      <AchievementSnackbarItem
        key={achievement.id}
        achievement={achievement}
        onClose={onClose}
      />
    ))}
  </Stack>
  );
};

const ACHIEVEMENT_SNACKBAR_AUTO_HIDE_MS = 4500;

const AchievementSnackbarItem = ({
  achievement,
  onClose,
}: {
  achievement: Achievement;
  onClose: (achievementId: string) => void;
}) => {
  useEffect(() => {
    const timeoutId = window.setTimeout(
      () => onClose(achievement.id),
      ACHIEVEMENT_SNACKBAR_AUTO_HIDE_MS
    );
    return () => window.clearTimeout(timeoutId);
  }, [achievement.id, onClose]);

  return (
    <Alert
      severity="success"
      variant="filled"
      icon={<EmojiEventsIcon />}
      action={
        <Stack direction="row" alignItems="center">
          <Button
            component={Link}
            href="/achievements"
            color="inherit"
            size="small"
            sx={{ fontWeight: 900, whiteSpace: "nowrap" }}
          >
            一覧
          </Button>
          <IconButton
            aria-label={`「${achievement.title}」の実績解除通知を閉じる`}
            color="inherit"
            size="small"
            onClick={() => onClose(achievement.id)}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>
      }
      aria-live="polite"
      sx={{
        width: "100%",
        alignItems: "center",
        boxShadow: "0 10px 28px rgba(15, 23, 42, 0.24)",
      }}
    >
      <Typography fontWeight={900}>実績を解除しました</Typography>
      <Typography variant="body2" fontWeight={800}>
        「{achievement.title}」
      </Typography>
    </Alert>
  );
};
