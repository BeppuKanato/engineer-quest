CREATE TABLE "DailyReview" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reviewDate" DATE NOT NULL,
    "courseId" TEXT NOT NULL,
    "phaseKey" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "selectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "answeredAt" TIMESTAMP(3),
    "correct" BOOLEAN,
    CONSTRAINT "DailyReview_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "DailyReview_answer_pair" CHECK (("answeredAt" IS NULL) = ("correct" IS NULL))
);
CREATE UNIQUE INDEX "DailyReview_userId_reviewDate_key" ON "DailyReview"("userId", "reviewDate");
CREATE INDEX "DailyReview_userId_correct_answeredAt_idx" ON "DailyReview"("userId", "correct", "answeredAt");
ALTER TABLE "DailyReview" ADD CONSTRAINT "DailyReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
