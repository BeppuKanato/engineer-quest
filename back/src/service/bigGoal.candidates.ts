/**
 * 大目標の候補生成ルール（純粋関数、Issue #366）。
 * 正本：候補生成ルール仕様「2026-11-10_大目標-候補生成ルール仕様」。
 * ルールはガードとして働く：学習者の実態に合わない候補と、達成判定できない
 * 候補を落とす。本命の決定はルールではなく適合度採点（bigGoal.scoring.ts）が担う。
 * 初回に発行するのは到達型・実績型・応用型のみ。統合型・共有型・定着型は
 * 前提が揃うまで候補に出さない。目標に時間指定（所要日数・期限）は付けない。
 */
import type { BigGoalProposalTiming, BigGoalType } from "@prisma/client";

import { buildBigGoalDisplayText, type BigGoalParams } from "./bigGoal.types";

export type LearnerUnitState = {
  courseId: string;
  title: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  completedPhaseCount: number;
};

export type LearnerAchievementState = {
  achievementId: string;
  title: string;
  courseId: string | null;
  achieved: boolean;
};

/** 候補生成が参照する学習者状態のスナップショット。service 側が DB から組み立てる。 */
export type LearnerGoalState = {
  /** 単元一覧の並び順（公開コースの作成順＝単元マップの表示順） */
  units: LearnerUnitState[];
  /** 実績の定義順（sortOrder、createdAt） */
  achievements: LearnerAchievementState[];
  /** 直近に完了した単元の状態（挑戦条件の「余裕」の材料） */
  latestCompletedUnit: {
    courseId: string;
    firstAttemptRate: number | null;
    phase7NoHint: boolean;
  } | null;
  /** 確定中の大目標が対象に含む単元（タイミングAで新規設定をしない判定） */
  coveredCourseIds: string[];
  /** 単元ごとの、まだ完了していない作る課題の件数 */
  openCreateQuestCountByCourse: Record<string, number>;
};

export type BigGoalCandidate = {
  candidateKey: string;
  type: BigGoalType;
  params: BigGoalParams;
  displayText: string;
};

export const MAX_BIG_GOAL_CANDIDATES = 8;

/**
 * 挑戦変種を出す「余裕あり」の初回正答率の線。ルール仕様 §3.1／§7 の 0.8 と、
 * 実装仕様の二値表現（初回成績が高くヒント未使用）の具体的な線は未統一のため、
 * ここに一元化して持ち、後で揃える。
 */
export const ROOMY_FIRST_ATTEMPT_RATE = 0.8;

const hasChallengeRoom = (state: LearnerGoalState): boolean => {
  const latest = state.latestCompletedUnit;
  return (
    latest !== null &&
    latest.firstAttemptRate !== null &&
    latest.firstAttemptRate >= ROOMY_FIRST_ATTEMPT_RATE &&
    latest.phase7NoHint
  );
};

function unitCompletionCandidates(
  unit: LearnerUnitState,
  room: boolean
): BigGoalCandidate[] {
  const standardParams = { courseId: unit.courseId };
  const candidates: BigGoalCandidate[] = [
    {
      candidateKey: `unit-completion:${unit.courseId}`,
      type: "UNIT_COMPLETION",
      params: standardParams,
      displayText: buildBigGoalDisplayText("UNIT_COMPLETION", standardParams, {
        courseTitle: unit.title,
      }),
    },
  ];
  if (room) {
    const challengeParams = {
      courseId: unit.courseId,
      challenge: { inputLevel: "full" as const },
    };
    candidates.push({
      candidateKey: `unit-completion-challenge:${unit.courseId}`,
      type: "UNIT_COMPLETION",
      params: challengeParams,
      displayText: buildBigGoalDisplayText("UNIT_COMPLETION", challengeParams, {
        courseTitle: unit.title,
      }),
    });
  }
  return candidates;
}

function achievementCandidate(
  state: LearnerGoalState,
  unit: LearnerUnitState
): BigGoalCandidate | null {
  const first = state.achievements.find(
    (a) => a.courseId === unit.courseId && !a.achieved
  );
  if (!first) return null;
  const params = { achievementId: first.achievementId };
  return {
    candidateKey: `achievement:${first.achievementId}`,
    type: "ACHIEVEMENT",
    params,
    displayText: buildBigGoalDisplayText("ACHIEVEMENT", params, {
      achievementTitle: first.title,
    }),
  };
}

const dedupe = (list: BigGoalCandidate[]): BigGoalCandidate[] => {
  const seen = new Set<string>();
  return list.filter((c) => {
    if (seen.has(c.candidateKey)) return false;
    seen.add(c.candidateKey);
    return true;
  });
};

export function generateBigGoalCandidates(input: {
  timing: BigGoalProposalTiming;
  startCourseId?: string | null;
  state: LearnerGoalState;
}): BigGoalCandidate[] {
  const { state } = input;
  const room = hasChallengeRoom(state);

  if (input.timing === "UNIT_START") {
    // タイミングA：開始した単元の到達型・実績型のみ。確定中の大目標の対象に
    // 含まれる単元では新規設定をしない。
    const unit = state.units.find((u) => u.courseId === input.startCourseId);
    if (!unit || unit.status === "COMPLETED") return [];
    if (state.coveredCourseIds.includes(unit.courseId)) return [];
    const list = [...unitCompletionCandidates(unit, room)];
    const achievement = achievementCandidate(state, unit);
    if (achievement) list.push(achievement);
    return dedupe(list).slice(0, MAX_BIG_GOAL_CANDIDATES);
  }

  // タイミングB：到達型は未完了の全単元、他型は前提を満たす全単元。
  const others: BigGoalCandidate[] = [];
  for (const unit of state.units) {
    const achievement = achievementCandidate(state, unit);
    if (achievement) others.push(achievement);
  }
  for (const unit of state.units) {
    if ((state.openCreateQuestCountByCourse[unit.courseId] ?? 0) > 0) {
      const params = { algorithmCourseId: unit.courseId, count: 1 };
      others.push({
        candidateKey: `create-quest:${unit.courseId}:1`,
        type: "CREATE_QUEST",
        params,
        displayText: buildBigGoalDisplayText("CREATE_QUEST", params, {
          courseTitle: unit.title,
        }),
      });
    }
  }
  const incomplete = state.units.filter((u) => u.status !== "COMPLETED");
  const orderedUnits = [
    ...incomplete.filter((u) => u.status === "IN_PROGRESS"),
    ...incomplete.filter((u) => u.status === "NOT_STARTED"),
  ];
  const completions: BigGoalCandidate[] = [];
  for (const unit of orderedUnits) {
    completions.push(...unitCompletionCandidates(unit, room));
  }
  // 型の多様性を優先する：到達型以外を先に置き、残りを到達型で埋める。
  let combined = dedupe([...others, ...completions]);
  if (combined.length === 0 && orderedUnits[0]) {
    // 未完了単元がある限り標準形の到達型は常に出せるため、候補集合は空にしない。
    combined = unitCompletionCandidates(orderedUnits[0], false);
  }
  return combined.slice(0, MAX_BIG_GOAL_CANDIDATES);
}
