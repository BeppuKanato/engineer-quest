"use client";

import { Alert, Box, Button, Chip, CircularProgress, Paper, Stack, TextField, Typography } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { diffLines } from "diff";
import { normalizeTranscriptionCode } from "@/lib/bubbleSort";
import { preparePyodide, runBubbleSortTests, type PythonTestResult } from "@/lib/pyodideRunner";

type Props = {
  sampleCode: string;
  value: string;
  tests: Array<{ input: number[]; expected: number[] }>;
  disabled: boolean;
  onChange: (value: string) => void;
  onPassed: () => void;
};

export function CourseCheckEditor({ sampleCode, value, tests, disabled, onChange, onPassed }: Props) {
  const [runtime, setRuntime] = useState<"loading" | "ready" | "error">("loading");
  const [checking, setChecking] = useState(false);
  const [showDiff, setShowDiff] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<PythonTestResult[]>([]);
  const [stdout, setStdout] = useState("");
  const differences = useMemo(
    () => diffLines(normalizeTranscriptionCode(sampleCode), normalizeTranscriptionCode(value)),
    [sampleCode, value],
  );

  useEffect(() => {
    let active = true;
    preparePyodide().then(() => active && setRuntime("ready")).catch((reason) => {
      console.error("Pyodide load failed", reason);
      if (active) setRuntime("error");
    });
    return () => { active = false; };
  }, []);

  const checkAndRun = async () => {
    setError(""); setResults([]); setStdout(""); setShowDiff(false);
    if (normalizeTranscriptionCode(value) !== normalizeTranscriptionCode(sampleCode)) {
      setShowDiff(true);
      return;
    }
    setChecking(true);
    try {
      const response = await runBubbleSortTests(value, tests);
      setResults(response.results);
      setStdout(response.stdout);
      if (response.results.every((test) => test.passed)) onPassed();
      else setError("見本と一致しましたが、テスト結果が一致しませんでした。");
    } catch (reason) {
      console.error("Python execution failed", reason);
      setError(reason instanceof Error ? reason.message : "Pythonの実行に失敗しました。");
    } finally {
      setChecking(false);
    }
  };

  return (
    <Stack spacing={2}>
      {runtime === "loading" && <Alert severity="info">Python実行環境を準備しています。入力は先に始められます。</Alert>}
      {runtime === "error" && <Alert severity="error">Python実行環境を読み込めませんでした。通信を確認して再読み込みしてください。</Alert>}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 2, minWidth: 0 }}>
        <Paper sx={{ p: 1.5, bgcolor: "#0f172a", color: "#e2e8f0", overflowX: "auto" }}>
          <Typography fontWeight={900} sx={{ mb: 1 }}>見本コード</Typography>
          <Typography component="pre" sx={{ m: 0, minWidth: 590, fontFamily: "monospace", fontSize: 13 }}>{sampleCode}</Typography>
        </Paper>
        <TextField
          label="ここへ同じコードを入力"
          multiline minRows={18} value={value} disabled={disabled || checking}
          onChange={(event) => onChange(event.target.value)}
          inputProps={{ spellCheck: false, "aria-label": "写経コード入力欄" }}
          sx={{ "& textarea": { fontFamily: "monospace", fontSize: 13, whiteSpace: "pre", overflowX: "auto" } }}
        />
      </Box>
      {showDiff && (
        <Paper aria-label="コード差分" sx={{ p: 2, border: "2px solid #f59e0b" }}>
          <Typography fontWeight={900}>一致しない行があります</Typography>
          <Stack sx={{ mt: 1, fontFamily: "monospace", overflowX: "auto" }}>
            {differences.map((part, index) => (
              <Box key={index} sx={{ px: 1, whiteSpace: "pre", bgcolor: part.added ? "#fff7ed" : part.removed ? "#fef2f2" : "transparent", textDecoration: part.removed ? "underline" : "none" }}>
                <strong>{part.added ? "余分 " : part.removed ? "不足/相違 " : "一致 "}</strong>{part.value}
              </Box>
            ))}
          </Stack>
        </Paper>
      )}
      {error && <Alert severity="error">{error}</Alert>}
      {stdout && (
        <Paper sx={{ p: 1.5, bgcolor: "#0f172a", color: "#e2e8f0" }}>
          <Typography fontWeight={900}>標準出力</Typography>
          <Typography component="pre" sx={{ m: 0, mt: 1, fontFamily: "monospace", whiteSpace: "pre-wrap" }}>{stdout}</Typography>
        </Paper>
      )}
      {results.length > 0 && (
        <Stack spacing={1}>
          {results.map((test, index) => (
            <Paper key={index} sx={{ p: 1.5, border: "1px solid #e2e8f0" }}>
              <Stack direction="row" justifyContent="space-between"><Typography fontWeight={900}>テスト {index + 1}</Typography><Chip label={test.passed ? "成功" : "失敗"} color={test.passed ? "success" : "error"} /></Stack>
              <Typography>入力: [{test.input.join(", ")}]</Typography><Typography>期待: [{test.expected.join(", ")}]</Typography><Typography>実行: [{test.actual.join(", ")}]</Typography>
            </Paper>
          ))}
        </Stack>
      )}
      <Button variant="contained" size="large" disabled={disabled || checking || runtime !== "ready" || !value} onClick={checkAndRun}>
        {checking && <CircularProgress size={20} sx={{ mr: 1 }} />}コードを確認して実行
      </Button>
    </Stack>
  );
}
