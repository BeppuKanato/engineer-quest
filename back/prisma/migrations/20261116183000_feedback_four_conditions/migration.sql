-- Keep PERSONALIZED as a legacy value so existing rows are not silently reassigned.
ALTER TYPE "FeedbackCondition" ADD VALUE IF NOT EXISTS 'TOP_1';
ALTER TYPE "FeedbackCondition" ADD VALUE IF NOT EXISTS 'ROULETTE';
ALTER TYPE "FeedbackCondition" ADD VALUE IF NOT EXISTS 'MULTI';
ALTER TABLE "ExperimentAssignment" ADD COLUMN "top1Type" TEXT;
