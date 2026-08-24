"use client";

import Editor from "@monaco-editor/react";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { getMascotImagePath, type MascotId } from "@/app/component/mascot";
import {
  disposePyodideRunner,
  preparePyodide,
  runCourseMissionTests,
  type PythonTestCase,
  type PythonTestResult,
} from "@/lib/pyodideRunner";

type CourseMissionHint = {
  id: string;
  title: string;
  body: string;
  code?: string;
};

type Props = {
  attemptId: string;
  starterCode: string;
  value: string;
  tests: PythonTestCase[];
  hints: CourseMissionHint[];
  viewedHintIds: string[];
  mascotId: MascotId;
  disabled: boolean;
  onChange: (code: string) => void;
  onTestResult: (result: {
    passed: boolean;
    passedCount: number;
    totalCount: number;
    testResults: StoredTestResult[];
    runtimeError: string | null;
  }) => void;
  onTestExecution: (execution: {
    code: string;
    testResults: StoredTestResult[];
    runtimeError: string | null;
  }) => Promise<void>;
  onViewHint: (hintId: string) => Promise<void>;
};

type StoredTestResult = {
  testCaseId: string;
  passed: boolean;
  expectedOutput?: unknown;
  actualOutput?: unknown;
};

type StoredDraft = {
  code: string;
  savedAt: string;
};

type RuntimeStatus = "loading" | "ready" | "error";

