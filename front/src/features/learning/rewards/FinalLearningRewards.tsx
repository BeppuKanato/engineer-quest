"use client";
import { Box, Button, Typography } from "@mui/material";
import Link from "next/link";
import type { LearningObserver } from "../../../lib/learningEvents";
import type { LearningRewards } from "../app/rewards";
import { appLearningTokens as colors } from "../app/appLearning.tokens";
import { AchievementList } from "./AchievementList";
import { rewardText as text } from "./presentation";

export function FinalLearningRewards({ rewards, onEvent }: { rewards: LearningRewards; onEvent?: LearningObserver }) {
  return <Box component="section" aria-label={text.finalTitle} sx={{ width: "100%", maxWidth: 640, color: colors.text, p: 2, bgcolor: colors.background, borderRadius: 2 }}>
    <Typography component="h2" sx={{ fontWeight: 800, fontSize: 22, mb: 2 }}>{text.finalTitle}</Typography>
    {rewards.unlockedAchievements.length ? <AchievementList final items={rewards.unlockedAchievements} onEvent={onEvent} /> : <Typography>{text.finalEmpty}</Typography>}
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 2 }}><Button component={Link} href="/collection">{text.collection}</Button><Button component={Link} href="/achievements">{text.achievements}</Button></Box>
  </Box>;
}
