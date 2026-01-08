import { PrismaClient, MissionType } from "@prisma/client";
import fs from "fs";
import path from "path";
import { title } from "process";

// JSONファイルからデータを読み込み
const missionDataPath = path.join(__dirname, 'java.json');
const missionData = JSON.parse(
  fs.readFileSync(missionDataPath, "utf-8")
);

// Slugを使用して関連エンティティを接続するためのヘルパー型
type ConnectBySlug = { connect: { slug: string } };
type CreateMissionRelation = {
  order: number;
  sentence: string;
  speaker: ConnectBySlug;
};

export async function seedMissions(prisma: PrismaClient) {
  console.log("-> Seeding Missions...");

  for (const mission of missionData) {
    // 必須Slugフィールドの存在チェック
    if (!mission.slug || !mission.clientSlug || !mission.difficultySlug) {
      console.error(
        `❌ 必須Slugが不足: title=${mission.title}, slug=${mission.slug}`
      );
      continue;
    }

    // 1. MissionのSlugを使って存在チェック
    const existingMission = await prisma.mission.findUnique({
      where: { slug: mission.slug },
    });

    // 2. 関連データ (Sentences, Steps) の変換
    const beforeSentences: CreateMissionRelation[] = mission.beforeSentences?.map(
      (sentence: any) => ({
        order: sentence.order,
        sentence: sentence.sentence,
        // Slugでconnect
        speaker: { connect: { slug: sentence.speakerSlug } },
      })
    ) || [];

    const afterSentences: CreateMissionRelation[] = mission.afterSentences?.map(
      (sentence: any) => ({
        order: sentence.order,
        sentence: sentence.sentence,
        // Slugでconnect
        speaker: { connect: { slug: sentence.speakerSlug } },
      })
    ) || [];

    const steps = mission.steps.map((step: any) => ({
      order: step.order,
      title: step.title,
      detail: step.detail,
      explains: {
        create: step.explains.map((exp: any) => ({
          order: exp.order,
          content: exp.content,
          highlight: exp.highlight,
          componentType: exp.componentType,
          code: exp.code ?? null,
          // Slugでconnect
          supporter: { connect: { slug: exp.supporterSlug } },
        })),
      },
      stepExams: {
        create: step.stepExams.map((exam: any) => ({
          content: exam.content,
          answer: exam.answer,
          highlight: exam.highlight,
          componentType: exam.componentType,
          order: exam.order,
          instructions: exam.instructions,
          // Slugでconnect
          supporter: { connect: { slug: exam.supporterSlug } },
        })),
      },
    }));

    // 3. Missionの基本データ
    const baseMissionData = {
      title: mission.title,
      detail: mission.detail,
      type: mission.type as MissionType,
      component: mission.component,
      experience: mission.experience,
      // Slugでconnect
      client: { connect: { slug: mission.clientSlug } },
      // Slugでconnect
      difficulty: { connect: { slug: mission.difficultySlug } },
    };

    let missionId: string;

    if (existingMission) {
      // Missionの更新処理: 関連データは一度削除してから再作成
      const currentId = existingMission.id;

      // 既存のSteps, Sentences, Examsを全て削除
      await prisma.step.deleteMany({ where: { missionId: currentId } });
      await prisma.missionBeforeSentence.deleteMany({
        where: { missionId: currentId },
      });
      await prisma.missionAfterSentence.deleteMany({
        where: { missionId: currentId },
      });
      await prisma.missionExam.deleteMany({ where: { missionId: currentId } });

      const updatedMission = await prisma.mission.update({
        where: { id: currentId },
        data: {
          ...baseMissionData,
          steps: { create: steps },
          beforeSentences: { create: beforeSentences },
          afterSentences: { create: afterSentences },
        },
      });
      missionId = updatedMission.id;
      console.log(`✅ Mission updated: ${mission.title} (${mission.slug})`);
    } else {
      // Missionの作成処理

      const createdMission = await prisma.mission.create({
        data: {
          ...baseMissionData,
          slug: mission.slug, // 新規作成時はslug必須
          steps: { create: steps },
          beforeSentences: { create: beforeSentences },
          afterSentences: { create: afterSentences },
        },
      });
      missionId = createdMission.id;
      console.log(`✅ Mission created: ${mission.title} (${mission.slug})`);
    }

    // --- MissionExam の作成 ---
    if (mission.exams?.length) {
      for (const exam of mission.exams) {
        console.log(exam.type);
        await prisma.missionExam.create({
          data: {
            missionId,
            criteria: exam.criteria, // JSONをそのまま保存
            instructions: exam.instructions,
            type: exam.type,
            component: exam.component,
            exampleCode: exam.exampleCode,
            language: exam.language,
          },
        });
      }
    }
  }

  console.log("-> Missions finished.");
}