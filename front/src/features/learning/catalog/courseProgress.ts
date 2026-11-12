import { getLearningProgress } from "@/api/learning.api";
import { findLearningUnit } from "@/features/learning/app/unitRegistry";

import type { Course } from "@/types/course";

/**
 * コース一覧へ新フローの学習進捗（状態と進捗率）を重ねる。
 * 新フロー対象外のコースと、進捗の取得に失敗したコースは元の表示のまま返す。
 * コース一覧ページとホーム画面の単元グリッドで共有する。
 */
export async function withLearningProgress(token: string, courses: Course[]): Promise<Course[]> {
  const progress = await Promise.allSettled(courses.map(async (course) => {
    const unit = findLearningUnit(course.id);
    if (!unit) return course;
    const saved = await getLearningProgress(token, course.id);
    const completed = saved.phases.filter((phase) => phase.status === "COMPLETED" && unit.phases.some((item) => item.id === phase.phaseKey)).length;
    return {
      ...course,
      status: saved.unit?.status === "COMPLETED" ? "completed" as const : saved.unit ? "in_progress" as const : "not_started" as const,
      progressRate: (completed / unit.phases.length) * 100,
    };
  }));
  return courses.map((course, index) => (progress[index].status === "fulfilled" ? progress[index].value : course));
}
