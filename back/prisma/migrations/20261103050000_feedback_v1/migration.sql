-- CreateTable
CREATE TABLE "FeedbackV1" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventKey" TEXT NOT NULL,
    "condition" "FeedbackCondition" NOT NULL,
    "status" "CourseExamFeedbackStatus" NOT NULL,
    "input" JSONB NOT NULL,
    "result" JSONB,
    "failureCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generatedAt" TIMESTAMP(3),

    CONSTRAINT "FeedbackV1_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedbackV1Call" (
    "id" TEXT NOT NULL,
    "feedbackId" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeedbackV1Call_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedbackV1Interaction" (
    "id" TEXT NOT NULL,
    "feedbackId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeedbackV1Interaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FeedbackV1_eventKey_key" ON "FeedbackV1"("eventKey");

-- CreateIndex
CREATE INDEX "FeedbackV1_userId_createdAt_idx" ON "FeedbackV1"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "FeedbackV1Interaction_feedbackId_createdAt_idx" ON "FeedbackV1Interaction"("feedbackId", "createdAt");

-- AddForeignKey
ALTER TABLE "FeedbackV1Call" ADD CONSTRAINT "FeedbackV1Call_feedbackId_fkey" FOREIGN KEY ("feedbackId") REFERENCES "FeedbackV1"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackV1Interaction" ADD CONSTRAINT "FeedbackV1Interaction_feedbackId_fkey" FOREIGN KEY ("feedbackId") REFERENCES "FeedbackV1"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FeedbackV1" ADD CONSTRAINT "FeedbackV1_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
