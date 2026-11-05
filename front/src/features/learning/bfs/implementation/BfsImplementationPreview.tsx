"use client";

import Editor, { type OnMount } from "@monaco-editor/react";
import { Box, Button, LinearProgress, Typography } from "@mui/material";
import { useCallback, useEffect, useRef, useState } from "react";

import { disposePyodideRunner, preparePyodide } from "../../../../lib/pyodideRunner";
import { playerTokens } from "../../player/player.tokens";
import { BfsTraceDialog } from "../trace/BfsTraceDialog";
import { traceBfsCode } from "../trace/acquireTrace";
import { convertBfsTrace } from "../trace/convertTrace";
import { bfsTraceText } from "../trace/trace.content";
import type { BfsTracePlayback } from "../trace/trace.types";
import type { BfsUnitPhaseSummary } from "../unit/unit.types";
import { ImplementationHints } from "./ImplementationHints";
import { ImplementationResults } from "./ImplementationResults";
import { bfsImplementationContent as content } from "./implementation.content";
import { allTestsPassed, runImplementationTests, recordHintUsage, runningMessage, type HintLevel, type HintUsage, type TestOutcome } from "./implementation";

/** embedded / onComplete は単元フロー（#77）からの埋め込み用。未指定なら単品ページとして従来どおり動く。 */
export function BfsImplementationPreview({ embedded = false, onComplete }: { embedded?: boolean; onComplete?: (summary: BfsUnitPhaseSummary) => void }) {
  const [code, setCode] = useState<string>(content.template);
  const [runtime, setRuntime] = useState<"loading" | "ready" | "error">("loading");
  const [running, setRunning] = useState(false);
  const [tracing, setTracing] = useState(false);
  const [tracePlayback, setTracePlayback] = useState<BfsTracePlayback | null>(null);
  const [traceError, setTraceError] = useState<string | null>(null);
  const [outcomes, setOutcomes] = useState<readonly TestOutcome[]>([]);
  const [lastOutcomes, setLastOutcomes] = useState<readonly TestOutcome[]>([]);
  const [runs, setRuns] = useState(0);
  const [usage, setUsage] = useState<HintUsage>([0, 0, 0, 0]);
  const [hint, setHint] = useState<HintLevel | null>(null);
  const [editorReady, setEditorReady] = useState(false);
  const editor = useRef<Parameters<OnMount>[0] | null>(null);
  const lock = useRef(false);
  const generation = useRef(0);
  const completedRef = useRef(false);
  const resultRef = useRef<HTMLParagraphElement>(null);
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
  useEffect(() => { if (complete) resultRef.current?.focus(); }, [complete]);
  // 全テスト通過した瞬間だけ単元フローへ通知する。
  useEffect(() => {
    if (complete && !completedRef.current) {
      completedRef.current = true;
      onComplete?.({ testRuns: runs, hintUsage: usage });
    }
    if (!complete) completedRef.current = false;
  }, [complete, onComplete, runs, usage]);
  const run = async () => {
    if (lock.current || runtime !== "ready" || complete || !code.trim()) return;
    lock.current = true;
    const current = generation.current;
    setRunning(true); setRuns(count => count + 1); setOutcomes([]); setTraceError(null);
    try {
      const result = await runImplementationTests(code, content.tests, next => { if (current === generation.current) setOutcomes(next); }, () => current === generation.current);
      if (current === generation.current) setLastOutcomes(result);
    } finally {
      lock.current = false;
      if (current === generation.current) setRunning(false);
    }
  };
  const runTrace = async () => {
    if (lock.current || runtime !== "ready" || !editorReady || !code.trim()) return;
    lock.current = true;
    const current = generation.current;
    setTracing(true); setTraceError(null);
    try {
      const trace = await traceBfsCode(code, () => current === generation.current);
      if (current === generation.current) setTracePlayback(convertBfsTrace(trace));
    } catch (error) {
      if (current === generation.current) setTraceError(error instanceof Error && error.message.includes("タイムアウト") ? bfsTraceText.timeout : bfsTraceText.unavailable);
    } finally {
      lock.current = false;
      if (current === generation.current) setTracing(false);
    }
  };
  const traceButton = <Button variant="outlined" disabled={runtime !== "ready" || running || tracing || !editorReady || !code.trim()} onClick={() => void runTrace()}
    sx={{ minHeight: 44, color: playerTokens.text, borderColor: playerTokens.control }}>{complete ? bfsTraceText.resultButton : bfsTraceText.button}</Button>;
  const insert = (token: string) => {
    const instance = editor.current, selection = instance?.getSelection();
    if (!instance || !selection || running || tracing) return;
    instance.pushUndoStop();
    instance.executeEdits("bfs-token", [{ range: selection, text: token, forceMoveMarkers: true }]);
    instance.pushUndoStop(); instance.focus();
  };
  const openHint = (level: HintLevel) => {
    if (level > 1 && usage[level - 2] === 0) return;
    setUsage(current => recordHintUsage(current, level)); setHint(level);
  };
  return <Box component={embedded ? "div" : "main"} sx={{ minHeight: embedded ? 0 : "100dvh", height: embedded ? "100%" : undefined, display: "grid", placeItems: "center", bgcolor: playerTokens.background, color: playerTokens.text }}>
    <Box component="section" aria-label={complete ? "BFS自力実装の完了" : "BFSの自力実装"}
      sx={{ width: embedded ? "100%" : "84vw", height: embedded ? "100%" : "84dvh", p: 1, minHeight: 0, display: "flex", flexDirection: "column", gap: 1 }}>
      <Typography component="p" ref={resultRef} tabIndex={-1} sx={{ textAlign: "center", fontWeight: 700, fontSize: "clamp(18px, 1.5vw, 30px)", outline: "none" }}>
        {complete ? content.result.title : content.caption}
      </Typography>
      <Typography component="p" role="status" aria-live="polite" sx={{ textAlign: "center", fontSize: 16 }}>{passed}/{content.tests.length} 本通過</Typography>
      <LinearProgress aria-label="テスト通過数" variant="determinate" value={passed / content.tests.length * 100}
        sx={{ flexShrink: 0, bgcolor: playerTokens.layers.layer0, "& .MuiLinearProgress-bar": { bgcolor: playerTokens.focus } }} />
      {complete ? <Box sx={{ my: "auto", textAlign: "center", overflowY: "auto" }}>
        <Typography component="p">{content.result.runsLabel.replace("{count}", String(runs))}</Typography>
        {usage.map((count, index) => <Typography component="p" key={index}>{content.result.hintLabel.replace("{level}", String(index + 1)).replace("{count}", String(count))}</Typography>)}
        <Typography component="p" sx={{ mt: 2 }}>{content.result.closing}</Typography>
        <Box sx={{ mt: 2 }}>{traceButton}</Box>
        {tracing && <Typography component="p" role="status">{bfsTraceText.loading}</Typography>}
      </Box> : <>
        <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", display: { xs: "block", md: "grid" }, gridTemplateColumns: "minmax(0, 1.3fr) minmax(0, 1fr)", gap: 2 }}>
          <Box sx={{ minWidth: 0, minHeight: 0, display: "flex", flexDirection: "column" }}>
            <Box sx={{ flex: { xs: "none", md: 1 }, height: { xs: 260, md: "auto" }, minHeight: 200 }}>
              <Editor height="100%" language="python" theme="light" value={code} loading={content.status.editorLoading}
                onMount={instance => { editor.current = instance; setEditorReady(true); }}
                onChange={next => { setCode(next ?? ""); setOutcomes([]); setTraceError(null); }}
                options={{ fontSize: 16, lineHeight: 29, fontFamily: "monospace", minimap: { enabled: false }, tabSize: 4, insertSpaces: true,
                  readOnly: running || tracing, automaticLayout: true, scrollBeyondLastLine: false, lineNumbersMinChars: 2, wordWrap: "on", padding: { top: 8, bottom: 8 } }} />
            </Box>
          </Box>
          <Box sx={{ minWidth: 0, minHeight: 0, mt: { xs: 2, md: 0 }, overflowY: { md: "auto" } }}><ImplementationResults outcomes={outcomes} diagnostics={running ? outcomes : lastOutcomes} /></Box>
        </Box>
        <Box sx={{ flexShrink: 0 }}>
          <Typography component="p" role="status" sx={{ textAlign: "center", fontSize: 16 }}>{tracing ? bfsTraceText.loading : running ? runningMessage(outcomes.length, content.tests.length) : runtime === "error" ? content.status.unavailable : content.status[runtime]}</Typography>
          {running && <Typography component="p" sx={{ textAlign: "center", fontSize: 16 }}>{content.status.timeoutNotice}</Typography>}
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, justifyContent: "center" }}>
            {runtime === "error" && <Button onClick={() => void prepare()} sx={{ color: playerTokens.control }}>{content.controls.reload}</Button>}
            {traceButton}
            <Button variant="contained" disabled={runtime !== "ready" || running || tracing || !editorReady || !code.trim()} onClick={() => void run()}
              sx={{ minHeight: 44, bgcolor: playerTokens.focus, color: playerTokens.surface, "&:hover": { bgcolor: playerTokens.states.processing.stroke } }}>{content.controls.run}</Button>
            <Box role="group" aria-label={content.hints.groupLabel} sx={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 1 }}>
              {content.hints.labels.map((label, index) => <Button key={label} aria-label={label} variant="outlined" disabled={running || tracing || !editorReady || (index > 0 && usage[index - 1] === 0)} onClick={() => openHint((index + 1) as HintLevel)}
                sx={{ minHeight: 44, color: playerTokens.text, borderColor: playerTokens.control }}>
                <Box component="span" sx={{ display: { xs: "none", md: "inline" } }}>{label}</Box>
                <Box component="span" sx={{ display: { xs: "inline", md: "none" } }}>{content.hints.compactLabels[index]}</Box>
              </Button>)}
            </Box>
          </Box>
        </Box>
      </>}
      {traceError && <Typography component="p" role="alert">{traceError}</Typography>}
    </Box>
    {tracePlayback && <BfsTraceDialog playback={tracePlayback} onClose={() => setTracePlayback(null)} />}
    {hint && <ImplementationHints level={hint} onInsert={token => { setHint(null); requestAnimationFrame(() => insert(token)); }} onClose={() => setHint(null)} />}
  </Box>;
}
