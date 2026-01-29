/*
  Warnings:

  - You are about to drop the column `feedback` on the `MissionExamProgress` table. All the data in the column will be lost.
  - You are about to drop the column `judgeType` on the `MissionExamProgress` table. All the data in the column will be lost.
  - Added the required column `feedbacks` to the `MissionExamProgress` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "MissionExamProgress" DROP COLUMN "feedback",
DROP COLUMN "judgeType",
ADD COLUMN     "feedbacks" JSONB NOT NULL,
ADD COLUMN     "selectedFeedbackIndex" INTEGER,
ADD COLUMN     "selectedFeedbackType" "JudgeType";
