"use client";

import Editor, { type OnMount } from "@monaco-editor/react";
import { LEARNING_EDITOR_THEME, learningEditorTextCursor, setupLearningEditor } from "../../code/learningEditor";
import { Box, Button, LinearProgress, Tab, Tabs, Typography } from "@mui/material";
import { useCallback, useEffect, useId, useRef, useState, type ComponentType, type ReactNode } from "react";

import { disposePyodideRunner, preparePyodide } from "../../../../lib/pyodideRunner";
import type { PythonTraceResult } from "../../../../lib/pythonTrace.types";
import type { LearningInstrumentation } from "../../instrumentation/useLearningVisit";
import { ImplementationLevelSelector } from "../../implementation/ImplementationLevelSelector";
import type { ImplementationInputLevel } from "../../implementation/inputLevel";
import { useImplementationInputLevel, type ImplementationLevelTemplates } from "../../implementation/useImplementationInputLevel";

import { DrawnCheck } from "../../app/DrawnCheck";
import { ResultConfetti } from "../../app/ResultConfetti";
import { useSoundEffect } from "../../../../app/component/soundFeedback";
import { useErrorLineDecoration } from "../../../../hooks/useErrorLineDecoration";
import { playerTokens } from "../../player/player.tokens";
import { BfsTraceDialog } from "../trace/BfsTraceDialog";
import { traceBfsCode } from "../trace/acquireTrace";
import { convertBfsTrace } from "../trace/convertTrace";
import { bfsTraceText } from "../trace/trace.content";
import type { BfsTracePlayback } from "../trace/trace.types";
import type { BfsUnitPhaseSummary } from "../unit/unit.types";
import { FreeExecutionConsole } from "./FreeExecutionConsole";
import { runBfsFreeCode, type FreeExecutionResult } from "./freeExecution";
import { bfsEditorText as text } from "./editor.content";
import { editorTokens as colors } from "./editor.tokens";
import type { ParsonsCode } from "../consolidation/ParsonsBoard";
import { ImplementationHints, type ImplementationHintContent } from "./ImplementationHints";
import { ImplementationResults } from "./ImplementationResults";
import { bfsImplementationContent, type ImplementationTest } from "./implementation.content";
import { allTestsPassed, runImplementationTests, recordHintUsage, runningMessage, type HintLevel, type HintUsage, type TestOutcome } from "./implementation";

type WorkspaceProps = LearningInstrumentation & {
  embedded?: boolean;
  onComplete?: (summary: BfsUnitPhaseSummary) => void;
  codeDraftBaseKey?: string;
  onCodeDraftError?: (failed: boolean) => void;
  onShowFinalResult?: () => void;
};

type WorkspacePlayback = { mode: "replay" | "final"; notice: string | null; content: { steps: readonly unknown[] } };
type ImplementationExercise<Playback extends WorkspacePlayback> = {
  label: string;
  content: Pick<typeof bfsImplementationContent, "status" | "controls"> & {
    id: string;
    caption: string;
    templates: ImplementationLevelTemplates;
    tests: readonly ImplementationTest[];
    hints: ImplementationHintContent;
    result: { title: string; closing: string; runsLabel: string; finalButton: string };
  };
  Results: ComponentType<{ outcomes: readonly TestOutcome[]; diagnostics?: readonly TestOutcome[] }>;
  runFreeCode: (code: string, onPrepared: () => void, isCurrent: () => boolean) => Promise<FreeExecutionResult>;
  hintCode?: ParsonsCode;
  hintRepeatLabel?: string;
  freeReturnedLabel?: string;
  renderFreeReturn?: (actual: unknown) => ReactNode;
  visualDebug?: {
    acquire: (code: string, isCurrent: () => boolean) => Promise<PythonTraceResult>;
    convert: (trace: PythonTraceResult) => Playback;
    Dialog: ComponentType<LearningInstrumentation & { playback: Playback; onClose: () => void }>;
  };
};

const bfsExercise = {
  label: "BFSの自分で実装", content: bfsImplementationContent, Results: ImplementationResults,
  runFreeCode: runBfsFreeCode, visualDebug: { acquire: traceBfsCode, convert: convertBfsTrace, Dialog: BfsTraceDialog },
} satisfies ImplementationExercise<BfsTracePlayback>;

