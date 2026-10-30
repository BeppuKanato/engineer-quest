-- CreateEnum
CREATE TYPE "CreateThemeCategory" AS ENUM ('UI', 'HTML_CSS', 'JAVASCRIPT', 'FORM', 'DATA_DISPLAY', 'API', 'CRUD', 'GAME');

-- CreateEnum
CREATE TYPE "CreateWorkStatus" AS ENUM ('DRAFT', 'COMPLETED');

-- CreateEnum
CREATE TYPE "CreateWorkVisibility" AS ENUM ('PRIVATE', 'SHARED');

-- CreateTable
CREATE TABLE "CreateTheme" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "CreateThemeCategory" NOT NULL,
    "difficulty" "CourseDifficulty" NOT NULL DEFAULT 'EASY',
    "estimatedMinutes" INTEGER NOT NULL DEFAULT 60,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "defaultThumbnailUrl" TEXT,
    "recommendedCourseId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreateTheme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreateThemeRequirement" (
    "id" TEXT NOT NULL,
    "themeId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreateThemeRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreateThemeChallenge" (
    "id" TEXT NOT NULL,
    "themeId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreateThemeChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserCreateWork" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "themeId" TEXT NOT NULL,
    "courseId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "learnedNote" TEXT,
    "techStack" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "publicUrl" TEXT,
    "repositoryUrl" TEXT,
    "imageUrl" TEXT,
    "imageStoragePath" TEXT,
    "status" "CreateWorkStatus" NOT NULL DEFAULT 'DRAFT',
    "visibility" "CreateWorkVisibility" NOT NULL DEFAULT 'PRIVATE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sharedAt" TIMESTAMP(3),

    CONSTRAINT "UserCreateWork_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserCreateWorkRequirementCheck" (
    "workId" TEXT NOT NULL,
    "requirementId" TEXT NOT NULL,
    "checked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "UserCreateWorkRequirementCheck_pkey" PRIMARY KEY ("workId","requirementId")
);

-- CreateTable
CREATE TABLE "UserCreateWorkChallengeCheck" (
    "workId" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "checked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "UserCreateWorkChallengeCheck_pkey" PRIMARY KEY ("workId","challengeId")
);

-- CreateIndex
CREATE INDEX "CreateTheme_category_idx" ON "CreateTheme"("category");
CREATE INDEX "CreateTheme_recommendedCourseId_idx" ON "CreateTheme"("recommendedCourseId");
CREATE INDEX "CreateTheme_sortOrder_idx" ON "CreateTheme"("sortOrder");
CREATE INDEX "CreateThemeRequirement_themeId_idx" ON "CreateThemeRequirement"("themeId");
CREATE INDEX "CreateThemeRequirement_order_idx" ON "CreateThemeRequirement"("order");
CREATE INDEX "CreateThemeChallenge_themeId_idx" ON "CreateThemeChallenge"("themeId");
CREATE INDEX "CreateThemeChallenge_order_idx" ON "CreateThemeChallenge"("order");
CREATE INDEX "UserCreateWork_userId_idx" ON "UserCreateWork"("userId");
CREATE INDEX "UserCreateWork_themeId_idx" ON "UserCreateWork"("themeId");
CREATE INDEX "UserCreateWork_courseId_idx" ON "UserCreateWork"("courseId");
CREATE INDEX "UserCreateWork_visibility_idx" ON "UserCreateWork"("visibility");
CREATE INDEX "UserCreateWork_updatedAt_idx" ON "UserCreateWork"("updatedAt");

-- AddForeignKey
ALTER TABLE "CreateTheme" ADD CONSTRAINT "CreateTheme_recommendedCourseId_fkey" FOREIGN KEY ("recommendedCourseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CreateThemeRequirement" ADD CONSTRAINT "CreateThemeRequirement_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "CreateTheme"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CreateThemeChallenge" ADD CONSTRAINT "CreateThemeChallenge_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "CreateTheme"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserCreateWork" ADD CONSTRAINT "UserCreateWork_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserCreateWork" ADD CONSTRAINT "UserCreateWork_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "CreateTheme"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserCreateWork" ADD CONSTRAINT "UserCreateWork_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "UserCreateWorkRequirementCheck" ADD CONSTRAINT "UserCreateWorkRequirementCheck_workId_fkey" FOREIGN KEY ("workId") REFERENCES "UserCreateWork"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserCreateWorkRequirementCheck" ADD CONSTRAINT "UserCreateWorkRequirementCheck_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "CreateThemeRequirement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserCreateWorkChallengeCheck" ADD CONSTRAINT "UserCreateWorkChallengeCheck_workId_fkey" FOREIGN KEY ("workId") REFERENCES "UserCreateWork"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserCreateWorkChallengeCheck" ADD CONSTRAINT "UserCreateWorkChallengeCheck_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "CreateThemeChallenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;
