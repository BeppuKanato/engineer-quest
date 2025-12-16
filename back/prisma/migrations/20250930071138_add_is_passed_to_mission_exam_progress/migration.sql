/*
  Warnings:

  - A unique constraint covering the columns `[userId,date]` on the table `DailyUsage` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "DailyUsage_userId_date_key" ON "DailyUsage"("userId", "date");
