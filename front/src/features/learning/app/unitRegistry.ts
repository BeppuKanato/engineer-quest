import { bfsUnitIntro, bfsUnitPhases, bfsUnitTitle } from "../bfs/unit/unit.content";
import type { BfsUnitPhaseSummary } from "../bfs/unit/unit.types";
import { wallExtensionUnitIntro, wallExtensionUnitPhases, wallExtensionUnitTitle } from "../wall-extension/unit/unit.content";
import { bubbleSortUnitIntro, bubbleSortUnitPhases, bubbleSortUnitTitle } from "../bubble-sort/unit/unit.content";
import { mazeDiggingUnitIntro, mazeDiggingUnitPhases, mazeDiggingUnitTitle } from "../maze-digging/unit/unit.content";
import { binarySearchUnitIntro, binarySearchUnitPhases, binarySearchUnitTitle } from "../binary-search/unit/unit.content";
import type { LearningProgress } from "../../../api/learning.api";

export const learningUnits = [
  { courseId: "course-algorithm-breadth-first-search-v1", title: bfsUnitTitle, intro: bfsUnitIntro, kind: "bfs", phases: bfsUnitPhases },
  { courseId: "course-algorithm-wall-extension-v1", title: wallExtensionUnitTitle, intro: wallExtensionUnitIntro, kind: "wall-extension", phases: wallExtensionUnitPhases },
  { courseId: "course-algorithm-bubble-sort-v2", title: bubbleSortUnitTitle, intro: bubbleSortUnitIntro, kind: "bubble-sort", phases: bubbleSortUnitPhases },
  { courseId: "course-algorithm-maze-digging-v1", title: mazeDiggingUnitTitle, intro: mazeDiggingUnitIntro, kind: "maze-digging", phases: mazeDiggingUnitPhases },
  { courseId: "course-algorithm-binary-search-v1", title: binarySearchUnitTitle, intro: binarySearchUnitIntro, kind: "binary-search", phases: binarySearchUnitPhases },
] as const;
export const findLearningUnit = (courseId: string) => learningUnits.find(unit => unit.courseId === courseId);
export type LearningUnit = (typeof learningUnits)[number];
export function resumePhaseIndex(unit: LearningUnit, progress: LearningProgress): number | null {
  const index = unit.phases.findIndex(phase => !progress.phases.some(saved => saved.phaseKey === phase.id && saved.status === "COMPLETED"));
  return index < 0 ? null : index;
}
/** APIのJsonを、単元フローで表示する既知のサマリ項目だけへ絞る。 */
export function savedPhaseSummaries(unit: LearningUnit, progress: LearningProgress): Record<number, BfsUnitPhaseSummary> {
  return Object.fromEntries(unit.phases.flatMap((phase, index) => {
    const summary = progress.phases.find(saved => saved.phaseKey === phase.id && saved.status === "COMPLETED")?.summary;
    if (!summary || typeof summary !== "object" || Array.isArray(summary)) return [];
    const value = summary as Record<string, unknown>, result: BfsUnitPhaseSummary = {};
    for (const key of ["firstAttemptCorrect", "totalQuestions", "testRuns"] as const) {
      if (typeof value[key] === "number" && Number.isInteger(value[key]) && value[key] >= 0) result[key] = value[key];
    }
    if (Array.isArray(value.hintUsage) && value.hintUsage.every(count => Number.isInteger(count) && count >= 0)) result.hintUsage = value.hintUsage;
    return [[index, result]];
  }));
}
export const unitUrl = (courseId: string) => `/courses/roadmap/${encodeURIComponent(courseId)}`;
export const learnUrl = (courseId: string) => `${unitUrl(courseId)}/learn`;
