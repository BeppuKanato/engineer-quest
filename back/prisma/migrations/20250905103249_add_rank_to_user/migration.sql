/*
  Warnings:

  - You are about to drop the column `userId` on the `Rank` table. All the data in the column will be lost.
  - Added the required column `rankId` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Rank" DROP CONSTRAINT "Rank_userId_fkey";

-- AlterTable
ALTER TABLE "Rank" DROP COLUMN "userId";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "rankId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_rankId_fkey" FOREIGN KEY ("rankId") REFERENCES "Rank"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
