"use client";

import { Box, Typography } from "@mui/material";
import { useEffect, useRef } from "react";

import { learningPhaseIcons } from "../../app/learningPhaseIcons";
import { PhaseNextButton } from "../../app/PhaseNextButton";
import { playerTokens } from "../../player/player.tokens";
import { bfsUnitPhases, type BfsUnitPhase } from "./unit.content";

/**
 * フェーズ間のブリッジ（Issue #141）。前進の完了フローでのみ挟み、
 * 次のフェーズの目標を短く伝えてから、学習者のタップで次へ進む。
 * 復習・ナビゲーションからの移動や途中再開では出さない。
 * スクロールはこの画面専用に持たず、単元コンテナのラッパーに一元化する（#298）。
 */
export function PhaseBridgeScreen({ phase, onProceed }: { phase: BfsUnitPhase; onProceed: () => void }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => { headingRef.current?.focus(); }, []);
  const Icon = learningPhaseIcons[phase.phase - 1];
  if (!phase.bridge) return null;
  return <Box component="section" aria-label={`${phase.formalName}へのブリッジ`}
    sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "safe center", gap: 2, p: 2 }}>
    <Box aria-hidden sx={{ width: 96, height: 96, borderRadius: "50%", bgcolor: playerTokens.layers.layer0, display: "grid", placeItems: "center" }}>
      {Icon && <Icon sx={{ fontSize: 48, color: playerTokens.focus }} />}
    </Box>
    <Typography component="p" sx={{ fontSize: 14, color: playerTokens.states.idle.stroke }}>
      ステージ {phase.phase} / {bfsUnitPhases.length}
    </Typography>
    <Typography ref={headingRef} component="h2" tabIndex={-1}
      sx={{ color: playerTokens.text, fontWeight: 700, textAlign: "center", fontSize: "clamp(20px, 1.8vw, 32px)", outline: "none" }}>
      次は「{phase.formalName}」
    </Typography>
    <Typography component="p" sx={{ textAlign: "center", fontSize: 17, lineHeight: 1.8, maxWidth: 560 }}>{phase.bridge}</Typography>
    <PhaseNextButton label={`${phase.formalName}へ進む`} onClick={onProceed} />
  </Box>;
}
