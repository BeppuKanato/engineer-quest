"use client";

import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import { Box, Chip, Paper, Stack, Typography } from "@mui/material";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

import type { KnowledgeCardChoice } from "@/app/mission/[missionId]/play/type";

export const rewardPalette = {
  blue: "#2563eb",
  deepBlue: "#1d4ed8",
  cyan: "#06b6d4",
  gold: "#f59e0b",
  goldDeep: "#b45309",
  softGold: "#fff7d6",
  paper: "rgba(255, 255, 255, 0.92)",
};

export const rarityTone: Record<
  string,
  { label: string; color: string; bgcolor: string; border: string; glow: string }
> = {
  COMMON: {
    label: "COMMON",
    color: "#334155",
    bgcolor: "#f8fafc",
    border: "#cbd5e1",
    glow: "0 18px 42px rgba(100, 116, 139, 0.16)",
  },
  RARE: {
    label: "RARE",
    color: "#1d4ed8",
    bgcolor: "#eff6ff",
    border: "#93c5fd",
    glow: "0 22px 56px rgba(37, 99, 235, 0.24)",
  },
  EPIC: {
    label: "EPIC",
    color: "#7e22ce",
    bgcolor: "#faf5ff",
    border: "#d8b4fe",
    glow: "0 24px 64px rgba(126, 34, 206, 0.28)",
  },
};

export const getRarityTone = (rarity: string) =>
  rarityTone[rarity] ?? rarityTone.COMMON;

export const RewardSparkles = () => (
  <Box aria-hidden sx={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
    {[...Array(16)].map((_, index) => {
      const left = 6 + ((index * 17) % 88);
      const top = 7 + ((index * 23) % 76);
      const delay = index * 0.08;
      const size = index % 3 === 0 ? 10 : 6;

      return (
        <Box
          key={index}
          component={motion.div}
          initial={{ opacity: 0, scale: 0.5, y: 8 }}
          animate={{ opacity: [0, 0.72, 0.24], scale: [0.5, 1, 0.8], y: [8, -6, 0] }}
          transition={{ duration: 2.8, delay, repeat: Infinity, repeatType: "mirror" }}
          sx={{
            position: "absolute",
            left: `${left}%`,
            top: `${top}%`,
            width: size,
            height: size,
            borderRadius: "50%",
            bgcolor: index % 2 === 0 ? "#facc15" : "#60a5fa",
            boxShadow: index % 2 === 0 ? "0 0 20px rgba(250, 204, 21, 0.7)" : "0 0 18px rgba(96, 165, 250, 0.6)",
          }}
        />
      );
    })}
  </Box>
);

export const RewardPageShell = ({
  children,
  maxWidth = 1040,
}: {
  children: ReactNode;
  maxWidth?: number;
}) => (
  <Box
    component={motion.main}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.45 }}
    sx={{
      position: "relative",
      minHeight: "calc(100vh - 64px)",
      overflow: "hidden",
      px: { xs: 2, md: 4 },
      py: { xs: 4, md: 6 },
      background:
        "radial-gradient(circle at 50% 0%, rgba(250, 204, 21, 0.2) 0%, rgba(250, 204, 21, 0) 28%), radial-gradient(circle at 10% 18%, rgba(96, 165, 250, 0.2), transparent 24%), linear-gradient(180deg, #eff6ff 0%, #f8fafc 48%, #ffffff 100%)",
    }}
  >
    <RewardSparkles />
    <Box sx={{ position: "relative", zIndex: 1, maxWidth, mx: "auto" }}>{children}</Box>
  </Box>
);

export const RewardHero = ({
  chip,
  title,
  subtitle,
}: {
  chip: string;
  title: string;
  subtitle: string;
}) => (
  <Stack
    component={motion.div}
    initial={{ opacity: 0, y: 18 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.48 }}
    spacing={1.5}
    alignItems="center"
    textAlign="center"
    sx={{ mb: 3 }}
  >
    <Chip
      icon={<AutoAwesomeIcon />}
      label={chip}
      sx={{
        px: 0.5,
        borderRadius: 999,
        fontWeight: 900,
        color: rewardPalette.deepBlue,
        bgcolor: "rgba(219, 234, 254, 0.9)",
        border: "1px solid #bfdbfe",
        "& .MuiChip-icon": { color: "inherit" },
      }}
    />
    <Typography variant="h3" fontWeight={900} letterSpacing={0} sx={{ color: "#0f172a", fontSize: { xs: 34, md: 50 } }}>
      {title}
    </Typography>
    <Typography color="text.secondary" sx={{ maxWidth: 680, lineHeight: 1.8, fontWeight: 700 }}>
      {subtitle}
    </Typography>
  </Stack>
);

