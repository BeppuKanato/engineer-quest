/** Pythonの実値を、描画に必要な変数だけへ制限したコピー。未代入はプロパティなし。 */
export type PythonTraceLocals = {
  readonly queue?: readonly string[] | null;
  readonly distances?: Readonly<Record<string, number>> | null;
  readonly node?: string | null;
  readonly neighbor?: string | null;
  /** 盤面系の単元用。奇数の一辺を持つ正方形の整数グリッドだけをコピーする。 */
  readonly grid?: readonly (readonly number[])[] | null;
  readonly size?: number | null;
  readonly choices?: readonly number[] | null;
  /** 数値リスト（並び替えの作業配列など）。優先名は result、なければ型・内容で一意に検出する。 */
  readonly array?: readonly number[] | null;
  readonly i?: number | null;
  readonly j?: number | null;
  readonly n?: number | null;
  /** 二分探索単元用（Issue #293）。探索範囲の両端・中央・探す値の整数だけをコピーする。 */
  readonly lo?: number | null;
  readonly hi?: number | null;
  readonly mid?: number | null;
  readonly target?: number | null;
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
  readonly result: Readonly<Record<string, number>> | readonly (readonly number[])[] | readonly number[] | null;
  readonly error: { readonly line: number | null; readonly kind: string } | null;
  readonly stoppedLine: number | null;
  readonly eventCount: number;
  readonly limit: number;
  /** 型・内容で候補を一意に選べなかった場合は、部分再生でも推測しない。 */
  readonly ambiguous: boolean;
  /** 曖昧になった変数の種類（queue / distances / grid / array）。判定は単元ごとに自単元の種類だけを見る。 */
  readonly ambiguousKinds: readonly string[];
};
export type PythonTraceRequest = {
  readonly code: string;
  readonly functionName: string;
  readonly args: readonly unknown[];
  readonly maxEvents?: number;
};
