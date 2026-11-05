-- New-flow learning foundation (Issue #108): unit/phase progress, the generic
-- learning-event log, and the phase-keyed knowledge-card schedule that replaces
-- the mission-keyed table dropped in 20261105190000_remove_legacy_flow.

-- CreateEnum
CREATE TYPE "LearningProgressStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

-- AlterEnum
ALTER TYPE "AchievementConditionType" ADD VALUE 'UNIT_COMPLETE';
ALTER TYPE "AchievementConditionType" ADD VALUE 'UNIT_COMPLETED_COUNT';
ALTER TYPE "AchievementConditionType" ADD VALUE 'PHASE_COMPLETED';
ALTER TYPE "AchievementConditionType" ADD VALUE 'PHASE_FIRST_ATTEMPT_PERFECT';
ALTER TYPE "AchievementConditionType" ADD VALUE 'PHASE_NO_HINT_COMPLETE';

-- AlterTable
ALTER TABLE "Achievement" ADD COLUMN "phaseKey" TEXT;

-- CreateTable
CREATE TABLE "UnitLearningProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "status" "LearningProgressStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "lastPhaseKey" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UnitLearningProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhaseLearningProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "phaseKey" TEXT NOT NULL,
    "status" "LearningProgressStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "summary" JSONB,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PhaseLearningProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "courseId" TEXT,
    "phaseKey" TEXT,
    "targetId" TEXT,
    "payload" JSONB,
    "clientTimestamp" TIMESTAMP(3) NOT NULL,
    "serverTimestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LearningEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeCardPhaseScheduleEntry" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "courseVersion" INTEGER NOT NULL,
    "tableNumber" INTEGER NOT NULL,
    "phaseKey" TEXT NOT NULL,
    "knowledgeCardId" TEXT NOT NULL,

    CONSTRAINT "KnowledgeCardPhaseScheduleEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UnitLearningProgress_userId_idx" ON "UnitLearningProgress"("userId");
CREATE UNIQUE INDEX "UnitLearningProgress_userId_courseId_key" ON "UnitLearningProgress"("userId", "courseId");
CREATE INDEX "PhaseLearningProgress_userId_courseId_idx" ON "PhaseLearningProgress"("userId", "courseId");
CREATE UNIQUE INDEX "PhaseLearningProgress_userId_courseId_phaseKey_key" ON "PhaseLearningProgress"("userId", "courseId", "phaseKey");
CREATE INDEX "LearningEvent_userId_sessionId_serverTimestamp_idx" ON "LearningEvent"("userId", "sessionId", "serverTimestamp");
CREATE INDEX "LearningEvent_userId_courseId_idx" ON "LearningEvent"("userId", "courseId");
CREATE INDEX "KnowledgeCardPhaseScheduleEntry_courseId_tableNumber_idx" ON "KnowledgeCardPhaseScheduleEntry"("courseId", "tableNumber");
CREATE UNIQUE INDEX "KnowledgeCardPhaseScheduleEntry_courseId_courseVersion_tableNumber_phaseKey_key" ON "KnowledgeCardPhaseScheduleEntry"("courseId", "courseVersion", "tableNumber", "phaseKey");

-- AddForeignKey
ALTER TABLE "UnitLearningProgress" ADD CONSTRAINT "UnitLearningProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UnitLearningProgress" ADD CONSTRAINT "UnitLearningProgress_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PhaseLearningProgress" ADD CONSTRAINT "PhaseLearningProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PhaseLearningProgress" ADD CONSTRAINT "PhaseLearningProgress_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LearningEvent" ADD CONSTRAINT "LearningEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "KnowledgeCardPhaseScheduleEntry" ADD CONSTRAINT "KnowledgeCardPhaseScheduleEntry_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "KnowledgeCardPhaseScheduleEntry" ADD CONSTRAINT "KnowledgeCardPhaseScheduleEntry_knowledgeCardId_fkey" FOREIGN KEY ("knowledgeCardId") REFERENCES "KnowledgeCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;
