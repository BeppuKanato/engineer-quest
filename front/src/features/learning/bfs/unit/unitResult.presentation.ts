import type { BfsUnitPhaseSummary } from "./unit.types";

/** 完了済みのフェーズ3・5に限る。初回成績から、確認できた事実だけを称える。 */
export function phaseResultPraise(summary?: BfsUnitPhaseSummary): string {
  const total = summary?.totalQuestions, first = summary?.firstAttemptCorrect;
  if (total === undefined || first === undefined || !Number.isInteger(total) || total <= 0
    || !Number.isInteger(first) || first < 0 || first > total) {
    return "やった！ 確認問題を最後まで解き切りました！";
  }
  return first === total
    ? "やった！ 全問、初回で正解しました！"
    : "最後まで取り組んで、全問正解にたどり着きました！";
}
