import { PrismaClient } from "@prisma/client";
import fs from 'fs';
import path from 'path';

// JSONファイルからデータを読み込みます。
// このJSONには slug が含まれていることが前提です。
const characterDataPath = path.join(__dirname, 'data.json');
const characterData = JSON.parse(
    fs.readFileSync(characterDataPath, 'utf-8')
);

/**
 * Characterモデルのシードを実行します。
 * slugをユニークキーとして利用し、既存データがあれば更新（upsert）を行います。
 * @param prisma - PrismaClientのインスタンス
 */
export async function seedCharacters(prisma: PrismaClient) {
  console.log("-> Seeding Characters...");

  for (const data of characterData) {
    if (!data.slug) {
        console.error(`❌ Characterデータにslugがありません: name=${data.name}`);
        continue;
    }
    
    await prisma.character.upsert({
      where: { slug: data.slug }, // ⭐ slugをwhere条件として使用
      update: {
        name: data.name,
        imagePath: data.imagePath,
        // slugは更新しない（where条件と同じため）
      },
      create: {
        name: data.name,
        slug: data.slug,
        imagePath: data.imagePath,
      },
    });
  }
  console.log("-> Characters finished.");
}
