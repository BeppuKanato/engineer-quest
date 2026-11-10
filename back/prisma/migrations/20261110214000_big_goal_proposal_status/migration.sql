-- BigGoalProposal.status was declared with the CourseExamFeedbackStatus enum
-- by mistake. That enum has no GENERATED value, which the proposal lifecycle
-- (GENERATING -> GENERATED / FAILED) requires. Give proposals their own enum.
CREATE TYPE "BigGoalProposalStatus" AS ENUM ('GENERATING', 'GENERATED', 'FAILED');

ALTER TABLE "BigGoalProposal" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "BigGoalProposal" ALTER COLUMN "status" TYPE "BigGoalProposalStatus" USING ("status"::text::"BigGoalProposalStatus");
ALTER TABLE "BigGoalProposal" ALTER COLUMN "status" SET DEFAULT 'GENERATING';
