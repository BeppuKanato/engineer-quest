"use client";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { Box, Button, Typography } from "@mui/material";
import Link from "next/link";
import { useEffect, useRef, type ReactNode } from "react";

import { PhaseNextButton } from "../../app/PhaseNextButton";
import type { LearningRewards } from "../../app/rewards";

import { playerTokens } from "../../player/player.tokens";
import { bfsImplementationContent } from "../implementation/implementation.content";
import { bfsUnitPhases, bfsUnitText, nextPhaseLabel, type BfsUnitPhase } from "./unit.content";
import type { BfsUnitPhaseSummary } from "./unit.types";
import { UnitResultCelebration } from "./UnitResultCelebration";

const headingSx = {
  color: playerTokens.text, fontWeight: 700, textAlign: "center",
  fontSize: "clamp(20px, 1.8vw, 32px)", outline: "none",
} as const;

const nextButtonSx = {
  minHeight: 44, bgcolor: playerTokens.focus, color: playerTokens.surface,
  "&:hover": { bgcolor: playerTokens.states.processing.stroke },
} as const;

/** フェーズ3・5の後に単元側が出すリザルト画面。到達状況（事実）と次フェーズの予告、次のフェーズへの導線を持つ。 */
export function UnitResultScreen({ phase, summary, onNext }: {
  phase: BfsUnitPhase;
  summary?: BfsUnitPhaseSummary;
  onNext: () => void;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => { headingRef.current?.focus(); }, []);
  if (!phase.result) return null;
  return <Box component="section" aria-label={`${phase.formalName}のリザルト`}
    sx={{ flex: 1, minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "safe center", gap: 2, p: 2 }}>
    <UnitResultCelebration heading={phase.result.heading} headingRef={headingRef} />
    {summary?.totalQuestions !== undefined && summary.firstAttemptCorrect !== undefined && (
      <Typography component="p" sx={{ textAlign: "center", fontSize: 17, fontWeight: 700 }}>
        全{summary.totalQuestions}問に正解しました（初回で{summary.firstAttemptCorrect}問正解）。
      </Typography>
    )}
    <Typography component="p" sx={{ textAlign: "center", fontSize: 16 }}>{phase.result.nextPreview}</Typography>
    <PhaseNextButton label={nextPhaseLabel(phase)} onClick={onNext} />
  </Box>;
}

/** フェーズの到達状況を1行の事実文にする。記録がないフェーズは「完了」だけを出す。 */
function summaryLine(index: number, summary?: BfsUnitPhaseSummary): string | null {
  if (!summary) return null;
  if (summary.totalQuestions !== undefined && summary.firstAttemptCorrect !== undefined) {
    return `初回 ${summary.firstAttemptCorrect}/${summary.totalQuestions} 問正解`;
  }
  if (summary.testRuns !== undefined) {
    const usedHints = (summary.hintUsage ?? []).map((count, level) => count > 0 ? `ヒント${level + 1}を${count}回` : null).filter(Boolean);
    return `テスト実行 ${summary.testRuns} 回` + (usedHints.length ? `、${usedHints.join("、")}` : "、ヒントは未使用");
  }
  return null;
}

/** 単元完了時の最終リザルト。称号と締めの文はフェーズ7の完了表示と文言を揃える。 */
export function UnitFinalResult({ summaries, onReviewPhase, rewards, renderRewards }: {
  rewards?: LearningRewards;
  renderRewards?: (rewards: LearningRewards) => ReactNode;
  summaries: Readonly<Record<number, BfsUnitPhaseSummary>>;
  onReviewPhase: (index: number) => void;
}) {
  const headingRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => { headingRef.current?.focus(); }, []);
  // スクロールはこの画面専用に持たず、外側（画面全幅）のスクロールに任せる（#150）。
  return <Box component="section" aria-label="単元完了のリザルト"
    sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, p: 2 }}>
    <CheckCircleIcon aria-hidden sx={{ fontSize: 56, color: playerTokens.focus, mt: 2 }} />
    <Typography ref={headingRef} component="h2" tabIndex={-1} sx={headingSx}>{bfsImplementationContent.result.title}</Typography>
    <Typography component="p" sx={{ fontWeight: 700, fontSize: 17 }}>{bfsUnitText.summaryHeading}</Typography>
    <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0, width: "100%", maxWidth: 560 }}>
      {bfsUnitPhases.map((phase, index) => {
        const line = summaryLine(index, summaries[index]);
        return <Box component="li" key={phase.id} sx={{ display: "flex", alignItems: "center", gap: 1, py: 0.75, borderBottom: `1px solid ${playerTokens.layers.layer1}` }}>
          <CheckCircleIcon aria-hidden sx={{ fontSize: 20, color: playerTokens.focus, flexShrink: 0 }} />
          <Typography component="p" sx={{ fontSize: 16 }}>
            {phase.phase}. {phase.formalName}{line ? ` ― ${line}` : ""}
          </Typography>
          <Button size="small" onClick={() => onReviewPhase(index)}
            sx={{ ml: "auto", minHeight: 36, color: playerTokens.control, whiteSpace: "nowrap" }}>復習する</Button>
        </Box>;
      })}
    </Box>
    <Typography component="p" sx={{ textAlign: "center", fontSize: 16, maxWidth: 640 }}>{bfsImplementationContent.result.closing}</Typography>
    {rewards && renderRewards?.(rewards)}
    <Typography component="p" sx={{ textAlign: "center", fontSize: 15 }}>{bfsUnitText.reviewNote}</Typography>
    <Button variant="contained" component={Link} href="/courses" sx={{ ...nextButtonSx, mb: 2 }}>{bfsUnitText.backToCourses}</Button>
  </Box>;
}
