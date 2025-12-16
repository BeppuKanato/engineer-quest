/*
  Warnings:

  - You are about to drop the column `number` on the `Explain` table. All the data in the column will be lost.
  - You are about to drop the column `number` on the `Step` table. All the data in the column will be lost.
  - You are about to drop the `CompletedMission` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CompletedStep` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `order` to the `Explain` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Mission` table without a default value. This is not possible if the table is not empty.
  - Added the required column `order` to the `Step` table without a default value. This is not possible if the table is not empty.
  - Added the required column `experience` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `level` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MissionStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELED');

-- CreateEnum
CREATE TYPE "MissionType" AS ENUM ('MAIN', 'SUB');

-- DropForeignKey
ALTER TABLE "CompletedMission" DROP CONSTRAINT "CompletedMission_missionId_fkey";

-- DropForeignKey
ALTER TABLE "CompletedMission" DROP CONSTRAINT "CompletedMission_userId_fkey";

-- DropForeignKey
ALTER TABLE "CompletedStep" DROP CONSTRAINT "CompletedStep_stepId_fkey";

-- DropForeignKey
ALTER TABLE "CompletedStep" DROP CONSTRAINT "CompletedStep_userId_fkey";

-- AlterTable
ALTER TABLE "Explain" DROP COLUMN "number",
ADD COLUMN     "order" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Mission" ADD COLUMN     "type" "MissionType" NOT NULL;

-- AlterTable
ALTER TABLE "Step" DROP COLUMN "number",
ADD COLUMN     "order" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "experience" INTEGER NOT NULL,
ADD COLUMN     "level" INTEGER NOT NULL;

-- DropTable
DROP TABLE "CompletedMission";

-- DropTable
DROP TABLE "CompletedStep";

-- CreateTable
CREATE TABLE "MissionUnlockByRank" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "rankId" TEXT NOT NULL,

    CONSTRAINT "MissionUnlockByRank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MissionUnlockByLevel" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "level" INTEGER NOT NULL,

    CONSTRAINT "MissionUnlockByLevel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MissionUnlockByMission" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "requiredId" TEXT NOT NULL,

    CONSTRAINT "MissionUnlockByMission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MissionUnlockByAchievement" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "requiredId" TEXT NOT NULL,

    CONSTRAINT "MissionUnlockByAchievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rank" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "requiredId" TEXT NOT NULL,

    CONSTRAINT "Rank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MissionBeforeSentence" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "speakerId" TEXT NOT NULL,
    "sentence" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "MissionBeforeSentence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MissionAfterSentence" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "speakerId" TEXT NOT NULL,
    "sentence" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "MissionAfterSentence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MissionProgress" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "MissionStatus" NOT NULL,
    "currentStep" INTEGER NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "MissionProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Achievement" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "type" TEXT NOT NULL,

    CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AchievementCondition" (
    "id" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "stringCondition" TEXT NOT NULL,
    "intCondition" INTEGER NOT NULL,
    "type" TEXT NOT NULL,

    CONSTRAINT "AchievementCondition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAchievement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserAchievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LevelupRequirement" (
    "level" INTEGER NOT NULL,
    "requiredExperience" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "LevelupRequirement_level_key" ON "LevelupRequirement"("level");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_level_fkey" FOREIGN KEY ("level") REFERENCES "LevelupRequirement"("level") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionUnlockByRank" ADD CONSTRAINT "MissionUnlockByRank_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionUnlockByRank" ADD CONSTRAINT "MissionUnlockByRank_rankId_fkey" FOREIGN KEY ("rankId") REFERENCES "Rank"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionUnlockByLevel" ADD CONSTRAINT "MissionUnlockByLevel_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionUnlockByMission" ADD CONSTRAINT "MissionUnlockByMission_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionUnlockByMission" ADD CONSTRAINT "MissionUnlockByMission_requiredId_fkey" FOREIGN KEY ("requiredId") REFERENCES "Mission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionUnlockByAchievement" ADD CONSTRAINT "MissionUnlockByAchievement_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionUnlockByAchievement" ADD CONSTRAINT "MissionUnlockByAchievement_requiredId_fkey" FOREIGN KEY ("requiredId") REFERENCES "Achievement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rank" ADD CONSTRAINT "Rank_requiredId_fkey" FOREIGN KEY ("requiredId") REFERENCES "Mission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionBeforeSentence" ADD CONSTRAINT "MissionBeforeSentence_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionBeforeSentence" ADD CONSTRAINT "MissionBeforeSentence_speakerId_fkey" FOREIGN KEY ("speakerId") REFERENCES "Character"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionAfterSentence" ADD CONSTRAINT "MissionAfterSentence_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionAfterSentence" ADD CONSTRAINT "MissionAfterSentence_speakerId_fkey" FOREIGN KEY ("speakerId") REFERENCES "Character"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionProgress" ADD CONSTRAINT "MissionProgress_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionProgress" ADD CONSTRAINT "MissionProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AchievementCondition" ADD CONSTRAINT "AchievementCondition_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "Achievement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "Achievement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
