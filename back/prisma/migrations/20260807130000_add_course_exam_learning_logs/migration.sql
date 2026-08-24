CREATE TABLE "CourseExamTestExecution" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "testResults" JSONB NOT NULL,
    "runtimeError" TEXT,
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CourseExamTestExecution_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CourseExamSubmission" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "testResults" JSONB NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CourseExamSubmission_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CourseExamTestExecution_attemptId_executedAt_idx"
ON "CourseExamTestExecution"("attemptId", "executedAt");

CREATE INDEX "CourseExamSubmission_attemptId_submittedAt_idx"
ON "CourseExamSubmission"("attemptId", "submittedAt");

ALTER TABLE "CourseExamTestExecution" ADD CONSTRAINT "CourseExamTestExecution_attemptId_fkey"
FOREIGN KEY ("attemptId") REFERENCES "CourseExamAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CourseExamSubmission" ADD CONSTRAINT "CourseExamSubmission_attemptId_fkey"
FOREIGN KEY ("attemptId") REFERENCES "CourseExamAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
