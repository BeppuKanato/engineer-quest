/**
 * Pyodide ワーカーから返る Python 例外の解析（フェーズ7の自由実行・テスト判定で共通）。
 *
 * ワーカー（public/pyodide-course-worker.mjs）は学習者コードを exec で直接実行するため、
 * 例外メッセージのトレースバックに現れる `File "<string>", line N` は学習者コードの
 * 行番号に対応する。ハーネス側のフレーム（"<exec>"）は学習者には意味がないので拾わない。
 * 文法エラーはコンパイル時に例外オブジェクトへ行番号が乗り、トレースバック整形でも
 * 同じ `File "<string>", line N` として現れる。実行時エラーは最も内側（最後）の
 * "<string>" フレームが、エラーが実際に起きた学習者コードの行である。
 */
export type ExecutionErrorKind = "syntax" | "runtime" | "timeout";
export type ExecutionErrorAnalysis = { readonly kind: ExecutionErrorKind; readonly line?: number; readonly exception?: string; readonly name?: string };

/**
 * トレースバック末尾の例外行（例：`NameError: name 'n' is not defined`）から
 * 例外クラス名を取り出す。NameError のときは未定義の名前も拾う。
 * 学習者向けの具体文（定型文）に差し替えるための材料で、LLMは使わない。
 */
export function extractException(message: string): { exception?: string; name?: string } {
  const lines = message.split("\n").map(line => line.trim()).filter(Boolean);
  for (let i = lines.length - 1; i >= 0; i--) {
    const match = /^([A-Za-z_][\w.]*?(?:Error|Exception|Exit|Interrupt|Iteration)):\s*(.*)$/u.exec(lines[i]);
    if (!match) continue;
    const exception = match[1].split(".").pop()!;
    if (exception === "NameError") {
      const nameMatch = /name '([^']+)' is not defined/u.exec(match[2]);
      if (nameMatch) return { exception, name: nameMatch[1] };
    }
    return { exception };
  }
  return {};
}

/** pyodideRunner がタイムアウト時に投げる文言そのもの。この文字列と完全一致したときだけ timeout とする。 */
const runnerTimeoutMessage = "Pythonの実行がタイムアウトしました。処理を見直してください。";

export function executionErrorText(error: unknown): string {
  return error !== null && typeof error === "object" && "message" in error && typeof error.message === "string" ? error.message : String(error);
}

/** トレースバック中の `File "<string>", line N` のうち最後のものの行番号。見つからなければ undefined。 */
export function extractExecutionErrorLine(message: string): number | undefined {
  let line: number | undefined;
  const pattern = /File "<string>", line (\d+)/gu;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(message)) !== null) {
    const parsed = Number(match[1]);
    if (Number.isSafeInteger(parsed) && parsed > 0) line = parsed;
  }
  return line;
}

export function classifyExecutionError(error: unknown): ExecutionErrorKind {
  const message = executionErrorText(error);
  if (message === runnerTimeoutMessage) return "timeout";
  return /(?:SyntaxError|IndentationError|TabError):/u.test(message) ? "syntax" : "runtime";
}

/** エラーの種別と、取れる場合は学習者コード基準の行番号・例外名を返す。タイムアウトは行を持たない。 */
export function analyzeExecutionError(error: unknown): ExecutionErrorAnalysis {
  const kind = classifyExecutionError(error);
  if (kind === "timeout") return { kind };
  const message = executionErrorText(error);
  const line = extractExecutionErrorLine(message);
  const { exception, name } = extractException(message);
  return { kind, ...(line === undefined ? {} : { line }), ...(exception === undefined ? {} : { exception }), ...(name === undefined ? {} : { name }) };
}
