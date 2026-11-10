-- Big goal model (Issue #365): goal instances, proposal logs, and scoring call
-- logs. Attainment is judged from the structured params, never display text.

-- CreateEnum
CREATE TYPE "BigGoalType" AS ENUM ('UNIT_COMPLETION', 'ACHIEVEMENT', 'CREATE_QUEST', 'INTEGRATION', 'SHARING', 'RETENTION');

-- CreateEnum
CREATE TYPE "BigGoalStatus" AS ENUM ('PROPOSED', 'ACTIVE', 'ACHIEVED', 'CLOSED_UNMET', 'REVISED');

-- CreateEnum
CREATE TYPE "BigGoalProposalTiming" AS ENUM ('UNIT_START', 'ON_ACHIEVEMENT');

-- CreateTable
CREATE TABLE "BigGoalProposal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventKey" TEXT NOT NULL,
    "timing" "BigGoalProposalTiming" NOT NULL,
    "startCourseId" TEXT,
    "condition" "FeedbackCondition",
    "status" "CourseExamFeedbackStatus" NOT NULL DEFAULT 'GENERATING',
    "input" JSONB NOT NULL,
    "result" JSONB,
    "failureCode" TEXT,
    "selectedCandidateKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generatedAt" TIMESTAMP(3),

    CONSTRAINT "BigGoalProposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BigGoalProposalCall" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BigGoalProposalCall_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BigGoal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "proposalId" TEXT,
    "candidateKey" TEXT NOT NULL,
    "type" "BigGoalType" NOT NULL,
    "params" JSONB NOT NULL,
    "displayText" TEXT NOT NULL,
    "status" "BigGoalStatus" NOT NULL DEFAULT 'PROPOSED',
    "confirmedAt" TIMESTAMP(3),
    "evaluation" JSONB,
    "evaluatedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "supersedesId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BigGoal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BigGoalProposal_eventKey_key" ON "BigGoalProposal"("eventKey");
CREATE INDEX "BigGoalProposal_userId_createdAt_idx" ON "BigGoalProposal"("userId", "createdAt");
CREATE INDEX "BigGoalProposalCall_proposalId_createdAt_idx" ON "BigGoalProposalCall"("proposalId", "createdAt");
CREATE INDEX "BigGoal_userId_status_idx" ON "BigGoal"("userId", "status");
CREATE INDEX "BigGoal_userId_createdAt_idx" ON "BigGoal"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "BigGoalProposal" ADD CONSTRAINT "BigGoalProposal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BigGoalProposalCall" ADD CONSTRAINT "BigGoalProposalCall_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "BigGoalProposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BigGoal" ADD CONSTRAINT "BigGoal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BigGoal" ADD CONSTRAINT "BigGoal_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "BigGoalProposal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