/** embedded / onComplete は単元フロー（#77）からの埋め込み用。 */
export function BfsImplementationPreview(props: WorkspaceProps) {
  return <ImplementationWorkspace {...props} exercise={bfsExercise} />;
}

/** BFS と DFS がエディタ、実行操作、ヒント表示を共有する。 */
export function ImplementationWorkspace<Playback extends WorkspacePlayback>({ exercise, embedded = false, onComplete, onLearningEvent, active = true, codeDraftBaseKey, onCodeDraftError, onShowFinalResult }:
  WorkspaceProps & { exercise: ImplementationExercise<Playback> }) {
  const { content, Results, visualDebug } = exercise;
  const TraceDialog = visualDebug?.Dialog;
  // 入力量レベルとレベル別下書き（Issue #328）。単品ページではプレビュー専用のキーで下書きを分ける。
  const draftBaseKey = codeDraftBaseKey ?? `engineer-quest:learning-code:preview:${content.id}`;
  const { level, code, setCode, selectLevel } = useImplementationInputLevel({ draftBaseKey, templates: content.templates, onDraftError: onCodeDraftError });
  const [runtime, setRuntime] = useState<"loading" | "ready" | "error">("loading");
  const [running, setRunning] = useState(false);
  const [tracing, setTracing] = useState(false);
  const [freeStatus, setFreeStatus] = useState<"idle" | "preparing" | "running">("idle");
  const [freeResult, setFreeResult] = useState<FreeExecutionResult | null>(null);
  const [panel, setPanel] = useState<"tests" | "console">("tests");
  const freeRunning = freeStatus !== "idle";
  const busy = running || tracing || freeRunning;
  const panelId = useId();
  const sidePanel = useRef<HTMLElement>(null);
  const [tracePlayback, setTracePlayback] = useState<Playback | null>(null);
  const [traceError, setTraceError] = useState<string | null>(null);
  const [outcomes, setOutcomes] = useState<readonly TestOutcome[]>([]);
  const [lastOutcomes, setLastOutcomes] = useState<readonly TestOutcome[]>([]);
  const [runs, setRuns] = useState(0);
  const traceRuns = useRef(0);
  const [usage, setUsage] = useState<HintUsage>([0, 0, 0, 0]);
  const [hint, setHint] = useState<HintLevel | null>(null);
  const [editorReady, setEditorReady] = useState(false);
  const editor = useRef<Parameters<OnMount>[0] | null>(null);
  const [errorLine, setErrorLine] = useState<number | undefined>(undefined);
  useErrorLineDecoration(editor, editorReady, errorLine);
  const lock = useRef(false);
  const generation = useRef(0);
  const completedRef = useRef(false);
  const { play } = useSoundEffect();
  const prevPassedRef = useRef(0);
  const passed = outcomes.filter(outcome => outcome.passed).length;
  const complete = !running && allTestsPassed(content.tests, outcomes);
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
  // 全テスト通過した瞬間だけ単元フローへ通知する。
  useEffect(() => {
    if (complete && !completedRef.current) {
      completedRef.current = true;
      onComplete?.({ testRuns: runs, hintUsage: usage, inputLevel: level });
    }
    if (!complete) completedRef.current = false;
  }, [complete, onComplete, runs, usage, level]);
  // テストが新たに通過するたび、小さな確認音で採点の進みを伝える（#305 案A'）。
  // 全通過時の紙吹雪と歓声は ResultConfetti が担当し、演出の強弱を分ける。
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
      const result = await exercise.runFreeCode(code, () => { if (current === generation.current) setFreeStatus("running"); }, () => current === generation.current);
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
    setRunning(true); setRuns(count => count + 1); setOutcomes([]); setTraceError(null); setErrorLine(undefined);
    try {
      const result = await runImplementationTests(code, content.tests, next => { if (current === generation.current) { setOutcomes(next); setErrorLine(next.find(outcome => outcome.errorLine !== undefined)?.errorLine); } }, () => current === generation.current);
      if (current === generation.current) {
        setLastOutcomes(result);
        onLearningEvent?.({ eventType: "implementation_test_result", payload: { count: runs + 1, level, results: result.map(item => ({ id: item.id, passed: item.passed, error: item.error ?? (item.passed ? null : "mismatch") })) } });
        if (allTestsPassed(content.tests, result)) onLearningEvent?.({ eventType: "implementation_complete", payload: { testRuns: runs + 1, hintUsage: usage, level } });
      }
    } finally {
      lock.current = false;
      if (current === generation.current) setRunning(false);
    }
  };
  const runTrace = async () => {
    if (!visualDebug || lock.current || runtime !== "ready" || !editorReady || !code.trim()) return;
    lock.current = true;
    const current = generation.current;
    traceRuns.current++;
    onLearningEvent?.({ eventType: "implementation_run", payload: { kind: "trace", count: traceRuns.current, code, level } });
    setTracing(true); setTraceError(null);
    try {
      const trace = await visualDebug.acquire(code, () => current === generation.current);
      if (current === generation.current) {
        const playback = visualDebug.convert(trace);
        setTracePlayback(playback);
        onLearningEvent?.({ eventType: "trace_result", payload: { mode: playback.mode, states: playback.content.steps.length, status: trace.status, partial: !!playback.notice, errorKind: trace.error?.kind ?? null } });
      }
    } catch (error) {
      onLearningEvent?.({ eventType: "trace_result", payload: { status: "failed", states: 0, timeout: error instanceof Error && error.message.includes("タイムアウト") } });
      if (current === generation.current) setTraceError(error instanceof Error && error.message.includes("タイムアウト") ? bfsTraceText.timeout : bfsTraceText.unavailable);
    } finally {
      lock.current = false;
      if (current === generation.current) setTracing(false);
    }
  };
  const outlinedButton = { minHeight: 44, color: colors.text, borderColor: colors.border,
    "&:hover": { borderColor: colors.text, bgcolor: colors.button },
    "&.Mui-disabled": { color: colors.text, borderColor: colors.border, opacity: 0.45 } };
  const traceButton = visualDebug && <Button variant="outlined" disabled={runtime !== "ready" || busy || !editorReady || !code.trim()} onClick={() => void runTrace()}
    sx={outlinedButton}>{complete ? bfsTraceText.resultButton : bfsTraceText.button}</Button>;
  const insert = (token: string) => {
    const instance = editor.current, selection = instance?.getSelection();
    if (!instance || !selection || busy) return;
    onLearningEvent?.({ eventType: "hint_token_insert", payload: { level: 1, token } });
    instance.pushUndoStop();
    instance.executeEdits(content.id, [{ range: selection, text: token, forceMoveMarkers: true }]);
    instance.pushUndoStop(); instance.focus();
  };
  const openHint = (level: HintLevel) => {
    if (level > 1 && usage[level - 2] === 0) return;
    onLearningEvent?.({ eventType: "hint_open", payload: { level, count: usage[level - 1] + 1 } });
    setUsage(current => recordHintUsage(current, level)); setHint(level);
  };
  // レベルの切り替えはログに残し、表示中の結果は切り替えたレベルのコードに合わせて消す（Issue #328）。
  const changeLevel = (next: ImplementationInputLevel) => {
    if (busy || next === level) return;
    onLearningEvent?.({ eventType: "implementation_level_select", payload: { level: next, previousLevel: level } });
    selectLevel(next);
    setOutcomes([]); setTraceError(null); setFreeResult(null);
  };
  return <Box component={embedded ? "div" : "main"} sx={{ height: embedded ? "100%" : "100dvh", minHeight: 0, bgcolor: colors.background, color: colors.text, p: { xs: 1, sm: 2 } }}>
    <Box component="section" aria-label={exercise.label}
      sx={{ width: "100%", height: "100%", minHeight: 0, display: "flex", flexDirection: "column", gap: 1 }}>
      <Typography component="p" sx={{ textAlign: "center", fontWeight: 700, fontSize: "clamp(18px, 1.5vw, 24px)", flexShrink: 0 }}>
        {content.caption}
      </Typography>
      {complete && <ResultConfetti />}
      <Typography component="p" role="status" aria-live="polite" sx={{ textAlign: "center", fontSize: 16, flexShrink: 0 }}>{passed}/{content.tests.length} 本通過</Typography>
      <LinearProgress aria-label="テスト通過数" variant="determinate" value={passed / content.tests.length * 100}
        sx={{ flexShrink: 0, bgcolor: colors.button, "& .MuiLinearProgress-bar": { bgcolor: playerTokens.focus } }} />
      {!complete && <Box sx={{ flexShrink: 0 }}>
        <ImplementationLevelSelector level={level} onChange={changeLevel} disabled={busy || !editorReady} />
      </Box>}
      <>
        <Box data-editor-workspace sx={{ flex: 1, minHeight: 0, overflowY: { xs: "auto", md: "hidden" }, display: { xs: "block", md: "grid" }, gridTemplateColumns: "minmax(0, 2.4fr) minmax(300px, 1fr)", gap: 2 }}>
          <Box aria-label={text.code} sx={{ minWidth: 0, minHeight: { xs: 360, md: 0 }, height: { xs: "70dvh", md: "100%" }, display: "flex", flexDirection: "column", border: `2px solid ${colors.focus}`, borderRadius: 1.5, overflow: "hidden", bgcolor: colors.panel,
            "& .monaco-editor .monaco-scrollable-element, & .monaco-editor .view-lines, & .monaco-editor .inputarea": { cursor: learningEditorTextCursor } }}>
            <Box role="group" aria-label={text.panel} sx={{ flexShrink: 0, p: 1, bgcolor: colors.panelAlt, display: "flex", flexWrap: "wrap", gap: 1, alignItems: "center" }}>
              <Typography component="p" sx={{ fontWeight: 800, fontSize: 16, mr: 0.5 }}>{text.code}</Typography>
              <Button variant="outlined" disabled={runtime !== "ready" || busy || !editorReady || !code.trim()} onClick={() => void runFree()} sx={outlinedButton}>{text.freeRun}</Button>
              {traceButton}
              <Button variant="contained" disabled={runtime !== "ready" || busy || !editorReady || !code.trim()} onClick={() => void run()}
                sx={{ minHeight: 44, bgcolor: playerTokens.focus, color: playerTokens.surface, "&:hover": { bgcolor: playerTokens.states.processing.stroke }, "&.Mui-disabled": { bgcolor: colors.button, color: colors.text, opacity: 0.45 } }}>{content.controls.run}</Button>
            </Box>
            <Box sx={{ flex: 1, minHeight: 0, position: "relative" }}>
              {complete && <Box data-completion-banner sx={{ position: "absolute", top: 8, right: 8, zIndex: 6, maxWidth: "min(440px, calc(100% - 16px))", display: "flex", gap: 1.25, alignItems: "flex-start", p: 1.5, bgcolor: colors.panel, border: `2px solid ${colors.focus}`, borderRadius: 1.5, boxShadow: 3 }}>
                <Box sx={{ flexShrink: 0 }}><DrawnCheck size={44} /></Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography component="p" sx={{ fontWeight: 800, fontSize: 17 }}>{content.result.title}</Typography>
                  <Typography component="p" sx={{ fontSize: 13.5, mt: 0.25 }}>{content.result.closing}</Typography>
                  <Typography component="p" sx={{ fontSize: 13.5, mt: 0.5 }}>{content.result.runsLabel.replace("{count}", String(runs))}</Typography>
                  {onShowFinalResult && <Button variant="contained" onClick={onShowFinalResult}
                    sx={{ mt: 1, minHeight: 44, bgcolor: playerTokens.focus, color: playerTokens.surface, "&:hover": { bgcolor: playerTokens.states.processing.stroke } }}>{content.result.finalButton}</Button>}
                </Box>
              </Box>}
              <Editor height="100%" language="python" theme={LEARNING_EDITOR_THEME} beforeMount={setupLearningEditor} value={code} loading={content.status.editorLoading}
                onMount={instance => { editor.current = instance; setEditorReady(true); }}
                onChange={next => { setCode(next ?? ""); setOutcomes([]); setTraceError(null); setFreeResult(null); setErrorLine(undefined); }}
                options={{ fontSize: 16, lineHeight: 29, fontFamily: "monospace", minimap: { enabled: false }, tabSize: 4, insertSpaces: true,
                  readOnly: busy, automaticLayout: true, scrollBeyondLastLine: false, lineNumbersMinChars: 2, wordWrap: "on", padding: { top: 8, bottom: 8 } }} />
            </Box>
          </Box>
          <Box component="aside" ref={sidePanel} sx={{ minWidth: 0, minHeight: 0, mt: { xs: 2, md: 0 }, height: { xs: "74dvh", md: "100%" }, display: "flex", flexDirection: "column", border: `1px solid ${colors.border}`, borderRadius: 1.5, overflow: "hidden", bgcolor: colors.panel }}>
            <Tabs value={panel} onChange={(_, value: "tests" | "console") => setPanel(value)} textColor="inherit" aria-label={text.panel}
              sx={{ flexShrink: 0, borderBottom: `1px solid ${colors.border}`, "& .MuiTabs-indicator": { bgcolor: colors.focus }, "& .MuiTab-root": { fontSize: 16 } }}>
              <Tab value="tests" label={text.testsTab} id={`${panelId}-tests`} aria-controls={`${panelId}-tests-panel`} />
              <Tab value="console" label={text.consoleTab} id={`${panelId}-console`} aria-controls={`${panelId}-console-panel`} />
            </Tabs>
            <Box role="tabpanel" hidden={panel !== "tests"} id={`${panelId}-tests-panel`} aria-labelledby={`${panelId}-tests`}
              sx={{ display: panel === "tests" ? "block" : "none", flex: 1, minHeight: 0, overflowY: "auto", p: 1.5 }}>
              <Results outcomes={outcomes} diagnostics={running ? outcomes : lastOutcomes} />
            </Box>
            <Box role="tabpanel" hidden={panel !== "console"} id={`${panelId}-console-panel`} aria-labelledby={`${panelId}-console`}
              sx={{ display: panel === "console" ? "block" : "none", flex: 1, minHeight: 0, overflowY: "auto" }}>
              <FreeExecutionConsole result={freeResult} busy={freeRunning} returnedLabel={exercise.freeReturnedLabel} renderReturn={exercise.renderFreeReturn} />
            </Box>
            <Box role="group" aria-label={content.hints.groupLabel} sx={{ p: 1, flexShrink: 0, borderTop: `1px solid ${colors.border}` }}>
              <Typography component="p" sx={{ fontSize: 16, mb: 0.5 }}>{text.hints}</Typography>
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 1 }}>
                {content.hints.labels.map((label, index) => <Button key={label} aria-label={label} title={label} variant="outlined" disabled={busy || !editorReady || (index > 0 && usage[index - 1] === 0)} onClick={() => openHint((index + 1) as HintLevel)}
                  sx={{ ...outlinedButton, minWidth: 0, display: "block", textTransform: "none", fontSize: 15, py: 0.5, px: 0.5 }}>
                  <Box component="span" sx={{ display: "block" }}>{content.hints.compactLabels[index]}</Box>
                  <Box component="span" sx={{ display: "block" }}>{text.hintNames[index]}</Box>
                </Button>)}
              </Box>
            </Box>
          </Box>
        </Box>
        <Box sx={{ flexShrink: 0 }}>
          <Typography component="p" role="status" sx={{ textAlign: "center", fontSize: 16 }}>{freeStatus === "preparing" ? text.preparing : freeStatus === "running" ? text.running : tracing ? bfsTraceText.loading : running ? runningMessage(outcomes.length, content.tests.length) : runtime === "error" ? content.status.unavailable : content.status[runtime]}</Typography>
          {running && <Typography component="p" sx={{ textAlign: "center", fontSize: 16 }}>{content.status.timeoutNotice}</Typography>}
          {runtime === "error" && <Button onClick={() => void prepare()} sx={outlinedButton}>{content.controls.reload}</Button>}
        </Box>
      </>
      {traceError && <Typography component="p" role="alert">{traceError}</Typography>}
    </Box>
    {TraceDialog && tracePlayback && <TraceDialog onLearningEvent={onLearningEvent} active={active} playback={tracePlayback} onClose={() => setTracePlayback(null)} />}
    {hint && <ImplementationHints level={hint} hints={content.hints} code={exercise.hintCode} repeatLabel={exercise.hintRepeatLabel}
      onInsert={token => { setHint(null); requestAnimationFrame(() => insert(token)); }} onClose={() => setHint(null)} />}
  </Box>;
}
