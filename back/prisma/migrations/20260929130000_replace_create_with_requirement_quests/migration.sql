-- Replace only the retired Create feature. No course, mission, user, or board data is removed.
DROP TABLE IF EXISTS "UserCreateWorkChallengeCheck";
DROP TABLE IF EXISTS "UserCreateWorkRequirementCheck";
DROP TABLE IF EXISTS "UserCreateWork";
DROP TABLE IF EXISTS "CreateThemeChallenge";
DROP TABLE IF EXISTS "CreateThemeRequirement";
DROP TABLE IF EXISTS "CreateTheme";
DROP TABLE IF EXISTS "UserWorkReview";
DROP TABLE IF EXISTS "UserWork";
DROP TABLE IF EXISTS "CreateMission";

DROP TYPE IF EXISTS "CreateThemeCategory";
DROP TYPE IF EXISTS "CreateWorkStatus";
DROP TYPE IF EXISTS "CreateWorkVisibility";

CREATE TYPE "CreateQuestRequirementKind" AS ENUM ('BASIC', 'OPTIONAL');
CREATE TYPE "CreateQuestRequirementCategory" AS ENUM ('FUNCTIONAL', 'QUALITY', 'PERFORMANCE', 'IMPLEMENTATION');
CREATE TYPE "CreateQuestAttemptStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED');

ALTER TYPE "CourseExamFeedbackActionType" ADD VALUE IF NOT EXISTS 'RETRY_CREATE_QUEST';
ALTER TYPE "CourseExamFeedbackActionType" ADD VALUE IF NOT EXISTS 'OPEN_RELATED_COURSE';
ALTER TYPE "CourseExamFeedbackActionType" ADD VALUE IF NOT EXISTS 'SHARE_CREATE_QUEST';

CREATE TABLE "CreateQuest" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "scenario" TEXT NOT NULL,
    "problemType" TEXT NOT NULL,
    "functionName" TEXT NOT NULL,
    "starterCode" TEXT NOT NULL,
    "estimatedMinutes" INTEGER NOT NULL DEFAULT 45,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "thumbnailUrl" TEXT,
    "previewData" JSONB NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreateQuest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CreateQuestRequirement" (
    "id" TEXT NOT NULL,
    "questId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "kind" "CreateQuestRequirementKind" NOT NULL,
    "category" "CreateQuestRequirementCategory" NOT NULL,
    "points" INTEGER NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "tests" JSONB NOT NULL,
    "hints" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreateQuestRequirement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CreateQuestCourse" (
    "questId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CreateQuestCourse_pkey" PRIMARY KEY ("questId", "courseId")
);

CREATE TABLE "CreateQuestAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "selectedRequirementIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "CreateQuestAttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "bestScore" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreateQuestAttempt_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CreateQuestTestExecution" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "basicPassed" BOOLEAN NOT NULL,
    "results" JSONB NOT NULL,
    "runtimeError" TEXT,
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreateQuestTestExecution_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CreateQuestSubmission" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "maxScore" INTEGER NOT NULL,
    "basicPassed" BOOLEAN NOT NULL,
    "results" JSONB NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreateQuestSubmission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CreateQuestHintView" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "requirementId" TEXT NOT NULL,
    "hintId" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreateQuestHintView_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CreateQuestFeedback" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
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

    CONSTRAINT "CreateQuestFeedback_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CreateQuest_sortOrder_idx" ON "CreateQuest"("sortOrder");
CREATE INDEX "CreateQuest_problemType_idx" ON "CreateQuest"("problemType");
CREATE INDEX "CreateQuestRequirement_questId_order_idx" ON "CreateQuestRequirement"("questId", "order");
CREATE INDEX "CreateQuestRequirement_kind_idx" ON "CreateQuestRequirement"("kind");
CREATE INDEX "CreateQuestCourse_courseId_idx" ON "CreateQuestCourse"("courseId");
CREATE UNIQUE INDEX "CreateQuestAttempt_userId_questId_key" ON "CreateQuestAttempt"("userId", "questId");
CREATE INDEX "CreateQuestAttempt_userId_updatedAt_idx" ON "CreateQuestAttempt"("userId", "updatedAt");
CREATE INDEX "CreateQuestAttempt_questId_idx" ON "CreateQuestAttempt"("questId");
CREATE INDEX "CreateQuestTestExecution_attemptId_executedAt_idx" ON "CreateQuestTestExecution"("attemptId", "executedAt");
CREATE INDEX "CreateQuestSubmission_attemptId_submittedAt_idx" ON "CreateQuestSubmission"("attemptId", "submittedAt");
CREATE UNIQUE INDEX "CreateQuestHintView_attemptId_requirementId_hintId_key" ON "CreateQuestHintView"("attemptId", "requirementId", "hintId");
CREATE INDEX "CreateQuestHintView_attemptId_viewedAt_idx" ON "CreateQuestHintView"("attemptId", "viewedAt");
CREATE UNIQUE INDEX "CreateQuestFeedback_submissionId_key" ON "CreateQuestFeedback"("submissionId");
CREATE INDEX "CreateQuestFeedback_status_idx" ON "CreateQuestFeedback"("status");
CREATE INDEX "CreateQuestFeedback_condition_idx" ON "CreateQuestFeedback"("condition");

ALTER TABLE "CreateQuestRequirement" ADD CONSTRAINT "CreateQuestRequirement_questId_fkey" FOREIGN KEY ("questId") REFERENCES "CreateQuest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CreateQuestCourse" ADD CONSTRAINT "CreateQuestCourse_questId_fkey" FOREIGN KEY ("questId") REFERENCES "CreateQuest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CreateQuestCourse" ADD CONSTRAINT "CreateQuestCourse_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CreateQuestAttempt" ADD CONSTRAINT "CreateQuestAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CreateQuestAttempt" ADD CONSTRAINT "CreateQuestAttempt_questId_fkey" FOREIGN KEY ("questId") REFERENCES "CreateQuest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CreateQuestTestExecution" ADD CONSTRAINT "CreateQuestTestExecution_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "CreateQuestAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CreateQuestSubmission" ADD CONSTRAINT "CreateQuestSubmission_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "CreateQuestAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CreateQuestHintView" ADD CONSTRAINT "CreateQuestHintView_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "CreateQuestAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CreateQuestHintView" ADD CONSTRAINT "CreateQuestHintView_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "CreateQuestRequirement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CreateQuestFeedback" ADD CONSTRAINT "CreateQuestFeedback_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "CreateQuestSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
