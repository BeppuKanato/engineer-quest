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
import { WallExtensionCheckPreview } from "../check/WallExtensionCheckPreview";
import { WallExtensionCodeCheckPreview } from "../code-check/WallExtensionCodeCheckPreview";
import { WallExtensionCodeMappingPreview } from "../code-mapping/WallExtensionCodeMappingPreview";
import { WallExtensionConsolidationPreview } from "../consolidation/WallExtensionConsolidationPreview";
import { WallExtensionExecutionPreview } from "../execution/WallExtensionExecutionPreview";
import { WallExtensionImplementationPreview } from "../implementation/WallExtensionImplementationPreview";
import { WallExtensionMotivationPreview } from "../motivation/WallExtensionMotivationPreview";
import { wallExtensionUnitPhases, nextPhaseLabel, wallExtensionUnitText, wallExtensionUnitTitle, type WallExtensionUnitPhase } from "./unit.content";
import type { WallExtensionUnitPhaseSummary } from "./unit.types";
import { UnitFinalResult, UnitResultScreen } from "./UnitResultScreens";
import { FeedbackPositionFigure } from "../../app/feedback/FeedbackPositionFigure";

type Screen = { kind: "phase"; index: number } | { kind: "result"; index: number } | { kind: "bridge"; index: number } | { kind: "final" } | { kind: "feedback"; index: number } | { kind: "unitFeedback" };

/** フィードバックの対象になる確認フェーズ（3・5・6）。#202 */
const isCheckPhase = (phase: WallExtensionUnitPhase) => phase.phase === 3 || phase.phase === 5 || phase.phase === 6;

/**
 * 棒倒し法 単元フロー（Issue #214）。単品ページで確認済みのフェーズ1〜7を、1つの単元として通して学べるよう接続する。
 * 状態機械と遷移の仕組みは BFS 単元（BfsUnitPreview）と同一で、フェーズの実体と単元定義だけが異なる。
 * - 遷移は指針の3類型に従い、unit.content.ts の transitionOut で駆動する。
 * - 未指定時は画面内だけのプレビュー。アプリは任意の初期進捗・保存・計装ポートを接続する。
 * - 一度開いたフェーズはマウントしたまま隠し、戻ったときに状態（再生位置、回答、書いたコード）が残るようにする。
 */
