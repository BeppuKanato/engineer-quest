-- CreateEnum
CREATE TYPE "KnowledgeCardRarity" AS ENUM ('COMMON', 'RARE', 'EPIC');

-- CreateTable
CREATE TABLE "KnowledgeCard" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "rarity" "KnowledgeCardRarity" NOT NULL DEFAULT 'COMMON',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserKnowledgeCard" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "knowledgeCardId" TEXT NOT NULL,
    "collectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserKnowledgeCard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "KnowledgeCard_courseId_idx" ON "KnowledgeCard"("courseId");

-- CreateIndex
CREATE INDEX "KnowledgeCard_rarity_idx" ON "KnowledgeCard"("rarity");

-- CreateIndex
CREATE INDEX "UserKnowledgeCard_userId_idx" ON "UserKnowledgeCard"("userId");

-- CreateIndex
CREATE INDEX "UserKnowledgeCard_knowledgeCardId_idx" ON "UserKnowledgeCard"("knowledgeCardId");

-- CreateIndex
CREATE UNIQUE INDEX "UserKnowledgeCard_userId_knowledgeCardId_key" ON "UserKnowledgeCard"("userId", "knowledgeCardId");

-- AddForeignKey
ALTER TABLE "KnowledgeCard" ADD CONSTRAINT "KnowledgeCard_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserKnowledgeCard" ADD CONSTRAINT "UserKnowledgeCard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserKnowledgeCard" ADD CONSTRAINT "UserKnowledgeCard_knowledgeCardId_fkey" FOREIGN KEY ("knowledgeCardId") REFERENCES "KnowledgeCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;
