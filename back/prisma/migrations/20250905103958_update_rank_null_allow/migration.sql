-- DropForeignKey
ALTER TABLE "Rank" DROP CONSTRAINT "Rank_requiredId_fkey";

-- AlterTable
ALTER TABLE "Rank" ALTER COLUMN "requiredId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Rank" ADD CONSTRAINT "Rank_requiredId_fkey" FOREIGN KEY ("requiredId") REFERENCES "Mission"("id") ON DELETE SET NULL ON UPDATE CASCADE;