export const AchievementUnlockCard = ({
  title,
  description,
  categoryLabel,
  progressLabel,
}: {
  title: string;
  description: string;
  categoryLabel: string;
  progressLabel: string;
}) => (
  <Paper
    component={motion.div}
    key={title}
    initial={{ opacity: 0, y: 24, scale: 0.98 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: -18, scale: 0.98 }}
    transition={{ duration: 0.38, ease: "easeOut" }}
    elevation={0}
    sx={{
      position: "relative",
      p: { xs: 3, md: 5 },
      borderRadius: 4,
      border: "1px solid rgba(245, 158, 11, 0.45)",
      background: "linear-gradient(145deg, rgba(255,255,255,0.96), rgba(255, 247, 214, 0.9))",
      boxShadow: "0 28px 76px rgba(180, 83, 9, 0.22)",
      overflow: "hidden",
    }}
  >
    <RewardSparkles />
    <Stack spacing={2.2} alignItems="center" textAlign="center" sx={{ position: "relative", zIndex: 1 }}>
      <Box
        component={motion.div}
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.42, delay: 0.08, type: "spring", stiffness: 220 }}
        sx={{
          width: 132,
          height: 132,
          borderRadius: "50%",
          display: "grid",
          placeItems: "center",
          background: "radial-gradient(circle, rgba(250, 204, 21, 0.48), rgba(255, 247, 214, 0.3) 56%, rgba(255,255,255,0) 72%)",
          color: rewardPalette.gold,
        }}
      >
        <EmojiEventsIcon sx={{ fontSize: 84, filter: "drop-shadow(0 10px 18px rgba(217, 119, 6, 0.28))" }} />
      </Box>
      <Chip label="ACHIEVEMENT UNLOCKED" sx={{ fontWeight: 900, color: rewardPalette.goldDeep, bgcolor: "#fef3c7" }} />
      <Typography variant="caption" color="text.secondary" fontWeight={900}>
        {progressLabel}
      </Typography>
      <Typography
        component={motion.h1}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, delay: 0.2 }}
        variant="h4"
        fontWeight={900}
      >
        {title}
      </Typography>
      <Typography color="text.secondary" sx={{ maxWidth: 560, lineHeight: 1.85, fontWeight: 700 }}>
        {description}
      </Typography>
      <Chip label={categoryLabel} size="small" sx={{ fontWeight: 900, border: "1px solid #fde68a", bgcolor: "#fff" }} />
    </Stack>
  </Paper>
);

