"use client";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import { Box, Button, Dialog, DialogContent, DialogTitle, Typography } from "@mui/material";
import { motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import type { AwardedCard } from "../../../api/learning.api";
import { useSoundEffect } from "@/lib/audio/soundFeedback";
import type { LearningObserver } from "../../../lib/learningEvents";
import { appLearningTokens as colors } from "../app/appLearning.tokens";
import { useLearningRewards } from "../app/LearningRewardsContext";
import { useLearningVisit } from "../instrumentation/useLearningVisit";
import { presentationFor, rewardText as text, type RewardBoundary, type RewardStage } from "./presentation";

/** #109のキューを先頭から消費する。呼び出せるのは保存成功後のフェーズ境界だけ。
 * このダイアログは知識カード専用（#333）。実績は結果画面で提示するため、ここには来ない。
 * カードがなければ開かず、そのまま完了を通知してキューを進める。 */
export function LearningRewardBoundary({ boundary, onDone, onEvent }: { boundary: RewardBoundary; onDone: () => void; onEvent?: LearningObserver }) {
  const { rewards, dismissAwardedCard } = useLearningRewards();
  const entry = rewards.awardedCards[0], card = entry?.card;
  const last = rewards.awardedCards.length <= 1;
  useEffect(() => { if (!card) onDone(); }, [card, onDone]);
  if (!card) return null;
  return <Presentation key={card.id} card={card} boundary={{ phaseKey: entry?.phaseKey ?? boundary.phaseKey }} onEvent={onEvent}
    onDone={() => { dismissAwardedCard(card.id); if (last) onDone(); }} />;
}
function Presentation({ card, boundary, onDone, onEvent }: { card: AwardedCard; boundary: RewardBoundary; onDone: () => void; onEvent?: LearningObserver }) {
  const [stage, setStage] = useState<RewardStage>("anticipation");
  const closed = useRef(false), reduced = useReducedMotion();
  const spec = presentationFor(card.rarity);
  const finish = useCallback((skipped = false) => {
    if (closed.current) return;
    closed.current = true;
    onEvent?.({ eventType: "card_presentation_end", targetId: card.id,
      payload: { phaseKey: boundary.phaseKey, skipped, stage, rarity: card.rarity } });
    onDone();
  }, [card, boundary.phaseKey, stage, onDone, onEvent]);
  useLearningVisit(onEvent, true, "card_presentation_view", card.id, { phaseKey: boundary.phaseKey, rarity: card.rarity });
  const { play } = useSoundEffect();
  // 発見はユーザのクリックで開示する（#147）。自動では開かない。
  const reveal = useCallback(() => {
    if (stage !== "anticipation") return;
    onEvent?.({ eventType: "card_presentation_reveal", targetId: card.id, payload: { phaseKey: boundary.phaseKey, rarity: card.rarity } });
    play("cardFlip");
    setStage("appearance");
  }, [card, stage, boundary.phaseKey, onEvent, play]);
  // 自動で進むのは開示の余韻から賞賛へだけ。発見と賞賛はユーザの操作で進む。
  // 非表示中に演出を消費しない。復帰したら残り時間を再開する。
  useEffect(() => {
    if (stage !== "appearance") return;
    let remaining: number = spec.durations[1];
    let started = 0, timer: ReturnType<typeof setTimeout> | undefined;
    const advance = () => { play("cardAcquired"); setStage("praise"); };
    const resume = () => { started = performance.now(); timer = setTimeout(advance, remaining); };
    const visibility = () => {
      if (document.visibilityState === "hidden") { if (timer !== undefined) { clearTimeout(timer); remaining = Math.max(0, remaining - (performance.now() - started)); timer = undefined; } }
      else if (timer === undefined) resume();
    };
    if (document.visibilityState !== "hidden") resume();
    document.addEventListener("visibilitychange", visibility);
    return () => { clearTimeout(timer); document.removeEventListener("visibilitychange", visibility); };
  }, [stage, spec, play]);
  const revealed = stage !== "anticipation";
  return <Dialog open onClose={() => finish(true)} aria-labelledby="learning-reward-title" maxWidth="sm" fullWidth
    slotProps={{ paper: { sx: { m: 1, width: "calc(100% - 16px)", maxHeight: "90dvh", bgcolor: colors.surface, color: colors.text, borderRadius: 3 } } }}>
    <DialogTitle id="learning-reward-title" sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, fontSize: 18, fontWeight: 700 }}>
      {text.title}<Button onClick={() => finish(true)} sx={{ minHeight: 44, flexShrink: 0 }}>{text.skip}</Button>
    </DialogTitle>
    <DialogContent data-reward-stage={stage} data-reward-rarity={card.rarity} sx={{ textAlign: "center", overflowX: "hidden" }}>
      <Typography aria-live="polite" sx={{ fontWeight: 700, fontSize: 18, mb: 2 }}>{text[stage]}</Typography>
      <Box sx={{ position: "relative", mx: "auto", maxWidth: 360, p: 2 }}>
        {!reduced && revealed && Array.from({ length: spec.rays }, (_, i) => <Box key={i} component={motion.span} aria-hidden
          initial={{ opacity: 0, scale: 0 }} animate={{ opacity: [0, 0.7, 0], scale: [0.6, 1.4, 1.8] }} transition={{ duration: 0.7, delay: i * 0.035 }}
          sx={{ position: "absolute", left: `${50 + 46 * Math.cos(i * 2 * Math.PI / spec.rays)}%`, top: `${45 + 38 * Math.sin(i * 2 * Math.PI / spec.rays)}%`, color: spec.tone.color }}><AutoAwesomeIcon /></Box>)}
        <Box component={motion.div} animate={stage === "anticipation" && !reduced ? { scale: [1, 1.025, 1] } : { scale: 1 }}
          transition={stage === "anticipation" && !reduced ? { duration: 1.8, repeat: Infinity, ease: "easeInOut" } : { duration: 0.2 }}>
          <Box key={revealed ? "revealed" : "hidden"} component={motion.div}
            initial={reduced ? false : { opacity: 0, scale: revealed ? spec.scale : 0.98, rotate: revealed ? -spec.turns : 0 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ duration: reduced ? 0 : 0.4 }}
            onClick={stage === "anticipation" ? reveal : undefined}
            role={stage === "anticipation" ? "button" : undefined}
            aria-label={stage === "anticipation" ? text.reveal : undefined}
            sx={{ position: "relative", border: `2px solid ${revealed ? spec.tone.border : colors.border}`, bgcolor: revealed ? spec.tone.bgcolor : colors.background,
              borderRadius: 3, p: 2, minHeight: 170, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1,
              cursor: stage === "anticipation" ? "pointer" : undefined,
              boxShadow: revealed && !reduced && spec.glow ? `0 0 ${spec.glow}px ${spec.tone.border}` : "none" }}>
            <MenuBookIcon aria-hidden sx={{ color: revealed ? spec.tone.color : colors.progress.stroke, fontSize: revealed ? 54 : 40 }} />
            {revealed ? <><Typography sx={{ fontWeight: 700, color: spec.tone.color }}>{spec.tone.label} · No.{String(card.catalogNumber).padStart(2, "0")}</Typography><Typography component="h2" sx={{ fontSize: 24, fontWeight: 800 }}>{card.title}</Typography><Typography>{card.label}</Typography></> : <Typography sx={{ fontSize: 24 }}>？？？</Typography>}
          </Box>
        </Box>
      </Box>
      {stage === "anticipation" && <Button variant="contained" onClick={reveal} sx={{ minHeight: 48, px: 4, fontWeight: 700 }}>{text.reveal}</Button>}
      {stage === "praise" && <Box component={motion.div} initial={{ opacity: reduced ? 1 : 0 }} animate={{ opacity: 1 }}>
        <Typography sx={{ my: 1 }}>{text.saved}</Typography>
        <Button variant="contained" onClick={() => finish()} sx={{ mt: 2, minHeight: 44 }}>{text.close}</Button>
      </Box>}
    </DialogContent>
  </Dialog>;
}