const formatValue = (value: unknown) => {
  if (value === null || value === undefined) return "戻り値がありません";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

export function CourseCompletionEditor({
  attemptId,
  starterCode,
  value,
  tests,
  hints,
  viewedHintIds,
  mascotId,
  disabled,
  onChange,
  onTestResult,
  onTestExecution,
  onViewHint,
}: Props) {
  const [runtimeStatus, setRuntimeStatus] = useState<RuntimeStatus>("loading");
  const [runtimeError, setRuntimeError] = useState<string | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [persistenceError, setPersistenceError] = useState<string | null>(null);
  const [results, setResults] = useState<PythonTestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [revealedHintIds, setRevealedHintIds] = useState<Set<string>>(
    () => new Set(viewedHintIds)
  );
  const [loadingHintIds, setLoadingHintIds] = useState<Set<string>>(new Set());
  const [hintError, setHintError] = useState<string | null>(null);
  const restoredStorageKeyRef = useRef<string | null>(null);
  const storageKey = useMemo(() => `course-exam-draft:${attemptId}`, [attemptId]);

  const prepareRuntime = useCallback(async () => {
    setRuntimeStatus("loading");
    setRuntimeError(null);
    try {
      await preparePyodide();
      setRuntimeStatus("ready");
    } catch (error) {
      console.error("Failed to load Pyodide:", error);
      setRuntimeStatus("error");
      setRuntimeError(
        error instanceof Error
          ? error.message
          : "Python実行環境を読み込めませんでした。",
      );
    }
  }, []);

  useEffect(() => {
    void prepareRuntime();
    return () => {
      disposePyodideRunner();
    };
  }, [prepareRuntime]);

  useEffect(() => {
    if (restoredStorageKeyRef.current === storageKey) return;
    restoredStorageKeyRef.current = storageKey;
    const saved = window.localStorage.getItem(storageKey);
    if (saved && (value === "" || value === starterCode)) {
      try {
        const draft = JSON.parse(saved) as Partial<StoredDraft>;
        if (typeof draft.code !== "string" || typeof draft.savedAt !== "string") {
          return;
        }
        onChange(draft.code);
        setSavedAt(
          `${new Date(draft.savedAt).toLocaleString("ja-JP")} に保存したコードを復元しました`
        );
      } catch (error) {
        console.warn("Invalid course exam draft was ignored:", error);
      }
    }
  }, [onChange, starterCode, storageKey, value]);

  useEffect(() => {
    setRevealedHintIds((current) => new Set([...current, ...viewedHintIds]));
  }, [viewedHintIds]);

  const handleViewHint = async (hintId: string) => {
    if (revealedHintIds.has(hintId) || loadingHintIds.has(hintId)) return;

    setHintError(null);
    setLoadingHintIds((current) => new Set([...current, hintId]));
    try {
      await onViewHint(hintId);
      setRevealedHintIds((current) => new Set([...current, hintId]));
    } catch (error) {
      console.error("Failed to record hint view:", error);
      setHintError("ヒントを表示できませんでした。通信状態を確認して、もう一度お試しください。");
    } finally {
      setLoadingHintIds((current) => {
        const next = new Set(current);
        next.delete(hintId);
        return next;
      });
    }
  };

  const passedCount = results.filter((result) => result.passed).length;
  const progress = tests.length === 0 ? 0 : Math.round((passedCount / tests.length) * 100);

  const handleCodeChange = (nextCode: string) => {
    setResults([]);
    setRunError(null);
    setPersistenceError(null);
    onTestResult({
      passed: false,
      passedCount: 0,
      totalCount: tests.length,
      testResults: [],
      runtimeError: null,
    });
    onChange(nextCode);
  };

  const handleSave = () => {
    const savedAt = new Date();
    const draft: StoredDraft = { code: value, savedAt: savedAt.toISOString() };
    window.localStorage.setItem(storageKey, JSON.stringify(draft));
    setSavedAt(`${savedAt.toLocaleString("ja-JP")} に保存しました`);
  };

  const handleReset = () => {
    setResults([]);
    setRunError(null);
    setPersistenceError(null);
    window.localStorage.removeItem(storageKey);
    setSavedAt(null);
    onTestResult({
      passed: false,
      passedCount: 0,
      totalCount: tests.length,
      testResults: [],
      runtimeError: null,
    });
    onChange(starterCode);
  };

  const handleRun = async () => {
    if (runtimeStatus !== "ready" || isRunning || disabled || !value.trim()) return;
    setIsRunning(true);
    setRunError(null);
    setPersistenceError(null);
    setResults([]);
    onTestResult({
      passed: false,
      passedCount: 0,
      totalCount: tests.length,
      testResults: [],
      runtimeError: null,
    });

    let storedResults: StoredTestResult[] = [];
    let executionError: string | null = null;
    try {
      const response = await runCourseMissionTests(value, tests);
      setResults(response.results);
      const nextPassedCount = response.results.filter((result) => result.passed).length;
      const passed = tests.length > 0 && nextPassedCount === tests.length;
      storedResults = response.results.map((result) => ({
        testCaseId: result.id,
        passed: result.passed,
        expectedOutput: result.expected,
        actualOutput: result.actual,
      }));
      onTestResult({
        passed,
        passedCount: nextPassedCount,
        totalCount: tests.length,
        testResults: storedResults,
        runtimeError: null,
      });
    } catch (error) {
      console.error("Failed to run Course Mission code:", error);
      executionError =
        error instanceof Error ? error.message : "コードの実行に失敗しました。";
      setRunError(executionError);
      onTestResult({
        passed: false,
        passedCount: 0,
        totalCount: tests.length,
        testResults: [],
        runtimeError: executionError,
      });
    }

    try {
      await onTestExecution({
        code: value,
        testResults: storedResults,
        runtimeError: executionError,
      });
    } catch (error) {
      console.error("Failed to persist Course Mission test execution:", error);
      setPersistenceError(
        "テスト実行履歴を保存できませんでした。通信状態を確認して、もう一度実行してください。"
      );
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", lg: "190px minmax(380px, 1fr) 220px" },
        minHeight: { md: 620 },
        minWidth: 0,
      }}
    >
      <Box
        component="aside"
        aria-label="テストケース進捗"
        sx={{
          p: 2,
          borderRight: { lg: "1px solid #e2e8f0" },
          borderBottom: { xs: "1px solid #e2e8f0", lg: 0 },
          bgcolor: "#fffdf5",
        }}
      >
        <Typography fontWeight={950} color="#713f12">コース完了サポート</Typography>
        <Typography fontSize={13} color="#64748b" sx={{ mt: 0.75, lineHeight: 1.7 }}>
          実行結果を見ながら、つまずいているケースを確認しよう。
        </Typography>
        <Stack direction="row" justifyContent="space-between" sx={{ mt: 2.5, mb: 0.75 }}>
          <Typography fontSize={13} fontWeight={900}>テストケース</Typography>
          <Typography fontSize={13} fontWeight={950}>{passedCount} / {tests.length} 通過</Typography>
        </Stack>
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            height: 8,
            borderRadius: 999,
            bgcolor: "#fde68a",
            "& .MuiLinearProgress-bar": { bgcolor: "#16a34a", borderRadius: 999 },
          }}
        />
        <Stack spacing={1} sx={{ mt: 2 }}>
          {tests.map((test) => {
            const result = results.find((item) => item.id === test.id);
            return (
              <Paper
                key={test.id}
                elevation={0}
                sx={{
                  p: 1.25,
                  borderRadius: 2,
                  border: `1px solid ${result?.passed ? "#86efac" : result ? "#fecaca" : "#e2e8f0"}`,
                  bgcolor: result?.passed ? "#f0fdf4" : result ? "#fef2f2" : "#fff",
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  {result?.passed ? (
                    <CheckCircleIcon sx={{ color: "#16a34a", fontSize: 19 }} />
                  ) : result ? (
                    <Box sx={{ width: 17, height: 17, borderRadius: "50%", bgcolor: "#dc2626", color: "#fff", display: "grid", placeItems: "center", fontSize: 12, fontWeight: 950 }}>!</Box>
                  ) : (
                    <Box sx={{ width: 17, height: 17, borderRadius: "50%", border: "2px solid #cbd5e1" }} />
                  )}
                  <Box sx={{ minWidth: 0 }}>
                    <Typography fontSize={13} fontWeight={900}>{test.label}</Typography>
                    <Typography fontSize={11} color="#64748b" noWrap>{formatValue(test.displayInput ?? test.args)}</Typography>
                  </Box>
                </Stack>
              </Paper>
            );
          })}
        </Stack>
      </Box>

      <Stack sx={{ minWidth: 0, bgcolor: "#fff" }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          gap={1}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", sm: "center" }}
          sx={{ px: 2, py: 1.5, borderBottom: "1px solid #e2e8f0" }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography fontWeight={950} color="#1d4ed8">Pythonコードエディタ</Typography>
            <Chip
              size="small"
              label={runtimeStatus === "ready" ? "実行準備OK" : runtimeStatus === "loading" ? "読込中" : "読込エラー"}
              color={runtimeStatus === "ready" ? "success" : runtimeStatus === "error" ? "error" : "default"}
              sx={{ fontWeight: 900 }}
            />
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button size="small" variant="outlined" startIcon={<SaveOutlinedIcon />} onClick={handleSave} disabled={isRunning}>
              コードを保存
            </Button>
            <Button size="small" color="inherit" startIcon={<RestartAltIcon />} onClick={handleReset} disabled={disabled || isRunning}>
              リセット
            </Button>
          </Stack>
        </Stack>

        <Editor
          height="470px"
          language="python"
          value={value}
          onChange={(next) => handleCodeChange(next ?? "")}
          options={{
            readOnly: disabled || isRunning,
            minimap: { enabled: false },
            fontSize: 15,
            lineNumbersMinChars: 3,
            scrollBeyondLastLine: false,
            renderLineHighlight: "all",
            wordWrap: "on",
            autoClosingBrackets: "always",
            autoIndent: "full",
            tabSize: 4,
            insertSpaces: true,
            padding: { top: 16, bottom: 16 },
          }}
        />

        <Stack spacing={1.25} sx={{ p: 2, borderTop: "1px solid #e2e8f0" }}>
          {savedAt && <Typography fontSize={12} color="#64748b">{savedAt}</Typography>}
          {persistenceError && <Alert severity="error">{persistenceError}</Alert>}
          {runtimeStatus === "error" && (
            <Alert
              severity="error"
              action={<Button color="inherit" size="small" onClick={() => void prepareRuntime()}>再読込</Button>}
            >
              {runtimeError}
            </Alert>
          )}
          {tests.length === 0 && (
            <Alert severity="warning">テストケースを読み込めませんでした。ページを再読み込みしてください。</Alert>
          )}
          {runError && (
            <Alert severity="error">
              <Typography fontWeight={900}>コードを実行できませんでした</Typography>
              <Box component="pre" sx={{ m: 0, mt: 0.75, whiteSpace: "pre-wrap", fontSize: 12, overflowWrap: "anywhere" }}>
                {runError}
              </Box>
            </Alert>
          )}
          {results.length > 0 && (
            <Stack spacing={0.75} aria-live="polite">
              {results.map((result) => (
                <Paper key={result.id} elevation={0} sx={{ p: 1.25, border: `1px solid ${result.passed ? "#bbf7d0" : "#fecaca"}`, bgcolor: result.passed ? "#f0fdf4" : "#fef2f2", borderRadius: 2 }}>
                  <Typography fontSize={13} fontWeight={950} color={result.passed ? "#15803d" : "#b91c1c"}>
                    {result.passed ? "通過" : "未通過"}：{result.label}
                  </Typography>
                  <Typography component="div" fontSize={12} color="#475569" sx={{ mt: 0.5 }}>
                    期待 {formatValue(result.expected)} ／ 実行 {formatValue(result.actual)}
                  </Typography>
                </Paper>
              ))}
            </Stack>
          )}
          {results.length > 0 && passedCount === tests.length && (
            <Alert severity="success">すべてのテストケースを通過しました。下の「提出する」からコードを提出できます。</Alert>
          )}
          <Button
            variant="contained"
            size="large"
            startIcon={isRunning ? <CircularProgress size={18} color="inherit" /> : <PlayArrowIcon />}
            disabled={disabled || isRunning || runtimeStatus !== "ready" || !value.trim() || tests.length === 0}
            onClick={() => void handleRun()}
            sx={{ minHeight: 50, fontWeight: 950 }}
          >
            {isRunning ? "テスト実行中..." : "テストケースを実行"}
          </Button>
        </Stack>
      </Stack>

      <Box
        component="aside"
        aria-label="ヒント"
        sx={{ p: 2, borderLeft: { lg: "1px solid #e2e8f0" }, borderTop: { xs: "1px solid #e2e8f0", lg: 0 }, bgcolor: "#f8fbff" }}
      >
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
          <LightbulbOutlinedIcon sx={{ color: "#2563eb" }} />
          <Typography fontWeight={950} color="#1d4ed8">ヒント</Typography>
        </Stack>
        <Typography fontSize={13} color="#64748b" sx={{ mb: 1.5, lineHeight: 1.7 }}>
          分からないところだけ開いて、これまでのMissionを思い出そう。
        </Typography>
        <Stack spacing={1}>
          {hints.map((hint, index) => {
            const isRevealed = revealedHintIds.has(hint.id);
            const isLoadingHint = loadingHintIds.has(hint.id);

            return (
              <Paper key={hint.id} elevation={0} sx={{ p: 1.5, border: "1px solid #dbeafe", borderRadius: 2, bgcolor: "#fff" }}>
                <Typography fontSize={14} fontWeight={900}>
                  ヒント {index + 1}：{hint.title}
                </Typography>
                {isRevealed ? (
                  <Box sx={{ mt: 1.25, pt: 1.25, borderTop: "1px solid #dbeafe" }}>
                    <Typography fontSize={13} color="#475569" sx={{ lineHeight: 1.75, whiteSpace: "pre-line" }}>{hint.body}</Typography>
                    {hint.code && (
                      <Box component="pre" sx={{ m: 0, mt: 1, p: 1, borderRadius: 1.5, bgcolor: "#0f172a", color: "#e2e8f0", fontSize: 12, overflowX: "auto" }}>
                        {hint.code}
                      </Box>
                    )}
                  </Box>
                ) : (
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={isLoadingHint ? <CircularProgress size={15} /> : <LightbulbOutlinedIcon />}
                    disabled={isLoadingHint}
                    onClick={() => void handleViewHint(hint.id)}
                    sx={{ mt: 1.25, fontWeight: 900 }}
                  >
                    {isLoadingHint ? "記録中..." : "ヒントを見る"}
                  </Button>
                )}
              </Paper>
            );
          })}
        </Stack>
        {hintError && <Alert severity="error" sx={{ mt: 1.5 }}>{hintError}</Alert>}

        <Stack direction="row" alignItems="flex-end" justifyContent="flex-end" sx={{ mt: 3 }}>
          <Paper elevation={0} sx={{ p: 1.25, border: "1px solid #bfdbfe", borderRadius: 2, bgcolor: "#fff", position: "relative", maxWidth: 170 }}>
            <Typography fontSize={13} fontWeight={900} lineHeight={1.7}>
              迷ったらヒントを1つずつ見てみよう。ここまでの知識で完成できるよ！
            </Typography>
          </Paper>
          <Box component="img" src={getMascotImagePath(mascotId, "cheer")} alt="コース完了課題を応援する相棒" sx={{ width: 76, height: 76, objectFit: "contain", ml: -0.5 }} />
        </Stack>
      </Box>
    </Box>
  );
}
