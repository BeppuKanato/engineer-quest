import fs from "fs";
import path from "path";
import {
  ExamType,
  MissionExamLanguages,
  MissionType,
  Prisma,
  PrismaClient,
} from "@prisma/client";

/**
 * JSONの型定義
 */

type MissionSentenceSeed = {
  speakerSlug: string;
  sentence: string;
  order: number;
};

type ExplainSeed = {
  order: number;
  content: string;
  supporterSlug: string;
  componentType: string | null;
  code: string;
  highlight?: string | null;
};

type StepExamSeed = {
  order: number;
  content: string;
  instructions: string[];
  answer: string;
  supporterSlug: string;
  highlight?: string | null;
  componentType?: string | null;
};

type StepSeed = {
  order: number;
  title: string;
  detail: string;
  explains: ExplainSeed[];
  stepExams: StepExamSeed[];
};

type MissionExamCriteriaSeed = {
  score: number;
  factor: string[];
};

type MissionExamExampleCodeSeed = Partial<
  Record<MissionExamLanguages, string>
>;

type MissionExamSeed = {
  criteria: MissionExamCriteriaSeed;
  type: ExamType;
  component?: string | null;
  instructions: string[];
  exampleCode?: MissionExamExampleCodeSeed | null;
  language?: MissionExamLanguages[];
};

type MissionSeed = {
  slug: string;
  title: string;
  detail: string;
  type: MissionType;
  component: string;
  experience: number;
  clientSlug: string;
  difficultySlug: string;
  star: number;
  beforeSentences: MissionSentenceSeed[];
  afterSentences: MissionSentenceSeed[];
  steps: StepSeed[];
  exams: MissionExamSeed[];
};

/**
 * relation create 用の補助型
 */
type CreateMissionSentenceInput = {
  order: number;
  sentence: string;
  speaker: {
    connect: {
      slug: string;
    };
  };
};

/**
 * JSON読み込み
 */
const missionDataPath = path.join(__dirname, "java.json");
const missionData = JSON.parse(
  fs.readFileSync(missionDataPath, "utf-8")
) as MissionSeed[];

export async function seedMissions(prisma: PrismaClient) {
  console.log("-> Seeding Missions...");

  for (const mission of missionData) {
    if (!mission.slug || !mission.clientSlug || !mission.difficultySlug) {
      console.error(
        `❌ 必須Slugが不足: title=${mission.title}, slug=${mission.slug}`
      );
      continue;
    }

    const existingMission = await prisma.mission.findUnique({
      where: { slug: mission.slug },
    });

    const beforeSentences: CreateMissionSentenceInput[] =
      mission.beforeSentences.map((sentence) => ({
        order: sentence.order,
        sentence: sentence.sentence,
        speaker: {
          connect: { slug: sentence.speakerSlug },
        },
      }));

    const afterSentences: CreateMissionSentenceInput[] =
      mission.afterSentences.map((sentence) => ({
        order: sentence.order,
        sentence: sentence.sentence,
        speaker: {
          connect: { slug: sentence.speakerSlug },
        },
      }));

    const steps = mission.steps.map((step) => ({
      order: step.order,
      title: step.title,
      detail: step.detail,
      explains: {
        create: step.explains.map((exp) => ({
          order: exp.order,
          content: exp.content,
          highlight: exp.highlight ?? null,
          componentType: exp.componentType ?? null,
          code: exp.code ?? null,
          supporter: {
            connect: { slug: exp.supporterSlug },
          },
        })),
      },
      stepExams: {
        create: step.stepExams.map((exam) => ({
          content: exam.content,
          answer: exam.answer,
          highlight: exam.highlight ?? null,
          componentType: exam.componentType ?? null,
          order: exam.order,
          instructions: exam.instructions,
          supporter: {
            connect: { slug: exam.supporterSlug },
          },
        })),
      },
    }));

    const baseMissionData = {
      title: mission.title,
      detail: mission.detail,
      type: mission.type,
      component: mission.component,
      experience: mission.experience,
      client: {
        connect: { slug: mission.clientSlug },
      },
      difficulty: {
        connect: { slug: mission.difficultySlug },
      },
      star: mission.star ?? 1,
    };

    let missionId: string;

    if (existingMission) {
      const currentMissionId = existingMission.id;

      // 関連データ削除
      await prisma.step.deleteMany({
        where: { missionId: currentMissionId },
      });

      await prisma.missionBeforeSentence.deleteMany({
        where: { missionId: currentMissionId },
      });

      await prisma.missionAfterSentence.deleteMany({
        where: { missionId: currentMissionId },
      });

      await prisma.missionExam.deleteMany({
        where: { missionId: currentMissionId },
      });

      const updatedMission = await prisma.mission.update({
        where: { id: currentMissionId },
        data: {
          ...baseMissionData,
          steps: {
            create: steps,
          },
          beforeSentences: {
            create: beforeSentences,
          },
          afterSentences: {
            create: afterSentences,
          },
        },
      });

      missionId = updatedMission.id;
      console.log(`✅ Mission updated: ${mission.title} (${mission.slug})`);
    } else {
      const createdMission = await prisma.mission.create({
        data: {
          ...baseMissionData,
          slug: mission.slug,
          steps: {
            create: steps,
          },
          beforeSentences: {
            create: beforeSentences,
          },
          afterSentences: {
            create: afterSentences,
          },
        },
      });

      missionId = createdMission.id;
      console.log(`✅ Mission created: ${mission.title} (${mission.slug})`);
    }

    if (mission.exams.length > 0) {
      for (const exam of mission.exams) {
        await prisma.missionExam.create({
          data: {
            missionId,
            criteria: exam.criteria as Prisma.InputJsonValue,
            instructions: exam.instructions,
            type: exam.type,
            component: exam.component ?? null,
            exampleCode:
              exam.exampleCode === null
                ? Prisma.JsonNull
                : (exam.exampleCode as Prisma.InputJsonValue | undefined),
            language: exam.language ?? undefined,
          },
        });
      }
    }
  }

  console.log("-> Missions finished.");
}