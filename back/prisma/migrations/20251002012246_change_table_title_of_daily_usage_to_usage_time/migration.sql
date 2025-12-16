/*
  Warnings:

  - You are about to drop the `DailyUsage` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "DailyUsage" DROP CONSTRAINT "DailyUsage_userId_fkey";

-- DropTable
DROP TABLE "DailyUsage";

-- CreateTable
CREATE TABLE "UsageTime" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "usageTime" INTEGER NOT NULL,

    CONSTRAINT "UsageTime_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UsageTime_userId_date_key" ON "UsageTime"("userId", "date");

-- AddForeignKey
ALTER TABLE "UsageTime" ADD CONSTRAINT "UsageTime_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