export const KnowledgeCardRewardCard = ({
  card,
  selected,
  disabled,
  index,
  onSelect,
  revealed = true,
  acquired = false,
}: {
  card: KnowledgeCardChoice;
  selected: boolean;
  disabled: boolean;
  index: number;
  onSelect: () => void;
  revealed?: boolean;
  acquired?: boolean;
}) => {
  const tone = getRarityTone(card.rarity);

  return (
    <Paper
      component={motion.button}
      type="button"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0, scale: acquired ? 1.08 : selected ? 1.04 : 1 }}
      whileHover={disabled ? undefined : { y: -8, scale: selected ? 1.04 : 1.02 }}
      transition={{ duration: 0.36, delay: 0.12 + index * 0.08 }}
      onClick={onSelect}
      disabled={disabled}
      elevation={0}
      sx={{
        appearance: "none",
        width: "100%",
        minHeight: 318,
        p: 0,
        borderRadius: 3,
        textAlign: "left",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled && !selected ? 0.55 : 1,
        border: "none",
        background: "transparent",
        boxShadow: "none",
        perspective: 1200,
      }}
    >
      <Box
        component={motion.div}
        animate={{ rotateY: revealed ? 180 : 0 }}
        transition={{ duration: 0.72, ease: [0.2, 0.8, 0.2, 1] }}
        sx={{
          position: "relative",
          width: "100%",
          minHeight: 318,
          transformStyle: "preserve-3d",
        }}
      >
        <Stack
          spacing={2.2}
          sx={{
            position: "absolute",
            inset: 0,
            minHeight: 318,
            p: 2.5,
            borderRadius: 2,
            justifyContent: "space-between",
            overflow: "hidden",
            backfaceVisibility: "hidden",
            border: `2px solid ${selected ? tone.border : "#dbe3ef"}`,
            color: tone.color,
            background:
              card.rarity === "EPIC"
                ? "radial-gradient(circle at 50% 28%, rgba(216, 180, 254, 0.55), transparent 30%), linear-gradient(145deg, #312e81 0%, #6d28d9 48%, #111827 100%)"
                : card.rarity === "RARE"
                  ? "radial-gradient(circle at 50% 28%, rgba(147, 197, 253, 0.6), transparent 30%), linear-gradient(145deg, #1e3a8a 0%, #2563eb 48%, #0f172a 100%)"
                  : "radial-gradient(circle at 50% 28%, rgba(203, 213, 225, 0.44), transparent 30%), linear-gradient(145deg, #334155 0%, #64748b 48%, #0f172a 100%)",
            boxShadow: selected ? tone.glow : "0 16px 38px rgba(15, 23, 42, 0.08)",
            "&::before": {
              content: '""',
              position: "absolute",
              inset: 14,
              borderRadius: 2,
              border: "1px solid rgba(255,255,255,0.28)",
            },
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" sx={{ position: "relative", zIndex: 1 }}>
            <Chip label="Knowledge Card" size="small" sx={{ fontWeight: 900, color: "#0f172a", bgcolor: "rgba(255,255,255,0.88)" }} />
            <Chip label={tone.label} size="small" sx={{ fontWeight: 900, color: tone.color, bgcolor: "rgba(255,255,255,0.92)", border: `1px solid ${tone.border}` }} />
          </Stack>
          <Stack alignItems="center" spacing={1.5} sx={{ position: "relative", zIndex: 1, textAlign: "center" }}>
            <Box
              sx={{
                width: 92,
                height: 92,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                color: "#fff",
                bgcolor: "rgba(255,255,255,0.14)",
                border: "1px solid rgba(255,255,255,0.28)",
                boxShadow: card.rarity === "COMMON" ? "none" : `0 0 42px ${tone.border}`,
              }}
            >
              <AutoAwesomeIcon sx={{ fontSize: 48 }} />
            </Box>
            <Typography variant="h4" fontWeight={900} color="#fff">
              ???
            </Typography>
          </Stack>
          <Typography sx={{ position: "relative", zIndex: 1, color: "rgba(255,255,255,0.72)", fontWeight: 800, textAlign: "center" }}>
            1枚選んで入手します
          </Typography>
        </Stack>

        <Stack
          spacing={2}
          sx={{
            position: "absolute",
            inset: 0,
            minHeight: 318,
            p: 2.5,
            borderRadius: 2,
            textAlign: "left",
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            border: `2px solid ${selected ? tone.border : "#dbe3ef"}`,
            background: selected
              ? `linear-gradient(145deg, #ffffff 0%, ${tone.bgcolor} 100%)`
              : "linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)",
            boxShadow: acquired ? `0 0 86px ${tone.border}` : selected ? tone.glow : "0 16px 38px rgba(15, 23, 42, 0.08)",
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <Chip label={card.label} size="small" sx={{ fontWeight: 900, bgcolor: "#fff" }} />
            <Chip label={tone.label} size="small" sx={{ fontWeight: 900, color: tone.color, bgcolor: tone.bgcolor, border: `1px solid ${tone.border}` }} />
            {selected && <Chip label={acquired ? "ACQUIRED" : "SELECTED"} size="small" color={acquired ? "success" : "primary"} sx={{ fontWeight: 900 }} />}
          </Stack>
          <Box
            sx={{
              width: 54,
              height: 54,
              borderRadius: 2,
              display: "grid",
              placeItems: "center",
              color: tone.color,
              bgcolor: tone.bgcolor,
              border: `1px solid ${tone.border}`,
            }}
          >
            <WorkspacePremiumIcon />
          </Box>
          <Typography variant="h5" fontWeight={900} color="#0f172a">
            {card.title}
          </Typography>
          <Typography color="text.secondary" sx={{ lineHeight: 1.8, fontWeight: 650 }}>
            {card.description}
          </Typography>
        </Stack>
      </Box>
    </Paper>
  );
};

export const RewardSummaryCard = ({
  icon,
  label,
  value,
  tone = "blue",
}: {
  icon: ReactNode;
  label: string;
  value: string;
  tone?: "blue" | "green" | "gold";
}) => {
  const styles = {
    blue: { bg: "linear-gradient(135deg, #2563eb, #06b6d4)", color: "#fff" },
    green: { bg: "linear-gradient(135deg, #16a34a, #22c55e)", color: "#fff" },
    gold: { bg: "linear-gradient(135deg, #f59e0b, #facc15)", color: "#422006" },
  }[tone];

  return (
    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, color: styles.color, background: styles.bg, boxShadow: "0 20px 48px rgba(15, 23, 42, 0.16)" }}>
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Box sx={{ width: 48, height: 48, borderRadius: 2, display: "grid", placeItems: "center", bgcolor: "rgba(255,255,255,0.22)" }}>
          {icon}
        </Box>
        <Box>
          <Typography sx={{ opacity: 0.88, fontWeight: 900 }}>{label}</Typography>
          <Typography variant="h4" fontWeight={900}>{value}</Typography>
        </Box>
      </Stack>
    </Paper>
  );
};

export const LearnedItem = ({ children }: { children: ReactNode }) => (
  <Stack direction="row" spacing={1.25} alignItems="flex-start" sx={{ p: 1.5, borderRadius: 2, bgcolor: "#eff6ff", border: "1px solid #bfdbfe" }}>
    <CheckCircleIcon sx={{ color: "#16a34a", mt: 0.15 }} />
    <Typography fontWeight={800} color="#1e293b">{children}</Typography>
  </Stack>
);
