"use client";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import { Box, Typography } from "@mui/material";
import { motion, useReducedMotion } from "framer-motion";
import type { UnlockedAchievement } from "../../../api/learning.api";
import type { LearningObserver } from "../../../lib/learningEvents";
import { appLearningTokens as colors } from "../config/appLearning.tokens";
import { useLearningVisit } from "../instrumentation/useLearningVisit";
import { presentationFor, rewardText as text } from "./presentation";

/**
 * 解除された瞬間の実績1件（#333）。カード出現と同じ語彙（レアリティ色・放射・グロー）で、
 * トロフィーバッジがポップインする。出現はその場限りで、記録としての要約は別に残る。
 * 動きを減らす設定では静止表示にし、放射も出さない（ResultConfetti と同じ扱い）。
 */
function AchievementUnlock({ item, index, stagger, onEvent, placement, phaseKey }: {
  item: UnlockedAchievement; index: number; stagger: number;
  onEvent?: LearningObserver; placement: "phase-result" | "unit-result-new"; phaseKey?: string;
}) {
  const reduced = useReducedMotion(), spec = presentationFor(item.rarity), tone = spec.tone;
  useLearningVisit(onEvent, true, "achievement_present_view", item.id, { placement, phaseKey, rarity: item.rarity });
  const delay = reduced ? 0 : index * stagger;
  return <Box component={motion.div} data-achievement-id={item.id}
    initial={reduced ? false : { opacity: 0, scale: 0.85, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }}
    transition={{ duration: reduced ? 0 : 0.45, delay, ease: "easeOut" }}
    sx={{ position: "relative", display: "flex", alignItems: "center", gap: 1.5, p: 1.5, border: `2px solid ${tone.border}`, borderRadius: 2, bgcolor: tone.bgcolor, textAlign: "left",
      boxShadow: !reduced && spec.glow ? `0 0 ${spec.glow}px ${tone.border}` : "none" }}>
    <Box sx={{ position: "relative", flexShrink: 0, width: 56, height: 56 }}>
      {!reduced && Array.from({ length: spec.rays }, (_, i) => <Box key={i} component={motion.span} aria-hidden
        initial={{ opacity: 0, scale: 0 }} animate={{ opacity: [0, 0.7, 0], scale: [0.6, 1.4, 1.8] }} transition={{ duration: 0.7, delay: delay + 0.1 + i * 0.035 }}
        sx={{ position: "absolute", left: `${50 + 62 * Math.cos(i * 2 * Math.PI / spec.rays)}%`, top: `${50 + 62 * Math.sin(i * 2 * Math.PI / spec.rays)}%`, color: tone.color, lineHeight: 0 }}><AutoAwesomeIcon sx={{ fontSize: 16 }} /></Box>)}
      <Box sx={{ width: 56, height: 56, borderRadius: "50%", border: `2px solid ${tone.border}`, bgcolor: colors.surface, display: "grid", placeItems: "center" }}>
        <EmojiEventsIcon aria-hidden sx={{ color: tone.color, fontSize: 32 }} />
      </Box>
    </Box>
    <Box sx={{ minWidth: 0 }}>
      <Typography sx={{ fontSize: 12, fontWeight: 800, color: tone.color }}>{tone.label}</Typography>
      <Typography component="h3" sx={{ fontWeight: 800, fontSize: 18 }}>{item.title}</Typography>
      <Typography sx={{ fontSize: 15 }}>{item.description}</Typography>
    </Box>
  </Box>;
}

function UnlockList({ items, stagger, onEvent, placement, phaseKey }: {
  items: readonly UnlockedAchievement[]; stagger: number;
  onEvent?: LearningObserver; placement: "phase-result" | "unit-result-new"; phaseKey?: string;
}) {
  return <Box sx={{ display: "grid", gap: 1, width: "100%" }}>
    {items.map((item, index) => <AchievementUnlock key={item.id} item={item} index={index} stagger={stagger} onEvent={onEvent} placement={placement} phaseKey={phaseKey} />)}
  </Box>;
}

/** フェーズの結果画面に出す実績バンド（#333）。そのフェーズの保存で解除された分だけを受ける。 */
export function AchievementBand({ items, phaseKey, onEvent }: { items: readonly UnlockedAchievement[]; phaseKey?: string; onEvent?: LearningObserver }) {
  if (!items.length) return null;
  return <Box component="section" aria-label={text.achievement} data-achievement-band sx={{ width: "100%", maxWidth: 640, color: colors.text }}>
    <Typography component="h3" sx={{ fontWeight: 800, fontSize: 18, textAlign: "center", mb: 1 }}>{text.achievement}</Typography>
    <UnlockList items={items} stagger={0.15} onEvent={onEvent} placement="phase-result" phaseKey={phaseKey} />
  </Box>;
}

/** 最終リザルトの「新しい実績」ゾーン（#333）。フェーズ7と単元完了で解除された分を1件ずつ出す。 */
export function NewAchievementZone({ items, onEvent }: { items: readonly UnlockedAchievement[]; onEvent?: LearningObserver }) {
  if (!items.length) return null;
  return <Box component="section" aria-label={text.newAchievements} data-new-achievements sx={{ width: "100%", maxWidth: 640, color: colors.text, p: 2, bgcolor: colors.background, borderRadius: 2 }}>
    <Typography component="h2" sx={{ fontWeight: 800, fontSize: 22, mb: 2 }}>{text.newAchievements}</Typography>
    <UnlockList items={items} stagger={0.35} onEvent={onEvent} placement="unit-result-new" />
  </Box>;
}
