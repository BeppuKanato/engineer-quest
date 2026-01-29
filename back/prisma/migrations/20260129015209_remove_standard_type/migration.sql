/*
  Warnings:

  - The values [STANDARD] on the enum `JudgeType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "JudgeType_new" AS ENUM ('PHILANTHROPIST', 'ACHIEVER', 'FREE_SPIRIT', 'SOCIALIZER', 'PLAYER', 'DISRUPTOR');
ALTER TABLE "MissionExamProgress" ALTER COLUMN "selectedFeedbackType" TYPE "JudgeType_new" USING ("selectedFeedbackType"::text::"JudgeType_new");
ALTER TYPE "JudgeType" RENAME TO "JudgeType_old";
ALTER TYPE "JudgeType_new" RENAME TO "JudgeType";
DROP TYPE "JudgeType_old";
COMMIT;
