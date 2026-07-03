"use client";

import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import LockIcon from "@mui/icons-material/Lock";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import { Box, Chip, Paper, Stack, Typography } from "@mui/material";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

import type { KnowledgeCardChoice } from "@/app/mission/[missionId]/play/type";

export const rewardPalette = {
  blue: "#0052d9",
  deepBlue: "#003caa",
  cyan: "#06b6d4",
  gold: "#f59e0b",
  goldDeep: "#a16207",
  softGold: "#fff7d6",
  paper: "rgba(255, 255, 255, 0.94)",
};

export const rarityTone: Record<
  string,
  { label: string; color: string; bgcolor: string; border: string; glow: string }
> = {
  COMMON: {
    label: "COMMON",
    color: "#0f766e",
    bgcolor: "#e6fffb",
    border: "#99f6e4",
    glow: "0 20px 52px rgba(15, 118, 110, 0.22)",
  },
  RARE: {
    label: "RARE",
    color: "#1d4ed8",
    bgcolor: "#eff6ff",
    border: "#93c5fd",
    glow: "0 22px 58px rgba(37, 99, 235, 0.26)",
  },
  EPIC: {
    label: "EPIC",
    color: "#7e22ce",
    bgcolor: "#faf5ff",
    border: "#d8b4fe",
    glow: "0 24px 68px rgba(126, 34, 206, 0.3)",
  },
};

export const getRarityTone = (rarity: string) =>
  rarityTone[rarity] ?? rarityTone.COMMON;

