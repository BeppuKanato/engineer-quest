import { PrismaClient } from "@prisma/client";
import fs from 'fs';
import path from 'path';

// JSONファイルからデータを読み込みます。
const unlockDataPath = path.join(__dirname, 'web.json');
const unlockData = JSON.parse(
    fs.readFileSync(unlockDataPath, 'utf-8')
);

/**
 * MissionUnlockByMissionモデルのシードを実行します。
 * missionSlugとrequiredSlugを使って、ミッション間の依存関係を設定します。
 * @param prisma - PrismaClientのインスタンス
 */
export async function seedMissionUnlocks(prisma: PrismaClient) {
    console.log("-> Seeding Mission Unlocks...");

    for (const data of unlockData) {
        // missionSlugとrequiredSlugからMission IDを取得
        const mission = await prisma.mission.findUnique({
            where: { slug: data.missionSlug },
            select: { id: true, title: true }
        });

        const required = await prisma.mission.findUnique({
            where: { slug: data.requiredSlug },
            select: { id: true, title: true }
        });

        if (!mission) {
            console.error(`❌ 開放されるMissionが見つかりません: Slug=${data.missionSlug}`);
            continue;
        }
        if (!required) {
            console.error(`❌ 要求Missionが見つかりません: Slug=${data.requiredSlug}`);
            continue;
        }

        // 既存のアンロック条件がないかチェック（複合ユニーク制約がないため）
        const existingUnlock = await prisma.missionUnlockByMission.findFirst({
            where: {
                missionId: mission.id,
                requiredId: required.id,
            }
        });

        if (!existingUnlock) {
             // データが存在しない場合のみ作成
             await prisma.missionUnlockByMission.create({
                data: {
                    missionId: mission.id,
                    requiredId: required.id,
                }
            });
            console.log(`✅ アンロック条件を設定: ${mission.title} (${data.missionSlug}) は ${required.title} (${data.requiredSlug}) を要求します`);
        } else {
             console.log(`ℹ️ アンロック条件はすでに設定済みです: ${data.missionSlug} -> ${data.requiredSlug}`);
        }
    }
    console.log("-> Mission Unlocks finished.");
}