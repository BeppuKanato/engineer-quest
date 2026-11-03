import { feedbackV1 } from "./feedbackV1.service";
export const startCourseExamFeedbackByFirebaseUid = ({ firebaseUid, rewardRunId }: { firebaseUid: string; rewardRunId: string }) => feedbackV1(firebaseUid, "mission", rewardRunId, true);
export const getCourseExamFeedbackByFirebaseUid = ({ firebaseUid, rewardRunId }: { firebaseUid: string; rewardRunId: string }) => feedbackV1(firebaseUid, "mission", rewardRunId);
