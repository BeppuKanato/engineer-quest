-- Track Cloud Tasks worker ownership and bound repeated LLM attempts.
ALTER TABLE "FeedbackV1"
  ADD COLUMN "runToken" TEXT,
  ADD COLUMN "runExpiresAt" TIMESTAMP(3),
  ADD COLUMN "runAttempts" INTEGER NOT NULL DEFAULT 0;
