export type PythonTestCase = { input: number[]; expected: number[] };
export type PythonTestResult = PythonTestCase & { actual: number[]; passed: boolean };

let worker: Worker | null = null;
let requestId = 0;

const getWorker = () => {
  if (!worker) worker = new Worker("/pyodide-bubble-worker.mjs", { type: "module" });
  return worker;
};

const request = <T>(payload: Record<string, unknown>, timeoutMs = 15_000) =>
  new Promise<T>((resolve, reject) => {
    const currentWorker = getWorker();
    const id = ++requestId;
    const timer = window.setTimeout(() => {
      currentWorker.terminate();
      worker = null;
      reject(new Error("Pythonの実行がタイムアウトしました。"));
    }, timeoutMs);
    const listener = (event: MessageEvent) => {
      if (event.data?.id !== id) return;
      if (event.data?.stdout) { stdout.push(event.data.stdout); return; }
      if (event.data?.stderr) { stderr.push(event.data.stderr); return; }
      window.clearTimeout(timer);
      currentWorker.removeEventListener("message", listener);
      if (event.data?.error) reject(new Error(event.data.error));
      else resolve({ ...event.data, stdout: stdout.join("\n"), stderr: stderr.join("\n") } as T);
    };
    currentWorker.addEventListener("message", listener);
    currentWorker.postMessage({ id, ...payload });
  });

export const preparePyodide = () => request<{ ready: true }>({ kind: "ping" }, 30_000);
export const runBubbleSortTests = (code: string, tests: PythonTestCase[]) =>
  request<{ done: true; results: PythonTestResult[]; stdout: string; stderr: string }>({ kind: "run", code, tests });
    const stdout: string[] = [];
    const stderr: string[] = [];
