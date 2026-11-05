"use client";

import Editor, { type OnMount } from "@monaco-editor/react";
import { Box, Button, LinearProgress, Typography } from "@mui/material";
import { useCallback, useEffect, useRef, useState } from "react";

import { disposePyodideRunner, preparePyodide } from "../../../../lib/pyodideRunner";
import { playerTokens } from "../../player/player.tokens";
import { ImplementationHints } from "./ImplementationHints";
import { ImplementationResults } from "./ImplementationResults";
import { bfsImplementationContent as content } from "./implementation.content";
import { allTestsPassed, runImplementationTests, recordHintUsage, type HintLevel, type HintUsage, type TestOutcome } from "./implementation";

export function BfsImplementationPreview() {
  const [code, setCode] = useState<string>(content.template);
  const [runtime, setRuntime] = useState<"loading" | "ready" | "error">("loading");
  const [running, setRunning] = useState(false);
  const [outcomes, setOutcomes] = useState<readonly TestOutcome[]>([]);
  const [lastOutcomes, setLastOutcomes] = useState<readonly TestOutcome[]>([]);
  const [runs, setRuns] = useState(0);
  const [usage, setUsage] = useState<HintUsage>([0, 0, 0]);
  const [hint, setHint] = useState<HintLevel | null>(null);
  const [editorReady, setEditorReady] = useState(false);
  const editor = useRef<Parameters<OnMount>[0] | null>(null);
  const lock = useRef(false);
  const generation = useRef(0);
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
  const run = async () => {
    if (lock.current || runtime !== "ready" || complete || !code.trim()) return;
    lock.current = true;
    const current = generation.current;
    setRunning(true); setRuns(count => count + 1); setOutcomes([]);
    try {
      const result = await runImplementationTests(code, content.tests, next => { if (current === generation.current) setOutcomes(next); }, () => current === generation.current);
      if (current === generation.current) setLastOutcomes(result);
    } finally {
      lock.current = false;
      if (current === generation.current) setRunning(false);
    }
  };
  const insert = (token: string) => {
    const instance = editor.current, selection = instance?.getSelection();
    if (!instance || !selection || running) return;
    instance.pushUndoStop();
    instance.executeEdits("bfs-token", [{ range: selection, text: token, forceMoveMarkers: true }]);
    instance.pushUndoStop(); instance.focus();
  };
  const openHint = (level: HintLevel) => {
    if (level > 1 && usage[level - 2] === 0) return;
    setUsage(current => recordHintUsage(current, level)); setHint(level);
  };
  return <Box component="main" sx={{ minHeight: "100dvh", display: "grid", placeItems: "center", bgcolor: playerTokens.background, color: playerTokens.text }}>
    <Box component="section" aria-label={complete ? "BFS自力実装の完了" : "BFSの自力実装"}
      sx={{ width: "84vw", height: "84dvh", p: 1, minHeight: 0, display: "flex", flexDirection: "column", gap: 1 }}>
      <Typography component="p" ref={resultRef} tabIndex={-1} sx={{ textAlign: "center", fontWeight: 700, fontSize: "clamp(18px, 1.5vw, 30px)", outline: "none" }}>
        {complete ? content.result.title : content.caption}
      </Typography>
      <Typography component="p" role="status" aria-live="polite" sx={{ textAlign: "center", fontSize: 16 }}>{passed}/{content.tests.length} 本通過</Typography>
      <LinearProgress aria-label="テスト通過数" variant="determinate" value={passed / content.tests.length * 100}
        sx={{ flexShrink: 0, bgcolor: playerTokens.layers.layer0, "& .MuiLinearProgress-bar": { bgcolor: playerTokens.focus } }} />
      {complete ? <Box sx={{ my: "auto", textAlign: "center", overflowY: "auto" }}>
        <Typography component="p">実行回数：{runs}回</Typography>
        {usage.map((count, index) => <Typography component="p" key={index}>ヒントレベル{index + 1}：{count}回</Typography>)}
        <Typography component="p" sx={{ mt: 2 }}>{content.result.closing}</Typography>
      </Box> : <>
        <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", display: { xs: "block", md: "grid" }, gridTemplateColumns: "minmax(0, 1.3fr) minmax(0, 1fr)", gap: 2 }}>
          <Box sx={{ minWidth: 0, minHeight: 0, display: "flex", flexDirection: "column" }}>
            <Box sx={{ flex: { xs: "none", md: 1 }, height: { xs: 260, md: "auto" }, minHeight: 200 }}>
              <Editor height="100%" language="python" theme="light" value={code} loading={content.status.editorLoading}
                onMount={instance => { editor.current = instance; setEditorReady(true); }}
                onChange={next => { setCode(next ?? ""); setOutcomes([]); }}
                options={{ fontSize: 16, lineHeight: 29, fontFamily: "monospace", minimap: { enabled: false }, tabSize: 4, insertSpaces: true,
                  readOnly: running, automaticLayout: true, scrollBeyondLastLine: false, lineNumbersMinChars: 2, wordWrap: "on", padding: { top: 8, bottom: 8 } }} />
            </Box>
            <Typography component="p" sx={{ mt: 1, fontSize: 16 }}>{content.chipInstruction}</Typography>
            <Box role="group" aria-label="コード補助チップ" sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
              {content.chips.map(token => <Button key={token} variant="outlined" disabled={!editorReady || running} onClick={() => insert(token)}
                sx={{ fontFamily: "monospace", fontSize: 16, minHeight: 44, px: 1, textTransform: "none", color: playerTokens.text, border: `2px solid ${playerTokens.focus}` }}>{token}</Button>)}
            </Box>
          </Box>
          <Box sx={{ minWidth: 0, minHeight: 0, mt: { xs: 2, md: 0 }, overflowY: { md: "auto" } }}><ImplementationResults outcomes={outcomes} /></Box>
        </Box>
        <Box sx={{ flexShrink: 0 }}>
          <Typography component="p" role="status" sx={{ textAlign: "center", fontSize: 16 }}>{running ? content.status.running : runtime === "error" ? content.status.unavailable : content.status[runtime]}</Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, justifyContent: "center" }}>
            {runtime === "error" && <Button onClick={() => void prepare()} sx={{ color: playerTokens.control }}>実行環境を再読込</Button>}
            <Button variant="contained" disabled={runtime !== "ready" || running || !editorReady || !code.trim()} onClick={() => void run()}
              sx={{ minHeight: 44, bgcolor: playerTokens.focus, color: playerTokens.surface, "&:hover": { bgcolor: playerTokens.states.processing.stroke } }}>実行する</Button>
            <Box role="group" aria-label="段階式ヒント" sx={{ display: "flex", gap: 1 }}>
              {content.hints.labels.map((label, index) => <Button key={label} aria-label={label} variant="outlined" disabled={running || (index > 0 && usage[index - 1] === 0)} onClick={() => openHint((index + 1) as HintLevel)}
                sx={{ minHeight: 44, color: playerTokens.text, borderColor: playerTokens.control }}>
                <Box component="span" sx={{ display: { xs: "none", md: "inline" } }}>{label}</Box>
                <Box component="span" sx={{ display: { xs: "inline", md: "none" } }}>{content.hints.compactLabels[index]}</Box>
              </Button>)}
            </Box>
          </Box>
        </Box>
      </>}
    </Box>
    {hint && <ImplementationHints level={hint} code={code} outcomes={lastOutcomes} onClose={() => setHint(null)} />}
  </Box>;
}
