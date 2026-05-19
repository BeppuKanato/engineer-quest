/*
  Warnings:

  - You are about to drop the column `clientId` on the `Mission` table. All the data in the column will be lost.
  - You are about to drop the column `component` on the `Mission` table. All the data in the column will be lost.
  - You are about to drop the column `detail` on the `Mission` table. All the data in the column will be lost.
  - You are about to drop the column `difficultyId` on the `Mission` table. All the data in the column will be lost.
  - You are about to drop the column `experience` on the `Mission` table. All the data in the column will be lost.
  - You are about to drop the column `slug` on the `Mission` table. All the data in the column will be lost.
  - You are about to drop the column `star` on the `Mission` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Mission` table. All the data in the column will be lost.
  - You are about to drop the column `component` on the `MissionExam` table. All the data in the column will be lost.
  - You are about to drop the column `criteria` on the `MissionExam` table. All the data in the column will be lost.
  - You are about to drop the column `exampleCode` on the `MissionExam` table. All the data in the column will be lost.
  - You are about to drop the column `instructions` on the `MissionExam` table. All the data in the column will be lost.
  - You are about to drop the column `language` on the `MissionExam` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `MissionExam` table. All the data in the column will be lost.
  - You are about to drop the column `experience` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `level` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `rankId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Achievement` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AchievementCondition` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Character` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Difficulty` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ExperienceLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Explain` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MissionAfterSentence` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MissionBeforeSentence` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MissionExamProgress` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MissionExamUserCode` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MissionProgress` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MissionUnlockByAchievement` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MissionUnlockByLevel` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MissionUnlockByMission` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MissionUnlockByRank` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Rank` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SharedMissionExamProgress` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Step` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `StepExam` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UsageTime` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserAchievement` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[courseId,order]` on the table `Mission` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[firebaseUid]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `courseId` to the `Mission` table without a default value. This is not possible if the table is not empty.
  - Added the required column `description` to the `Mission` table without a default value. This is not possible if the table is not empty.
  - Added the required column `difficulty` to the `Mission` table without a default value. This is not possible if the table is not empty.
  - Added the required column `goalImg` to the `Mission` table without a default value. This is not possible if the table is not empty.
  - Added the required column `order` to the `Mission` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Mission` table without a default value. This is not possible if the table is not empty.
  - Added the required column `answerCode` to the `MissionExam` table without a default value. This is not possible if the table is not empty.
  - Added the required column `description` to the `MissionExam` table without a default value. This is not possible if the table is not empty.
  - Added the required column `difficulty` to the `MissionExam` table without a default value. This is not possible if the table is not empty.
  - Added the required column `estimatedTime` to the `MissionExam` table without a default value. This is not possible if the table is not empty.
  - Added the required column `initialCode` to the `MissionExam` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rewardExp` to the `MissionExam` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `MissionExam` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `MissionExam` table without a default value. This is not possible if the table is not empty.
  - Added the required column `firebaseUid` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CourseDifficulty" AS ENUM ('EASY', 'NORMAL', 'HARD');

-- CreateEnum
CREATE TYPE "ExamDifficulty" AS ENUM ('EASY', 'NORMAL', 'HARD');

-- CreateEnum
CREATE TYPE "CourseCategoryType" AS ENUM ('GAME', 'ALGORITHM', 'TOOL', 'UI', 'DATA');

-- CreateEnum
CREATE TYPE "LessonStepType" AS ENUM ('TRY_CODE', 'TUTORIAL', 'VIEW', 'CHOICE', 'SELECT_FILL');

-- CreateEnum
CREATE TYPE "ProgressStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED');

-- DropForeignKey
ALTER TABLE "AchievementCondition" DROP CONSTRAINT "AchievementCondition_achievementId_fkey";

-- DropForeignKey
ALTER TABLE "ExperienceLog" DROP CONSTRAINT "ExperienceLog_missionProgressId_fkey";

-- DropForeignKey
ALTER TABLE "ExperienceLog" DROP CONSTRAINT "ExperienceLog_userId_fkey";

-- DropForeignKey
ALTER TABLE "Explain" DROP CONSTRAINT "Explain_stepId_fkey";

-- DropForeignKey
ALTER TABLE "Explain" DROP CONSTRAINT "Explain_supporterId_fkey";

-- DropForeignKey
ALTER TABLE "Mission" DROP CONSTRAINT "Mission_clientId_fkey";

-- DropForeignKey
ALTER TABLE "Mission" DROP CONSTRAINT "Mission_difficultyId_fkey";

-- DropForeignKey
ALTER TABLE "MissionAfterSentence" DROP CONSTRAINT "MissionAfterSentence_missionId_fkey";

-- DropForeignKey
ALTER TABLE "MissionAfterSentence" DROP CONSTRAINT "MissionAfterSentence_speakerId_fkey";

-- DropForeignKey
ALTER TABLE "MissionBeforeSentence" DROP CONSTRAINT "MissionBeforeSentence_missionId_fkey";

-- DropForeignKey
ALTER TABLE "MissionBeforeSentence" DROP CONSTRAINT "MissionBeforeSentence_speakerId_fkey";

-- DropForeignKey
ALTER TABLE "MissionExamProgress" DROP CONSTRAINT "MissionExamProgress_examId_fkey";

-- DropForeignKey
ALTER TABLE "MissionExamProgress" DROP CONSTRAINT "MissionExamProgress_progressId_fkey";

-- DropForeignKey
ALTER TABLE "MissionExamProgress" DROP CONSTRAINT "MissionExamProgress_userId_fkey";

-- DropForeignKey
ALTER TABLE "MissionExamUserCode" DROP CONSTRAINT "MissionExamUserCode_examProgressId_fkey";

-- DropForeignKey
ALTER TABLE "MissionProgress" DROP CONSTRAINT "MissionProgress_missionId_fkey";

-- DropForeignKey
ALTER TABLE "MissionProgress" DROP CONSTRAINT "MissionProgress_userId_fkey";

-- DropForeignKey
ALTER TABLE "MissionUnlockByAchievement" DROP CONSTRAINT "MissionUnlockByAchievement_missionId_fkey";

-- DropForeignKey
ALTER TABLE "MissionUnlockByAchievement" DROP CONSTRAINT "MissionUnlockByAchievement_requiredId_fkey";

-- DropForeignKey
ALTER TABLE "MissionUnlockByLevel" DROP CONSTRAINT "MissionUnlockByLevel_missionId_fkey";

-- DropForeignKey
ALTER TABLE "MissionUnlockByMission" DROP CONSTRAINT "MissionUnlockByMission_missionId_fkey";

-- DropForeignKey
ALTER TABLE "MissionUnlockByMission" DROP CONSTRAINT "MissionUnlockByMission_requiredId_fkey";

-- DropForeignKey
ALTER TABLE "MissionUnlockByRank" DROP CONSTRAINT "MissionUnlockByRank_missionId_fkey";

-- DropForeignKey
ALTER TABLE "MissionUnlockByRank" DROP CONSTRAINT "MissionUnlockByRank_rankId_fkey";

-- DropForeignKey
ALTER TABLE "Rank" DROP CONSTRAINT "Rank_requiredId_fkey";

-- DropForeignKey
ALTER TABLE "SharedMissionExamProgress" DROP CONSTRAINT "SharedMissionExamProgress_examProgressId_fkey";

-- DropForeignKey
ALTER TABLE "SharedMissionExamProgress" DROP CONSTRAINT "SharedMissionExamProgress_userId_fkey";

-- DropForeignKey
ALTER TABLE "Step" DROP CONSTRAINT "Step_missionId_fkey";

-- DropForeignKey
ALTER TABLE "StepExam" DROP CONSTRAINT "StepExam_stepId_fkey";

-- DropForeignKey
ALTER TABLE "StepExam" DROP CONSTRAINT "StepExam_supporterId_fkey";

-- DropForeignKey
ALTER TABLE "UsageTime" DROP CONSTRAINT "UsageTime_userId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_rankId_fkey";

-- DropForeignKey
ALTER TABLE "UserAchievement" DROP CONSTRAINT "UserAchievement_achievementId_fkey";

-- DropForeignKey
ALTER TABLE "UserAchievement" DROP CONSTRAINT "UserAchievement_userId_fkey";

-- DropIndex
DROP INDEX "Mission_slug_key";

-- AlterTable
ALTER TABLE "Mission" DROP COLUMN "clientId",
DROP COLUMN "component",
DROP COLUMN "detail",
DROP COLUMN "difficultyId",
DROP COLUMN "experience",
DROP COLUMN "slug",
DROP COLUMN "star",
DROP COLUMN "type",
ADD COLUMN     "courseId" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "difficulty" "CourseDifficulty" NOT NULL,
ADD COLUMN     "goalImg" TEXT NOT NULL,
ADD COLUMN     "isPublished" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "order" INTEGER NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "MissionExam" DROP COLUMN "component",
DROP COLUMN "criteria",
DROP COLUMN "exampleCode",
DROP COLUMN "instructions",
DROP COLUMN "language",
DROP COLUMN "type",
ADD COLUMN     "answerCode" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "difficulty" "ExamDifficulty" NOT NULL,
ADD COLUMN     "estimatedTime" TEXT NOT NULL,
ADD COLUMN     "initialCode" TEXT NOT NULL,
ADD COLUMN     "previewCss" TEXT,
ADD COLUMN     "rewardExp" INTEGER NOT NULL,
ADD COLUMN     "thumbnailUrl" TEXT,
ADD COLUMN     "title" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "experience",
DROP COLUMN "level",
DROP COLUMN "name",
DROP COLUMN "rankId",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "displayName" TEXT,
ADD COLUMN     "firebaseUid" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- DropTable
DROP TABLE "Achievement";

-- DropTable
DROP TABLE "AchievementCondition";

-- DropTable
DROP TABLE "Character";

-- DropTable
DROP TABLE "Difficulty";

-- DropTable
DROP TABLE "ExperienceLog";

-- DropTable
DROP TABLE "Explain";

-- DropTable
DROP TABLE "MissionAfterSentence";

-- DropTable
DROP TABLE "MissionBeforeSentence";

-- DropTable
DROP TABLE "MissionExamProgress";

-- DropTable
DROP TABLE "MissionExamUserCode";

-- DropTable
DROP TABLE "MissionProgress";

-- DropTable
DROP TABLE "MissionUnlockByAchievement";

-- DropTable
DROP TABLE "MissionUnlockByLevel";

-- DropTable
DROP TABLE "MissionUnlockByMission";

-- DropTable
DROP TABLE "MissionUnlockByRank";

-- DropTable
DROP TABLE "Rank";

-- DropTable
DROP TABLE "SharedMissionExamProgress";

-- DropTable
DROP TABLE "Step";

-- DropTable
DROP TABLE "StepExam";

-- DropTable
DROP TABLE "UsageTime";

-- DropTable
DROP TABLE "UserAchievement";

-- DropEnum
DROP TYPE "ExamType";

-- DropEnum
DROP TYPE "JudgeType";

-- DropEnum
DROP TYPE "MissionExamLanguages";

-- DropEnum
DROP TYPE "MissionStatus";

-- DropEnum
DROP TYPE "MissionType";

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "difficulty" "CourseDifficulty" NOT NULL,
    "isInitiallyUnlocked" BOOLEAN NOT NULL DEFAULT true,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseCategory" (
    "id" TEXT NOT NULL,
    "name" "CourseCategoryType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseCategoryMap" (
    "courseId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "CourseCategoryMap_pkey" PRIMARY KEY ("courseId","categoryId")
);

-- CreateTable
CREATE TABLE "Lesson" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonActivity" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "type" "LessonStepType" NOT NULL,
    "title" TEXT NOT NULL,
    "instruction" TEXT NOT NULL,
    "mentorMessage" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "preview" JSONB NOT NULL,
    "actionLabel" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LessonActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserMissionProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "status" "ProgressStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserMissionProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserLessonProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "status" "ProgressStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserLessonProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserMissionExamProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "missionExamId" TEXT NOT NULL,
    "passed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserMissionExamProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityAnswerLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonActivityId" TEXT NOT NULL,
    "answer" JSONB NOT NULL,
    "isCorrect" BOOLEAN,
    "answeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityAnswerLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MissionExamSubmission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "missionExamId" TEXT NOT NULL,
    "submittedCode" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MissionExamSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CourseCategory_name_key" ON "CourseCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Lesson_missionId_order_key" ON "Lesson"("missionId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "LessonActivity_lessonId_order_key" ON "LessonActivity"("lessonId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "UserMissionProgress_userId_missionId_key" ON "UserMissionProgress"("userId", "missionId");

-- CreateIndex
CREATE UNIQUE INDEX "UserLessonProgress_userId_lessonId_key" ON "UserLessonProgress"("userId", "lessonId");

-- CreateIndex
CREATE UNIQUE INDEX "UserMissionExamProgress_userId_missionExamId_key" ON "UserMissionExamProgress"("userId", "missionExamId");

-- CreateIndex
CREATE INDEX "ActivityAnswerLog_userId_idx" ON "ActivityAnswerLog"("userId");

-- CreateIndex
CREATE INDEX "ActivityAnswerLog_lessonActivityId_idx" ON "ActivityAnswerLog"("lessonActivityId");

-- CreateIndex
CREATE INDEX "MissionExamSubmission_userId_idx" ON "MissionExamSubmission"("userId");

-- CreateIndex
CREATE INDEX "MissionExamSubmission_missionId_idx" ON "MissionExamSubmission"("missionId");

-- CreateIndex
CREATE INDEX "MissionExamSubmission_missionExamId_idx" ON "MissionExamSubmission"("missionExamId");

-- CreateIndex
CREATE UNIQUE INDEX "Mission_courseId_order_key" ON "Mission"("courseId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "User_firebaseUid_key" ON "User"("firebaseUid");

-- AddForeignKey
ALTER TABLE "CourseCategoryMap" ADD CONSTRAINT "CourseCategoryMap_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseCategoryMap" ADD CONSTRAINT "CourseCategoryMap_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "CourseCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mission" ADD CONSTRAINT "Mission_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonActivity" ADD CONSTRAINT "LessonActivity_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMissionProgress" ADD CONSTRAINT "UserMissionProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMissionProgress" ADD CONSTRAINT "UserMissionProgress_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserLessonProgress" ADD CONSTRAINT "UserLessonProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserLessonProgress" ADD CONSTRAINT "UserLessonProgress_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMissionExamProgress" ADD CONSTRAINT "UserMissionExamProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMissionExamProgress" ADD CONSTRAINT "UserMissionExamProgress_missionExamId_fkey" FOREIGN KEY ("missionExamId") REFERENCES "MissionExam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityAnswerLog" ADD CONSTRAINT "ActivityAnswerLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityAnswerLog" ADD CONSTRAINT "ActivityAnswerLog_lessonActivityId_fkey" FOREIGN KEY ("lessonActivityId") REFERENCES "LessonActivity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionExamSubmission" ADD CONSTRAINT "MissionExamSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionExamSubmission" ADD CONSTRAINT "MissionExamSubmission_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionExamSubmission" ADD CONSTRAINT "MissionExamSubmission_missionExamId_fkey" FOREIGN KEY ("missionExamId") REFERENCES "MissionExam"("id") ON DELETE CASCADE ON UPDATE CASCADE;
