-- CreateEnum
CREATE TYPE "AchievementCategory" AS ENUM ('MISSION_COUNT', 'MISSION_CLEAR', 'MISSION_COMPLETE', 'COURSE_EXAM', 'LEARNING_ACTION', 'COURSE_COMPLETE', 'STREAK');

-- CreateEnum
CREATE TYPE "AchievementConditionType" AS ENUM ('MISSION_COUNT', 'SPECIFIC_MISSION_CLEAR', 'COURSE_REQUIRED_MISSION_COMPLETE', 'COURSE_ALL_MISSION_COMPLETE', 'COURSE_EXAM_HARD_CLEAR', 'ACTIVITY_COUNT', 'COURSE_COMPLETE', 'STREAK_DAYS');

-- CreateTable
CREATE TABLE "Achievement" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "AchievementCategory" NOT NULL,
    "conditionType" "AchievementConditionType" NOT NULL,
    "conditionValue" INTEGER,
    "missionId" TEXT,
    "courseId" TEXT,
    "isSecret" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAchievement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "achievedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserAchievement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Achievement_category_idx" ON "Achievement"("category");

-- CreateIndex
CREATE INDEX "Achievement_conditionType_idx" ON "Achievement"("conditionType");

-- CreateIndex
CREATE INDEX "Achievement_missionId_idx" ON "Achievement"("missionId");

-- CreateIndex
CREATE INDEX "Achievement_courseId_idx" ON "Achievement"("courseId");

-- CreateIndex
CREATE INDEX "UserAchievement_userId_idx" ON "UserAchievement"("userId");

-- CreateIndex
CREATE INDEX "UserAchievement_achievementId_idx" ON "UserAchievement"("achievementId");

-- CreateIndex
CREATE UNIQUE INDEX "UserAchievement_userId_achievementId_key" ON "UserAchievement"("userId", "achievementId");

-- AddForeignKey
ALTER TABLE "Achievement" ADD CONSTRAINT "Achievement_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Achievement" ADD CONSTRAINT "Achievement_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "Achievement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
