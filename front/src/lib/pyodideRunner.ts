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

let worker: Worker | null = null;
let requestId = 0;
const pendingRequests = new Map<number, () => void>();

const getWorker = () => {
  if (!worker) worker = new Worker("/pyodide-course-worker.mjs", { type: "module" });
  return worker;
};

const request = <T>(payload: Record<string, unknown>, timeoutMs = 15_000) =>
  new Promise<T>((resolve, reject) => {
    const currentWorker = getWorker();
    const id = ++requestId;
    const stdout: string[] = [];
    const stderr: string[] = [];
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
      if (event.data?.stdout) { stdout.push(event.data.stdout); return; }
      if (event.data?.stderr) { stderr.push(event.data.stderr); return; }
      cleanup();
      if (event.data?.error) reject(new Error(event.data.error));
      else resolve({ ...event.data, stdout: stdout.join("\n"), stderr: stderr.join("\n") } as T);
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
export const runCourseMissionTests = (code: string, tests: PythonTestCase[]) =>
  request<{ done: true; results: PythonTestResult[]; stdout: string; stderr: string }>({ kind: "run", code, tests });

export const disposePyodideRunner = () => {
  for (const cancel of pendingRequests.values()) cancel();
  worker?.terminate();
  worker = null;
};
