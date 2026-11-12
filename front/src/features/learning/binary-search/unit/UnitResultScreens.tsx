"use client";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { Box, Button, Typography } from "@mui/material";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useEffect, useRef, type ReactNode } from "react";

import { DrawnCheck } from "../../app/DrawnCheck";
import { PhaseNextButton } from "../../app/PhaseNextButton";
import { ResultConfetti } from "../../app/ResultConfetti";
import { ResultScoreDots } from "../../app/ResultScoreDots";
import { UnitPathMiniMap } from "../../app/UnitPathMiniMap";
import type { LearningRewards } from "../../types/rewards";
import { UnitResultCelebration } from "../../components/results/UnitResultCelebration";

import { playerTokens } from "../../player/player.tokens";
import { binarySearchImplementationContent } from "../implementation/implementation.content";
import { binarySearchUnitPhases, binarySearchUnitText, type BinarySearchUnitPhase } from "./unit.content";
import type { BinarySearchUnitPhaseSummary } from "./unit.types";
import { BinarySearchResultFigure } from "./BinarySearchResultFigure";

const headingSx = {
  color: playerTokens.text, fontWeight: 700, textAlign: "center",
  fontSize: "clamp(20px, 1.8vw, 32px)", outline: "none",
} as const;

const nextButtonSx = {
  minHeight: 44, bgcolor: playerTokens.focus, color: playerTokens.surface,
  "&:hover": { bgcolor: playerTokens.states.processing.stroke },
} as const;

/** フェーズ3・5の後に単元側が出すリザルト画面。到達状況（事実）と次フェーズの予告、次のフェーズへの導線を持つ。
 * スクロールはこの画面専用に持たず、単元コンテナのラッパーに一元化する（#298）。 */
export function UnitResultScreen({ phase, summary, onNext, achievements, goalAchievement }: {
  phase: BinarySearchUnitPhase;
  summary?: BinarySearchUnitPhaseSummary;
  onNext: () => void;
  achievements?: ReactNode;
  /** 大目標の達成の提示（#370）。ある場合は紙吹雪も最大級に引き上げる。 */
  goalAchievement?: ReactNode;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => { headingRef.current?.focus(); }, []);
  if (!phase.result) return null;
  return <Box component="section" aria-label={`${phase.formalName}のリザルト`}
    sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "safe center", gap: 2, p: 2 }}>
    <UnitResultCelebration heading={phase.result.heading} headingRef={headingRef} preset={goalAchievement ? "final" : "phase"} />
    <BinarySearchResultFigure />
    {summary?.totalQuestions !== undefined && summary.firstAttemptCorrect !== undefined && (
      <>
        <ResultScoreDots total={summary.totalQuestions} firstAttemptCorrect={summary.firstAttemptCorrect} />
        <Typography component="p" sx={{ textAlign: "center", fontSize: 17, fontWeight: 700 }}>
          全{summary.totalQuestions}問に正解しました（初回で{summary.firstAttemptCorrect}問正解）。
        </Typography>
      </>
    )}
    {achievements}
    {goalAchievement}
    <PhaseNextButton label="次へ進む" onClick={onNext} />
  </Box>;
}

