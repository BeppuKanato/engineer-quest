/**
 * 候補生成に使う学習者状態の読み込み（Issue #366）。
 * 並び順は実画面の表示順に揃える：単元は公開コースの作成順（単元マップの
 * 表示順）、実績は定義順（sortOrder、createdAt）。
 */
import { BigGoalStatus } from "@prisma/client";

import { prisma } from "../lib/prisma";
import { summarizeUnit, type PhaseFact } from "./bigGoal.evaluate";
import type {
  LearnerAchievementState,
  LearnerGoalState,
  LearnerUnitState,
} from "./bigGoal.candidates";
import type {
  AchievementGoalParams,
  CreateQuestGoalParams,
  IntegrationGoalParams,
  RetentionGoalParams,
  SharingGoalParams,
  UnitCompletionParams,
} from "./bigGoal.types";

const toPhaseFacts = (
  rows: { phaseKey: string; status: string; summary: unknown }[]
): PhaseFact[] =>
  rows.map((p) => ({
    phaseKey: p.phaseKey,
    status: p.status,
    summary:
      p.summary && typeof p.summary === "object" && !Array.isArray(p.summary)
        ? (p.summary as Record<string, unknown>)
        : null,
  }));

export async function loadLearnerGoalState(userId: string): Promise<LearnerGoalState> {
  const [courses, unitRows, phaseRows, achievementDefs, ownedRows, activeGoal, quests, completedAttempts] =
    await Promise.all([
      prisma.course.findMany({
        where: { isPublished: true },
        orderBy: { createdAt: "asc" },
        select: { id: true, title: true },
      }),
      prisma.unitLearningProgress.findMany({
        where: { userId },
        select: { courseId: true, status: true, completedAt: true },
      }),
      prisma.phaseLearningProgress.findMany({
        where: { userId },
        select: { courseId: true, phaseKey: true, status: true, summary: true },
      }),
      prisma.achievement.findMany({
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: { id: true, title: true, courseId: true },
      }),
      prisma.userAchievement.findMany({
        where: { userId },
        select: { achievementId: true },
      }),
      prisma.bigGoal.findFirst({
        where: { userId, status: BigGoalStatus.ACTIVE },
        orderBy: { createdAt: "desc" },
        select: { type: true, params: true },
      }),
      prisma.createQuest.findMany({
        select: {
          id: true,
          relatedCourses: { select: { courseId: true } },
        },
      }),
      prisma.createQuestAttempt.findMany({
        where: { userId, status: "COMPLETED" },
        select: { questId: true },
      }),
    ]);

  const unitStatusByCourse = new Map(unitRows.map((u) => [u.courseId, u.status]));
  const completedCountByCourse = new Map<string, number>();
  for (const phase of phaseRows) {
    if (phase.status === "COMPLETED") {
      completedCountByCourse.set(
        phase.courseId,
        (completedCountByCourse.get(phase.courseId) ?? 0) + 1
      );
    }
  }
  const units: LearnerUnitState[] = courses.map((course) => ({
    courseId: course.id,
    title: course.title,
    status: unitStatusByCourse.get(course.id) ?? "NOT_STARTED",
    completedPhaseCount: completedCountByCourse.get(course.id) ?? 0,
  }));

  const owned = new Set(ownedRows.map((o) => o.achievementId));
  const achievements: LearnerAchievementState[] = achievementDefs.map((def) => ({
    achievementId: def.id,
    title: def.title,
    courseId: def.courseId,
    achieved: owned.has(def.id),
  }));

  // 直近に完了した単元の挑戦余裕の材料。
  const completedUnits = unitRows
    .filter((u) => u.status === "COMPLETED" && u.completedAt)
    .sort((a, b) => (b.completedAt?.getTime() ?? 0) - (a.completedAt?.getTime() ?? 0));
  let latestCompletedUnit: LearnerGoalState["latestCompletedUnit"] = null;
  if (completedUnits[0]) {
    const summary = summarizeUnit(
      toPhaseFacts(phaseRows.filter((p) => p.courseId === completedUnits[0].courseId))
    );
    latestCompletedUnit = {
      courseId: completedUnits[0].courseId,
      firstAttemptRate: summary.firstAttempt.rate,
      phase7NoHint: summary.phase7.noHint === true,
    };
  }

  // 確定中の大目標が対象に含む単元。
  const coveredCourseIds: string[] = [];
  if (activeGoal) {
    const params = (activeGoal.params ?? {}) as Record<string, unknown>;
    if (activeGoal.type === "UNIT_COMPLETION") {
      coveredCourseIds.push((params as UnitCompletionParams).courseId);
    } else if (activeGoal.type === "ACHIEVEMENT") {
      const def = achievementDefs.find(
        (d) => d.id === (params as AchievementGoalParams).achievementId
      );
      if (def?.courseId) coveredCourseIds.push(def.courseId);
    } else if (activeGoal.type === "CREATE_QUEST") {
      coveredCourseIds.push((params as CreateQuestGoalParams).algorithmCourseId);
    } else if (activeGoal.type === "INTEGRATION") {
      coveredCourseIds.push(...((params as IntegrationGoalParams).courseIds ?? []));
    } else if (activeGoal.type === "RETENTION") {
      coveredCourseIds.push((params as RetentionGoalParams).courseId);
    } else if (activeGoal.type === "SHARING") {
      const quest = quests.find(
        (q) => q.id === (params as SharingGoalParams).artifactQuestId
      );
      if (quest) coveredCourseIds.push(...quest.relatedCourses.map((r) => r.courseId));
    }
  }

  const completedQuestIds = new Set(completedAttempts.map((a) => a.questId));
  const openCreateQuestCountByCourse: Record<string, number> = {};
  for (const quest of quests) {
    if (completedQuestIds.has(quest.id)) continue;
    for (const related of quest.relatedCourses) {
      openCreateQuestCountByCourse[related.courseId] =
        (openCreateQuestCountByCourse[related.courseId] ?? 0) + 1;
    }
  }

  return {
    units,
    achievements,
    latestCompletedUnit,
    coveredCourseIds,
    openCreateQuestCountByCourse,
  };
}

/** 採点入力に載せる学習状態の要約（候補生成と同じスナップショットの抜粋）。 */
export function summarizeLearnerStateForScoring(state: LearnerGoalState) {
  return {
    units: state.units,
    achievements: {
      total: state.achievements.length,
      achieved: state.achievements.filter((a) => a.achieved).length,
      unachievedTitles: state.achievements.filter((a) => !a.achieved).map((a) => a.title),
    },
    latestCompletedUnit: state.latestCompletedUnit,
    openCreateQuestCountByCourse: state.openCreateQuestCountByCourse,
  };
}
