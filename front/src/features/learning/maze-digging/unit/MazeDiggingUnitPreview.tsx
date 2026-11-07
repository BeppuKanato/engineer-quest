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
import { PhaseBridgeScreen } from "../../bfs/unit/PhaseBridgeScreen";

import { playerTokens } from "../../player/player.tokens";
import { MazeDiggingCheckPreview } from "../check/MazeDiggingCheckPreview";
import { MazeDiggingCodeCheckPreview } from "../code-check/MazeDiggingCodeCheckPreview";
import { MazeDiggingCodeMappingPreview } from "../code-mapping/MazeDiggingCodeMappingPreview";
import { MazeDiggingConsolidationPreview } from "../consolidation/MazeDiggingConsolidationPreview";
import { MazeDiggingExecutionPreview } from "../execution/MazeDiggingExecutionPreview";
import { MazeDiggingImplementationPreview } from "../implementation/MazeDiggingImplementationPreview";
import { MazeDiggingMotivationPreview } from "../motivation/MazeDiggingMotivationPreview";
import { mazeDiggingUnitPhases, nextPhaseLabel, mazeDiggingUnitText, mazeDiggingUnitTitle, type MazeDiggingUnitPhase } from "./unit.content";
import type { MazeDiggingUnitPhaseSummary } from "./unit.types";
import { UnitFinalResult, UnitResultScreen } from "./UnitResultScreens";

type Screen = { kind: "phase"; index: number } | { kind: "result"; index: number } | { kind: "bridge"; index: number } | { kind: "final" };

/** フィードバックの対象になる確認フェーズ（3・5・6）。#202 */
const isCheckPhase = (phase: MazeDiggingUnitPhase) => phase.phase === 3 || phase.phase === 5 || phase.phase === 6;

/**
 * 穴掘り法 単元フロー（Issue #265）。単品ページで確認済みのフェーズ1〜7を、1つの単元として通して学べるよう接続する。
 * 状態機械と遷移の仕組みは BFS 単元（BfsUnitPreview）と同一で、フェーズの実体と単元定義だけが異なる。
 * - 遷移は指針の3類型に従い、unit.content.ts の transitionOut で駆動する。
 * - 未指定時は画面内だけのプレビュー。アプリは任意の初期進捗・保存・計装ポートを接続する。
 * - 一度開いたフェーズはマウントしたまま隠し、戻ったときに状態（再生位置、回答、書いたコード）が残るようにする。
 */
