/*
  Warnings:

  - Added the required column `feedback` to the `MissionExamProgress` table without a default value. This is not possible if the table is not empty.
  - Added the required column `isPassed` to the `MissionExamProgress` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "MissionExamProgress" ADD COLUMN     "feedback" TEXT NOT NULL,
ADD COLUMN     "isPassed" BOOLEAN NOT NULL;
