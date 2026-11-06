"use client";
import { Box, Button, Typography } from "@mui/material";
import Link from "next/link";
import type { LearningObserver } from "../../../lib/learningEvents";
import type { LearningRewards } from "../app/rewards";
import { appLearningTokens as colors } from "../app/appLearning.tokens";
import { AchievementList } from "./AchievementList";
import { presentationFor, rewardText as text } from "./presentation";

/**
 * 最終リザルトの報酬まとめ。実績は区切りでの提示が本番のため、ここはアイコン＋題名の
 * コンパクトな要約に留める。獲得した知識カードはこれまで最終リザルトに出なかったので、
 * レアリティの枠色を持つタイルで一覧する。
 */
export function FinalLearningRewards({ rewards, onEvent }: { rewards: LearningRewards; onEvent?: LearningObserver }) {
  return <Box component="section" aria-label={text.finalTitle} sx={{ width: "100%", maxWidth: 640, color: colors.text, p: 2, bgcolor: colors.background, borderRadius: 2 }}>
    <Typography component="h2" sx={{ fontWeight: 800, fontSize: 22, mb: 2 }}>{text.finalTitle}</Typography>
    {rewards.unlockedAchievements.length ? <AchievementList final compact items={rewards.unlockedAchievements} onEvent={onEvent} /> : <Typography>{text.finalEmpty}</Typography>}
    {rewards.awardedCards.length > 0 && <>
      <Typography component="h3" sx={{ fontWeight: 800, fontSize: 18, mt: 3, mb: 1.5 }}>{text.finalCards}</Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 1 }}>
        {rewards.awardedCards.map(({ card }) => {
          const tone = presentationFor(card.rarity).tone;
          return <Box key={card.id} data-awarded-card={card.id} sx={{ border: `2px solid ${tone.border}`, bgcolor: tone.bgcolor, borderRadius: 2, p: 1.5, textAlign: "left" }}>
            <Typography sx={{ fontSize: 12, fontWeight: 800, color: tone.color }}>{tone.label}</Typography>
            <Typography sx={{ fontWeight: 700, fontSize: 15 }}>{card.title}</Typography>
          </Box>;
        })}
      </Box>
    </>}
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 2 }}><Button component={Link} href="/collection">{text.collection}</Button><Button component={Link} href="/achievements">{text.achievements}</Button></Box>
  </Box>;
}