export type WallExtensionUnitPreviewProps = {
  embedded?: boolean;
  initialPhaseIndex?: number | null;
  initialFurthestIndex?: number;
  initialUnitComplete?: boolean;
  initialCompletedPhases?: readonly string[];
  initialSummaries?: Readonly<Record<number, WallExtensionUnitPhaseSummary>>;
  codeDraftBaseKey?: string;
  onCodeDraftError?: (failed: boolean) => void;
  onPhaseComplete?: (phaseKey: string, summary?: WallExtensionUnitPhaseSummary) => Promise<void>;
  onFinalResult?: () => void;
  onLearningEvent?: (event: Parameters<LearningObserver>[0] & { phaseKey?: string }) => void;
  rewards?: LearningRewards;
  renderRewards?: (rewards: LearningRewards) => ReactNode;
  // 実績の提示（#333）。結果画面のバンドと最終リザルトの新着ゾーンの差し込み口。
  renderPhaseAchievements?: (phaseKey: string) => ReactNode;
  renderNewAchievements?: () => ReactNode;
  // フィードバック接続（#202／#369）。確認フェーズ（3・5・6）の完了保存後に先行生成を
  // 依頼する。表示は結果画面の付属ではなく専用画面が担う：結果画面の前進で
  // フィードバック画面へ入り（renderPhaseFeedbackScreen）、最終結果からは
  // 専用の入口ボタンで単元のフィードバック画面へ進む（renderUnitFeedbackScreen）。
  // 位置の図は学習状態を持つこのコンテナが組み立てて nav.figure で渡す。
  onCheckPhaseCompleted?: (phaseKey: string, nextPhaseKey: string | null) => void;
  /** フィードバックがこの学習者に適用される見込みがあるか。false の間は結果画面の前進が従来のブリッジへ向かう。 */
  feedbackEnabled?: boolean;
  renderPhaseFeedbackScreen?: (phaseKey: string, nextPhaseKey: string | null, nav: { goToPhase: (phaseKey: string) => void; goNext: () => void; goBack: () => void; figure: ReactNode }) => ReactNode;
  renderUnitFeedbackScreen?: (nav: { goBack: () => void; figure: ReactNode }) => ReactNode;
};
export function WallExtensionUnitPreview({ embedded = false, initialPhaseIndex = 0, initialFurthestIndex, initialUnitComplete = false, initialCompletedPhases = [], initialSummaries = {}, codeDraftBaseKey, onCodeDraftError, onPhaseComplete, onFinalResult, onLearningEvent, rewards, renderRewards, renderPhaseAchievements, renderNewAchievements, onCheckPhaseCompleted, feedbackEnabled = false, renderPhaseFeedbackScreen, renderUnitFeedbackScreen }: WallExtensionUnitPreviewProps = {}) {
  const first = initialPhaseIndex === null ? null : Math.max(0, Math.min(initialPhaseIndex, wallExtensionUnitPhases.length - 1));
  const [screen, setScreen] = useState<Screen>(first === null ? { kind: "final" } : { kind: "phase", index: first });
  const screenRef = useRef(screen);
  const [furthest, setFurthest] = useState(initialFurthestIndex ?? first ?? wallExtensionUnitPhases.length - 1);
  const [visited, setVisited] = useState<ReadonlySet<number>>(() => new Set(first === null ? [] : [first]));
  const [summaries, setSummaries] = useState<Readonly<Record<number, WallExtensionUnitPhaseSummary>>>(initialSummaries);
  const [completed, setCompleted] = useState(() => new Set(initialCompletedPhases));
  const [unitComplete, setUnitComplete] = useState(initialUnitComplete || first === null);
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);
  const reviewCounts = useRef<Record<string, number>>({});
  const [failed, setFailed] = useState<{ index: number; summary?: WallExtensionUnitPhaseSummary } | null>(null);
  const observer = useRef(onLearningEvent);
  useEffect(() => { screenRef.current = screen; observer.current = onLearningEvent; }, [screen, onLearningEvent]);
  const failedRef = useRef<{ index: number; summary?: WallExtensionUnitPhaseSummary } | null>(null);
  useEffect(() => { failedRef.current = failed; }, [failed]);
  const phaseKey = screen.kind === "final" || screen.kind === "unitFeedback" ? undefined : wallExtensionUnitPhases[screen.index].id;
  const onUnitEvent = useCallback<LearningObserver>(event => onLearningEvent?.({ ...event,
    phaseKey: typeof event.payload?.phaseKey === "string" ? event.payload.phaseKey : undefined,
  }), [onLearningEvent]);
  useLearningVisit(onLearningEvent ? onUnitEvent : undefined, screen.kind === "phase", "phase_start", phaseKey, { phaseKey });
  useLearningVisit(onLearningEvent ? onUnitEvent : undefined, screen.kind === "result", "phase_result_view", phaseKey, { phaseKey });
  useLearningVisit(onLearningEvent ? onUnitEvent : undefined, screen.kind === "bridge", "phase_bridge_view", phaseKey, { phaseKey });
  useLearningVisit(onLearningEvent, screen.kind === "final", "unit_result_view");
  useLearningVisit(onLearningEvent ? onUnitEvent : undefined, screen.kind === "feedback", "feedback_view", phaseKey, { phaseKey });
  useLearningVisit(onLearningEvent, screen.kind === "unitFeedback", "unit_feedback_view");
  useEffect(() => { if (screen.kind === "final") onFinalResult?.(); }, [screen.kind, onFinalResult]);
  // 非表示への切替で閉じる滞在区間や、開始済みの非同期実行結果も元のフェーズへ記録する。
  const phaseObservers = useMemo(() => wallExtensionUnitPhases.map((phase): LearningObserver => event => {
    observer.current?.({ ...event, phaseKey: phase.id });
  }), []);

  const goToPhase = useCallback((index: number) => {
    if (busy.current) return;
    const previous = screenRef.current;
    const reviewing = previous.kind === "final" || previous.kind === "unitFeedback" || (previous.kind === "bridge" ? index < previous.index : index <= previous.index);
    const target = wallExtensionUnitPhases[index].id;
    if (reviewing) reviewCounts.current[target] = (reviewCounts.current[target] ?? 0) + 1;
    observer.current?.({ eventType: "phase_move", phaseKey: wallExtensionUnitPhases[index].id, payload: { from: previous.kind === "final" || previous.kind === "unitFeedback" ? "final" : wallExtensionUnitPhases[previous.index].id, to: wallExtensionUnitPhases[index].id,
      direction: reviewing ? "review" : "forward", reviewCount: reviewCounts.current[target] ?? 0 } });
    setVisited(current => (current.has(index) ? current : new Set(current).add(index)));
    setScreen({ kind: "phase", index });
  }, []);

  // ブリッジからの前進は phase_move（forward）として記録し、対象フェーズを開く。
  const proceedFromBridge = useCallback((index: number) => {
    observer.current?.({ eventType: "phase_move", phaseKey: wallExtensionUnitPhases[index].id, payload: { from: wallExtensionUnitPhases[index - 1].id, to: wallExtensionUnitPhases[index].id,
      direction: "forward", reviewCount: 0 } });
    setVisited(current => (current.has(index) ? current : new Set(current).add(index)));
    setScreen({ kind: "phase", index });
  }, []);

  const handleComplete = useCallback(async (index: number, summary?: WallExtensionUnitPhaseSummary) => {
    if (busy.current) return;
    const phase = wallExtensionUnitPhases[index];
    // リザルト遷移のフェーズ（3・5）は、保存を待たずに結果画面へ移る（#317 案1）。
    // 完了ビューが保存往復の間だけ閃く問題への対処で、保存は並行して行う。
    // 失敗時は結果画面上でも警告と再試行が出る（failed の Alert は画面種別に依らない）。
    // 保存のリトライでは、遷移と phase_complete の記録を繰り返さない。
    // 結果画面のフィードバックは保存の確定後にマウントする（未保存のまま先行リクエストすると
    // 未完了として404になり、その画面では二度と表示されないため。#202）。
    if (phase.transitionOut === "result") {
      const retrying = failedRef.current?.index === index;
      busy.current = true; setSaving(true);
      if (!retrying) {
        observer.current?.({ eventType: "phase_complete", phaseKey: phase.id, payload: { summary } });
        if (summary) setSummaries(current => ({ ...current, [index]: summary }));
        setCompleted(current => new Set(current).add(phase.id));
        setFurthest(current => Math.max(current, Math.min(index + 1, wallExtensionUnitPhases.length - 1)));
        const current = screenRef.current;
        if (current.kind === "phase" && current.index === index) setScreen({ kind: "result", index });
      }
      try {
        if (onPhaseComplete) await onPhaseComplete(phase.id, summary);
        // 確認フェーズの完了が保存できたら、結果画面の表示前に生成を始める（#202）。
        if (onCheckPhaseCompleted && isCheckPhase(phase)) {
          onCheckPhaseCompleted(phase.id, wallExtensionUnitPhases[index + 1]?.id ?? null);
        }
        setFailed(null);
      } catch { setFailed({ index, summary }); }
      finally { busy.current = false; setSaving(false); }
      return;
    }
    busy.current = true; setSaving(true); setFailed(null);
    try {
      if (onPhaseComplete) await onPhaseComplete(wallExtensionUnitPhases[index].id, summary);
      // 確認フェーズの完了が保存できたら、結果画面の表示前に生成を始める（#202）。
      if (onCheckPhaseCompleted && isCheckPhase(wallExtensionUnitPhases[index])) {
        onCheckPhaseCompleted(wallExtensionUnitPhases[index].id, wallExtensionUnitPhases[index + 1]?.id ?? null);
      }
      observer.current?.({ eventType: "phase_complete", phaseKey: wallExtensionUnitPhases[index].id, payload: { summary } });
      if (summary) setSummaries(current => ({ ...current, [index]: summary }));
      setCompleted(current => new Set(current).add(wallExtensionUnitPhases[index].id));
      setFurthest(current => Math.max(current, Math.min(index + 1, wallExtensionUnitPhases.length - 1)));
      const transition = wallExtensionUnitPhases[index].transitionOut;
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
    () => wallExtensionUnitPhases.map((_, index) => (summary?: WallExtensionUnitPhaseSummary) => { void handleComplete(index, summary); }),
    [handleComplete],
  );

  const renderPhase = (index: number): ReactNode => {
    switch (index) {
      case 0: return <WallExtensionMotivationPreview embedded active={!onLearningEvent || screen.kind === "phase" && screen.index === 0} onLearningEvent={onLearningEvent ? phaseObservers[0] : undefined} onComplete={completeHandlers[0]} />;
      case 1: return <WallExtensionExecutionPreview embedded active={!onLearningEvent || screen.kind === "phase" && screen.index === 1} onLearningEvent={onLearningEvent ? phaseObservers[1] : undefined} onComplete={completeHandlers[1]} nextLabel={nextPhaseLabel(wallExtensionUnitPhases[1])} />;
      case 2: return <WallExtensionCheckPreview embedded active={!onLearningEvent || screen.kind === "phase" && screen.index === 2} onLearningEvent={onLearningEvent ? phaseObservers[2] : undefined} onComplete={completeHandlers[2]} />;
      case 3: return <WallExtensionCodeMappingPreview embedded active={!onLearningEvent || screen.kind === "phase" && screen.index === 3} onLearningEvent={onLearningEvent ? phaseObservers[3] : undefined} onComplete={completeHandlers[3]} nextLabel={nextPhaseLabel(wallExtensionUnitPhases[3])} />;
      case 4: return <WallExtensionCodeCheckPreview embedded active={!onLearningEvent || screen.kind === "phase" && screen.index === 4} onLearningEvent={onLearningEvent ? phaseObservers[4] : undefined} onComplete={completeHandlers[4]} />;
      case 5: return <WallExtensionConsolidationPreview embedded active={!onLearningEvent || screen.kind === "phase" && screen.index === 5} onLearningEvent={onLearningEvent ? phaseObservers[5] : undefined} onComplete={completeHandlers[5]} onNext={() => setScreen({ kind: "bridge", index: 6 })} nextLabel={nextPhaseLabel(wallExtensionUnitPhases[5])} />;
      case 6: return <WallExtensionImplementationPreview embedded active={!onLearningEvent || screen.kind === "phase" && screen.index === 6} onLearningEvent={onLearningEvent ? phaseObservers[6] : undefined} codeDraftBaseKey={codeDraftBaseKey} onCodeDraftError={onCodeDraftError} onComplete={completeHandlers[6]} onShowFinalResult={() => setScreen({ kind: "final" })} />;
      default: return null;
    }
  };

  const isCompleted = (index: number) => completed.has(wallExtensionUnitPhases[index].id);
  const isCurrent = (index: number) => (screen.kind === "phase" || screen.kind === "result" || screen.kind === "bridge" || screen.kind === "feedback") && screen.index === index;
  // フィードバック専用画面の現在位置の図（#369）。完了集合と現在位置から組み立てる。
  const buildFeedbackFigure = (currentIndex: number, allDone: boolean): ReactNode => (
    <FeedbackPositionFigure
      states={wallExtensionUnitPhases.map((phase, index) => index === currentIndex ? "current" : allDone || completed.has(phase.id) ? "done" : "upcoming")}
      phaseNames={wallExtensionUnitPhases.map(phase => phase.formalName)} />
  );

  return <Box component={embedded ? "div" : "main"} sx={{ height: embedded ? "100%" : "100dvh", minHeight: 0, display: "flex", flexDirection: "column", bgcolor: playerTokens.background, color: playerTokens.text }}>
    <Box component="header" sx={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 1.5, px: { xs: 1, sm: 2 }, py: 1, borderBottom: `1px solid ${playerTokens.layers.layer1}` }}>
      <Typography component="h1" sx={{ fontSize: 16, fontWeight: 700, whiteSpace: "nowrap" }}>{wallExtensionUnitTitle}</Typography>
      <Box role="navigation" aria-label={wallExtensionUnitText.navLabel} sx={{ display: "flex", alignItems: "center", gap: 0.5, overflowX: "auto", flex: 1, py: 0.25 }}>
        {wallExtensionUnitPhases.map((phase, index) => {
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
          aria-current={screen.kind === "final" || screen.kind === "unitFeedback" ? "step" : undefined}
          startIcon={<EmojiEventsIcon sx={{ fontSize: 16 }} />}
          sx={{
            minHeight: 36, px: 1.25, whiteSpace: "nowrap", fontSize: 13.5, borderRadius: 999,
            color: screen.kind === "final" || screen.kind === "unitFeedback" ? playerTokens.surface : playerTokens.text,
            bgcolor: screen.kind === "final" || screen.kind === "unitFeedback" ? playerTokens.focus : "transparent",
            border: `2px solid ${playerTokens.focus}`,
            "&:hover": { bgcolor: screen.kind === "final" || screen.kind === "unitFeedback" ? playerTokens.states.processing.stroke : playerTokens.layers.layer0 },
          }}>
          {wallExtensionUnitText.finalChip}
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
    {screen.kind === "phase" && (
      <Box sx={{ flexShrink: 0, display: "flex", justifyContent: "center" }}>
        <Box sx={{ width: screen.index === 6 ? "100%" : "84vw" }}>
          <AnswerFeedbackNotice assessmentId={phaseKey} />
        </Box>
      </Box>
    )}
    {/* 画面より高い内容はこの中でスクロールさせ、白い画面の外（body のグレー背景）へ
        はみ出して描かれないようにする（#303）。背景色もこの箱が担う。
        結果・ブリッジ・最終結果では、この箱が唯一のスクロール領域になる（#298）。 */}
    <Box inert={!!failed || undefined} sx={{ flex: 1, minHeight: 0, display: "flex", justifyContent: "center", overflowY: "auto", bgcolor: playerTokens.background }}>
      <Box sx={{ width: screen.kind === "phase" && screen.index === 6 ? "100%" : "84vw", height: screen.kind === "phase" ? "100%" : "auto", minHeight: "100%", display: "flex", flexDirection: "column" }}>
        {wallExtensionUnitPhases.map((phase, index) => visited.has(index) && (
          <Box key={phase.id} sx={{ display: screen.kind === "phase" && screen.index === index ? "flex" : "none", flexDirection: "column", flex: 1, minHeight: 0 }}>
            {renderPhase(index)}
          </Box>
        ))}
        {screen.kind === "result" && (
          <UnitResultScreen phase={wallExtensionUnitPhases[screen.index]} summary={summaries[screen.index]}
            onNext={isCheckPhase(wallExtensionUnitPhases[screen.index]) && feedbackEnabled && renderPhaseFeedbackScreen && !saving && !failed
              ? () => setScreen({ kind: "feedback", index: screen.index })
              : () => setScreen({ kind: "bridge", index: screen.index + 1 })}
            achievements={renderPhaseAchievements?.(wallExtensionUnitPhases[screen.index].id)} />
        )}
        {screen.kind === "feedback" && renderPhaseFeedbackScreen?.(wallExtensionUnitPhases[screen.index].id, wallExtensionUnitPhases[screen.index + 1]?.id ?? null, {
          goToPhase: key => { const target = wallExtensionUnitPhases.findIndex(p => p.id === key); if (target >= 0) goToPhase(target); },
          goNext: () => setScreen({ kind: "bridge", index: screen.index + 1 }),
          goBack: () => setScreen({ kind: "result", index: screen.index }),
          figure: buildFeedbackFigure(screen.index, false),
        })}
        {screen.kind === "bridge" && (
          <PhaseBridgeScreen phase={wallExtensionUnitPhases[screen.index]} onProceed={() => proceedFromBridge(screen.index)} />
        )}
        {screen.kind === "final" && (
          <UnitFinalResult rewards={rewards} renderRewards={renderRewards} newAchievements={renderNewAchievements?.()} summaries={summaries} onReviewPhase={goToPhase}
            onShowFeedback={feedbackEnabled && renderUnitFeedbackScreen ? () => setScreen({ kind: "unitFeedback" }) : undefined} />
        )}
        {screen.kind === "unitFeedback" && renderUnitFeedbackScreen?.({
          goBack: () => setScreen({ kind: "final" }),
          figure: buildFeedbackFigure(wallExtensionUnitPhases.length - 1, true),
        })}
      </Box>
    </Box>
  </Box>;
}
