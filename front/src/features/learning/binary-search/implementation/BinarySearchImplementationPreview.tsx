"use client";

import Editor, { type OnMount } from "@monaco-editor/react";
import { LEARNING_EDITOR_THEME, learningEditorTextCursor, setupLearningEditor } from "../../code/learningEditor";
import { Box, Button, Chip, Dialog, DialogContent, DialogTitle, Tab, Tabs, Typography } from "@mui/material";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { disposePyodideRunner, preparePyodide } from "../../../../lib/pyodideRunner";
import type { LearningInstrumentation } from "../../instrumentation/useLearningVisit";
import { implementationInputLevels, implementationInputLevelText, type ImplementationInputLevel } from "../../implementation/inputLevel";
import { useImplementationInputLevel } from "../../implementation/useImplementationInputLevel";
import { courseIdFromDraftKey, SOLUTION_REVEAL_FAILURE_THRESHOLD, type ImplementationClearRecord } from "../../implementation/answerReveal";
import { checkUsedAiConsultation } from "../../implementation/checkAiConsultation";
import { useSolutionRevealAttempt } from "../../implementation/useSolutionRevealAttempt";
import { SolutionRevealDialog, SolutionRevealValve } from "../../implementation/SolutionReveal";
import { useUserSession } from "@/app/component/userSession";
import { bridgeOptionalPhaseId, findOptionalPhase } from "../../unit/optionalPhases";
import { OptionalPhaseNote } from "../../unit/OptionalPhaseNote";

import { ResultConfetti } from "../../app/ResultConfetti";
import { useSoundEffect } from "../../../../app/component/soundFeedback";
import { useErrorLineDecoration } from "../../../../hooks/useErrorLineDecoration";
import { useTodoLineDecoration } from "../../../../hooks/useTodoLineDecoration";
import { playerTokens } from "../../player/player.tokens";
import { FreeExecutionConsole } from "./FreeExecutionConsole";
import { runBinarySearchFreeCode, type FreeExecutionResult } from "./freeExecution";
import { binarySearchEditorText as text } from "./editor.content";
import { editorTokens as colors } from "./editor.tokens";
import { ImplementationHintContent } from "./ImplementationHints";
import { RobotFigure } from "@/app/component/robotFigure";
import { ProgramResults } from "./ProgramResults";
import { binarySearchExampleProgram, binarySearchImplementationContent as content } from "./implementation.content";
import { IndexFigure } from "./IndexFigure";
import { allNamedTestsPassed, runAutoTests, runImplementationTests, recordHintUsage, runningMessage, type BinarySearchImplementationSummary, type HintLevel, type HintUsage, type TestOutcome } from "./implementation";

/** 達成モーダルの中で、見つけた位置が目立つ短い演出。 */
function BinarySearchFoundCelebration() {
  const sample = content.tests.find(test => test.id === "D1");
  if (!sample) return null;
  return <IndexFigure values={sample.values} highlight={sample.expected} animate label="見つけた位置が目立つ図" />;
}

/** 橋渡しカードのイラスト。実線の行＝もう書かれている、青い点線の空白＝自分で書く場所。 */
function LevelFillIllustration({ level }: { level: ImplementationInputLevel }) {
  const rows: Record<ImplementationInputLevel, readonly { w: number; write: boolean }[]> = {
    "full": [{ w: 0.5, write: false }, { w: 0.85, write: true }, { w: 0.65, write: true }, { w: 0.92, write: true }, { w: 0.72, write: true }, { w: 0.8, write: true }, { w: 0.45, write: true }],
    "skeleton": [{ w: 0.5, write: false }, { w: 0.7, write: false }, { w: 0.6, write: true }, { w: 0.85, write: false }, { w: 0.75, write: true }, { w: 0.62, write: true }, { w: 0.45, write: false }],
    "fill-in": [{ w: 0.5, write: false }, { w: 0.82, write: false }, { w: 0.66, write: false }, { w: 0.7, write: true }, { w: 0.9, write: false }, { w: 0.6, write: false }, { w: 0.45, write: true }],
  };
  const list = rows[level];
  return <svg viewBox="0 0 300 96" aria-hidden style={{ display: "block", width: "100%", height: "auto" }}>
    <rect x="1" y="1" width="298" height="94" rx="8" fill="#f8fafc" stroke="#dbe3ef" strokeWidth="2" />
    {list.map((row, i) => row.write
      ? <rect key={i} x="16" y={12 + i * 11} width={268 * row.w} height="7" rx="3.5" fill="#ffffff" stroke="#2563eb" strokeWidth="1.6" strokeDasharray="4 3" />
      : <rect key={i} x="16" y={12 + i * 11} width={268 * row.w} height="7" rx="3.5" fill="#94a3b8" />)}
  </svg>;
}

/**
 * フェーズ7（自由実装・プログラム形式）。学習者は標準入力から読み、
 * 標準出力へ出すプログラムを書く。入口では書き方の量を選ぶ（旧画面の
 * 選択ゲートをプログラム形のテンプレートで残した）。問題文は作業画面の
 * 「問題」タブにも常駐する。旧・関数形は implementation-legacy に保存。
 */
