CREATE TABLE "HexadResponse" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questionnaireVersion" TEXT NOT NULL,
    "q1" INTEGER NOT NULL,
    "q2" INTEGER NOT NULL,
    "q3" INTEGER NOT NULL,
    "q4" INTEGER NOT NULL,
    "q5" INTEGER NOT NULL,
    "q6" INTEGER NOT NULL,
    "q7" INTEGER NOT NULL,
    "q8" INTEGER NOT NULL,
    "q9" INTEGER NOT NULL,
    "q10" INTEGER NOT NULL,
    "q11" INTEGER NOT NULL,
    "q12" INTEGER NOT NULL,
    "q13" INTEGER NOT NULL,
    "q14" INTEGER NOT NULL,
    "q15" INTEGER NOT NULL,
    "q16" INTEGER NOT NULL,
    "q17" INTEGER NOT NULL,
    "q18" INTEGER NOT NULL,
    "q19" INTEGER NOT NULL,
    "q20" INTEGER NOT NULL,
    "q21" INTEGER NOT NULL,
    "q22" INTEGER NOT NULL,
    "q23" INTEGER NOT NULL,
    "q24" INTEGER NOT NULL,
    "philanthropistScore" INTEGER NOT NULL,
    "socialiserScore" INTEGER NOT NULL,
    "freeSpiritScore" INTEGER NOT NULL,
    "achieverScore" INTEGER NOT NULL,
    "disruptorScore" INTEGER NOT NULL,
    "playerScore" INTEGER NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HexadResponse_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "HexadResponse_answers_check" CHECK (
        "q1" BETWEEN 1 AND 7 AND "q2" BETWEEN 1 AND 7 AND
        "q3" BETWEEN 1 AND 7 AND "q4" BETWEEN 1 AND 7 AND
        "q5" BETWEEN 1 AND 7 AND "q6" BETWEEN 1 AND 7 AND
        "q7" BETWEEN 1 AND 7 AND "q8" BETWEEN 1 AND 7 AND
        "q9" BETWEEN 1 AND 7 AND "q10" BETWEEN 1 AND 7 AND
        "q11" BETWEEN 1 AND 7 AND "q12" BETWEEN 1 AND 7 AND
        "q13" BETWEEN 1 AND 7 AND "q14" BETWEEN 1 AND 7 AND
        "q15" BETWEEN 1 AND 7 AND "q16" BETWEEN 1 AND 7 AND
        "q17" BETWEEN 1 AND 7 AND "q18" BETWEEN 1 AND 7 AND
        "q19" BETWEEN 1 AND 7 AND "q20" BETWEEN 1 AND 7 AND
        "q21" BETWEEN 1 AND 7 AND "q22" BETWEEN 1 AND 7 AND
        "q23" BETWEEN 1 AND 7 AND "q24" BETWEEN 1 AND 7
    ),
    CONSTRAINT "HexadResponse_scores_check" CHECK (
        "philanthropistScore" BETWEEN 4 AND 28 AND
        "socialiserScore" BETWEEN 4 AND 28 AND
        "freeSpiritScore" BETWEEN 4 AND 28 AND
        "achieverScore" BETWEEN 4 AND 28 AND
        "disruptorScore" BETWEEN 4 AND 28 AND
        "playerScore" BETWEEN 4 AND 28
    )
);

CREATE UNIQUE INDEX "HexadResponse_userId_key" ON "HexadResponse"("userId");

ALTER TABLE "HexadResponse" ADD CONSTRAINT "HexadResponse_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
