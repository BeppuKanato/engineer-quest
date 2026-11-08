"use client";

import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CheckIcon from "@mui/icons-material/Check";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import { Alert, Box, Button, CircularProgress, Paper, Typography } from "@mui/material";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import type { LearningObserver } from "../../../../lib/learningEvents";
import { useLearningVisit } from "../../instrumentation/useLearningVisit";
import type { LearningRewards } from "../../app/rewards";
import { AnswerFeedbackNotice } from "../../assessment/AnswerFeedback";

import { playerTokens } from "../../player/player.tokens";
import { BfsCheckPreview } from "../check/BfsCheckPreview";
import { BfsCodeCheckPreview } from "../code-check/BfsCodeCheckPreview";
import { BfsCodeMappingPreview } from "../code-mapping/BfsCodeMappingPreview";
import { BfsConsolidationPreview } from "../consolidation/BfsConsolidationPreview";
import { BfsExecutionPreview } from "../execution/BfsExecutionPreview";
import { BfsImplementationPreview } from "../implementation/BfsImplementationPreview";
import { BfsMotivationPreview } from "../motivation/BfsMotivationPreview";
import { bfsUnitPhases, nextPhaseLabel, bfsUnitText, bfsUnitTitle, type BfsUnitPhase } from "./unit.content";
import type { BfsUnitPhaseSummary } from "./unit.types";
import { PhaseBridgeScreen } from "./PhaseBridgeScreen";
import { UnitFinalResult, UnitResultScreen } from "./UnitResultScreens";

type Screen = { kind: "phase"; index: number } | { kind: "result"; index: number } | { kind: "bridge"; index: number } | { kind: "final" };

/** フィードバックの対象になる確認フェーズ（3・5・6）。#202 */
const isCheckPhase = (phase: BfsUnitPhase) => phase.phase === 3 || phase.phase === 5 || phase.phase === 6;

/**
 * BFS 単元フロー（Issue #77）。単品ページで確認済みのフェーズ1〜7を、1つの単元として通して学べるよう接続する。
 * - 遷移は指針の3類型に従い、unit.content.ts の transitionOut で駆動する。
 * - 未指定時は画面内だけのプレビュー。アプリは任意の初期進捗・保存・計装ポートを接続する。
 * - 一度開いたフェーズはマウントしたまま隠し、戻ったときに状態（再生位置、回答、書いたコード）が残るようにする。
 */
