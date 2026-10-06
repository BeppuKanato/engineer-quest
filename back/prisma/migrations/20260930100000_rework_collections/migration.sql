CREATE TYPE "AchievementRarity" AS ENUM ('COMMON', 'RARE', 'EPIC', 'LEGENDARY');

ALTER TABLE "User"
ADD COLUMN "knowledgeCardTableNumber" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "selectedProfileAchievementId" TEXT;

UPDATE "User"
SET "knowledgeCardTableNumber" = 1 + MOD(ABS(hashtext("id")), 15);

ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_selectedTechIconBadgeId_fkey";
ALTER TABLE "User" DROP COLUMN IF EXISTS "selectedTechIconBadgeId";
ALTER TABLE "User" DROP COLUMN IF EXISTS "badgeTickets";

ALTER TABLE "Achievement"
ADD COLUMN "rarity" "AchievementRarity" NOT NULL DEFAULT 'COMMON',
ADD COLUMN "iconKey" TEXT NOT NULL DEFAULT 'achievement',
ADD COLUMN "createQuestId" TEXT;

CREATE INDEX "Achievement_createQuestId_idx" ON "Achievement"("createQuestId");
ALTER TABLE "Achievement"
ADD CONSTRAINT "Achievement_createQuestId_fkey"
FOREIGN KEY ("createQuestId") REFERENCES "CreateQuest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "User"
ADD CONSTRAINT "User_selectedProfileAchievementId_fkey"
FOREIGN KEY ("selectedProfileAchievementId") REFERENCES "Achievement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "KnowledgeCard"
ADD COLUMN "connection" TEXT NOT NULL DEFAULT '',
ADD COLUMN "useCase" TEXT NOT NULL DEFAULT '',
ADD COLUMN "searchKeywords" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "catalogNumber" INTEGER;

WITH numbered AS (
  SELECT "id", ROW_NUMBER() OVER (PARTITION BY "courseId" ORDER BY "sortOrder", "createdAt") AS number
  FROM "KnowledgeCard"
)
UPDATE "KnowledgeCard"
SET "catalogNumber" = numbered.number
FROM numbered
WHERE "KnowledgeCard"."id" = numbered."id";

ALTER TABLE "KnowledgeCard" ALTER COLUMN "catalogNumber" SET NOT NULL;
CREATE UNIQUE INDEX "KnowledgeCard_courseId_catalogNumber_key" ON "KnowledgeCard"("courseId", "catalogNumber");

CREATE TABLE "KnowledgeCardScheduleEntry" (
  "id" TEXT NOT NULL,
  "courseId" TEXT NOT NULL,
  "courseVersion" INTEGER NOT NULL,
  "tableNumber" INTEGER NOT NULL,
  "missionId" TEXT NOT NULL,
  "knowledgeCardId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "KnowledgeCardScheduleEntry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "KnowledgeSchedule_course_version_table_mission_key"
ON "KnowledgeCardScheduleEntry"("courseId", "courseVersion", "tableNumber", "missionId");
CREATE UNIQUE INDEX "KnowledgeSchedule_course_version_table_card_key"
ON "KnowledgeCardScheduleEntry"("courseId", "courseVersion", "tableNumber", "knowledgeCardId");
CREATE INDEX "KnowledgeCardScheduleEntry_missionId_idx" ON "KnowledgeCardScheduleEntry"("missionId");
CREATE INDEX "KnowledgeCardScheduleEntry_knowledgeCardId_idx" ON "KnowledgeCardScheduleEntry"("knowledgeCardId");

ALTER TABLE "KnowledgeCardScheduleEntry"
ADD CONSTRAINT "KnowledgeCardScheduleEntry_courseId_fkey"
FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "KnowledgeCardScheduleEntry"
ADD CONSTRAINT "KnowledgeCardScheduleEntry_missionId_fkey"
FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "KnowledgeCardScheduleEntry"
ADD CONSTRAINT "KnowledgeCardScheduleEntry_knowledgeCardId_fkey"
FOREIGN KEY ("knowledgeCardId") REFERENCES "KnowledgeCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MissionRewardRun" DROP COLUMN IF EXISTS "candidateKnowledgeCardIds";
ALTER TABLE "MissionRewardRun" RENAME COLUMN "selectedKnowledgeCardId" TO "awardedKnowledgeCardId";
ALTER TABLE "MissionRewardRun" RENAME COLUMN "knowledgeCardSelectedAt" TO "knowledgeCardAwardedAt";
ALTER TABLE "MissionRewardRun" DROP COLUMN IF EXISTS "awardedBadgeTickets";

DROP TABLE IF EXISTS "BadgeTicketTransaction";
DROP TABLE IF EXISTS "UserTechIconBadge";
DROP TABLE IF EXISTS "TechIconBadge";
DROP TYPE IF EXISTS "BadgeTicketReason";
DROP TYPE IF EXISTS "TechIconBadgeRarity";

ALTER TYPE "AchievementCategory" ADD VALUE 'CREATE_QUEST';
ALTER TYPE "AchievementCategory" ADD VALUE 'COLLECTION';
ALTER TYPE "AchievementConditionType" ADD VALUE 'CREATE_QUEST_SCORE';
ALTER TYPE "AchievementConditionType" ADD VALUE 'CREATE_QUEST_COMPLETED_COUNT';
ALTER TYPE "AchievementConditionType" ADD VALUE 'CREATE_QUEST_OPTIONAL_REQUIREMENT_COUNT';
ALTER TYPE "AchievementConditionType" ADD VALUE 'CREATE_QUEST_PERFECT_COUNT';
ALTER TYPE "AchievementConditionType" ADD VALUE 'KNOWLEDGE_CARD_COUNT';
ALTER TYPE "AchievementConditionType" ADD VALUE 'COURSE_COMPLETED_COUNT';
