-- AlterEnum
ALTER TYPE "BadgeTicketReason" ADD VALUE 'CREATE_WORK_SAVE';
ALTER TYPE "BadgeTicketReason" ADD VALUE 'CREATE_WORK_REVIEW';

-- CreateTable
CREATE TABLE "CreateMission" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "missionId" TEXT,
    "title" TEXT NOT NULL,
    "theme" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "minimumRequirements" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "advancedRequirements" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "suggestedTechnologies" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "starterCode" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreateMission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserWork" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createMissionId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "missionId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "focusPoint" TEXT NOT NULL,
    "technologies" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "code" TEXT NOT NULL,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserWork_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserWorkReview" (
    "id" TEXT NOT NULL,
    "userWorkId" TEXT NOT NULL,
    "goodPoints" TEXT NOT NULL,
    "improvements" TEXT NOT NULL,
    "nextTry" TEXT NOT NULL,
    "rawText" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserWorkReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CreateMission_courseId_idx" ON "CreateMission"("courseId");

-- CreateIndex
CREATE INDEX "CreateMission_missionId_idx" ON "CreateMission"("missionId");

-- CreateIndex
CREATE INDEX "CreateMission_sortOrder_idx" ON "CreateMission"("sortOrder");

-- CreateIndex
CREATE INDEX "UserWork_userId_idx" ON "UserWork"("userId");

-- CreateIndex
CREATE INDEX "UserWork_createMissionId_idx" ON "UserWork"("createMissionId");

-- CreateIndex
CREATE INDEX "UserWork_courseId_idx" ON "UserWork"("courseId");

-- CreateIndex
CREATE INDEX "UserWork_missionId_idx" ON "UserWork"("missionId");

-- CreateIndex
CREATE INDEX "UserWorkReview_userWorkId_idx" ON "UserWorkReview"("userWorkId");

-- AddForeignKey
ALTER TABLE "CreateMission" ADD CONSTRAINT "CreateMission_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreateMission" ADD CONSTRAINT "CreateMission_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserWork" ADD CONSTRAINT "UserWork_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserWork" ADD CONSTRAINT "UserWork_createMissionId_fkey" FOREIGN KEY ("createMissionId") REFERENCES "CreateMission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserWork" ADD CONSTRAINT "UserWork_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserWork" ADD CONSTRAINT "UserWork_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserWorkReview" ADD CONSTRAINT "UserWorkReview_userWorkId_fkey" FOREIGN KEY ("userWorkId") REFERENCES "UserWork"("id") ON DELETE CASCADE ON UPDATE CASCADE;
