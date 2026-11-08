/**
 * 正本: docs/concept/learning-materials-guideline.md §1, §2 フェーズ1・2。
 * 1ステップを「1文 + 対象データ + 内部状態 + 強調」の完全なスナップショットにする。
 * 差分の累積ではないので、逆送り・任意位置へのシークでも図と状態が同期する。
 * フェーズ1の場面列も同じ契約で、内部状態や強調を空にして表せる。
 * Canvas は型引数で差し替えられ、再生処理を BFS や Activity に依存させない。
 */
export type CanvasSnapshot = {
  readonly data: object;
  readonly state: object;
  readonly highlights: readonly object[];
};

export type LearningStep<TCanvas extends CanvasSnapshot> = {
  readonly id: string;
  readonly caption: string;
  readonly canvas: TCanvas;
  /**
   * 説明専用ステップ（教材指針 §2-6）。コードの実行単位には対応しない説明
   * （ルールの予告、反例の実演、別解の提示など）をフェーズ2に置くための印。
   * フェーズ2では通常ステップとして再生されるが、フェーズ4のチェック
   * ポイント対象からは外れる（チェックポイントは codeMappedSteps で数える）。
   */
  readonly explanationOnly?: boolean;
};

/**
 * フェーズ4がチェックポイントとして順序どおり再現すべきステップ。
 * 説明専用ステップ（explanationOnly）を除いたものが、コード対応の正である。
 */
export function codeMappedSteps<TCanvas extends CanvasSnapshot>(
  content: LearningContent<TCanvas>,
): readonly LearningStep<TCanvas>[] {
  return content.steps.filter(step => !step.explanationOnly);
}

export type LearningContent<TCanvas extends CanvasSnapshot> = {
  readonly version: 1;
  readonly kind: "step-sequence";
  readonly id: string;
  readonly phase: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  readonly intervalMs: number;
  readonly steps: readonly [LearningStep<TCanvas>, ...LearningStep<TCanvas>[]];
};

/** 読み込み元は型付き TS モジュール。外部 JSON/API を信用する契約ではない。 */
export function defineLearningContent<TCanvas extends CanvasSnapshot>(
  content: LearningContent<TCanvas>,
  validateCanvas: (canvas: TCanvas) => void,
): LearningContent<TCanvas> {
  if (content.version !== 1 || content.kind !== "step-sequence" || !content.id.trim()) {
    throw new Error("Unsupported learning content");
  }
  if (!Number.isInteger(content.phase) || content.phase < 1 || content.phase > 7) {
    throw new Error("Unknown learning phase");
  }
  if (!Number.isFinite(content.intervalMs) || content.intervalMs < 100) {
    throw new Error("Playback interval must be at least 100ms");
  }
  if (content.steps.length === 0) throw new Error("Learning content needs a step");
  const ids = new Set<string>();
  for (const step of content.steps) {
    // 句読点の解釈では1文を保証できないため、文意は教材レビューでも確認する。
    if (!step.id.trim() || ids.has(step.id) || !step.caption.trim() || /[\r\n]/u.test(step.caption)) {
      throw new Error("Steps need unique IDs and a single-line caption");
    }
    ids.add(step.id);
    validateCanvas(step.canvas);
  }
  return content;
}
