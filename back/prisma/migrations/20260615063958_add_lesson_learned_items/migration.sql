-- AlterTable
ALTER TABLE "Lesson" ADD COLUMN     "learnedItems" TEXT[] DEFAULT ARRAY[]::TEXT[];