export function BinarySearchImplementationPreview({ embedded = false, onComplete, onLearningEvent, codeDraftBaseKey, onCodeDraftError, onShowFinalResult, onOptionalPhaseActive, optionalPhaseOpenRequest }: LearningInstrumentation & { embedded?: boolean; onComplete?: (summary: BinarySearchImplementationSummary) => void; codeDraftBaseKey?: string; onCodeDraftError?: (failed: boolean) => void; onShowFinalResult?: () => void; onOptionalPhaseActive?: (optionalPhaseId: string | null) => void; optionalPhaseOpenRequest?: { phaseId: string; seq: number } | null }) {
  // 下書きキーはプログラム形式専用にする（関数形の下書きと混ざらない）。
  const draftBaseKey = `${codeDraftBaseKey ?? `engineer-quest:learning-code:preview:${content.id}`}:program`;
  const { level, code, setCode, selectLevel } = useImplementationInputLevel({ draftBaseKey, templates: content.templates, onDraftError: onCodeDraftError });
  const [runtime, setRuntime] = useState<"loading" | "ready" | "error">("loading");
  const [running, setRunning] = useState(false);
  const [freeStatus, setFreeStatus] = useState<"idle" | "preparing" | "running">("idle");
  const [freeResult, setFreeResult] = useState<FreeExecutionResult | null>(null);
  const [panel, setPanel] = useState<"statement" | "tests" | "console" | "hints">("statement");
  // 入口では書き方の量を選ぶ（旧画面の選択ゲートを、プログラム形に合わせて残す）。
  const [started, setStarted] = useState(false);
  const [bridgeOpen, setBridgeOpen] = useState(false);
  const [solutionOpen, setSolutionOpen] = useState(false);
  // 解法例の解放バルブ（ステージ2）。失敗回数・閲覧・試行開始時刻は永続化され、画面を閉じても同じ試行として続く。
  const { attempt, unlocked: solutionUnlocked, recordFailure, markViewedSolution, resetAttempt } = useSolutionRevealAttempt(draftBaseKey);
  const failedRuns = attempt.failedRuns;
  const attemptRef = useRef(attempt); attemptRef.current = attempt;
  const pendingClearRef = useRef<ImplementationClearRecord | null>(null);
  const { firebaseUser } = useUserSession();
  // 任意フェーズ（実装の橋渡し）に滞在していることを、プレイヤー上部の
  // 区別表示へ知らせる（2026-11-28、任意フェーズの汎用仕組み）。
  useEffect(() => { onOptionalPhaseActive?.(bridgeOpen ? bridgeOptionalPhaseId : null); }, [bridgeOpen, onOptionalPhaseActive]);
  // プレイヤー上部の流れの要素から「実装の橋渡しを開く」要求が来たら、
  // 既存の橋渡しダイアログをそのまま開く（開閉の仕組みは一本のまま）。
  useEffect(() => {
    if (optionalPhaseOpenRequest?.phaseId === bridgeOptionalPhaseId) setBridgeOpen(true);
  }, [optionalPhaseOpenRequest]);
  const bridgeOptionalPhase = findOptionalPhase(bridgeOptionalPhaseId);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [celebrationDismissed, setCelebrationDismissed] = useState(false);
  const freeRunning = freeStatus !== "idle";
  const busy = running || freeRunning;
  const panelId = useId();
  const sidePanel = useRef<HTMLElement>(null);
  const [outcomes, setOutcomes] = useState<readonly TestOutcome[]>([]);
  const [lastOutcomes, setLastOutcomes] = useState<readonly TestOutcome[]>([]);
  const [runs, setRuns] = useState(0);
  const [usage, setUsage] = useState<HintUsage>([0, 0, 0, 0]);
  const [hint, setHint] = useState<HintLevel | null>(null);
  const [editorReady, setEditorReady] = useState(false);
  const editor = useRef<Parameters<OnMount>[0] | null>(null);
  const [errorLine, setErrorLine] = useState<number | undefined>(undefined);
  useErrorLineDecoration(editor, editorReady, errorLine);
  const todoLines = code.split("\n").flatMap((line, index) => line.includes("ここを書く") ? [index + 1] : []);
  useTodoLineDecoration(editor, editorReady, todoLines);
  const reduceMotion = useReducedMotion();
  const [confettiReady, setConfettiReady] = useState(false);
  const lock = useRef(false);
  const generation = useRef(0);
  const completedRef = useRef(false);
  const { play } = useSoundEffect();
  const prevPassedRef = useRef(0);
  const passed = outcomes.filter(outcome => outcome.passed).length;
  const totalChecks = content.tests.length + 1;
  const complete = !running && allNamedTestsPassed(content.tests, outcomes)
    && outcomes.some(outcome => outcome.id === "AUTO" && outcome.passed);
  const checkSegments = [
    ...content.tests.map(test => ({ id: test.id, short: test.label.split("（")[0] })),
    { id: "AUTO", short: content.freeForm.autoShortLabel },
  ];
  const displayOutcomes = running || outcomes.length > 0 ? outcomes : lastOutcomes;
  const staleResults = !running && outcomes.length === 0 && lastOutcomes.length > 0;
  const displayPassed = displayOutcomes.filter(outcome => outcome.passed).length;
  const focusErrorLine = (line: number) => {
    const instance = editor.current;
    if (!instance) return;
    setErrorLine(line);
    instance.revealLineInCenter(line);
    instance.setPosition({ lineNumber: line, column: 1 });
    instance.focus();
  };
  const prepare = useCallback(async () => {
    const current = ++generation.current;
    setRuntime("loading");
    try { await preparePyodide(); if (current === generation.current) setRuntime("ready"); }
    catch { if (current === generation.current) { setRuntime("error"); disposePyodideRunner(); } }
  }, []);
  useEffect(() => {
    const lifetime = generation;
    void prepare();
    return () => { lifetime.current++; disposePyodideRunner(); };
  }, [prepare]);
  useEffect(() => {
    if (!complete) { setConfettiReady(false); return; }
    if (reduceMotion) { setConfettiReady(true); return; }
    const timer = setTimeout(() => setConfettiReady(true), 1850);
    return () => clearTimeout(timer);
  }, [complete, reduceMotion]);
  const buildClearRecord = useCallback(async (): Promise<ImplementationClearRecord> => {
    const current = attemptRef.current;
    const usedAiConsultation = await checkUsedAiConsultation(async () => {
      if (!firebaseUser) throw new Error("unauthenticated");
      return firebaseUser.getIdToken();
    }, courseIdFromDraftKey(draftBaseKey), current.startedAt);
    return { completedAt: new Date().toISOString(), viewedSolution: current.viewedSolution, usedAiConsultation, usedHint: usage.some(count => count > 0), inputLevel: level };
  }, [firebaseUser, draftBaseKey, usage, level]);
  useEffect(() => {
    if (complete && !completedRef.current) {
      completedRef.current = true;
      void (async () => {
        const record = pendingClearRef.current ?? await buildClearRecord();
        pendingClearRef.current = null;
        onComplete?.({ testRuns: runs, hintUsage: usage, inputLevel: level, code, clears: [record] });
        resetAttempt();
      })();
    }
    if (!complete) { completedRef.current = false; setCelebrationDismissed(false); }
  }, [complete, onComplete, runs, usage, level, code, buildClearRecord, resetAttempt]);
  useEffect(() => {
    const passedCount = outcomes.filter(outcome => outcome.passed).length;
    if (passedCount > prevPassedRef.current) play("answerCorrect");
    prevPassedRef.current = passedCount;
  }, [outcomes, play]);
  useEffect(() => {
    const shouldScroll = (panel === "console" && freeRunning) || (panel === "tests" && running);
    if (shouldScroll && window.matchMedia("(max-width: 899px)").matches) sidePanel.current?.scrollIntoView({ block: "start" });
  }, [panel, freeRunning, running]);
  const runFree = async () => {
    if (lock.current || runtime !== "ready" || !editorReady || !code.trim()) return;
    lock.current = true;
    const current = generation.current;
    setFreeStatus("preparing"); setFreeResult(null); setErrorLine(undefined); setPanel("console");
    try {
      const result = await runBinarySearchFreeCode(code, () => { if (current === generation.current) setFreeStatus("running"); }, () => current === generation.current);
      if (current === generation.current) { setFreeResult(result); setErrorLine(result.returned ? undefined : result.errorLine); }
    } catch {
      if (current === generation.current) setFreeResult({ stdout: "", outputTruncated: false, returned: false, error: "unavailable" });
    } finally {
      lock.current = false;
      if (current === generation.current) setFreeStatus("idle");
    }
  };
  const run = async () => {
    if (lock.current || runtime !== "ready" || complete || !code.trim()) return;
    lock.current = true;
    const current = generation.current;
    setPanel("tests");
    onLearningEvent?.({ eventType: "implementation_run", payload: { kind: "test", count: runs + 1, code, level } });
    setRunning(true); setRuns(count => count + 1); setOutcomes([]); setErrorLine(undefined);
    try {
      const named = await runImplementationTests(code, content.tests, next => { if (current === generation.current) { setOutcomes(next); setErrorLine(next.find(outcome => outcome.errorLine !== undefined)?.errorLine); } }, () => current === generation.current);
      if (current !== generation.current) return;
      const auto = await runAutoTests(code);
      if (current !== generation.current) return;
      const result = [...named, auto];
      setOutcomes(result); setLastOutcomes(result);
      setErrorLine(result.find(outcome => outcome.errorLine !== undefined)?.errorLine);
      const succeeded = allNamedTestsPassed(content.tests, result) && auto.passed;
      if (!succeeded) recordFailure();
      onLearningEvent?.({ eventType: "implementation_test_result", payload: { count: runs + 1, code, level, results: result.map(item => ({ id: item.id, passed: item.passed, error: item.error ?? (item.passed ? null : "mismatch") })) } });
      if (succeeded) {
        const record = await buildClearRecord();
        pendingClearRef.current = record;
        onLearningEvent?.({ eventType: "implementation_complete", payload: { testRuns: runs + 1, hintUsage: usage, code, level, viewedSolution: record.viewedSolution, usedAiConsultation: record.usedAiConsultation, usedHint: record.usedHint, inputLevel: record.inputLevel } });
      }
    } finally {
      lock.current = false;
      if (current === generation.current) setRunning(false);
    }
  };
  const outlinedButton = { minHeight: 44, color: colors.text, borderColor: colors.border,
    "&:hover": { borderColor: colors.text, bgcolor: colors.button },
    "&.Mui-disabled": { color: colors.text, borderColor: colors.border, opacity: 0.45 } };
  const insert = (token: string) => {
    const instance = editor.current, selection = instance?.getSelection();
    if (!instance || !selection || busy) return;
    onLearningEvent?.({ eventType: "hint_token_insert", payload: { level: 1, token } });
    instance.pushUndoStop();
    instance.executeEdits("binary-search-token", [{ range: selection, text: token, forceMoveMarkers: true }]);
    instance.pushUndoStop(); instance.focus();
  };
  const openHint = (level: HintLevel) => {
    if (level > 1 && usage[level - 2] === 0) return;
    onLearningEvent?.({ eventType: "hint_open", payload: { level, count: usage[level - 1] + 1 } });
    setUsage(current => recordHintUsage(current, level)); setHint(level);
  };
  const openSolution = () => { markViewedSolution(); setSolutionOpen(true); };
  const changeLevel = (next: ImplementationInputLevel) => {
    if (busy || next === level) return;
    onLearningEvent?.({ eventType: "implementation_level_select", payload: { level: next, previousLevel: level } });
    selectLevel(next);
    setOutcomes([]); setLastOutcomes([]); setFreeResult(null);
  };
  const sampleTest = content.tests.find(test => test.id === "D1");
  return <Box component={embedded ? "div" : "main"} sx={{ height: embedded ? "100%" : "100dvh", minHeight: 0, bgcolor: colors.background, color: colors.text, p: { xs: 1, sm: 2 } }}>
    <Box component="section" aria-label="二分探索の自分で実装"
      sx={{ width: "100%", height: "100%", minHeight: 0, display: "flex", flexDirection: "column", gap: 1, position: "relative" }}>
      {(() => {
        const mission = content.mission;
        const bandTest = content.tests.find(test => test.id === "D1");
        return <Box sx={{ flexShrink: 0, border: "2px solid #2563eb", borderRadius: 3, bgcolor: "#fff", px: 2, py: 1.25 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {bandTest && <Box aria-hidden sx={{ flexShrink: 0 }}>
              <IndexFigure values={bandTest.values} label="" />
            </Box>}
            <Box sx={{ minWidth: 0 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                <Chip label="単元ミッション" size="small" sx={{ fontWeight: 800, bgcolor: "#2563eb", color: "#fff" }} />
                <Typography component="p" sx={{ fontSize: 16, fontWeight: 800 }}>{mission.title}</Typography>
              </Box>
              <Typography component="p" sx={{ fontSize: 14, mt: 0.5 }}>達成の条件：{mission.successCondition}。下のテストは、その確認です。</Typography>
            </Box>
          </Box>
          <Box role="status" aria-live="polite" sx={{ borderTop: "1px solid #dbe3ef", mt: 1.25, pt: 1 }}>
            <Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 2 }}>
              <Typography component="p" sx={{ fontSize: 16, fontWeight: 800 }}>{complete ? "ミッション達成" : "ミッション達成まで"}</Typography>
              <Typography component="p" sx={{ fontSize: 22, fontWeight: 900 }}>
                <Box component="span" sx={{ color: displayPassed > 0 && !staleResults ? "#16a34a" : "inherit" }}>{staleResults ? "前回 " : ""}{displayPassed}</Box> / {totalChecks}
              </Typography>
            </Box>
            {staleResults && <Typography component="p" sx={{ fontSize: 14, mt: 0.25 }}>前回のテスト結果です。コードが変更されています。再実行すると更新されます。</Typography>}
            <Box sx={{ display: "grid", gridTemplateColumns: `repeat(${totalChecks}, minmax(0, 1fr))`, gap: 1, mt: 0.5 }}>
              {checkSegments.map(segment => {
                const outcome = displayOutcomes.find(item => item.id === segment.id);
                const state = !outcome ? "todo" : outcome.passed ? "passed" : outcome.error ? "error" : "failed";
                return <Box key={segment.id} sx={{ minWidth: 0 }}>
                  <Box aria-hidden sx={{ height: 8, borderRadius: 999,
                    ...(state === "passed" && staleResults ? { bgcolor: "#fff", border: "2px solid #16a34a" }
                      : state === "passed" ? { bgcolor: "#16a34a" }
                      : state === "todo" ? { bgcolor: "#e5e7eb" }
                      : { bgcolor: "#fff", border: "2px solid #111827" }) }} />
                  <Typography component="p" sx={{ fontSize: 14, fontWeight: 700, mt: 0.4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {state === "passed" ? "✓" : state === "error" ? "!" : state === "failed" ? "×" : "○"} {segment.short}
                  </Typography>
                </Box>;
              })}
            </Box>
            {complete && onShowFinalResult && <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1.5 }}>
              <Button variant="contained" onClick={onShowFinalResult}
                sx={{ minHeight: 48, px: 3, fontWeight: 800, bgcolor: "#2563eb", "&:hover": { bgcolor: "#1d4ed8" } }}>単元の結果を見る</Button>
            </Box>}
          </Box>
        </Box>;
      })()}
      {/* 入口の量選択（旧画面のゲートを、プログラム形のテンプレートで残す）。 */}
      {!started && <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", py: 2 }}>
        <Typography component="p" sx={{ fontSize: 16, textAlign: "center", mb: 2.5 }}>{content.caption}</Typography>
        <Box sx={{ maxWidth: 720, mx: "auto", border: "2px solid #2563eb", borderRadius: 3, bgcolor: "#fff", p: 2.5, mb: 3 }}>
          <Typography component="p" sx={{ fontSize: 18, fontWeight: 900 }}>{content.statement.title}</Typography>
          <Typography component="p" sx={{ fontSize: 15, lineHeight: 1.8, mt: 0.75 }}>{content.statement.inputFormat} {content.statement.outputFormat}</Typography>
          {sampleTest && <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2, mt: 1.5 }}>
            <Box>
              <Typography component="p" sx={{ fontSize: 14, fontWeight: 700 }}>{content.statement.exampleInputLabel}</Typography>
              <Box component="pre" sx={{ m: 0, mt: 0.5, p: 1.5, bgcolor: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 1.5, fontFamily: "monospace", fontSize: 15 }}>{sampleTest.inputText}</Box>
            </Box>
            <Box>
              <Typography component="p" sx={{ fontSize: 14, fontWeight: 700 }}>{content.statement.exampleOutputLabel}</Typography>
              <Box component="pre" sx={{ m: 0, mt: 0.5, p: 1.5, bgcolor: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 1.5, fontFamily: "monospace", fontSize: 15 }}>{String(sampleTest.expected)}</Box>
            </Box>
          </Box>}
        </Box>
        <Typography component="p" id="implementation-level-label" sx={{ fontSize: 18, fontWeight: 900, textAlign: "center" }}>自分に合った書き方を選んで挑戦しましょう</Typography>
        <Typography component="p" sx={{ fontSize: 15, textAlign: "center", mt: 0.5, mb: 2 }}>{implementationInputLevelText.note}</Typography>
        <Box role="group" aria-labelledby="implementation-level-label" sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" }, gap: 2, maxWidth: 1180, mx: "auto", alignItems: "stretch" }}>
          {implementationInputLevels.map(candidate => (
            <Box key={candidate} sx={{ border: "2px solid #dbe3ef", borderRadius: 3, bgcolor: "#fff", p: 2.5, display: "flex", flexDirection: "column" }}>
              <Typography component="p" sx={{ fontSize: 18, fontWeight: 900, mb: 1 }}>{implementationInputLevelText.levels[candidate].label}</Typography>
              <Box sx={{ mb: 1.5 }}><LevelFillIllustration level={candidate} /></Box>
              <Typography component="p" sx={{ fontSize: 15, lineHeight: 1.7 }}>{implementationInputLevelText.levels[candidate].description}</Typography>
              <Typography component="p" sx={{ fontSize: 15, fontWeight: 700, mb: 1.5 }}>{implementationInputLevelText.levels[candidate].guide}</Typography>
              <Box component="pre" aria-hidden sx={{ m: 0, p: 1.5, height: 176, bgcolor: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 1.5, fontFamily: "monospace", fontSize: 12.5, lineHeight: 1.65, whiteSpace: "pre", overflow: "hidden", color: colors.text, WebkitMaskImage: "linear-gradient(to right, black 88%, transparent)", maskImage: "linear-gradient(to right, black 88%, transparent)" }}>
                {content.templates[candidate].split("\n").slice(0, 7).join("\n")}
                {content.templates[candidate].split("\n").length > 7 ? "\n…" : ""}
              </Box>
              <Box sx={{ flex: 1 }} />
              <Button variant="contained" onClick={() => { changeLevel(candidate); setStarted(true); }}
                sx={{ mt: 2, minHeight: 48, alignSelf: "flex-end", px: 2.5, fontWeight: 800, bgcolor: "#2563eb", "&:hover": { bgcolor: "#1d4ed8" } }}>
                この書き方で始める →
              </Button>
            </Box>
          ))}
        </Box>
        <Box sx={{ display: "flex", gap: 2.5, justifyContent: "center", mt: 2 }}>
          <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.75, fontSize: 14 }}>
            <Box aria-hidden sx={{ width: 22, height: 8, borderRadius: 999, bgcolor: "#94a3b8" }} />用意されている
          </Box>
          <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.75, fontSize: 14 }}>
            <Box aria-hidden sx={{ width: 22, height: 8, borderRadius: 999, bgcolor: "#fff", border: "1.6px dashed #2563eb" }} />自分で書く
          </Box>
        </Box>
      </Box>}
      {started && complete && confettiReady && <ResultConfetti preset="final" />}
      {started && !complete && <Box sx={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "flex-start", gap: 1, flexWrap: "wrap" }}>
        <Typography component="p" sx={{ fontSize: 15 }}>書き方：<Box component="span" sx={{ fontWeight: 800 }}>{level === "full" ? content.freeForm.modeFree : `${content.freeForm.bridgeLabel}（${implementationInputLevelText.levels[level].label}）`}</Box></Typography>
        {level === "full"
          ? <Button size="small" onClick={() => { setBridgeOpen(true); }} sx={{ minHeight: 36, color: playerTokens.focus, fontWeight: 700 }}>{content.freeForm.bridgeButton}</Button>
          : <>
              <Button size="small" onClick={() => changeLevel("full")} sx={{ minHeight: 36, color: playerTokens.focus, fontWeight: 700 }}>{content.freeForm.bridgeBackButton}</Button>
              <Button size="small" onClick={() => { setBridgeOpen(true); }} sx={{ minHeight: 36, color: playerTokens.focus, fontWeight: 700 }}>{content.freeForm.bridgeChangeButton}</Button>
            </>}
      </Box>}
      {/* 支援のエスカレーション：テストに2回つまずいたら、橋渡し（型）を一度だけ提案する。 */}
      {started && !complete && level === "full" && failedRuns >= 2 && !bannerDismissed && (
        <Box role="status" sx={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 1.5, border: "2px solid #2563eb", borderRadius: 2, bgcolor: "#fff", px: 2, py: 1 }}>
          <Typography component="p" sx={{ fontSize: 15, fontWeight: 700, flex: 1 }}>{content.freeForm.bannerText}</Typography>
          <Button variant="contained" size="small" onClick={() => { setBridgeOpen(true); }}
            sx={{ minHeight: 40, fontWeight: 800, bgcolor: "#2563eb", "&:hover": { bgcolor: "#1d4ed8" } }}>{content.freeForm.bridgeButton}</Button>
          <Button size="small" onClick={() => setBannerDismissed(true)} sx={{ minHeight: 40, color: colors.text, fontWeight: 700 }}>{content.freeForm.bannerDismiss}</Button>
        </Box>
      )}
      {started && !complete && solutionUnlocked && <SolutionRevealValve onOpen={openSolution} />}
      {started && <Box data-editor-workspace sx={{ flex: 1, minHeight: 0, overflowY: { xs: "auto", md: "hidden" }, display: { xs: "block", md: "grid" }, gridTemplateColumns: "minmax(0, 1.5fr) minmax(340px, 1fr)", gap: 2 }}>
        <Box aria-label={text.code} sx={{ minWidth: 0, minHeight: { xs: 360, md: 0 }, height: { xs: "70dvh", md: "100%" }, display: "flex", flexDirection: "column", border: "2px solid #dbe3ef", "&:focus-within": { borderColor: "#2563eb" }, borderRadius: 1.5, overflow: "hidden", bgcolor: colors.panel,
          "& .monaco-editor .monaco-scrollable-element, & .monaco-editor .view-lines, & .monaco-editor .inputarea": { cursor: learningEditorTextCursor } }}>
          <Box role="group" aria-label={text.panel} sx={{ flexShrink: 0, p: 1, bgcolor: colors.panelAlt, display: "flex", flexWrap: "wrap", gap: 1, alignItems: "flex-start" }}>
            <Typography component="p" sx={{ fontWeight: 800, fontSize: 16, mr: 0.5, pt: 1.25 }}>{text.code}</Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
              <Button variant="outlined" startIcon={<PlayArrowIcon />} disabled={runtime !== "ready" || busy || !editorReady || !code.trim()} onClick={() => void runFree()} sx={outlinedButton}>{text.freeRun}</Button>
              <Typography component="p" sx={{ fontSize: 13, textAlign: "center" }}>{text.buttonNotes.free}</Typography>
            </Box>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
              <Button variant="contained" startIcon={<FactCheckIcon />} disabled={runtime !== "ready" || busy || !editorReady || !code.trim()} onClick={() => void run()}
                sx={{ minHeight: 44, bgcolor: playerTokens.focus, color: playerTokens.surface, "&:hover": { bgcolor: playerTokens.states.processing.stroke }, "&.Mui-disabled": { bgcolor: colors.button, color: colors.text, opacity: 0.45 } }}>{content.controls.run}</Button>
              <Typography component="p" sx={{ fontSize: 13, textAlign: "center" }}>{text.buttonNotes.run}</Typography>
            </Box>
            <Box sx={{ ml: "auto", display: "flex", alignItems: "center", gap: 1, pt: 0.75 }}>
              <Typography component="p" role="status" sx={{ fontSize: 14, textAlign: "right" }}>
                {freeStatus === "preparing" ? text.preparing : freeStatus === "running" ? text.running : running ? runningMessage(outcomes.length, totalChecks) : runtime === "error" ? content.status.unavailable : content.status[runtime]}
              </Typography>
              {runtime === "error" && <Button onClick={() => void prepare()} sx={outlinedButton}>{content.controls.reload}</Button>}
            </Box>
          </Box>
          <Box sx={{ flex: 1, minHeight: 0, position: "relative" }}>
            <Editor height="100%" language="python" theme={LEARNING_EDITOR_THEME} beforeMount={setupLearningEditor} value={code} loading={content.status.editorLoading}
              onMount={instance => { editor.current = instance; setEditorReady(true); }}
              onChange={next => { setCode(next ?? ""); setOutcomes([]); setFreeResult(null); setErrorLine(undefined); }}
              options={{ fontSize: 16, lineHeight: 29, fontFamily: "monospace", minimap: { enabled: false }, tabSize: 4, insertSpaces: true,
                readOnly: busy, automaticLayout: true, scrollBeyondLastLine: false, lineNumbersMinChars: 2, wordWrap: "on", padding: { top: 8, bottom: 8 } }} />
          </Box>
        </Box>
        <Box component="aside" ref={sidePanel} sx={{ minWidth: 0, minHeight: 0, mt: { xs: 2, md: 0 }, height: { xs: "74dvh", md: "100%" }, display: "flex", flexDirection: "column", border: `1px solid ${colors.border}`, borderRadius: 1.5, overflow: "hidden", bgcolor: colors.panel }}>
          <Tabs value={panel} onChange={(_, value: "statement" | "tests" | "console" | "hints") => setPanel(value)} textColor="inherit" aria-label={text.panel}
            sx={{ flexShrink: 0, borderBottom: `1px solid ${colors.border}`, "& .MuiTabs-indicator": { bgcolor: colors.focus }, "& .MuiTab-root": { fontSize: 16 } }}>
            <Tab value="statement" label={content.statement.tabLabel} id={`${panelId}-statement`} aria-controls={`${panelId}-statement-panel`} />
            <Tab value="tests" label={text.testsTab} id={`${panelId}-tests`} aria-controls={`${panelId}-tests-panel`} />
            <Tab value="console" label={text.consoleTab} id={`${panelId}-console`} aria-controls={`${panelId}-console-panel`} />
            <Tab value="hints" label={text.hints} id={`${panelId}-hints`} aria-controls={`${panelId}-hints-panel`} />
          </Tabs>
          {/* 問題文（仕様）は開始ゲートにせず、作業中いつでも見返せるタブに常駐させる。 */}
          <Box role="tabpanel" hidden={panel !== "statement"} id={`${panelId}-statement-panel`} aria-labelledby={`${panelId}-statement`}
            sx={{ display: panel === "statement" ? "block" : "none", flex: 1, minHeight: 0, overflowY: "auto", p: 2 }}>
            <Typography component="p" sx={{ fontSize: 18, fontWeight: 900 }}>{content.statement.title}</Typography>
            <Typography component="p" sx={{ fontSize: 15, lineHeight: 1.8, mt: 1 }}>{content.statement.lead}</Typography>
            <Typography component="p" sx={{ fontSize: 16, fontWeight: 900, mt: 2.5 }}>{content.statement.inputLabel}</Typography>
            <Typography component="p" sx={{ fontSize: 15, lineHeight: 1.8, mt: 0.5 }}>{content.statement.inputFormat}</Typography>
            {sampleTest && <>
              <Typography component="p" sx={{ fontSize: 14, fontWeight: 700, mt: 1.5 }}>{content.statement.exampleInputLabel}</Typography>
              <Box component="pre" sx={{ m: 0, mt: 0.5, p: 1.5, bgcolor: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 1.5, fontFamily: "monospace", fontSize: 15 }}>{sampleTest.inputText}</Box>
              <Box aria-hidden sx={{ height: 190, mt: 1, border: "1px solid #e5e7eb", borderRadius: 1, overflow: "hidden" }}>
                <IndexFigure values={sampleTest.values} label={content.statement.exampleInputLabel} />
              </Box>
              <Typography component="p" sx={{ fontSize: 16, fontWeight: 900, mt: 2.5 }}>{content.statement.outputLabel}</Typography>
              <Typography component="p" sx={{ fontSize: 15, lineHeight: 1.8, mt: 0.5 }}>{content.statement.outputFormat}</Typography>
              <Typography component="p" sx={{ fontSize: 14, fontWeight: 700, mt: 1.5 }}>{content.statement.exampleOutputLabel}</Typography>
              <Box component="pre" sx={{ m: 0, mt: 0.5, p: 1.5, bgcolor: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 1.5, fontFamily: "monospace", fontSize: 15 }}>{String(sampleTest.expected)}</Box>
              <Box aria-hidden sx={{ height: 190, mt: 1, border: "1px solid #e5e7eb", borderRadius: 1, overflow: "hidden" }}>
                <IndexFigure values={sampleTest.values} highlight={sampleTest.expected} label={content.statement.exampleOutputLabel} />
              </Box>
            </>}
            <Typography component="p" sx={{ fontSize: 16, fontWeight: 900, mt: 2.5 }}>{content.statement.constraintsLabel}</Typography>
            {content.statement.constraints.map(item => (
              <Typography key={item} component="p" sx={{ fontSize: 15, lineHeight: 1.8, mt: 0.5 }}>・{item}</Typography>
            ))}
          </Box>
          <Box role="tabpanel" hidden={panel !== "tests"} id={`${panelId}-tests-panel`} aria-labelledby={`${panelId}-tests`}
            sx={{ display: panel === "tests" ? "block" : "none", flex: 1, minHeight: 0, overflowY: "auto", p: 1.5 }}>
            <ProgramResults outcomes={displayOutcomes} diagnostics={staleResults ? [] : running ? outcomes : lastOutcomes} stale={staleResults} code={code} onFocusLine={focusErrorLine} onShowHints={() => setPanel("hints")} />
          </Box>
          <Box role="tabpanel" hidden={panel !== "console"} id={`${panelId}-console-panel`} aria-labelledby={`${panelId}-console`}
            sx={{ display: panel === "console" ? "block" : "none", flex: 1, minHeight: 0, overflowY: "auto" }}>
            <FreeExecutionConsole result={freeResult} busy={freeRunning} />
          </Box>
          <Box role="tabpanel" hidden={panel !== "hints"} id={`${panelId}-hints-panel`} aria-labelledby={`${panelId}-hints`}
            sx={{ display: panel === "hints" ? "block" : "none", flex: 1, minHeight: 0, overflowY: "auto", p: 1.5 }}>
            <Typography component="p" sx={{ fontSize: 16, fontWeight: 800 }}>実装サポート</Typography>
            <Typography component="p" sx={{ fontSize: 14, mt: 0.25, mb: 1.5 }}>困ったときは、必要な分だけヒントを使おう。</Typography>
            <Box role="group" aria-label={content.hints.groupLabel} sx={{ display: "flex", flexDirection: "column" }}>
              {content.hints.labels.map((label, index) => {
                const locked = index > 0 && usage[index - 1] === 0;
                const open = hint === index + 1;
                const used = usage[index] > 0;
                return <Box key={label} sx={{ display: "flex", gap: 1.5 }}>
                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <Box aria-hidden sx={{ width: 34, height: 34, borderRadius: "50%", display: "grid", placeItems: "center", fontSize: 15, fontWeight: 900, flexShrink: 0,
                      ...(open || used ? { bgcolor: "#2563eb", color: "#fff" } : locked ? { border: "2px solid #c3cad4", color: colors.text } : { border: "2px solid #2563eb", color: colors.text }) }}>
                      {used && !open ? "✓" : index + 1}
                    </Box>
                    {index < content.hints.labels.length - 1 && <Box aria-hidden sx={{ width: 2, flex: 1, minHeight: 14, bgcolor: used ? "#2563eb" : "#dbe3ef" }} />}
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0, pb: 2 }}>
                    <Button aria-label={label} title={label} disabled={busy || !editorReady || locked} onClick={() => openHint((index + 1) as HintLevel)}
                      sx={{ minHeight: 36, px: 0.5, color: colors.text, fontWeight: 800, fontSize: 16, textTransform: "none", justifyContent: "flex-start", "&.Mui-disabled": { color: colors.text, opacity: 0.55 } }}>
                      {label.replace(/^ヒント\d+：/, "")}
                    </Button>
                    <Typography component="p" sx={{ fontSize: 14 }}>{content.hints.descriptions[index]}</Typography>
                    {locked && <Typography component="p" sx={{ fontSize: 14 }}>前のヒントを使うと開きます</Typography>}
                    {open && <Box sx={{ mt: 1 }}>
                      <ImplementationHintContent level={(index + 1) as HintLevel} onInsert={token => insert(token)} />
                      <Button onClick={() => setHint(null)} sx={{ mt: 1, minHeight: 40, color: playerTokens.control }}>{content.hints.closeLabel}</Button>
                    </Box>}
                  </Box>
                </Box>;
              })}
            </Box>
          </Box>
        </Box>
      </Box>}
      {running && <Box sx={{ flexShrink: 0 }}>
        <Typography component="p" sx={{ textAlign: "center", fontSize: 14 }}>{content.status.timeoutNotice}</Typography>
      </Box>}
      {complete && !celebrationDismissed && <Box data-completion-celebration sx={{ position: "absolute", inset: 0, zIndex: 8, display: "grid", placeItems: "center", bgcolor: "rgba(238, 244, 252, 0.55)", p: 2 }}>
        <Box sx={{ bgcolor: "#fff", border: "2px solid #2563eb", borderRadius: 4, px: 4, py: 3.5, maxWidth: 760, width: "100%", textAlign: "center", boxShadow: 6 }}>
          <Box sx={{ display: "flex", justifyContent: "center" }}><RobotFigure alt="" state="celebrate" size="L" grounding="shadow" sx={{ width: 103, height: 110 }} /></Box>
          <Typography component="p" sx={{ fontSize: 24, fontWeight: 900, mt: 0.5 }}>{content.result.celebrationHeading}</Typography>
          <Box sx={{ maxWidth: 520, mx: "auto", mt: 1.5, borderRadius: 2, overflow: "hidden" }}>
            <BinarySearchFoundCelebration />
          </Box>
          <Typography component="p" sx={{ fontSize: 16, mt: 1.5 }}>{content.result.celebrationText}</Typography>
          <Typography component="p" sx={{ fontSize: 22, fontWeight: 900, mt: 1 }}>{passed} / {totalChecks}　<Box component="span" sx={{ fontSize: 16, fontWeight: 800 }}>すべてのテストを通過</Box></Typography>
          <Box sx={{ display: "flex", gap: 1.5, justifyContent: "center", mt: 2.5, flexWrap: "wrap" }}>
            {onShowFinalResult && <Button variant="contained" onClick={onShowFinalResult}
              sx={{ minHeight: 48, px: 3, bgcolor: playerTokens.focus, color: playerTokens.surface, "&:hover": { bgcolor: playerTokens.states.processing.stroke } }}>{content.result.finalButton}</Button>}
            <Button variant="outlined" onClick={() => setCelebrationDismissed(true)} sx={{ ...outlinedButton, minHeight: 48, px: 3 }}>コードを見る</Button>
          </Box>
        </Box>
      </Box>}
    </Box>
    {/* 任意フェーズ6.5「実装の橋渡し」。型のコードはレベル別の下書きに残る。 */}
    <Dialog open={bridgeOpen} onClose={() => setBridgeOpen(false)} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontSize: 20, fontWeight: 900 }}>{content.freeForm.bridgeDialogTitle}</DialogTitle>
      <DialogContent>
        {bridgeOptionalPhase && <Box sx={{ mb: 2 }}><OptionalPhaseNote phase={bridgeOptionalPhase} /></Box>}
        <Typography component="p" sx={{ fontSize: 15, lineHeight: 1.7, mb: 2 }}>{content.freeForm.bridgeDialogLead}</Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" }, gap: 2 }}>
          {(["skeleton", "fill-in"] as const).map(candidate => (
            <Box key={candidate} sx={{ border: "2px solid #dbe3ef", borderRadius: 3, bgcolor: "#fff", p: 2.5 }}>
              <Typography component="p" sx={{ fontSize: 18, fontWeight: 900, mb: 1 }}>{implementationInputLevelText.levels[candidate].label}</Typography>
              <Box sx={{ mb: 1.5 }}><LevelFillIllustration level={candidate} /></Box>
              <Typography component="p" sx={{ fontSize: 14, lineHeight: 1.7 }}>{implementationInputLevelText.levels[candidate].description}</Typography>
              <Typography component="p" sx={{ fontSize: 14, fontWeight: 700, mb: 1.5 }}>{implementationInputLevelText.levels[candidate].guide}</Typography>
              <Box component="pre" aria-hidden sx={{ m: 0, p: 1.5, height: 150, bgcolor: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 1.5, fontFamily: "monospace", fontSize: 12.5, lineHeight: 1.65, whiteSpace: "pre", overflow: "hidden", color: colors.text, WebkitMaskImage: "linear-gradient(to right, black 88%, transparent)", maskImage: "linear-gradient(to right, black 88%, transparent)" }}>
                {content.templates[candidate].split("\n").slice(0, 7).join("\n")}
                {content.templates[candidate].split("\n").length > 7 ? "\n…" : ""}
              </Box>
              <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1.5 }}>
                <Button variant="contained" disabled={busy || level === candidate} onClick={() => { changeLevel(candidate); setBridgeOpen(false); setBannerDismissed(true); }}
                  sx={{ minHeight: 44, px: 2.5, fontWeight: 800, bgcolor: "#2563eb", "&:hover": { bgcolor: "#1d4ed8" } }}>
                  {level === candidate ? "使用中" : content.freeForm.bridgeUseButton}
                </Button>
              </Box>
            </Box>
          ))}
        </Box>
        <Box sx={{ display: "flex", gap: 2.5, alignItems: "center", mt: 2 }}>
          <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.75, fontSize: 14 }}>
            <Box aria-hidden sx={{ width: 22, height: 8, borderRadius: 999, bgcolor: "#94a3b8" }} />用意されている
          </Box>
          <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.75, fontSize: 14 }}>
            <Box aria-hidden sx={{ width: 22, height: 8, borderRadius: 999, bgcolor: "#fff", border: "1.6px dashed #2563eb" }} />自分で書く
          </Box>
        </Box>
        <Box sx={{ mt: 3, borderTop: "1px solid #dbe3ef", pt: 2 }}>
          {solutionUnlocked
            ? <Button onClick={() => { setBridgeOpen(false); openSolution(); }} sx={{ minHeight: 44, fontWeight: 800, color: "#2563eb" }}>{content.freeForm.exampleButton}</Button>
            : <Typography component="p" sx={{ fontSize: 14 }}>解法例は、テストに{SOLUTION_REVEAL_FAILURE_THRESHOLD}回つまずくと見られるようになります（現在{failedRuns}回）。ヒントと橋渡しは、いつでも使えます。</Typography>}
        </Box>
        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2.5 }}>
          <Button onClick={() => setBridgeOpen(false)} sx={{ minHeight: 44, fontWeight: 700, color: colors.text }}>閉じる</Button>
        </Box>
      </DialogContent>
    </Dialog>
    <SolutionRevealDialog open={solutionOpen} onClose={() => setSolutionOpen(false)} title={content.freeForm.exampleTitle} note={content.freeForm.exampleNote} program={binarySearchExampleProgram} />
  </Box>;
}
