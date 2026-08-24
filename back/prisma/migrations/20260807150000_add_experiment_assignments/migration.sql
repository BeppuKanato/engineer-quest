CREATE TYPE "FeedbackCondition" AS ENUM ('STANDARD', 'PERSONALIZED');

CREATE TABLE "ExperimentAssignment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "experimentKey" TEXT NOT NULL,
    "condition" "FeedbackCondition" NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExperimentAssignment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ExperimentAssignment_userId_experimentKey_key"
ON "ExperimentAssignment"("userId", "experimentKey");

CREATE INDEX "ExperimentAssignment_experimentKey_condition_idx"
ON "ExperimentAssignment"("experimentKey", "condition");

ALTER TABLE "ExperimentAssignment"
ADD CONSTRAINT "ExperimentAssignment_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Assign users who completed HEXAD before this migration in completion order.
-- The first participant is STANDARD, followed by PERSONALIZED, alternating thereafter.
INSERT INTO "ExperimentAssignment" (
    "id",
    "userId",
    "experimentKey",
    "condition",
    "assignedAt"
)
SELECT
    'hexad_feedback_2026_' || md5(response."userId"),
    response."userId",
    'HEXAD_FEEDBACK_2026',
    CASE
        WHEN MOD(ROW_NUMBER() OVER (
            ORDER BY response."completedAt" ASC, response."id" ASC
        ) - 1, 2) = 0
        THEN 'STANDARD'::"FeedbackCondition"
        ELSE 'PERSONALIZED'::"FeedbackCondition"
    END,
    response."completedAt"
FROM "HexadResponse" AS response
ON CONFLICT ("userId", "experimentKey") DO NOTHING;
