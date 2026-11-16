-- Separate explicit user retries from bounded automatic Cloud Tasks attempts.
ALTER TABLE "FeedbackV1" ADD COLUMN "retryCount" INTEGER NOT NULL DEFAULT 0;
