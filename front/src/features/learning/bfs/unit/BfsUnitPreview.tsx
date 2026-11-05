"use client";

import CheckIcon from "@mui/icons-material/Check";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import { Box, Button, Typography } from "@mui/material";
import { useCallback, useMemo, useState, type ReactNode } from "react";

import { playerTokens } from "../../player/player.tokens";
import { BfsCheckPreview } from "../check/BfsCheckPreview";
import { BfsCodeCheckPreview } from "../code-check/BfsCodeCheckPreview";
import { BfsCodeMappingPreview } from "../code-mapping/BfsCodeMappingPreview";
import { BfsConsolidationPreview } from "../consolidation/BfsConsolidationPreview";
import { BfsExecutionPreview } from "../execution/BfsExecutionPreview";
import { BfsImplementationPreview } from "../implementation/BfsImplementationPreview";
import { BfsMotivationPreview } from "../motivation/BfsMotivationPreview";
import { bfsUnitPhases, bfsUnitText, bfsUnitTitle } from "./unit.content";
import type { BfsUnitPhaseSummary } from "./unit.types";
import { UnitFinalResult, UnitResultScreen } from "./UnitResultScreens";

type Screen = { kind: "phase"; index: number } | { kind: "result"; index: number } | { kind: "final" };

/**
 * BFS 単元フロー（Issue #77）。単品ページで確認済みのフェーズ1〜7を、1つの単元として通して学べるよう接続する。
 * - 遷移は指針の3類型に従い、unit.content.ts の transitionOut で駆動する。
 * - 進捗はこの画面内の状態だけに持ち、保存しない（進捗保存・入口導線は #78 の範囲）。
 * - 一度開いたフェーズはマウントしたまま隠し、戻ったときに状態（再生位置、回答、書いたコード）が残るようにする。
 */
export function BfsUnitPreview() {
  const [screen, setScreen] = useState<Screen>({ kind: "phase", index: 0 });
  const [furthest, setFurthest] = useState(0);
  const [visited, setVisited] = useState<ReadonlySet<number>>(() => new Set([0]));
  const [summaries, setSummaries] = useState<Readonly<Record<number, BfsUnitPhaseSummary>>>({});
  const [unitComplete, setUnitComplete] = useState(false);

  const goToPhase = useCallback((index: number) => {
    setVisited(current => (current.has(index) ? current : new Set(current).add(index)));
    setScreen({ kind: "phase", index });
  }, []);

  const handleComplete = useCallback((index: number, summary?: BfsUnitPhaseSummary) => {
    if (summary) setSummaries(current => ({ ...current, [index]: summary }));
    setFurthest(current => Math.max(current, Math.min(index + 1, bfsUnitPhases.length - 1)));
    const transition = bfsUnitPhases[index].transitionOut;
    if (transition === "final") {
      setUnitComplete(true);
      setScreen({ kind: "final" });
    } else if (transition === "result") {
      setScreen({ kind: "result", index });
    } else if (transition === "result-in-phase") {
      // フェーズ6は診断画面がリザルトを兼ねる。完了だけ記録し、画面は切り替えない（次へは診断画面のボタン）。
    } else {
      goToPhase(index + 1);
    }
  }, [goToPhase]);

  const completeHandlers = useMemo(
    () => bfsUnitPhases.map((_, index) => (summary?: BfsUnitPhaseSummary) => handleComplete(index, summary)),
    [handleComplete],
  );

  const renderPhase = (index: number): ReactNode => {
    switch (index) {
      case 0: return <BfsMotivationPreview embedded onComplete={completeHandlers[0]} />;
      case 1: return <BfsExecutionPreview embedded onComplete={completeHandlers[1]} nextLabel={bfsUnitPhases[1].nextLabel} />;
      case 2: return <BfsCheckPreview embedded onComplete={completeHandlers[2]} />;
      case 3: return <BfsCodeMappingPreview embedded onComplete={completeHandlers[3]} nextLabel={bfsUnitPhases[3].nextLabel} />;
      case 4: return <BfsCodeCheckPreview embedded onComplete={completeHandlers[4]} />;
      case 5: return <BfsConsolidationPreview embedded onComplete={completeHandlers[5]} onNext={() => goToPhase(6)} nextLabel={bfsUnitPhases[5].nextLabel} />;
      case 6: return <BfsImplementationPreview embedded onComplete={completeHandlers[6]} />;
      default: return null;
    }
  };

  const isCompleted = (index: number) => index < furthest || summaries[index] !== undefined || (unitComplete && index === bfsUnitPhases.length - 1);
  const isCurrent = (index: number) => (screen.kind === "phase" || screen.kind === "result") && screen.index === index;

  return <Box component="main" sx={{ height: "100dvh", display: "flex", flexDirection: "column", bgcolor: playerTokens.background, color: playerTokens.text }}>
    <Box component="header" sx={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 1.5, px: { xs: 1, sm: 2 }, py: 1, borderBottom: `1px solid ${playerTokens.layers.layer1}` }}>
      <Typography component="h1" sx={{ fontSize: 16, fontWeight: 700, whiteSpace: "nowrap" }}>{bfsUnitTitle}</Typography>
      <Box role="navigation" aria-label={bfsUnitText.navLabel} sx={{ display: "flex", gap: 0.5, overflowX: "auto", flex: 1, py: 0.25 }}>
        {bfsUnitPhases.map((phase, index) => {
          const completed = isCompleted(index);
          const current = isCurrent(index);
          const reachable = index <= furthest;
          return <Button key={phase.id} disabled={!reachable} onClick={() => goToPhase(index)}
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
          </Button>;
        })}
        {unitComplete && <Button onClick={() => setScreen({ kind: "final" })}
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
        </Button>}
      </Box>
    </Box>
    <Box sx={{ flex: 1, minHeight: 0, display: "flex", justifyContent: "center" }}>
      <Box sx={{ width: "84vw", height: "100%", display: "flex", flexDirection: "column" }}>
        {bfsUnitPhases.map((phase, index) => visited.has(index) && (
          <Box key={phase.id} sx={{ display: screen.kind === "phase" && screen.index === index ? "flex" : "none", flexDirection: "column", flex: 1, minHeight: 0 }}>
            {renderPhase(index)}
          </Box>
        ))}
        {screen.kind === "result" && (
          <UnitResultScreen phase={bfsUnitPhases[screen.index]} summary={summaries[screen.index]} onNext={() => goToPhase(screen.index + 1)} />
        )}
        {screen.kind === "final" && (
          <UnitFinalResult summaries={summaries} onReviewPhase={goToPhase} onBackToStart={() => goToPhase(0)} />
        )}
      </Box>
    </Box>
  </Box>;
}
