import { PrismaClient } from "@prisma/client";
import fs from 'fs';
import path from 'path';

// JSONファイルからデータを読み込むように修正
const difficultyDataPath = path.join(__dirname, 'data.json');
const difficultyData = JSON.parse(fs.readFileSync(difficultyDataPath, "utf-8"));

export async function seedDifficulties(prisma: PrismaClient) {
  console.log("-> Seeding Difficulties...");
  for (const data of difficultyData) {
    // slugはユニークである前提でupsert
    await prisma.difficulty.upsert({
      where: { slug: data.slug },
      update: { name: data.name },
      create: data,
    });
  }
  console.log("-> Difficulties finished.");
}
