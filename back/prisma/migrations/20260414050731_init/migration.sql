-- CreateEnum
CREATE TYPE "JudgeType" AS ENUM ('PHILANTHROPIST', 'ACHIEVER', 'FREE_SPIRIT', 'SOCIALIZER', 'PLAYER', 'DISRUPTOR');

-- CreateEnum
CREATE TYPE "MissionExamLanguages" AS ENUM ('HTML', 'CSS', 'JavaScript', 'Java');

-- CreateEnum
CREATE TYPE "MissionStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELED');

-- CreateEnum
CREATE TYPE "MissionType" AS ENUM ('PROMOTION', 'MAIN', 'SUB');

-- CreateEnum
CREATE TYPE "ExamType" AS ENUM ('REPRODUCTION', 'FREE_CREATION', 'HYBRID');

-- CreateTable
CREATE TABLE "Character" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "imagePath" TEXT NOT NULL,

    CONSTRAINT "Character_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "rankId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "experience" INTEGER NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Difficulty" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "Difficulty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mission" (
    "id" TEXT NOT NULL,
    "difficultyId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "component" TEXT NOT NULL,
    "experience" INTEGER NOT NULL DEFAULT 1,
    "type" "MissionType" NOT NULL,
    "slug" TEXT NOT NULL,
    "star" INTEGER NOT NULL,

    CONSTRAINT "Mission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Step" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "detail" TEXT NOT NULL,

    CONSTRAINT "Step_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Explain" (
    "id" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "supporterId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "highlight" TEXT,
    "componentType" TEXT,
    "code" TEXT,

    CONSTRAINT "Explain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MissionExam" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "criteria" JSONB NOT NULL,
    "type" "ExamType",
    "instructions" TEXT[],
    "component" TEXT,
    "exampleCode" JSONB,
    "language" "MissionExamLanguages"[],

    CONSTRAINT "MissionExam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StepExam" (
    "id" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "supporterId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "order" INTEGER,
    "instructions" TEXT[],
    "highlight" TEXT,
    "componentType" TEXT,

    CONSTRAINT "StepExam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MissionExamProgress" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "progressId" TEXT NOT NULL,
    "point" INTEGER NOT NULL,
    "isPassed" BOOLEAN NOT NULL,
    "good" TEXT[],
    "bad" TEXT[],
    "feedbacks" JSONB NOT NULL,
    "selectedFeedbackType" "JudgeType",
    "selectedFeedbackIndex" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "learningTimeSec" INTEGER,

    CONSTRAINT "MissionExamProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MissionExamUserCode" (
    "id" TEXT NOT NULL,
    "examProgressId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "language" "MissionExamLanguages" NOT NULL,
    "fileName" TEXT,

    CONSTRAINT "MissionExamUserCode_pkey" PRIMARY KEY ("id")
);

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
    "slug" TEXT NOT NULL,
    "requiredId" TEXT,

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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MissionProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Achievement" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
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
CREATE TABLE "UsageTime" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "usageTime" INTEGER NOT NULL,

    CONSTRAINT "UsageTime_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExperienceLog" (
    "id" TEXT NOT NULL,
    "missionProgressId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "experience" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExperienceLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SharedMissionExamProgress" (
    "id" TEXT NOT NULL,
    "examProgressId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SharedMissionExamProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Character_slug_key" ON "Character"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Difficulty_slug_key" ON "Difficulty"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Mission_slug_key" ON "Mission"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "MissionExam_missionId_key" ON "MissionExam"("missionId");

-- CreateIndex
CREATE UNIQUE INDEX "Rank_slug_key" ON "Rank"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Rank_requiredId_key" ON "Rank"("requiredId");

-- CreateIndex
CREATE UNIQUE INDEX "Achievement_slug_key" ON "Achievement"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "UsageTime_userId_date_key" ON "UsageTime"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "SharedMissionExamProgress_examProgressId_key" ON "SharedMissionExamProgress"("examProgressId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_rankId_fkey" FOREIGN KEY ("rankId") REFERENCES "Rank"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mission" ADD CONSTRAINT "Mission_difficultyId_fkey" FOREIGN KEY ("difficultyId") REFERENCES "Difficulty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mission" ADD CONSTRAINT "Mission_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Character"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Step" ADD CONSTRAINT "Step_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Explain" ADD CONSTRAINT "Explain_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "Step"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Explain" ADD CONSTRAINT "Explain_supporterId_fkey" FOREIGN KEY ("supporterId") REFERENCES "Character"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionExam" ADD CONSTRAINT "MissionExam_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StepExam" ADD CONSTRAINT "StepExam_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "Step"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StepExam" ADD CONSTRAINT "StepExam_supporterId_fkey" FOREIGN KEY ("supporterId") REFERENCES "Character"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionExamProgress" ADD CONSTRAINT "MissionExamProgress_progressId_fkey" FOREIGN KEY ("progressId") REFERENCES "MissionProgress"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionExamProgress" ADD CONSTRAINT "MissionExamProgress_examId_fkey" FOREIGN KEY ("examId") REFERENCES "MissionExam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionExamProgress" ADD CONSTRAINT "MissionExamProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionExamUserCode" ADD CONSTRAINT "MissionExamUserCode_examProgressId_fkey" FOREIGN KEY ("examProgressId") REFERENCES "MissionExamProgress"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionUnlockByRank" ADD CONSTRAINT "MissionUnlockByRank_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionUnlockByRank" ADD CONSTRAINT "MissionUnlockByRank_rankId_fkey" FOREIGN KEY ("rankId") REFERENCES "Rank"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionUnlockByLevel" ADD CONSTRAINT "MissionUnlockByLevel_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionUnlockByMission" ADD CONSTRAINT "MissionUnlockByMission_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionUnlockByMission" ADD CONSTRAINT "MissionUnlockByMission_requiredId_fkey" FOREIGN KEY ("requiredId") REFERENCES "Mission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionUnlockByAchievement" ADD CONSTRAINT "MissionUnlockByAchievement_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionUnlockByAchievement" ADD CONSTRAINT "MissionUnlockByAchievement_requiredId_fkey" FOREIGN KEY ("requiredId") REFERENCES "Achievement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rank" ADD CONSTRAINT "Rank_requiredId_fkey" FOREIGN KEY ("requiredId") REFERENCES "Mission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionBeforeSentence" ADD CONSTRAINT "MissionBeforeSentence_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionBeforeSentence" ADD CONSTRAINT "MissionBeforeSentence_speakerId_fkey" FOREIGN KEY ("speakerId") REFERENCES "Character"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionAfterSentence" ADD CONSTRAINT "MissionAfterSentence_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionAfterSentence" ADD CONSTRAINT "MissionAfterSentence_speakerId_fkey" FOREIGN KEY ("speakerId") REFERENCES "Character"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionProgress" ADD CONSTRAINT "MissionProgress_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionProgress" ADD CONSTRAINT "MissionProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AchievementCondition" ADD CONSTRAINT "AchievementCondition_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "Achievement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "Achievement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsageTime" ADD CONSTRAINT "UsageTime_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExperienceLog" ADD CONSTRAINT "ExperienceLog_missionProgressId_fkey" FOREIGN KEY ("missionProgressId") REFERENCES "MissionProgress"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExperienceLog" ADD CONSTRAINT "ExperienceLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedMissionExamProgress" ADD CONSTRAINT "SharedMissionExamProgress_examProgressId_fkey" FOREIGN KEY ("examProgressId") REFERENCES "MissionExamProgress"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedMissionExamProgress" ADD CONSTRAINT "SharedMissionExamProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
