"use client";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import FlagIcon from "@mui/icons-material/Flag";
import { Box, Typography } from "@mui/material";
import { motion, useReducedMotion } from "framer-motion";

import type { AchievedBigGoal } from "@/api/learning.api";
import type { LearningObserver } from "@/lib/learningEvents";
import { useLearningVisit } from "../instrumentation/useLearningVisit";
import { playerTokens } from "../player/player.tokens";

/**
 * 達成した大目標1件の提示（Issue #370）。実績の提示（#333）と同じ語彙で、
 * 旗のバッジがポップインする。色は到達の青に統一し、非難の表現は使わない。
 * 動きを減らす設定では静止表示にし、放射も出さない。
 * 紙吹雪と歓声は結果画面側の演出に一元化されており、ここでは発火しない。
 */
function GoalAchievementItem({ goal, index, stagger, onEvent, placement, phaseKey }: {
  goal: AchievedBigGoal; index: number; stagger: number;
  onEvent?: LearningObserver; placement: "phase-result" | "unit-result"; phaseKey?: string;
}) {
  const reduced = useReducedMotion();
  useLearningVisit(onEvent, true, "big_goal_present_view", goal.id, { placement, phaseKey });
  const delay = reduced ? 0 : index * stagger;
  return <Box component={motion.div} data-big-goal-id={goal.id}
    initial={reduced ? false : { opacity: 0, scale: 0.85, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }}
    transition={{ duration: reduced ? 0 : 0.45, delay, ease: "easeOut" }}
    sx={{ position: "relative", display: "flex", alignItems: "center", gap: 1.5, p: 1.5, border: `2px solid ${playerTokens.focus}`, borderRadius: 2, bgcolor: playerTokens.surface, textAlign: "left",
      boxShadow: !reduced ? "0 0 18px rgba(37, 99, 235, 0.35)" : "none" }}>
    <Box sx={{ position: "relative", flexShrink: 0, width: 56, height: 56 }}>
      {!reduced && Array.from({ length: 8 }, (_, i) => <Box key={i} component={motion.span} aria-hidden
        initial={{ opacity: 0, scale: 0 }} animate={{ opacity: [0, 0.7, 0], scale: [0.6, 1.4, 1.8] }} transition={{ duration: 0.7, delay: delay + 0.1 + i * 0.035 }}
        sx={{ position: "absolute", left: `${50 + 62 * Math.cos(i * 2 * Math.PI / 8)}%`, top: `${50 + 62 * Math.sin(i * 2 * Math.PI / 8)}%`, color: playerTokens.focus, lineHeight: 0 }}><AutoAwesomeIcon sx={{ fontSize: 16 }} /></Box>)}
      <Box sx={{ width: 56, height: 56, borderRadius: "50%", bgcolor: playerTokens.focus, display: "grid", placeItems: "center" }}>
        <FlagIcon aria-hidden sx={{ color: playerTokens.surface, fontSize: 30 }} />
      </Box>
    </Box>
    <Box sx={{ minWidth: 0 }}>
      <Typography sx={{ fontSize: 12, fontWeight: 800, color: playerTokens.focus }}>大目標</Typography>
      <Typography component="h3" sx={{ fontWeight: 800, fontSize: 17 }}>{goal.displayText}</Typography>
    </Box>
  </Box>;
}

function GoalAchievementList({ goals, stagger, onEvent, placement, phaseKey }: {
  goals: readonly AchievedBigGoal[]; stagger: number;
  onEvent?: LearningObserver; placement: "phase-result" | "unit-result"; phaseKey?: string;
}) {
  return <Box sx={{ display: "grid", gap: 1, width: "100%" }}>
    {goals.map((goal, index) => <GoalAchievementItem key={goal.id} goal={goal} index={index} stagger={stagger} onEvent={onEvent} placement={placement} phaseKey={phaseKey} />)}
  </Box>;
}

/** フェーズの結果画面に出す大目標の達成バンド（#370）。その結果画面に対応する保存で達成した分だけを受ける。 */
export function BigGoalAchievementBand({ goals, phaseKey, onEvent }: { goals: readonly AchievedBigGoal[]; phaseKey?: string; onEvent?: LearningObserver }) {
  if (!goals.length) return null;
  return <Box component="section" aria-label="大目標を達成しました" data-big-goal-band sx={{ width: "100%", maxWidth: 640, color: playerTokens.text }}>
    <Typography component="h3" sx={{ fontWeight: 800, fontSize: 18, textAlign: "center", mb: 1 }}>大目標を達成しました</Typography>
    <GoalAchievementList goals={goals} stagger={0.15} onEvent={onEvent} placement="phase-result" phaseKey={phaseKey} />
  </Box>;
}

/** 最終リザルトの大目標の達成ゾーン（#370）。単元完了と重なって達成した分を、結果の一部として出す。 */
export function BigGoalAchievementZone({ goals, onEvent }: { goals: readonly AchievedBigGoal[]; onEvent?: LearningObserver }) {
  if (!goals.length) return null;
  return <Box component="section" aria-label="大目標を達成しました" data-big-goal-zone sx={{ width: "100%", maxWidth: 640, color: playerTokens.text, p: 2, bgcolor: playerTokens.background, borderRadius: 2 }}>
    <Typography component="h2" sx={{ fontWeight: 800, fontSize: 22, mb: 2 }}>大目標を達成しました</Typography>
    <GoalAchievementList goals={goals} stagger={0.35} onEvent={onEvent} placement="unit-result" />
  </Box>;
}
