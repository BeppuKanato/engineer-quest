/** ActivityContentのlearningRoleを画面表示用ラベルへ変換する。 */
import type { ActivityLearningRole } from "./activityRendererRegistry";

import type { MissionActivity } from "@/features/learning/mission-activity-play/missionActivityPlay.types";

export const getActivityLearningRole = (
  activity: MissionActivity,
): ActivityLearningRole => activity.content.learningRole;

export const learningRoleLabel: Record<ActivityLearningRole, string> = {
  ORIENTATION: "導入",
  EXPLANATION: "説明",
  GUIDED_PRACTICE: "練習",
  INDEPENDENT_PRACTICE: "練習",
  CODE_MAPPING: "コードとの対応",
  SYNTHESIS: "まとめ",
  MISSION_CHECK: "練習",
  COURSE_EXAM: "Course Mission",
};

export const isCodeLearningRole = (role: ActivityLearningRole) =>
  role === "CODE_MAPPING" || role === "SYNTHESIS" || role === "COURSE_EXAM";
