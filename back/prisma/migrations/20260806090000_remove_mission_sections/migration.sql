-- MissionActivity already has missionId and a mission-wide order, so activity
-- IDs and all user progress remain intact while the grouping table is removed.
DROP INDEX IF EXISTS "MissionActivity_sectionId_idx";
ALTER TABLE "MissionActivity" DROP CONSTRAINT IF EXISTS "MissionActivity_sectionId_fkey";
ALTER TABLE "MissionActivity" DROP COLUMN IF EXISTS "sectionId";
ALTER TABLE "MissionActivity" DROP COLUMN IF EXISTS "sectionOrder";
DROP TABLE IF EXISTS "MissionSection";
