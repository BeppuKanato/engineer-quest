/*
  Warnings:

  - You are about to drop the column `answerCode` on the `MissionExam` table. All the data in the column will be lost.
  - You are about to drop the column `difficulty` on the `MissionExam` table. All the data in the column will be lost.
  - You are about to drop the column `initialCode` on the `MissionExam` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,missionExamId,difficulty]` on the table `UserMissionExamProgress` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `difficulty` to the `MissionExamSubmission` table without a default value. This is not possible if the table is not empty.
  - Added the required column `difficulty` to the `UserMissionExamProgress` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "UserMissionExamProgress_userId_missionExamId_key";

-- AlterTable
ALTER TABLE "MissionExam" DROP COLUMN "answerCode",
DROP COLUMN "difficulty",
DROP COLUMN "initialCode";

-- AlterTable
ALTER TABLE "MissionExamSubmission" ADD COLUMN     "difficulty" "ExamDifficulty" NOT NULL;

-- AlterTable
ALTER TABLE "UserMissionExamProgress" ADD COLUMN     "difficulty" "ExamDifficulty" NOT NULL,
ADD COLUMN     "startedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "MissionExamVariant" (
    "id" TEXT NOT NULL,
    "missionExamId" TEXT NOT NULL,
    "difficulty" "ExamDifficulty" NOT NULL,
    "initialCode" TEXT NOT NULL,
    "answerCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MissionExamVariant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MissionExamVariant_missionExamId_difficulty_key" ON "MissionExamVariant"("missionExamId", "difficulty");

-- CreateIndex
CREATE INDEX "MissionExamSubmission_difficulty_idx" ON "MissionExamSubmission"("difficulty");

-- CreateIndex
CREATE UNIQUE INDEX "UserMissionExamProgress_userId_missionExamId_difficulty_key" ON "UserMissionExamProgress"("userId", "missionExamId", "difficulty");

-- AddForeignKey
ALTER TABLE "MissionExamVariant" ADD CONSTRAINT "MissionExamVariant_missionExamId_fkey" FOREIGN KEY ("missionExamId") REFERENCES "MissionExam"("id") ON DELETE CASCADE ON UPDATE CASCADE;
