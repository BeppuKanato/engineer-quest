/** Pythonの実値を、描画に必要な変数だけへ制限したコピー。未代入はプロパティなし。 */
export type PythonTraceLocals = {
  readonly queue?: readonly string[] | null;
  readonly distances?: Readonly<Record<string, number>> | null;
  readonly node?: string | null;
  readonly neighbor?: string | null;
};
export type PythonTraceEvent = {
  readonly line: number;
  readonly event: "line" | "return" | "exception";
  readonly boundary: "while" | "for" | "line";
  readonly locals: PythonTraceLocals;
};
export type PythonTraceResult = {
  readonly events: readonly PythonTraceEvent[];
  readonly status: "returned" | "error" | "truncated";
  readonly result: Readonly<Record<string, number>> | null;
  readonly error: { readonly line: number | null; readonly kind: string } | null;
  readonly stoppedLine: number | null;
  readonly eventCount: number;
  readonly limit: number;
  /** 型・内容で候補を一意に選べなかった場合は、部分再生でも推測しない。 */
  readonly ambiguous: boolean;
};
export type PythonTraceRequest = {
  readonly code: string;
  readonly functionName: string;
  readonly args: readonly unknown[];
  readonly maxEvents?: number;
};
