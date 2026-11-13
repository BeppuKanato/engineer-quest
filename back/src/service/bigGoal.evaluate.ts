/**
 * 大目標の達成判定と進捗計算（純粋関数、Issue #365）。
 * 正本：実装仕様「2026-11-10_大目標モデル実装仕様」4.3（進捗の計算）、
 * 5章（達成判定の基盤）。判定は条件とデータからコード側で行い、LLM は行わない。
 * 進捗は達成条件の部分充足であり、達成そのものは条件全体の充足でのみ成立する。
 */
import { BigGoalType } from "@prisma/client";

import type {
  BigGoalParams,
  UnitCompletionParams,
  CreateQuestGoalParams,
} from "./bigGoal.types";

/** 新フロー単元は教材指針で全単元7フェーズに統一されている。 */
export const UNIT_PHASE_COUNT = 7;

export type PhaseFact = {
  phaseKey: string;
  status: string;
  summary: Record<string, unknown> | null;
};

/** 判定に使う実態データのスナップショット。service 側が DB から組み立てる。 */
export type BigGoalFacts = {
  /** 到達型・定着型：対象単元の進捗とフェーズ事実 */
  unitStatus?: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  phases?: PhaseFact[];
  /** 実績型：対象実績を獲得済みか */
  achievementAcquired?: boolean;
  /** 応用型：対象アルゴリズムの作る課題の完了件数 */
  createQuestCompletedCount?: number;
};

export type BigGoalOutcome =
  | "ACHIEVED"
  | "UNMET_CLOSED"
  | "ONGOING"
  | "NOT_INSTRUMENTED";

export type GoalRequirement = {
  id: string;
  label: string;
  status: "met" | "ongoing" | "unobserved" | "not_met" | "unavailable";
  current?: number;
  target?: number;
  unit?: string;
};

export type BigGoalEvaluation = {
  outcome: BigGoalOutcome;
  /** 部分充足の割合（0〜1）。定義できない型は null */
  fraction: number | null;
  detail: Record<string, unknown>;
  /** 目標の達成条件ごとの事実。割合だけでは表せない挑戦も含む。 */
  requirements: GoalRequirement[];
};

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const asNumber = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

export type UnitSummary = {
  completedPhaseCount: number;
  firstAttempt: { correct: number; total: number; rate: number | null };
  phase7: {
    inputLevel: string | null;
    hintUsage: number[] | null;
    /** フェーズ7のサマリがない、または hintUsage がすべて0なら true（実績評価の既存解釈に揃える） */
    noHint: boolean | null;
  };
};

/** フェーズ事実から、初回正答の集計とフェーズ7の状態を取り出す。 */
export function summarizeUnit(phases: PhaseFact[]): UnitSummary {
  const completed = phases.filter((p) => p.status === "COMPLETED");
  let correct = 0;
  let total = 0;
  let phase7: UnitSummary["phase7"] = { inputLevel: null, hintUsage: null, noHint: null };
  for (const phase of completed) {
    const summary = asRecord(phase.summary);
    if (!summary) continue;
    const first = asNumber(summary.firstAttemptCorrect);
    const questions = asNumber(summary.totalQuestions);
    if (first !== null && questions !== null && questions > 0) {
      correct += first;
      total += questions;
    }
    // フェーズ7のサマリは inputLevel / hintUsage を持つことで識別する。
    if ("inputLevel" in summary || "hintUsage" in summary) {
      const usage = Array.isArray(summary.hintUsage)
        ? summary.hintUsage.filter((v): v is number => typeof v === "number")
        : null;
      phase7 = {
        inputLevel: typeof summary.inputLevel === "string" ? summary.inputLevel : null,
        hintUsage: usage,
        noHint: usage === null ? null : usage.every((count) => count === 0),
      };
    }
  }
  return {
    completedPhaseCount: completed.length,
    firstAttempt: {
      correct,
      total,
      rate: total > 0 ? correct / total : null,
    },
    phase7,
  };
}

