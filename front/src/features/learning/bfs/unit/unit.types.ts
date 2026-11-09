import type { ImplementationInputLevel } from "../../implementation/inputLevel";

/**
 * 単元フロー（Issue #77）が各フェーズの単品プレビューから受け取る到達状況。
 * フェーズごとに該当する項目だけが入る（未実施の項目は undefined）。
 * 型だけの共有であり、実行時の依存は持たない。
 */
export type BfsUnitPhaseSummary = {
  /** 初回解答で正解した問題数（フェーズ3・5・6） */
  firstAttemptCorrect?: number;
  /** 問題の総数（フェーズ3・5・6） */
  totalQuestions?: number;
  /** テスト実行の回数（フェーズ7） */
  testRuns?: number;
  /** ヒントレベル別の使用回数（フェーズ7） */
  hintUsage?: readonly number[];
  /** 完了時点の入力量レベル（フェーズ7、Issue #328） */
  inputLevel?: ImplementationInputLevel;
};
