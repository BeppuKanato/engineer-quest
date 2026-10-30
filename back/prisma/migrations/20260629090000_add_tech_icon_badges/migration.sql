-- CreateEnum
CREATE TYPE "TechIconBadgeRarity" AS ENUM ('COMMON', 'RARE', 'EPIC', 'LEGENDARY');

-- CreateEnum
CREATE TYPE "BadgeTicketReason" AS ENUM ('MISSION_COMPLETE', 'CHALLENGE_COMPLETE', 'COURSE_COMPLETE', 'ACHIEVEMENT_UNLOCK', 'BADGE_GACHA');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "badgeTickets" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "selectedTechIconBadgeId" TEXT;

-- CreateTable
CREATE TABLE "TechIconBadge" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "iconUrl" TEXT NOT NULL,
    "rarity" "TechIconBadgeRarity" NOT NULL DEFAULT 'COMMON',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TechIconBadge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserTechIconBadge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "acquiredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserTechIconBadge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BadgeTicketTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" "BadgeTicketReason" NOT NULL,
    "sourceId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BadgeTicketTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TechIconBadge_rarity_idx" ON "TechIconBadge"("rarity");

-- CreateIndex
CREATE INDEX "TechIconBadge_sortOrder_idx" ON "TechIconBadge"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "UserTechIconBadge_userId_badgeId_key" ON "UserTechIconBadge"("userId", "badgeId");

-- CreateIndex
CREATE INDEX "UserTechIconBadge_userId_idx" ON "UserTechIconBadge"("userId");

-- CreateIndex
CREATE INDEX "UserTechIconBadge_badgeId_idx" ON "UserTechIconBadge"("badgeId");

-- CreateIndex
CREATE INDEX "BadgeTicketTransaction_userId_idx" ON "BadgeTicketTransaction"("userId");

-- CreateIndex
CREATE INDEX "BadgeTicketTransaction_reason_idx" ON "BadgeTicketTransaction"("reason");

-- CreateIndex
CREATE INDEX "BadgeTicketTransaction_sourceId_idx" ON "BadgeTicketTransaction"("sourceId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_selectedTechIconBadgeId_fkey" FOREIGN KEY ("selectedTechIconBadgeId") REFERENCES "TechIconBadge"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTechIconBadge" ADD CONSTRAINT "UserTechIconBadge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTechIconBadge" ADD CONSTRAINT "UserTechIconBadge_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "TechIconBadge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BadgeTicketTransaction" ADD CONSTRAINT "BadgeTicketTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