/** フェーズの到達状況を1行の事実文にする。記録がないフェーズは「完了」だけを出す。 */
function summaryLine(index: number, summary?: BinarySearchUnitPhaseSummary): string | null {
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

/** 最終リザルトの要約タイル。値は記録（サマリ）からの事実だけを出す。 */
function StatTile({ label, value }: { label: string; value: string }) {
  return <Box sx={{ flex: "1 1 150px", maxWidth: 204, border: `1px solid ${playerTokens.layers.layer1}`, borderRadius: 2, bgcolor: playerTokens.surface, px: 1.5, py: 1.25, textAlign: "center" }}>
    <Typography component="p" sx={{ fontSize: 26, fontWeight: 800, lineHeight: 1.2, color: playerTokens.focus }}>{value}</Typography>
    <Typography component="p" sx={{ fontSize: 13 }}>{label}</Typography>
  </Box>;
}

/** 単元完了時の最終リザルト。称号と締めの文はフェーズ7の完了表示と文言を揃える。 */
export function UnitFinalResult({ summaries, onReviewPhase, rewards, renderRewards, onShowFeedback, newAchievements, goalAchievement }: {
  rewards?: LearningRewards;
  renderRewards?: (rewards: LearningRewards) => ReactNode;
  newAchievements?: ReactNode;
  summaries: Readonly<Record<number, BinarySearchUnitPhaseSummary>>;
  onReviewPhase: (index: number) => void;
  /** フィードバック専用画面への入口（#369）。単元のフィードバックがある場合だけ渡される。 */
  onShowFeedback?: () => void;
  /** 大目標の達成の提示（#370）。単元完了と重なる達成を結果の一部として出す。紙吹雪はこの画面の既存の最大級が担い、追加では発火しない。 */
  goalAchievement?: ReactNode;
}) {
  const headingRef = useRef<HTMLParagraphElement>(null);
  const reduced = useReducedMotion();
  useEffect(() => { headingRef.current?.focus(); }, []);
  // 要約タイルはサマリにある記録だけから組み立てる（記録のない項目は出さない）。
  const assessed = binarySearchUnitPhases.map((_, index) => summaries[index])
    .filter(summary => summary?.totalQuestions !== undefined && summary.firstAttemptCorrect !== undefined);
  const firstCorrectTotal = assessed.reduce((sum, summary) => sum + (summary?.firstAttemptCorrect ?? 0), 0);
  const questionTotal = assessed.reduce((sum, summary) => sum + (summary?.totalQuestions ?? 0), 0);
  const implementation = summaries[binarySearchUnitPhases.length - 1];
  const hintTotal = (implementation?.hintUsage ?? []).reduce((sum, count) => sum + count, 0);
  const tiles: { label: string; value: string }[] = [];
  if (questionTotal > 0) tiles.push({ label: "初回正解（確認問題・応用問題）", value: `${firstCorrectTotal} / ${questionTotal} 問` });
  if (implementation?.testRuns !== undefined) tiles.push({ label: "自分で実装のテスト実行", value: `${implementation.testRuns} 回` });
  if (implementation?.hintUsage !== undefined) tiles.push({ label: "ヒント使用", value: hintTotal > 0 ? `${hintTotal} 回` : "未使用" });
  // スクロールはこの画面専用に持たず、外側（画面全幅）のスクロールに任せる（#150）。
  return <Box component="section" aria-label="単元完了のリザルト"
    sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, p: 2 }}>
    <ResultConfetti preset="final" />
    <Box component={motion.div} aria-hidden="true" data-final-result-mark
      initial={reduced ? false : { scale: 0.8, opacity: 0.5 }} animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: reduced ? 0 : 0.6, repeat: 0, ease: "easeOut" }}
      sx={{ width: 96, height: 96, borderRadius: "50%", bgcolor: playerTokens.layers.layer0, display: "grid", placeItems: "center", mt: 2 }}>
      <DrawnCheck />
    </Box>
    <Typography ref={headingRef} component="h2" tabIndex={-1} sx={headingSx}>{binarySearchImplementationContent.result.title}</Typography>
    <UnitPathMiniMap count={binarySearchUnitPhases.length} />
    {tiles.length > 0 && <Box data-final-stats sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, justifyContent: "center", width: "100%", maxWidth: 640 }}>
      {tiles.map(tile => <StatTile key={tile.label} label={tile.label} value={tile.value} />)}
    </Box>}
    <Typography component="p" sx={{ fontWeight: 700, fontSize: 17 }}>{binarySearchUnitText.summaryHeading}</Typography>
    <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0, width: "100%", maxWidth: 560 }}>
      {binarySearchUnitPhases.map((phase, index) => {
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
    <Typography component="p" sx={{ textAlign: "center", fontSize: 16, maxWidth: 640 }}>{binarySearchImplementationContent.result.closing}</Typography>
    {newAchievements}
    {goalAchievement}
    {rewards && renderRewards?.(rewards)}
    <Typography component="p" sx={{ textAlign: "center", fontSize: 15 }}>{binarySearchUnitText.reviewNote}</Typography>
    {onShowFeedback ? <>
      <Button variant="contained" onClick={onShowFeedback} sx={{ ...nextButtonSx, minHeight: 48, px: 3, fontSize: 16, fontWeight: 700 }}>フィードバックへ進む</Button>
      <Button variant="text" component={Link} href="/courses" sx={{ mb: 2, minHeight: 44, fontWeight: 700, color: playerTokens.control }}>{binarySearchUnitText.backToCourses}</Button>
    </> : <Button variant="contained" component={Link} href="/courses" sx={{ ...nextButtonSx, mb: 2 }}>{binarySearchUnitText.backToCourses}</Button>}
  </Box>;
}
