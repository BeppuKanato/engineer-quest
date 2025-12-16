/*
  Warnings:

  - Added the required column `judgeType` to the `MissionExamProgress` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "JudgeType" AS ENUM ('WITH_FEEDBACK', 'WITHOUT_FEEDBACK');

-- AlterTable
ALTER TABLE "MissionExamProgress" ADD COLUMN     "bad" TEXT[],
ADD COLUMN     "good" TEXT[],
ADD COLUMN     "judgeType" "JudgeType" NOT NULL,
ALTER COLUMN "feedback" DROP NOT NULL;