export type MazeDiggingUnitPreviewProps = {
  embedded?: boolean;
  initialPhaseIndex?: number | null;
  initialFurthestIndex?: number;
  initialUnitComplete?: boolean;
  initialCompletedPhases?: readonly string[];
  initialSummaries?: Readonly<Record<number, MazeDiggingUnitPhaseSummary>>;
  initialCode?: string;
  onCodeChange?: (code: string) => void;
  onPhaseComplete?: (phaseKey: string, summary?: MazeDiggingUnitPhaseSummary) => Promise<void>;
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
export function MazeDiggingUnitPreview({ embedded = false, initialPhaseIndex = 0, initialFurthestIndex, initialUnitComplete = false, initialCompletedPhases = [], initialSummaries = {}, initialCode, onCodeChange, onPhaseComplete, onFinalResult, onLearningEvent, rewards, renderRewards, onCheckPhaseCompleted, renderPhaseFeedback, renderUnitFeedback }: MazeDiggingUnitPreviewProps = {}) {
  const first = initialPhaseIndex === null ? null : Math.max(0, Math.min(initialPhaseIndex, mazeDiggingUnitPhases.length - 1));
  const [screen, setScreen] = useState<Screen>(first === null ? { kind: "final" } : { kind: "phase", index: first });
  const screenRef = useRef(screen);
  const [furthest, setFurthest] = useState(initialFurthestIndex ?? first ?? mazeDiggingUnitPhases.length - 1);
  const [visited, setVisited] = useState<ReadonlySet<number>>(() => new Set(first === null ? [] : [first]));
  const [summaries, setSummaries] = useState<Readonly<Record<number, MazeDiggingUnitPhaseSummary>>>(initialSummaries);
  const [completed, setCompleted] = useState(() => new Set(initialCompletedPhases));
  const [unitComplete, setUnitComplete] = useState(initialUnitComplete || first === null);
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);
  const reviewCounts = useRef<Record<string, number>>({});
  const [failed, setFailed] = useState<{ index: number; summary?: MazeDiggingUnitPhaseSummary } | null>(null);
  const observer = useRef(onLearningEvent);
  useEffect(() => { screenRef.current = screen; observer.current = onLearningEvent; }, [screen, onLearningEvent]);
  const phaseKey = screen.kind === "final" ? undefined : mazeDiggingUnitPhases[screen.index].id;
  const onUnitEvent = useCallback<LearningObserver>(event => onLearningEvent?.({ ...event,
    phaseKey: typeof event.payload?.phaseKey === "string" ? event.payload.phaseKey : undefined,
  }), [onLearningEvent]);
  useLearningVisit(onLearningEvent ? onUnitEvent : undefined, screen.kind === "phase", "phase_start", phaseKey, { phaseKey });
  useLearningVisit(onLearningEvent ? onUnitEvent : undefined, screen.kind === "result", "phase_result_view", phaseKey, { phaseKey });
  useLearningVisit(onLearningEvent ? onUnitEvent : undefined, screen.kind === "bridge", "phase_bridge_view", phaseKey, { phaseKey });
  useLearningVisit(onLearningEvent, screen.kind === "final", "unit_result_view");
  useEffect(() => { if (screen.kind === "final") onFinalResult?.(); }, [screen.kind, onFinalResult]);
  // 非表示への切替で閉じる滞在区間や、開始済みの非同期実行結果も元のフェーズへ記録する。
  const phaseObservers = useMemo(() => mazeDiggingUnitPhases.map((phase): LearningObserver => event => {
    observer.current?.({ ...event, phaseKey: phase.id });
  }), []);

  const goToPhase = useCallback((index: number) => {
    if (busy.current) return;
    const previous = screenRef.current;
    const reviewing = previous.kind === "final" || (previous.kind === "bridge" ? index < previous.index : index <= previous.index);
    const target = mazeDiggingUnitPhases[index].id;
    if (reviewing) reviewCounts.current[target] = (reviewCounts.current[target] ?? 0) + 1;
    observer.current?.({ eventType: "phase_move", phaseKey: mazeDiggingUnitPhases[index].id, payload: { from: previous.kind === "final" ? "final" : mazeDiggingUnitPhases[previous.index].id, to: mazeDiggingUnitPhases[index].id,
      direction: reviewing ? "review" : "forward", reviewCount: reviewCounts.current[target] ?? 0 } });
    setVisited(current => (current.has(index) ? current : new Set(current).add(index)));
    setScreen({ kind: "phase", index });
  }, []);

  // ブリッジからの前進は phase_move（forward）として記録し、対象フェーズを開く。
  const proceedFromBridge = useCallback((index: number) => {
    observer.current?.({ eventType: "phase_move", phaseKey: mazeDiggingUnitPhases[index].id, payload: { from: mazeDiggingUnitPhases[index - 1].id, to: mazeDiggingUnitPhases[index].id,
      direction: "forward", reviewCount: 0 } });
    setVisited(current => (current.has(index) ? current : new Set(current).add(index)));
    setScreen({ kind: "phase", index });
  }, []);

  const handleComplete = useCallback(async (index: number, summary?: MazeDiggingUnitPhaseSummary) => {
    if (busy.current) return;
    busy.current = true; setSaving(true); setFailed(null);
    try {
      if (onPhaseComplete) await onPhaseComplete(mazeDiggingUnitPhases[index].id, summary);
      // 確認フェーズの完了が保存できたら、結果画面の表示前に生成を始める（#202）。
      if (onCheckPhaseCompleted && isCheckPhase(mazeDiggingUnitPhases[index])) {
        onCheckPhaseCompleted(mazeDiggingUnitPhases[index].id, mazeDiggingUnitPhases[index + 1]?.id ?? null);
      }
      observer.current?.({ eventType: "phase_complete", phaseKey: mazeDiggingUnitPhases[index].id, payload: { summary } });
      if (summary) setSummaries(current => ({ ...current, [index]: summary }));
      setCompleted(current => new Set(current).add(mazeDiggingUnitPhases[index].id));
      setFurthest(current => Math.max(current, Math.min(index + 1, mazeDiggingUnitPhases.length - 1)));
      const transition = mazeDiggingUnitPhases[index].transitionOut;
      if (transition === "final") setUnitComplete(true);
      const current = screenRef.current;
      if (onPhaseComplete && (current.kind !== "phase" || current.index !== index)) return;
      if (transition === "final") setScreen({ kind: "final" });
      else if (transition === "result") setScreen({ kind: "result", index });
      else if (transition === "bridge") {
        busy.current = false;
        setScreen({ kind: "bridge", index: index + 1 });
      }
    } catch { setFailed({ index, summary }); }
    finally { busy.current = false; setSaving(false); }
  }, [goToPhase, onPhaseComplete, onCheckPhaseCompleted]);

  const completeHandlers = useMemo(
    () => mazeDiggingUnitPhases.map((_, index) => (summary?: MazeDiggingUnitPhaseSummary) => { void handleComplete(index, summary); }),
    [handleComplete],
  );

  const renderPhase = (index: number): ReactNode => {
    switch (index) {
      case 0: return <MazeDiggingMotivationPreview embedded active={!onLearningEvent || screen.kind === "phase" && screen.index === 0} onLearningEvent={onLearningEvent ? phaseObservers[0] : undefined} onComplete={completeHandlers[0]} />;
      case 1: return <MazeDiggingExecutionPreview embedded active={!onLearningEvent || screen.kind === "phase" && screen.index === 1} onLearningEvent={onLearningEvent ? phaseObservers[1] : undefined} onComplete={completeHandlers[1]} nextLabel={nextPhaseLabel(mazeDiggingUnitPhases[1])} />;
      case 2: return <MazeDiggingCheckPreview embedded active={!onLearningEvent || screen.kind === "phase" && screen.index === 2} onLearningEvent={onLearningEvent ? phaseObservers[2] : undefined} onComplete={completeHandlers[2]} />;
      case 3: return <MazeDiggingCodeMappingPreview embedded active={!onLearningEvent || screen.kind === "phase" && screen.index === 3} onLearningEvent={onLearningEvent ? phaseObservers[3] : undefined} onComplete={completeHandlers[3]} nextLabel={nextPhaseLabel(mazeDiggingUnitPhases[3])} />;
      case 4: return <MazeDiggingCodeCheckPreview embedded active={!onLearningEvent || screen.kind === "phase" && screen.index === 4} onLearningEvent={onLearningEvent ? phaseObservers[4] : undefined} onComplete={completeHandlers[4]} />;
      case 5: return <MazeDiggingConsolidationPreview embedded active={!onLearningEvent || screen.kind === "phase" && screen.index === 5} onLearningEvent={onLearningEvent ? phaseObservers[5] : undefined} onComplete={completeHandlers[5]} onNext={() => setScreen({ kind: "bridge", index: 6 })} nextLabel={nextPhaseLabel(mazeDiggingUnitPhases[5])} />;
      case 6: return <MazeDiggingImplementationPreview embedded active={!onLearningEvent || screen.kind === "phase" && screen.index === 6} onLearningEvent={onLearningEvent ? phaseObservers[6] : undefined} initialCode={initialCode} onCodeChange={onCodeChange} onComplete={completeHandlers[6]} />;
      default: return null;
    }
  };

  const isCompleted = (index: number) => completed.has(mazeDiggingUnitPhases[index].id);
  const isCurrent = (index: number) => (screen.kind === "phase" || screen.kind === "result" || screen.kind === "bridge") && screen.index === index;

  return <Box component={embedded ? "div" : "main"} sx={{ height: embedded ? "100%" : "100dvh", minHeight: 0, display: "flex", flexDirection: "column", bgcolor: playerTokens.background, color: playerTokens.text }}>
    <Box component="header" sx={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 1.5, px: { xs: 1, sm: 2 }, py: 1, borderBottom: `1px solid ${playerTokens.layers.layer1}` }}>
      <Typography component="h1" sx={{ fontSize: 16, fontWeight: 700, whiteSpace: "nowrap" }}>{mazeDiggingUnitTitle}</Typography>
      <Box role="navigation" aria-label={mazeDiggingUnitText.navLabel} sx={{ display: "flex", alignItems: "center", gap: 0.5, overflowX: "auto", flex: 1, py: 0.25 }}>
        {mazeDiggingUnitPhases.map((phase, index) => {
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
          {mazeDiggingUnitText.finalChip}
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
        <AnswerFeedbackNotice assessmentId={phaseKey} />
        {mazeDiggingUnitPhases.map((phase, index) => visited.has(index) && (
          <Box key={phase.id} sx={{ display: screen.kind === "phase" && screen.index === index ? "flex" : "none", flexDirection: "column", flex: 1, minHeight: 0 }}>
            {renderPhase(index)}
          </Box>
        ))}
        {screen.kind === "result" && (
          <UnitResultScreen phase={mazeDiggingUnitPhases[screen.index]} summary={summaries[screen.index]} onNext={() => setScreen({ kind: "bridge", index: screen.index + 1 })}
            feedback={isCheckPhase(mazeDiggingUnitPhases[screen.index]) && renderPhaseFeedback ? renderPhaseFeedback(mazeDiggingUnitPhases[screen.index].id, mazeDiggingUnitPhases[screen.index + 1]?.id ?? null, {
              goToPhase: key => { const target = mazeDiggingUnitPhases.findIndex(p => p.id === key); if (target >= 0) goToPhase(target); },
              goNext: () => setScreen({ kind: "bridge", index: screen.index + 1 }),
            }) : undefined} />
        )}
        {screen.kind === "bridge" && (
          <PhaseBridgeScreen phase={mazeDiggingUnitPhases[screen.index]} onProceed={() => proceedFromBridge(screen.index)} />
        )}
        {screen.kind === "final" && (
          <UnitFinalResult rewards={rewards} renderRewards={renderRewards} summaries={summaries} onReviewPhase={goToPhase} feedback={renderUnitFeedback?.()} />
        )}
      </Box>
    </Box>
  </Box>;
}
