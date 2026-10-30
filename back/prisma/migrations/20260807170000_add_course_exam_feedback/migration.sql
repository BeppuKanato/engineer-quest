-- CreateEnum
CREATE TYPE "CourseExamFeedbackStatus" AS ENUM ('GENERATING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "CourseExamFeedbackActionType" AS ENUM ('RETRY_COURSE_EXAM', 'SOLVE_PRACTICE_PROBLEM', 'CREATE_LEARNING_MEMO', 'CREATE_QUESTION_POST', 'CREATE_ERROR_HELP_POST', 'CREATE_WORK_POST', 'VIEW_BOARD_POSTS', 'ANSWER_BOARD_POST', 'REVIEW_KNOWLEDGE_CARDS', 'VIEW_ACHIEVEMENTS', 'SET_TARGET_ACHIEVEMENT', 'USE_BADGE_TICKET', 'VIEW_BADGE_COLLECTION', 'SET_PROFILE_BADGE', 'VIEW_PROFILE', 'NO_APP_ACTION');

-- CreateTable
CREATE TABLE "CourseExamFeedback" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "status" "CourseExamFeedbackStatus" NOT NULL,
    "condition" "FeedbackCondition" NOT NULL,
    "currentState" TEXT,
    "nextGoal" TEXT,
    "nextStep" TEXT,
    "actionType" "CourseExamFeedbackActionType",
    "actionLabel" TEXT,
    "learningAnalysis" JSONB,
    "selectionAnalysis" JSONB,
    "inputSnapshot" JSONB NOT NULL,
    "model" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "openAiResponseId" TEXT,
    "usage" JSONB,
    "failureCode" TEXT,
    "generatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseExamFeedback_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CourseExamFeedback_attemptId_key" ON "CourseExamFeedback"("attemptId");
CREATE INDEX "CourseExamFeedback_status_idx" ON "CourseExamFeedback"("status");
CREATE INDEX "CourseExamFeedback_condition_idx" ON "CourseExamFeedback"("condition");
CREATE INDEX "CourseExamFeedback_createdAt_idx" ON "CourseExamFeedback"("createdAt");

ALTER TABLE "CourseExamFeedback" ADD CONSTRAINT "CourseExamFeedback_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "CourseExamAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
