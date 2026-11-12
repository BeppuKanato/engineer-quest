import type { BigGoal, BigGoalStatus, BigGoalType } from "@/api/bigGoal.api";

/** 型の表示名。back の型カタログ（bigGoal.types.ts）のラベルに揃える。 */
export const bigGoalTypeLabel = (type: BigGoalType): string =>
  ({
    UNIT_COMPLETION: "単元到達型",
    ACHIEVEMENT: "実績型",
    CREATE_QUEST: "応用型",
    INTEGRATION: "統合型",
    SHARING: "共有型",
    RETENTION: "定着型",
  })[type];

/** 履歴での状態の表示名。未達成で終了した目標も、非難の表現は使わない。 */
export const bigGoalStatusLabel = (status: BigGoalStatus): string =>
  ({
    PROPOSED: "提案中",
    ACTIVE: "取り組み中",
    ACHIEVED: "達成",
    CLOSED_UNMET: "終了",
    REVISED: "見直し済み",
  })[status];

const asCount = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

/**
 * 進捗の事実を一文にする。数値はすべて API が返した評価の内訳（コード側計算）
 * をそのまま使い、フロントで数え直したり割合から逆算したりはしない。
 * 内訳から文を作れない型・状態では null を返し、無理に表示しない。
 */
export const bigGoalProgressFact = (goal: BigGoal): string | null => {
  const detail = goal.evaluation?.detail;
  if (!detail) return null;
  if (goal.type === "UNIT_COMPLETION") {
    const done = asCount(detail.completedPhaseCount);
    const total = asCount(detail.totalPhaseCount);
    if (done === null || total === null) return null;
    return `${total}つのステージのうち${done}つが完了しています`;
  }
  if (goal.type === "CREATE_QUEST") {
    const done = asCount(detail.completedCount);
    const required = asCount(detail.requiredCount);
    if (done === null || required === null) return null;
    return `作るの課題を${required}件中${done}件完了しています`;
  }
  if (goal.type === "ACHIEVEMENT") {
    if (detail.achievementAcquired === true) return "対象の実績を獲得しました";
    if (detail.achievementAcquired === false) return "対象の実績はまだ獲得していません";
    return null;
  }
  return null;
};
