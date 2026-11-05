import type { PythonTraceRequest, PythonTraceResult } from "./pythonTrace.types";

export type PythonTestCase = {
  id: string;
  label: string;
  functionName: string;
  args: unknown[];
  expected: unknown;
  displayInput?: unknown;
};
export type PythonTestResult = PythonTestCase & {
  actual: unknown;
  passed: boolean;
};

/** 出力を表示する表示用実行だけで使う。既存の採点呼び出しは未指定のまま。 */
export type PythonRunOutputOptions = {
  onStdout?: (line: string) => void;
  maxOutputChars?: number;
};

let worker: Worker | null = null;
let requestId = 0;
const pendingRequests = new Map<number, () => void>();

const getWorker = () => {
  if (!worker) worker = new Worker("/pyodide-course-worker.mjs", { type: "module" });
  return worker;
};

const request = <T>(payload: Record<string, unknown>, timeoutMs = 15_000, output?: PythonRunOutputOptions) =>
  new Promise<T>((resolve, reject) => {
    const currentWorker = getWorker();
    const id = ++requestId;
    const stdout: string[] = [];
    const stderr: string[] = [];
    const limit = output?.maxOutputChars === undefined ? Infinity : Math.max(0, output.maxOutputChars);
    let stdoutSize = 0, stderrSize = 0, stdoutLines = 0, stderrLines = 0;
    const append = (parts: string[], line: string, size: number, lines: number) => {
      const chunk = (lines ? "\n" : "") + line;
      if (size < limit) parts.push(chunk.slice(0, limit - size));
      return Math.min(limit, size + chunk.length);
    };
    const cleanup = () => {
      window.clearTimeout(timer);
      currentWorker.removeEventListener("message", listener);
      currentWorker.removeEventListener("error", errorListener);
      pendingRequests.delete(id);
    };
    const timer = window.setTimeout(() => {
      cleanup();
      currentWorker.terminate();
      if (worker === currentWorker) worker = null;
      reject(new Error("Pythonの実行がタイムアウトしました。処理を見直してください。"));
    }, timeoutMs);
    const listener = (event: MessageEvent) => {
      if (event.data?.id !== id) return;
      if (typeof event.data?.stdout === "string") {
        stdoutSize = append(stdout, event.data.stdout, stdoutSize, stdoutLines++);
        output?.onStdout?.(event.data.stdout);
        return;
      }
      if (typeof event.data?.stderr === "string") {
        stderrSize = append(stderr, event.data.stderr, stderrSize, stderrLines++);
        return;
      }
      cleanup();
      if (event.data?.error) reject(new Error(event.data.error));
      else resolve({ ...event.data, stdout: stdout.join(""), stderr: stderr.join("") } as T);
    };
    const errorListener = (event: ErrorEvent) => {
      cleanup();
      currentWorker.terminate();
      if (worker === currentWorker) worker = null;
      reject(new Error(event.message || "Python実行環境の読み込みに失敗しました。"));
    };
    currentWorker.addEventListener("message", listener);
    currentWorker.addEventListener("error", errorListener);
    pendingRequests.set(id, () => {
      cleanup();
      reject(new Error("Python実行環境の読み込みを中断しました。"));
    });
    currentWorker.postMessage({ id, ...payload });
  });

export const preparePyodide = () => request<{ ready: true }>({ kind: "ping" }, 120_000);
export const runCourseMissionTests = (code: string, tests: PythonTestCase[], output?: PythonRunOutputOptions) =>
  request<{ done: true; results: PythonTestResult[]; stdout: string; stderr: string }>({ kind: "run", code, tests }, 15_000, output);

/** 既存と同じ15秒の実行上限。生のstdout/stderrはtrace経路では配信しない。 */
export const tracePythonFunction = (options: PythonTraceRequest) =>
  request<{ done: true; trace: PythonTraceResult }>({ ...options, kind: "trace" });

export type CreateQuestRequirementResult = {
  requirementId: string;
  passed: boolean;
  testResults: Array<{
    id: string;
    label: string;
    passed: boolean;
    expected?: unknown;
    actual?: unknown;
    metric?: { comparisons?: number; maxComparisons?: number; accesses?: number; maxAccesses?: number } | null;
    error?: string;
  }>;
};

export const runCreateQuestTests = ({
  code,
  functionName,
  requirements,
}: {
  code: string;
  functionName: string;
  requirements: unknown[];
}) =>
  request<{ done: true; results: CreateQuestRequirementResult[]; stdout: string; stderr: string }>(
    { kind: "runCreateQuest", code, functionName, requirements },
    30_000,
  );

export const disposePyodideRunner = () => {
  for (const cancel of pendingRequests.values()) cancel();
  worker?.terminate();
  worker = null;
};
