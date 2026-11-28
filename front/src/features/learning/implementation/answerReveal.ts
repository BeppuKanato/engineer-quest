import type { ImplementationInputLevel } from "./inputLevel";

/**
 * 答え（解法例）の解放バルブと、フェーズ7の試行フラグ記録（ステージ2）。
 *
 * 支援は2層に分ける。
 * - 理解支援（ヒント、橋渡し、AI相談）は常時・選択式で、回数制限なく使える。
 * - 答えそのもの（解法例＝お手本プログラム）の解放だけは、最終チャレンジの
 *   テスト失敗が累積で閾値に達したときに開く「進行保証の弁」とする。
 *   詰まったまま先へ進めなくなる事態を避けるための仕組みであり、
 *   理解支援の利用を罰するものではない。
 *
 * 閾値は仮置きであり、学習者実験の観察で見直す前提でこの1か所に集約する。
 */
export const SOLUTION_REVEAL_FAILURE_THRESHOLD = 5;

/** summary.clears に保持する完了記録の上限。古いものから落とす。 */
export const IMPLEMENTATION_CLEARS_LIMIT = 20;

/**
 * フェーズ7の完了1件分の試行フラグ（ステージ4の実績判定の入力）。
 * summary の `clears` 配列に完了ごとに追記される。
 */
export type ImplementationClearRecord = {
  /** 完了時刻（ISO 8601）。 */
  readonly completedAt: string;
  /** この試行で解法例（お手本）を見たか。 */
  readonly viewedSolution: boolean;
  /** この試行中（試行開始〜完了）に、その単元で AI 相談を使ったか。 */
  readonly usedAiConsultation: boolean;
  /** この試行でヒントを使ったか（既存の hintUsage の合計が1以上）。 */
  readonly usedHint: boolean;
  /** 試行開始時に選んだ入力量レベル。 */
  readonly inputLevel: ImplementationInputLevel;
};

/** 1回の試行（開始〜完了）の途中経過。下書きと同じ流儀で localStorage に永続化する。 */
export type SolutionRevealAttempt = {
  /** 試行開始時刻（ISO 8601）。AI 相談の利用判定の起点。 */
  readonly startedAt: string;
  /** その試行内で累積したテスト失敗回数。画面を閉じても消えない。 */
  readonly failedRuns: number;
  /** 解法例を表示したか。 */
  readonly viewedSolution: boolean;
};

export const solutionRevealAttemptKey = (draftBaseKey: string) => `${draftBaseKey}:solution-reveal-attempt`;

export function readSolutionRevealAttempt(draftBaseKey: string): SolutionRevealAttempt | null {
  try {
    const raw = localStorage.getItem(solutionRevealAttemptKey(draftBaseKey));
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<SolutionRevealAttempt>;
    if (typeof value.startedAt !== "string" || typeof value.failedRuns !== "number" || typeof value.viewedSolution !== "boolean") return null;
    return { startedAt: value.startedAt, failedRuns: value.failedRuns, viewedSolution: value.viewedSolution };
  } catch { return null; }
}

export function writeSolutionRevealAttempt(draftBaseKey: string, attempt: SolutionRevealAttempt): void {
  try { localStorage.setItem(solutionRevealAttemptKey(draftBaseKey), JSON.stringify(attempt)); } catch { /* 保存できなくても学習は止めない */ }
}

export function clearSolutionRevealAttempt(draftBaseKey: string): void {
  try { localStorage.removeItem(solutionRevealAttemptKey(draftBaseKey)); } catch { /* 同上 */ }
}

export const isSolutionRevealUnlocked = (attempt: SolutionRevealAttempt): boolean =>
  attempt.failedRuns >= SOLUTION_REVEAL_FAILURE_THRESHOLD;

/** 既存の clears に新しい完了記録を追記し、上限を超えた分は古いものから落とす。 */
export function appendImplementationClear(
  existing: readonly ImplementationClearRecord[] | undefined,
  record: ImplementationClearRecord,
): readonly ImplementationClearRecord[] {
  return [...(existing ?? []), record].slice(-IMPLEMENTATION_CLEARS_LIMIT);
}

/** API の Json から clears を安全に取り出す。形が違う要素は落とす。 */
export function parseImplementationClears(value: unknown): readonly ImplementationClearRecord[] {
  if (!Array.isArray(value)) return [];
  const levels: readonly string[] = ["full", "skeleton", "fill-in"];
  return value.flatMap(item => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return [];
    const record = item as Record<string, unknown>;
    if (typeof record.completedAt !== "string") return [];
    if (typeof record.viewedSolution !== "boolean" || typeof record.usedAiConsultation !== "boolean" || typeof record.usedHint !== "boolean") return [];
    if (typeof record.inputLevel !== "string" || !levels.includes(record.inputLevel)) return [];
    return [{
      completedAt: record.completedAt,
      viewedSolution: record.viewedSolution,
      usedAiConsultation: record.usedAiConsultation,
      usedHint: record.usedHint,
      inputLevel: record.inputLevel as ImplementationInputLevel,
    }];
  }).slice(-IMPLEMENTATION_CLEARS_LIMIT);
}

/**
 * 下書きキーから単元のコースIDを取り出す。
 * 実アプリの下書きキーは `engineer-quest:learning-code:<uid>:<courseId>`（codeDraft.ts）。
 * 単品プレビューのキー（courseId を含まない）では null を返す。
 */
export function courseIdFromDraftKey(draftBaseKey: string): string | null {
  const last = draftBaseKey.split(":").at(-1);
  if (!last) return null;
  try {
    const decoded = decodeURIComponent(last);
    return decoded.startsWith("course-") ? decoded : null;
  } catch { return null; }
}
