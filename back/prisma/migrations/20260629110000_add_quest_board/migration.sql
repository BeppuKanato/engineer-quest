-- CreateEnum
CREATE TYPE "QuestPostCategory" AS ENUM ('QUESTION', 'ERROR_HELP', 'WORK_SHARE', 'CODE_SHARE', 'MEMO', 'REFERENCE');

-- CreateEnum
CREATE TYPE "QuestPostStatus" AS ENUM ('OPEN', 'RESOLVED');

-- CreateEnum
CREATE TYPE "QuestPostVisibility" AS ENUM ('PUBLIC');

-- CreateEnum
CREATE TYPE "QuestReactionType" AS ENUM ('LIKE', 'HELPFUL', 'SAVED_ME');

-- CreateTable
CREATE TABLE "QuestPost" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" "QuestPostCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "code" TEXT,
    "referenceUrl" TEXT,
    "courseId" TEXT,
    "missionId" TEXT,
    "status" "QuestPostStatus" NOT NULL DEFAULT 'OPEN',
    "visibility" "QuestPostVisibility" NOT NULL DEFAULT 'PUBLIC',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuestPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestComment" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuestComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestReaction" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "QuestReactionType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuestReaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QuestPost_userId_idx" ON "QuestPost"("userId");

-- CreateIndex
CREATE INDEX "QuestPost_category_idx" ON "QuestPost"("category");

-- CreateIndex
CREATE INDEX "QuestPost_status_idx" ON "QuestPost"("status");

-- CreateIndex
CREATE INDEX "QuestPost_courseId_idx" ON "QuestPost"("courseId");

-- CreateIndex
CREATE INDEX "QuestPost_missionId_idx" ON "QuestPost"("missionId");

-- CreateIndex
CREATE INDEX "QuestPost_createdAt_idx" ON "QuestPost"("createdAt");

-- CreateIndex
CREATE INDEX "QuestComment_postId_idx" ON "QuestComment"("postId");

-- CreateIndex
CREATE INDEX "QuestComment_userId_idx" ON "QuestComment"("userId");

-- CreateIndex
CREATE INDEX "QuestReaction_postId_idx" ON "QuestReaction"("postId");

-- CreateIndex
CREATE INDEX "QuestReaction_userId_idx" ON "QuestReaction"("userId");

-- CreateIndex
CREATE INDEX "QuestReaction_type_idx" ON "QuestReaction"("type");

-- CreateIndex
CREATE UNIQUE INDEX "QuestReaction_postId_userId_type_key" ON "QuestReaction"("postId", "userId", "type");

-- AddForeignKey
ALTER TABLE "QuestPost" ADD CONSTRAINT "QuestPost_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestPost" ADD CONSTRAINT "QuestPost_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestPost" ADD CONSTRAINT "QuestPost_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestComment" ADD CONSTRAINT "QuestComment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "QuestPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestComment" ADD CONSTRAINT "QuestComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestReaction" ADD CONSTRAINT "QuestReaction_postId_fkey" FOREIGN KEY ("postId") REFERENCES "QuestPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestReaction" ADD CONSTRAINT "QuestReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