function evaluateUnitCompletion(
  params: UnitCompletionParams,
  facts: BigGoalFacts
): BigGoalEvaluation {
  const unit = summarizeUnit(facts.phases ?? []);
  const challenge = params.challenge;
  const unitComplete = facts.unitStatus === "COMPLETED";
  const checks = {
    inputLevel: challenge?.inputLevel === undefined ? null
      : unit.phase7.inputLevel === null ? null
      : unit.phase7.inputLevel === challenge.inputLevel,
    noHint: challenge?.noHint ? unit.phase7.noHint : null,
    firstAttemptRate: challenge?.minFirstAttemptRate === undefined ? null
      : unit.firstAttempt.rate === null ? null
      : unit.firstAttempt.rate >= challenge.minFirstAttemptRate,
  };
  const detail: Record<string, unknown> = {
    unitStatus: facts.unitStatus ?? "NOT_STARTED",
    completedPhaseCount: unit.completedPhaseCount,
    totalPhaseCount: UNIT_PHASE_COUNT,
    firstAttempt: unit.firstAttempt,
    phase7: unit.phase7,
    challengeChecks: checks,
  };
  const requirements: GoalRequirement[] = [{
    id: "unit",
    label: "単元の7フェーズを完了する",
    status: unitComplete ? "met" : "ongoing",
    current: unit.completedPhaseCount,
    target: UNIT_PHASE_COUNT,
    unit: "フェーズ",
  }];
  const statusOf = (check: boolean | null): GoalRequirement["status"] =>
    check === null ? "unobserved" : check ? "met" : "not_met";
  if (challenge?.inputLevel) requirements.push({
    id: "inputLevel",
    label: "フェーズ7で" + (challenge.inputLevel === "full" ? "全部書く" : challenge.inputLevel === "skeleton" ? "骨格から書く" : "穴埋め") + "方式を使用する",
    status: statusOf(checks.inputLevel),
  });
  if (challenge?.noHint) requirements.push({
    id: "noHint",
    label: "フェーズ7をヒントなしで完了する",
    status: statusOf(checks.noHint),
  });
  if (challenge?.minFirstAttemptRate !== undefined) requirements.push({
    id: "firstAttemptRate",
    label: "確認・応用問題の初回正答率" + Math.round(challenge.minFirstAttemptRate * 100) + "%以上",
    status: unitComplete ? statusOf(checks.firstAttemptRate)
      : checks.firstAttemptRate === null ? "unobserved" : "ongoing",
  });

  if (!unitComplete) {
    return {
      outcome: "ONGOING",
      // 挑戦条件つきの目標では単元7/7を「大目標100%」と誤表示しない。
      fraction: challenge ? null : Math.min(unit.completedPhaseCount / UNIT_PHASE_COUNT, 1),
      detail, requirements,
    };
  }
  if (!challenge) return { outcome: "ACHIEVED", fraction: 1, detail, requirements };
  const selectedChecks: Array<boolean | null> = [];
  if (challenge.inputLevel !== undefined) selectedChecks.push(checks.inputLevel);
  if (challenge.noHint) selectedChecks.push(checks.noHint);
  if (challenge.minFirstAttemptRate !== undefined) selectedChecks.push(checks.firstAttemptRate);
  // 記録不足を達成とも失敗とも推定しない。
  if (selectedChecks.includes(null)) {
    return { outcome: "NOT_INSTRUMENTED", fraction: null, detail, requirements };
  }
  const achieved = selectedChecks.every(value => value === true);
  return {
    outcome: achieved ? "ACHIEVED" : "UNMET_CLOSED",
    fraction: achieved ? 1 : null,
    detail, requirements,
  };
}

export function evaluateBigGoal(
  type: BigGoalType,
  params: BigGoalParams,
  facts: BigGoalFacts
): BigGoalEvaluation {
  switch (type) {
    case "UNIT_COMPLETION":
      return evaluateUnitCompletion(params as UnitCompletionParams, facts);
    case "ACHIEVEMENT": {
      const acquired = facts.achievementAcquired === true;
      return {
        outcome: acquired ? "ACHIEVED" : "ONGOING",
        fraction: acquired ? 1 : 0,
        detail: { achievementAcquired: acquired },
        requirements: [{
          id: "achievement", label: "指定の実績を獲得する",
          status: acquired ? "met" : "ongoing",
          current: acquired ? 1 : 0, target: 1, unit: "件",
        }],
      };
    }
    case "CREATE_QUEST": {
      const p = params as CreateQuestGoalParams;
      const done = facts.createQuestCompletedCount ?? 0;
      return {
        outcome: done >= p.count ? "ACHIEVED" : "ONGOING",
        fraction: p.count > 0 ? Math.min(done / p.count, 1) : 1,
        detail: { completedCount: done, requiredCount: p.count },
        requirements: [{
          id: "createQuest", label: "対象アルゴリズムの作る課題を完了する",
          status: done >= p.count ? "met" : "ongoing",
          current: done, target: p.count, unit: "件",
        }],
      };
    }
    case "INTEGRATION":
    case "SHARING":
    case "RETENTION":
      // 枠のみで計装が前提に依存する型は、達成も未達成も判定しない。
      return {
        outcome: "NOT_INSTRUMENTED",
        fraction: null,
        detail: { reason: "not_instrumented" },
        requirements: [{
          id: "notInstrumented", label: "達成条件の計測",
          status: "unavailable",
        }],
      };
  }
  throw new Error("UNKNOWN_BIG_GOAL_TYPE");
}
