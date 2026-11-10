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

export type BigGoalEvaluation = {
  outcome: BigGoalOutcome;
  /** 部分充足の割合（0〜1）。定義できない型は null */
  fraction: number | null;
  detail: Record<string, unknown>;
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
    noHint: boolean;
  };
};

/** フェーズ事実から、初回正答の集計とフェーズ7の状態を取り出す。 */
export function summarizeUnit(phases: PhaseFact[]): UnitSummary {
  const completed = phases.filter((p) => p.status === "COMPLETED");
  let correct = 0;
  let total = 0;
  let phase7: UnitSummary["phase7"] = { inputLevel: null, hintUsage: null, noHint: true };
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
        noHint: !usage || usage.every((count) => count === 0),
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
  const checks = {
    inputLevel:
      challenge?.inputLevel === undefined
        ? null
        : unit.phase7.inputLevel === challenge.inputLevel,
    noHint: challenge?.noHint ? unit.phase7.noHint : null,
    firstAttemptRate:
      challenge?.minFirstAttemptRate === undefined
        ? null
        : unit.firstAttempt.rate !== null &&
          unit.firstAttempt.rate >= challenge.minFirstAttemptRate,
  };
  const detail: Record<string, unknown> = {
    unitStatus: facts.unitStatus ?? "NOT_STARTED",
    completedPhaseCount: unit.completedPhaseCount,
    totalPhaseCount: UNIT_PHASE_COUNT,
    firstAttempt: unit.firstAttempt,
    phase7: unit.phase7,
    challengeChecks: checks,
  };
  const fraction = Math.min(unit.completedPhaseCount / UNIT_PHASE_COUNT, 1);
  if (facts.unitStatus !== "COMPLETED") return { outcome: "ONGOING", fraction, detail };
  if (!challenge) return { outcome: "ACHIEVED", fraction: 1, detail };
  // 対象単元が完了した時点で挑戦条件が満たされていなければ、未達成で閉じる（仕様5.1）。
  const satisfied = Object.values(checks).every((v) => v !== false);
  return { outcome: satisfied ? "ACHIEVED" : "UNMET_CLOSED", fraction, detail };
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
      };
    }
    case "CREATE_QUEST": {
      const p = params as CreateQuestGoalParams;
      const done = facts.createQuestCompletedCount ?? 0;
      return {
        outcome: done >= p.count ? "ACHIEVED" : "ONGOING",
        fraction: p.count > 0 ? Math.min(done / p.count, 1) : 1,
        detail: { completedCount: done, requiredCount: p.count },
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
      };
  }
  throw new Error("UNKNOWN_BIG_GOAL_TYPE");
}
