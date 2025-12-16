/*
  Warnings:

  - A unique constraint covering the columns `[missionId]` on the table `MissionExam` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[requiredId]` on the table `Rank` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `progressId` to the `MissionExamProgress` table without a default value. This is not possible if the table is not empty.
  - Added the required column `attemptCount` to the `MissionProgress` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "MissionExamProgress" ADD COLUMN     "progressId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "MissionProgress" ADD COLUMN     "attemptCount" INTEGER NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE UNIQUE INDEX "MissionExam_missionId_key" ON "MissionExam"("missionId");

-- CreateIndex
CREATE UNIQUE INDEX "Rank_requiredId_key" ON "Rank"("requiredId");

-- AddForeignKey
ALTER TABLE "MissionExamProgress" ADD CONSTRAINT "MissionExamProgress_progressId_fkey" FOREIGN KEY ("progressId") REFERENCES "MissionProgress"("id") ON DELETE CASCADE ON UPDATE CASCADE;
