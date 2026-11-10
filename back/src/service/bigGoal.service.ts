/**
 * 大目標の達成判定基盤（Issue #365）。
 * 学習の保存時（フェーズ／単元完了の保存と実績評価と同じタイミング）に、
 * 確定中の大目標を再評価し、判定結果と使ったデータの時点を記録する。
 * 判定はコード側で行う。LLM は達成判定を行わない。
 */
import { BigGoalStatus, Prisma } from "@prisma/client";

import { prisma } from "../lib/prisma";
import {
  evaluateBigGoal,
  type BigGoalEvaluation,
  type BigGoalFacts,
  type PhaseFact,
} from "./bigGoal.evaluate";
import type {
  AchievementGoalParams,
  BigGoalParams,
  CreateQuestGoalParams,
  RetentionGoalParams,
  UnitCompletionParams,
} from "./bigGoal.types";

const json = (v: unknown): Prisma.InputJsonValue => JSON.parse(JSON.stringify(v));

type BigGoalRow = {
  id: string;
  userId: string;
  type: string;
  params: Prisma.JsonValue;
  status: string;
};

const asParams = (value: Prisma.JsonValue): BigGoalParams =>
  (value ?? {}) as BigGoalParams;

/** 判定に使う実態データを DB から組み立てる。 */
export async function loadBigGoalFacts(
  userId: string,
  type: string,
  params: BigGoalParams
): Promise<BigGoalFacts> {
  switch (type) {
    case "UNIT_COMPLETION":
    case "RETENTION": {
      const courseId =
        type === "UNIT_COMPLETION"
          ? (params as UnitCompletionParams).courseId
          : (params as RetentionGoalParams).courseId;
      const [unit, phases] = await Promise.all([
        prisma.unitLearningProgress.findUnique({
          where: { userId_courseId: { userId, courseId } },
          select: { status: true },
        }),
        prisma.phaseLearningProgress.findMany({
          where: { userId, courseId },
          select: { phaseKey: true, status: true, summary: true },
        }),
      ]);
      const phaseFacts: PhaseFact[] = phases.map((p) => ({
        phaseKey: p.phaseKey,
        status: p.status,
        summary:
          p.summary && typeof p.summary === "object" && !Array.isArray(p.summary)
            ? (p.summary as Record<string, unknown>)
            : null,
      }));
      return { unitStatus: unit?.status ?? "NOT_STARTED", phases: phaseFacts };
    }
    case "ACHIEVEMENT": {
      const achievementId = (params as AchievementGoalParams).achievementId;
      const owned = await prisma.userAchievement.findUnique({
        where: { userId_achievementId: { userId, achievementId } },
        select: { id: true },
      });
      return { achievementAcquired: Boolean(owned) };
    }
    case "CREATE_QUEST": {
      const p = params as CreateQuestGoalParams;
      // 作る課題にアルゴリズムのタグは存在しないため、課題と単元の関連
      // （CreateQuestCourse）で対象アルゴリズムに対応づける。
      const completed = await prisma.createQuestAttempt.count({
        where: {
          userId,
          status: "COMPLETED",
          quest: { relatedCourses: { some: { courseId: p.algorithmCourseId } } },
        },
      });
      return { createQuestCompletedCount: completed };
    }
    default:
      return {};
  }
}

export type BigGoalTransition = {
  goalId: string;
  evaluation: BigGoalEvaluation;
  /** この評価で達成／未達成で終了へ遷移したか */
  transitioned: boolean;
};

/** 1件の大目標を再評価し、結果を記録する。終了状態のものは対象外。 */
export async function evaluateBigGoalRow(goal: BigGoalRow): Promise<BigGoalTransition> {
  const params = asParams(goal.params);
  const facts = await loadBigGoalFacts(goal.userId, goal.type, params);
  const evaluation = evaluateBigGoal(
    goal.type as Parameters<typeof evaluateBigGoal>[0],
    params,
    facts
  );
  const now = new Date();
  const nextStatus =
    evaluation.outcome === "ACHIEVED"
      ? BigGoalStatus.ACHIEVED
      : evaluation.outcome === "UNMET_CLOSED"
        ? BigGoalStatus.CLOSED_UNMET
        : null;
  await prisma.bigGoal.update({
    where: { id: goal.id },
    data: {
      evaluation: json(evaluation),
      evaluatedAt: now,
      ...(nextStatus
        ? { status: nextStatus, closedAt: now }
        : {}),
    },
  });
  return { goalId: goal.id, evaluation, transitioned: nextStatus !== null };
}

/**
 * ユーザーの確定中の大目標をすべて再評価する。
 * 学習の保存処理（learning.service の完了保存）から、実績評価に続けて呼ぶ。
 */
export async function evaluateBigGoalsForUser(userId: string): Promise<BigGoalTransition[]> {
  const goals = await prisma.bigGoal.findMany({
    where: { userId, status: BigGoalStatus.ACTIVE },
    select: { id: true, userId: true, type: true, params: true, status: true },
  });
  const transitions: BigGoalTransition[] = [];
  for (const goal of goals) {
    transitions.push(await evaluateBigGoalRow(goal));
  }
  return transitions;
}

export async function getActiveBigGoal(userId: string) {
  return prisma.bigGoal.findFirst({
    where: { userId, status: BigGoalStatus.ACTIVE },
    orderBy: { createdAt: "desc" },
  });
}
