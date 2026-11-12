"use client";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import { Box, Typography } from "@mui/material";
import { motion, useReducedMotion } from "framer-motion";
import type { UnlockedAchievement } from "../../../api/learning.api";
import type { LearningObserver } from "../../../lib/learningEvents";
import { appLearningTokens as colors } from "../config/appLearning.tokens";
import { useLearningVisit } from "../instrumentation/useLearningVisit";
import { presentationFor } from "./presentation";

function Achievement({ item, onEvent, final, compact = false }: { item: UnlockedAchievement; onEvent?: LearningObserver; final: boolean; compact?: boolean }) {
  const reduced = useReducedMotion(), tone = presentationFor(item.rarity).tone;
  useLearningVisit(onEvent, true, "achievement_present_view", item.id, { placement: final ? "unit-result" : "phase-boundary", rarity: item.rarity });
  return <Box component={motion.li} layout initial={{ opacity: 0, y: reduced ? 0 : final ? 12 : 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduced ? 0 : final ? 0.45 : 0.2 }}
    data-achievement-id={item.id} sx={{ listStyle: "none", display: "flex", alignItems: compact ? "center" : undefined, gap: 1.5, p: compact ? 1 : final ? 2 : 1, border: `1px solid ${colors.border}`, borderRadius: 2, bgcolor: colors.surface, textAlign: "left" }}>
    <EmojiEventsIcon aria-hidden sx={{ color: tone.color, fontSize: compact ? 28 : final ? 40 : 28, flexShrink: 0 }} />
    <Box><Typography component="h3" sx={{ fontWeight: 700, fontSize: final && !compact ? 18 : 16 }}>{item.title}</Typography>{!compact && <Typography sx={{ fontSize: 15 }}>{item.description}</Typography>}</Box>
  </Box>;
}
export function AchievementList({ items, onEvent, final = false, compact = false }: { items: readonly UnlockedAchievement[]; onEvent?: LearningObserver; final?: boolean; compact?: boolean }) {
  return <Box component="ul" sx={{ m: 0, p: 0, display: "grid", gap: 1, width: "100%" }}>{items.map(item => <Achievement key={item.id} item={item} onEvent={onEvent} final={final} compact={compact} />)}</Box>;
}