export type BfsUnitPreviewProps = {
  embedded?: boolean;
  initialPhaseIndex?: number | null;
  initialFurthestIndex?: number;
  initialUnitComplete?: boolean;
  initialCompletedPhases?: readonly string[];
  initialSummaries?: Readonly<Record<number, BfsUnitPhaseSummary>>;
  initialCode?: string;
  onCodeChange?: (code: string) => void;
  onPhaseComplete?: (phaseKey: string, summary?: BfsUnitPhaseSummary) => Promise<void>;
  onFinalResult?: () => void;
  onLearningEvent?: (event: Parameters<LearningObserver>[0] & { phaseKey?: string }) => void;
  rewards?: LearningRewards;
  renderRewards?: (rewards: LearningRewards) => ReactNode;
  // フィードバック接続（#202）。確認フェーズ（3・5・6）の完了保存後に先行生成を
  // 依頼し、結果画面と最終結果にフィードバックの差し込み口を提供する。
  onCheckPhaseCompleted?: (phaseKey: string, nextPhaseKey: string | null) => void;
  renderPhaseFeedback?: (phaseKey: string, nextPhaseKey: string | null, nav: { goToPhase: (phaseKey: string) => void; goNext: () => void }) => ReactNode;
  renderUnitFeedback?: () => ReactNode;
};
export function BfsUnitPreview({ embedded = false, initialPhaseIndex = 0, initialFurthestIndex, initialUnitComplete = false, initialCompletedPhases = [], initialSummaries = {}, initialCode, onCodeChange, onPhaseComplete, onFinalResult, onLearningEvent, rewards, renderRewards, onCheckPhaseCompleted, renderPhaseFeedback, renderUnitFeedback }: BfsUnitPreviewProps = {}) {
  const first = initialPhaseIndex === null ? null : Math.max(0, Math.min(initialPhaseIndex, bfsUnitPhases.length - 1));
  const [screen, setScreen] = useState<Screen>(first === null ? { kind: "final" } : { kind: "phase", index: first });
  const screenRef = useRef(screen);
  const [furthest, setFurthest] = useState(initialFurthestIndex ?? first ?? bfsUnitPhases.length - 1);
  const [visited, setVisited] = useState<ReadonlySet<number>>(() => new Set(first === null ? [] : [first]));
  const [summaries, setSummaries] = useState<Readonly<Record<number, BfsUnitPhaseSummary>>>(initialSummaries);
  const [completed, setCompleted] = useState(() => new Set(initialCompletedPhases));
  const [unitComplete, setUnitComplete] = useState(initialUnitComplete || first === null);
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);
  const reviewCounts = useRef<Record<string, number>>({});
  const [failed, setFailed] = useState<{ index: number; summary?: BfsUnitPhaseSummary } | null>(null);
  const observer = useRef(onLearningEvent);
  useEffect(() => { screenRef.current = screen; observer.current = onLearningEvent; }, [screen, onLearningEvent]);
  const phaseKey = screen.kind === "final" ? undefined : bfsUnitPhases[screen.index].id;
  const onUnitEvent = useCallback<LearningObserver>(event => onLearningEvent?.({ ...event,
    phaseKey: typeof event.payload?.phaseKey === "string" ? event.payload.phaseKey : undefined,
  }), [onLearningEvent]);
  useLearningVisit(onLearningEvent ? onUnitEvent : undefined, screen.kind === "phase", "phase_start", phaseKey, { phaseKey });
  useLearningVisit(onLearningEvent ? onUnitEvent : undefined, screen.kind === "result", "phase_result_view", phaseKey, { phaseKey });
  useLearningVisit(onLearningEvent ? onUnitEvent : undefined, screen.kind === "bridge", "phase_bridge_view", phaseKey, { phaseKey });
  useLearningVisit(onLearningEvent, screen.kind === "final", "unit_result_view");
  useEffect(() => { if (screen.kind === "final") onFinalResult?.(); }, [screen.kind, onFinalResult]);
  // 非表示への切替で閉じる滞在区間や、開始済みの非同期実行結果も元のフェーズへ記録する。
  const phaseObservers = useMemo(() => bfsUnitPhases.map((phase): LearningObserver => event => {
    observer.current?.({ ...event, phaseKey: phase.id });
  }), []);

  const goToPhase = useCallback((index: number) => {
    if (busy.current) return;
    const previous = screenRef.current;
    const reviewing = previous.kind === "final" || (previous.kind === "bridge" ? index < previous.index : index <= previous.index);
    const target = bfsUnitPhases[index].id;
    if (reviewing) reviewCounts.current[target] = (reviewCounts.current[target] ?? 0) + 1;
    observer.current?.({ eventType: "phase_move", phaseKey: bfsUnitPhases[index].id, payload: { from: previous.kind === "final" ? "final" : bfsUnitPhases[previous.index].id, to: bfsUnitPhases[index].id,
      direction: reviewing ? "review" : "forward", reviewCount: reviewCounts.current[target] ?? 0 } });
    setVisited(current => (current.has(index) ? current : new Set(current).add(index)));
    setScreen({ kind: "phase", index });
  }, []);

  // ブリッジからの前進は phase_move（forward）として記録し、対象フェーズを開く。
  const proceedFromBridge = useCallback((index: number) => {
    observer.current?.({ eventType: "phase_move", phaseKey: bfsUnitPhases[index].id, payload: { from: bfsUnitPhases[index - 1].id, to: bfsUnitPhases[index].id,
      direction: "forward", reviewCount: 0 } });
    setVisited(current => (current.has(index) ? current : new Set(current).add(index)));
    setScreen({ kind: "phase", index });
  }, []);

  const handleComplete = useCallback(async (index: number, summary?: BfsUnitPhaseSummary) => {
    if (busy.current) return;
    busy.current = true; setSaving(true); setFailed(null);
    try {
      if (onPhaseComplete) await onPhaseComplete(bfsUnitPhases[index].id, summary);
      // 確認フェーズの完了が保存できたら、結果画面の表示前に生成を始める（#202）。
      if (onCheckPhaseCompleted && isCheckPhase(bfsUnitPhases[index])) {
        onCheckPhaseCompleted(bfsUnitPhases[index].id, bfsUnitPhases[index + 1]?.id ?? null);
      }
      observer.current?.({ eventType: "phase_complete", phaseKey: bfsUnitPhases[index].id, payload: { summary } });
      if (summary) setSummaries(current => ({ ...current, [index]: summary }));
      setCompleted(current => new Set(current).add(bfsUnitPhases[index].id));
      setFurthest(current => Math.max(current, Math.min(index + 1, bfsUnitPhases.length - 1)));
      const transition = bfsUnitPhases[index].transitionOut;
      if (transition === "final") setUnitComplete(true);
      const current = screenRef.current;
      if (onPhaseComplete && (current.kind !== "phase" || current.index !== index)) return;
      // フェーズ7（final）は自動遷移しない。学習者がフェーズ7画面の
      // 「単元の結果を見る」を押したときだけ最終結果へ進む（#305 案A'）。
      if (transition === "result") setScreen({ kind: "result", index });
      else if (transition === "bridge") {
        busy.current = false;
        setScreen({ kind: "bridge", index: index + 1 });
      }
    } catch { setFailed({ index, summary }); }
    finally { busy.current = false; setSaving(false); }
  }, [goToPhase, onPhaseComplete, onCheckPhaseCompleted]);

  const completeHandlers = useMemo(
    () => bfsUnitPhases.map((_, index) => (summary?: BfsUnitPhaseSummary) => { void handleComplete(index, summary); }),
    [handleComplete],
  );

  const renderPhase = (index: number): ReactNode => {
    switch (index) {
      case 0: return <BfsMotivationPreview embedded active={!onLearningEvent || screen.kind === "phase" && screen.index === 0} onLearningEvent={onLearningEvent ? phaseObservers[0] : undefined} onComplete={completeHandlers[0]} />;
      case 1: return <BfsExecutionPreview embedded active={!onLearningEvent || screen.kind === "phase" && screen.index === 1} onLearningEvent={onLearningEvent ? phaseObservers[1] : undefined} onComplete={completeHandlers[1]} nextLabel={nextPhaseLabel(bfsUnitPhases[1])} />;
      case 2: return <BfsCheckPreview embedded active={!onLearningEvent || screen.kind === "phase" && screen.index === 2} onLearningEvent={onLearningEvent ? phaseObservers[2] : undefined} onComplete={completeHandlers[2]} />;
      case 3: return <BfsCodeMappingPreview embedded active={!onLearningEvent || screen.kind === "phase" && screen.index === 3} onLearningEvent={onLearningEvent ? phaseObservers[3] : undefined} onComplete={completeHandlers[3]} nextLabel={nextPhaseLabel(bfsUnitPhases[3])} />;
      case 4: return <BfsCodeCheckPreview embedded active={!onLearningEvent || screen.kind === "phase" && screen.index === 4} onLearningEvent={onLearningEvent ? phaseObservers[4] : undefined} onComplete={completeHandlers[4]} />;
      case 5: return <BfsConsolidationPreview embedded active={!onLearningEvent || screen.kind === "phase" && screen.index === 5} onLearningEvent={onLearningEvent ? phaseObservers[5] : undefined} onComplete={completeHandlers[5]} onNext={() => setScreen({ kind: "bridge", index: 6 })} nextLabel={nextPhaseLabel(bfsUnitPhases[5])} />;
      case 6: return <BfsImplementationPreview embedded active={!onLearningEvent || screen.kind === "phase" && screen.index === 6} onLearningEvent={onLearningEvent ? phaseObservers[6] : undefined} initialCode={initialCode} onCodeChange={onCodeChange} onComplete={completeHandlers[6]} onShowFinalResult={() => setScreen({ kind: "final" })} />;
      default: return null;
    }
  };

  const isCompleted = (index: number) => completed.has(bfsUnitPhases[index].id);
  const isCurrent = (index: number) => (screen.kind === "phase" || screen.kind === "result" || screen.kind === "bridge") && screen.index === index;

  return <Box component={embedded ? "div" : "main"} sx={{ height: embedded ? "100%" : "100dvh", minHeight: 0, display: "flex", flexDirection: "column", bgcolor: playerTokens.background, color: playerTokens.text }}>
    <Box component="header" sx={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 1.5, px: { xs: 1, sm: 2 }, py: 1, borderBottom: `1px solid ${playerTokens.layers.layer1}` }}>
      <Typography component="h1" sx={{ fontSize: 16, fontWeight: 700, whiteSpace: "nowrap" }}>{bfsUnitTitle}</Typography>
      <Box role="navigation" aria-label={bfsUnitText.navLabel} sx={{ display: "flex", alignItems: "center", gap: 0.5, overflowX: "auto", flex: 1, py: 0.25 }}>
        {bfsUnitPhases.map((phase, index) => {
          const completed = isCompleted(index);
          const current = isCurrent(index);
          const reachable = index <= furthest;
          return <Fragment key={phase.id}>
          {index > 0 && <ArrowForwardIcon aria-hidden sx={{ fontSize: 14, flexShrink: 0, color: playerTokens.states.completed.stroke }} />}
          <Button disabled={!reachable} onClick={() => goToPhase(index)}
            aria-current={current ? "step" : undefined}
            startIcon={completed && !current ? <CheckIcon sx={{ fontSize: 16 }} /> : undefined}
            sx={{
              minHeight: 36, px: 1.25, whiteSpace: "nowrap", fontSize: 13.5, borderRadius: 999,
              color: current ? playerTokens.surface : playerTokens.text,
              bgcolor: current ? playerTokens.focus : "transparent",
              border: `2px solid ${current ? playerTokens.focus : completed ? playerTokens.focus : playerTokens.states.idle.stroke}`,
              "&:hover": { bgcolor: current ? playerTokens.states.processing.stroke : playerTokens.layers.layer0 },
              "&.Mui-disabled": { color: playerTokens.states.completed.stroke, borderColor: playerTokens.layers.layer1 },
            }}>
            {phase.phase}. {phase.shortName}
          </Button>
          </Fragment>;
        })}
        {unitComplete && <>
          <ArrowForwardIcon aria-hidden sx={{ fontSize: 14, flexShrink: 0, color: playerTokens.states.completed.stroke }} />
          <Button onClick={() => setScreen({ kind: "final" })}
          aria-current={screen.kind === "final" ? "step" : undefined}
          startIcon={<EmojiEventsIcon sx={{ fontSize: 16 }} />}
          sx={{
            minHeight: 36, px: 1.25, whiteSpace: "nowrap", fontSize: 13.5, borderRadius: 999,
            color: screen.kind === "final" ? playerTokens.surface : playerTokens.text,
            bgcolor: screen.kind === "final" ? playerTokens.focus : "transparent",
            border: `2px solid ${playerTokens.focus}`,
            "&:hover": { bgcolor: screen.kind === "final" ? playerTokens.states.processing.stroke : playerTokens.layers.layer0 },
          }}>
          {bfsUnitText.finalChip}
          </Button>
        </>}
      </Box>
    </Box>
    {saving && (
      <Paper role="status" elevation={6} sx={{ position: "fixed", left: "50%", bottom: 24, transform: "translateX(-50%)", zIndex: 1250, display: "flex", alignItems: "center", gap: 1.25, px: 2.25, py: 1.25, borderRadius: 999, pointerEvents: "none" }}>
        <CircularProgress size={18} thickness={5} />
        <Typography sx={{ fontSize: 14, fontWeight: 700, whiteSpace: "nowrap" }}>進捗を保存しています…</Typography>
      </Paper>
    )}
    {failed && <Alert severity="error" action={<Button onClick={() => void handleComplete(failed.index, failed.summary)}>再試行</Button>}>進捗を保存できませんでした。再試行してから次へ進んでください。</Alert>}
    <Box inert={!!failed || undefined} sx={{ flex: 1, minHeight: 0, display: "flex", justifyContent: "center", overflowY: screen.kind === "final" ? "auto" : undefined }}>
      <Box sx={{ width: screen.kind === "phase" && screen.index === 6 ? "100%" : "84vw", height: screen.kind === "final" ? "auto" : "100%", minHeight: "100%", display: "flex", flexDirection: "column" }}>
        {screen.kind === "phase" && <AnswerFeedbackNotice assessmentId={phaseKey} />}
        {bfsUnitPhases.map((phase, index) => visited.has(index) && (
          <Box key={phase.id} sx={{ display: screen.kind === "phase" && screen.index === index ? "flex" : "none", flexDirection: "column", flex: 1, minHeight: 0 }}>
            {renderPhase(index)}
          </Box>
        ))}
        {screen.kind === "result" && (
          <UnitResultScreen phase={bfsUnitPhases[screen.index]} summary={summaries[screen.index]} onNext={() => setScreen({ kind: "bridge", index: screen.index + 1 })}
            feedback={isCheckPhase(bfsUnitPhases[screen.index]) && renderPhaseFeedback ? renderPhaseFeedback(bfsUnitPhases[screen.index].id, bfsUnitPhases[screen.index + 1]?.id ?? null, {
              goToPhase: key => { const target = bfsUnitPhases.findIndex(p => p.id === key); if (target >= 0) goToPhase(target); },
              goNext: () => setScreen({ kind: "bridge", index: screen.index + 1 }),
            }) : undefined} />
        )}
        {screen.kind === "bridge" && (
          <PhaseBridgeScreen phase={bfsUnitPhases[screen.index]} onProceed={() => proceedFromBridge(screen.index)} />
        )}
        {screen.kind === "final" && (
          <UnitFinalResult rewards={rewards} renderRewards={renderRewards} summaries={summaries} onReviewPhase={goToPhase} feedback={renderUnitFeedback?.()} />
        )}
      </Box>
    </Box>
  </Box>;
}
