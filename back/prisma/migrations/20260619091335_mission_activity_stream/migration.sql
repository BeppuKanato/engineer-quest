/*
  Warnings:

  - You are about to drop the column `lessonActivityId` on the `ActivityAnswerLog` table. All the data in the column will be lost.
  - You are about to drop the `Lesson` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `LessonActivity` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MissionExam` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MissionExamSubmission` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MissionExamVariant` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserLessonProgress` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserMissionExamProgress` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `activityId` to the `ActivityAnswerLog` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MissionActivityType" AS ENUM ('TUTORIAL', 'VIEW', 'CHOICE', 'MATCH', 'ORDERED_STEPS', 'SELECT_FILL', 'TRY_CODE', 'MISSION_CHECK');

-- DropForeignKey
ALTER TABLE "ActivityAnswerLog" DROP CONSTRAINT "ActivityAnswerLog_lessonActivityId_fkey";

-- DropForeignKey
ALTER TABLE "Lesson" DROP CONSTRAINT "Lesson_missionId_fkey";

-- DropForeignKey
ALTER TABLE "LessonActivity" DROP CONSTRAINT "LessonActivity_lessonId_fkey";

-- DropForeignKey
ALTER TABLE "MissionExam" DROP CONSTRAINT "MissionExam_missionId_fkey";

-- DropForeignKey
ALTER TABLE "MissionExamSubmission" DROP CONSTRAINT "MissionExamSubmission_missionExamId_fkey";

-- DropForeignKey
ALTER TABLE "MissionExamSubmission" DROP CONSTRAINT "MissionExamSubmission_missionId_fkey";

-- DropForeignKey
ALTER TABLE "MissionExamSubmission" DROP CONSTRAINT "MissionExamSubmission_userId_fkey";

-- DropForeignKey
ALTER TABLE "MissionExamVariant" DROP CONSTRAINT "MissionExamVariant_missionExamId_fkey";

-- DropForeignKey
ALTER TABLE "UserLessonProgress" DROP CONSTRAINT "UserLessonProgress_lessonId_fkey";

-- DropForeignKey
ALTER TABLE "UserLessonProgress" DROP CONSTRAINT "UserLessonProgress_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserMissionExamProgress" DROP CONSTRAINT "UserMissionExamProgress_missionExamId_fkey";

-- DropForeignKey
ALTER TABLE "UserMissionExamProgress" DROP CONSTRAINT "UserMissionExamProgress_userId_fkey";

-- DropIndex
DROP INDEX "ActivityAnswerLog_lessonActivityId_idx";

-- AlterTable
ALTER TABLE "ActivityAnswerLog" DROP COLUMN "lessonActivityId",
ADD COLUMN     "activityId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Mission" ADD COLUMN     "learnedItems" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "rewardExp" INTEGER NOT NULL DEFAULT 100;

-- AlterTable
ALTER TABLE "UserMissionProgress" ADD COLUMN     "currentActivityId" TEXT;

-- DropTable
DROP TABLE "Lesson";

-- DropTable
DROP TABLE "LessonActivity";

-- DropTable
DROP TABLE "MissionExam";

-- DropTable
DROP TABLE "MissionExamSubmission";

-- DropTable
DROP TABLE "MissionExamVariant";

-- DropTable
DROP TABLE "UserLessonProgress";

-- DropTable
DROP TABLE "UserMissionExamProgress";

-- DropEnum
DROP TYPE "ExamDifficulty";

-- DropEnum
DROP TYPE "LessonStepType";

-- CreateTable
CREATE TABLE "MissionSection" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MissionSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MissionActivity" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "sectionId" TEXT,
    "type" "MissionActivityType" NOT NULL,
    "title" TEXT NOT NULL,
    "instruction" TEXT NOT NULL,
    "mentorMessage" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "preview" JSONB,
    "actionLabel" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "sectionOrder" INTEGER,
    "isMissionCheck" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MissionActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserMissionActivityProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "status" "ProgressStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserMissionActivityProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MissionSection_missionId_idx" ON "MissionSection"("missionId");

-- CreateIndex
CREATE UNIQUE INDEX "MissionSection_missionId_order_key" ON "MissionSection"("missionId", "order");

-- CreateIndex
CREATE INDEX "MissionActivity_missionId_idx" ON "MissionActivity"("missionId");

-- CreateIndex
CREATE INDEX "MissionActivity_sectionId_idx" ON "MissionActivity"("sectionId");

-- CreateIndex
CREATE INDEX "MissionActivity_missionId_isMissionCheck_idx" ON "MissionActivity"("missionId", "isMissionCheck");

-- CreateIndex
CREATE UNIQUE INDEX "MissionActivity_missionId_order_key" ON "MissionActivity"("missionId", "order");

-- CreateIndex
CREATE INDEX "UserMissionActivityProgress_userId_idx" ON "UserMissionActivityProgress"("userId");

-- CreateIndex
CREATE INDEX "UserMissionActivityProgress_activityId_idx" ON "UserMissionActivityProgress"("activityId");

-- CreateIndex
CREATE UNIQUE INDEX "UserMissionActivityProgress_userId_activityId_key" ON "UserMissionActivityProgress"("userId", "activityId");

-- CreateIndex
CREATE INDEX "ActivityAnswerLog_activityId_idx" ON "ActivityAnswerLog"("activityId");

-- CreateIndex
CREATE INDEX "UserMissionProgress_userId_idx" ON "UserMissionProgress"("userId");

-- CreateIndex
CREATE INDEX "UserMissionProgress_missionId_idx" ON "UserMissionProgress"("missionId");

-- AddForeignKey
ALTER TABLE "MissionSection" ADD CONSTRAINT "MissionSection_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionActivity" ADD CONSTRAINT "MissionActivity_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionActivity" ADD CONSTRAINT "MissionActivity_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "MissionSection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMissionActivityProgress" ADD CONSTRAINT "UserMissionActivityProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMissionActivityProgress" ADD CONSTRAINT "UserMissionActivityProgress_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "MissionActivity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityAnswerLog" ADD CONSTRAINT "ActivityAnswerLog_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "MissionActivity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
