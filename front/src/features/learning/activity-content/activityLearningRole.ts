/** ActivityContentのlearningRoleを画面表示用ラベルへ変換する。 */
import type { ActivityLearningRole } from "./activityRendererRegistry";

import type { MissionActivity } from "@/features/learning/mission-activity-play/missionActivityPlay.types";

export const getActivityLearningRole = (
  activity: MissionActivity,
): ActivityLearningRole => activity.content.learningRole;

export const learningRoleLabel: Record<ActivityLearningRole, string> = {
  ORIENTATION: "コース案内",
  EXPLANATION: "学習",
  GUIDED_PRACTICE: "練習",
  INDEPENDENT_PRACTICE: "確認",
  CODE_MAPPING: "コード",
  SYNTHESIS: "総合",
  MISSION_CHECK: "確認",
  COURSE_EXAM: "コース課題",
};

export const isCodeLearningRole = (role: ActivityLearningRole) =>
  role === "CODE_MAPPING" || role === "SYNTHESIS" || role === "COURSE_EXAM";