export const RewardSparkles = () => (
  <Box aria-hidden sx={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
    {[...Array(22)].map((_, index) => {
      const left = 4 + ((index * 19) % 92);
      const top = 6 + ((index * 29) % 82);
      const size = index % 4 === 0 ? 10 : 6;
      const color = index % 3 === 0 ? "#facc15" : index % 3 === 1 ? "#60a5fa" : "#38bdf8";

      return (
        <Box
          key={index}
          component={motion.div}
          initial={{ opacity: 0, scale: 0.5, y: 8 }}
          animate={{ opacity: [0, 0.72, 0.24], scale: [0.5, 1, 0.86], y: [8, -8, 0] }}
          transition={{ duration: 3, delay: index * 0.07, repeat: Infinity, repeatType: "mirror" }}
          sx={{
            position: "absolute",
            left: `${left}%`,
            top: `${top}%`,
            width: size,
            height: size,
            borderRadius: index % 2 === 0 ? "50%" : 1,
            bgcolor: color,
            transform: "rotate(45deg)",
            boxShadow: `0 0 18px ${color}`,
          }}
        />
      );
    })}
  </Box>
);

export const RewardPageShell = ({
  children,
  maxWidth = 1440,
}: {
  children: ReactNode;
  maxWidth?: number;
}) => (
  <Box
    component={motion.main}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.42 }}
    sx={{
      position: "relative",
      minHeight: "calc(100vh - 64px)",
      overflow: "hidden",
      px: { xs: 2, md: 4 },
      py: { xs: 4, md: 5 },
      background:
        "radial-gradient(circle at 50% 0%, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.36) 30%, transparent 58%), radial-gradient(circle at 15% 24%, rgba(59, 130, 246, 0.28), transparent 28%), radial-gradient(circle at 86% 32%, rgba(96, 165, 250, 0.25), transparent 26%), linear-gradient(135deg, #d9ecff 0%, #f7fbff 44%, #dcecff 100%)",
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
    transition={{ duration: 0.46 }}
    spacing={1.4}
    alignItems="center"
    textAlign="center"
    sx={{ mb: 2.5, px: { xs: 0, md: 28 } }}
  >
    <Chip
      icon={<AutoAwesomeIcon />}
      label={chip}
      sx={{
        px: 0.5,
        borderRadius: 999,
        fontWeight: 900,
        color: rewardPalette.deepBlue,
        bgcolor: "rgba(219, 234, 254, 0.92)",
        border: "1px solid #bfdbfe",
        "& .MuiChip-icon": { color: "inherit" },
      }}
    />
    <Typography
      variant="h3"
      fontWeight={900}
      letterSpacing={0}
      sx={{ color: "#071b4d", fontSize: { xs: 34, md: 54 }, lineHeight: 1.12 }}
    >
      {title}
    </Typography>
    <Typography color="#1e293b" sx={{ maxWidth: 820, lineHeight: 1.8, fontWeight: 700 }}>
      {subtitle}
    </Typography>
  </Stack>
);

export const MascotBubble = ({ message }: { message: string }) => (
  <Box sx={{ position: { xs: "relative", md: "absolute" }, right: { md: 72 }, top: { md: 22 }, display: "flex", alignItems: "center", justifyContent: "center", mt: { xs: 1, md: 0 } }}>
    <Box
      component="img"
      src="/images/mascots/red-panda/normal.png"
      alt="報酬を案内するマスコット"
      sx={{ width: { xs: 92, md: 136 }, height: { xs: 92, md: 136 }, objectFit: "contain", flexShrink: 0 }}
    />
    <Paper
      elevation={0}
      sx={{
        ml: -0.5,
        px: 2,
        py: 1.4,
        borderRadius: 3,
        border: "1px solid #dbeafe",
        bgcolor: "rgba(255,255,255,0.95)",
        fontWeight: 900,
        maxWidth: 220,
        color: "#0f172a",
        boxShadow: "0 16px 38px rgba(37, 99, 235, 0.12)",
      }}
    >
      {message}
    </Paper>
  </Box>
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
    initial={{ opacity: 0, y: 26, scale: 0.96 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: -18, scale: 0.98 }}
    transition={{ duration: 0.38, ease: "easeOut" }}
    elevation={0}
    sx={{
      position: "relative",
      width: "100%",
      maxWidth: 520,
      minHeight: { xs: 430, md: 500 },
      p: { xs: 3, md: 5 },
      borderRadius: 4,
      border: "1px solid rgba(245, 158, 11, 0.48)",
      background:
        "radial-gradient(circle at 50% 16%, rgba(250, 204, 21, 0.34), transparent 34%), linear-gradient(145deg, rgba(255,255,255,0.98), rgba(255, 247, 214, 0.94))",
      boxShadow: "0 32px 82px rgba(180, 83, 9, 0.26), 0 0 90px rgba(250, 204, 21, 0.28)",
      overflow: "hidden",
    }}
  >
    <RewardSparkles />
    <Stack spacing={2.2} alignItems="center" textAlign="center" sx={{ position: "relative", zIndex: 1 }}>
      <Box
        component={motion.div}
        initial={{ scale: 0.62, opacity: 0, rotate: -6 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ duration: 0.5, delay: 0.08, type: "spring", stiffness: 210 }}
        sx={{
          width: 158,
          height: 158,
          borderRadius: "50%",
          display: "grid",
          placeItems: "center",
          background:
            "radial-gradient(circle, rgba(250, 204, 21, 0.62), rgba(255, 247, 214, 0.4) 58%, rgba(255,255,255,0) 74%)",
          color: rewardPalette.gold,
        }}
      >
        <EmojiEventsIcon sx={{ fontSize: 102, filter: "drop-shadow(0 14px 22px rgba(217, 119, 6, 0.32))" }} />
      </Box>
      <Chip label="ACHIEVEMENT UNLOCKED" sx={{ fontWeight: 900, color: rewardPalette.goldDeep, bgcolor: "#fef3c7", border: "1px solid #fde68a" }} />
      <Typography variant="caption" color="text.secondary" fontWeight={900}>
        {progressLabel}
      </Typography>
      <Typography variant="h4" fontWeight={900} sx={{ color: "#1f2937", lineHeight: 1.25 }}>
        {title}
      </Typography>
      <Typography color="text.secondary" sx={{ maxWidth: 420, lineHeight: 1.85, fontWeight: 700 }}>
        {description}
      </Typography>
      <Chip label={categoryLabel} size="small" icon={<WorkspacePremiumIcon />} sx={{ fontWeight: 900, border: "1px solid #fde68a", bgcolor: "#fff" }} />
    </Stack>
  </Paper>
);

export const KnowledgeCardRewardCard = ({
  card,
  selected,
  disabled,
  index,
  onSelect,
  revealed = false,
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
    <Box
      component={motion.button}
      type="button"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: disabled && !selected ? 0.64 : 1, y: 0, scale: acquired ? 1.06 : selected ? 1.06 : 1 }}
      whileHover={disabled ? undefined : { y: -14, scale: selected ? 1.08 : 1.06 }}
      whileTap={disabled ? undefined : { scale: 1.02 }}
      transition={{ duration: 0.36, delay: 0.08 + index * 0.08 }}
      onClick={onSelect}
      disabled={disabled}
      sx={{
        appearance: "none",
        border: 0,
        p: 0,
        m: 0,
        bgcolor: "transparent",
        cursor: disabled ? "default" : "pointer",
        width: "100%",
        display: "block",
        perspective: 1200,
      }}
    >
      <Box
        component={motion.div}
        animate={{ rotateY: revealed ? 180 : 0 }}
        transition={{ duration: 0.76, ease: [0.2, 0.8, 0.2, 1] }}
        sx={{
          position: "relative",
          width: "100%",
          maxWidth: 300,
          mx: "auto",
          aspectRatio: "0.72",
          transformStyle: "preserve-3d",
        }}
      >
        <Stack
          sx={{
            position: "absolute",
            inset: 0,
            borderRadius: 3,
            overflow: "hidden",
            backfaceVisibility: "hidden",
            border: selected ? "5px solid #fff" : "3px solid rgba(255,255,255,0.9)",
            background:
              "radial-gradient(circle at 50% 43%, rgba(96, 165, 250, 0.28), transparent 26%), linear-gradient(145deg, #092a70 0%, #0f3c96 44%, #061b4a 100%)",
            boxShadow: selected ? "0 0 0 8px #60a5fa, 0 0 52px rgba(96, 165, 250, 0.72), 0 30px 76px rgba(37, 99, 235, 0.42)" : "0 18px 44px rgba(15, 23, 42, 0.18)",
            justifyContent: "center",
            alignItems: "center",
            color: "#fff",
            "&::before": {
              content: '""',
              position: "absolute",
              inset: 14,
              borderRadius: 2,
              border: "1px solid rgba(255,255,255,0.28)",
            },
            "&::after": {
              content: '""',
              position: "absolute",
              inset: 28,
              borderRadius: "50%",
              border: "1px solid rgba(255,255,255,0.24)",
              boxShadow: "0 0 0 24px rgba(255,255,255,0.035)",
            },
            "&:hover": {
              boxShadow: selected
                ? "0 0 0 8px #60a5fa, 0 0 62px rgba(96, 165, 250, 0.82), 0 34px 82px rgba(37, 99, 235, 0.46)"
                : "0 0 0 5px rgba(96, 165, 250, 0.48), 0 28px 72px rgba(37, 99, 235, 0.34)",
              filter: "brightness(1.08)",
            },
          }}
        >
          <AutoAwesomeIcon sx={{ position: "absolute", top: "12%", left: "18%", fontSize: 18, opacity: 0.78 }} />
          <AutoAwesomeIcon sx={{ position: "absolute", right: "19%", bottom: "15%", fontSize: 16, opacity: 0.72 }} />
          <Typography sx={{ position: "relative", zIndex: 1, fontSize: { xs: 88, md: 104 }, fontWeight: 900, textShadow: "0 0 24px rgba(255,255,255,0.68)" }}>
            ?
          </Typography>
        </Stack>

        <Stack
          spacing={1.5}
          sx={{
            position: "absolute",
            inset: 0,
            p: 2,
            borderRadius: 3,
            textAlign: "center",
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            border: `3px solid ${tone.border}`,
            background:
              card.rarity === "EPIC"
                ? "linear-gradient(145deg, #fff 0%, #fbf5ff 58%, #f3e8ff 100%)"
                : "linear-gradient(145deg, #fff 0%, #eff6ff 100%)",
            boxShadow: acquired ? `0 0 92px ${tone.border}` : tone.glow,
            justifyContent: "space-between",
            overflow: "hidden",
            "&::before": {
              content: '""',
              position: "absolute",
              inset: -46,
              background: `radial-gradient(circle, ${tone.border}55, transparent 48%)`,
              opacity: acquired ? 0.9 : 0.45,
            },
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ position: "relative", zIndex: 1 }}>
            <Chip label="NEW" size="small" color="error" sx={{ fontWeight: 900, visibility: acquired ? "visible" : "hidden" }} />
            <Chip label={tone.label} size="small" sx={{ fontWeight: 900, color: tone.color, bgcolor: tone.bgcolor, border: `1px solid ${tone.border}` }} />
          </Stack>
          <Box
            sx={{
              position: "relative",
              zIndex: 1,
              width: 94,
              height: 94,
              mx: "auto",
              borderRadius: 3,
              display: "grid",
              placeItems: "center",
              color: tone.color,
              bgcolor: tone.bgcolor,
              border: `1px solid ${tone.border}`,
            }}
          >
            {card.rarity === "EPIC" ? <LockIcon sx={{ fontSize: 54 }} /> : <MenuBookIcon sx={{ fontSize: 54 }} />}
          </Box>
          <Box sx={{ position: "relative", zIndex: 1 }}>
            <Typography variant="h6" fontWeight={900} color="#0f172a" sx={{ lineHeight: 1.25 }}>
              {card.title}
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1, lineHeight: 1.65, fontWeight: 700, fontSize: 14 }}>
              {card.description}
            </Typography>
          </Box>
        </Stack>
      </Box>
    </Box>
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
