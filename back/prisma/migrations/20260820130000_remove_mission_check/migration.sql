-- Mission Check activities become ordinary activities of their actual input type.
UPDATE "MissionActivity"
SET
  "type" = CASE "content" ->> 'checkType'
    WHEN 'CHOICE' THEN 'CHOICE'::"MissionActivityType"
    WHEN 'MATCH' THEN 'MATCH'::"MissionActivityType"
    WHEN 'ORDERED_STEPS' THEN 'ORDERED_STEPS'::"MissionActivityType"
    WHEN 'SELECT_FILL' THEN 'SELECT_FILL'::"MissionActivityType"
    WHEN 'TRY_CODE' THEN 'TRY_CODE'::"MissionActivityType"
    ELSE 'VIEW'::"MissionActivityType"
  END,
  "content" = "content" - 'checkType'
WHERE "type" = 'MISSION_CHECK'::"MissionActivityType";

DROP INDEX IF EXISTS "MissionActivity_missionId_isMissionCheck_idx";
ALTER TABLE "MissionActivity" DROP COLUMN "isMissionCheck";

ALTER TYPE "MissionActivityType" RENAME TO "MissionActivityType_old";
CREATE TYPE "MissionActivityType" AS ENUM (
  'TUTORIAL',
  'VIEW',
  'CHOICE',
  'MATCH',
  'ORDERED_STEPS',
  'SELECT_FILL',
  'TRY_CODE'
);
ALTER TABLE "MissionActivity"
  ALTER COLUMN "type" TYPE "MissionActivityType"
  USING ("type"::text::"MissionActivityType");
DROP TYPE "MissionActivityType_old";
