import { JudgeType, MissionExamLanguages, Prisma } from "@prisma/client"
import { prisma } from "../lib/prisma"

/**
 * @abstract ミッション試験の進捗を追加
 * @summary ミッション試験の進捗をデータベースに保存する
 * @example
 * Request
 * {
 *   "examId": "1",
 *   "userId": "1",
 *   "progressId": "1",
 *   "result": {
 *     "score": 80,
 *     "isPassed": true,
 *     "feedback": "良い結果です"
 *   }
 * }
 * Response
 * {
 *   "id": "1",
 *   "examId": "1",
 *   "userId": "1",
 *   "progressId": "1",
 *   "result": {
 *     "score": 80,
 *     "isPassed": true,
 *     "feedback": "良い結果です"
 *   }
 * }
 * @description
 * ミッション試験の進捗をデータベースに保存するAPIです。
 * 試験の結果として、スコア、合否、フィードバックを含むオブジェクトを受け取ります。
 * 成功した場合は、保存された進捗情報をJSON形式で返します。
 * 失敗した場合は、エラーメッセージを返します。
 * 
 * @param examId
 * @param userId
 * @param progressId
 * @param result
 * @returns 
 */
export const createMissionExamProgress = async (
  examId: string,
  userId: string,
  progressId: string,
  result: {
    score: number;
    isPassed: boolean;
    good: string[];
    bad: string[];
    feedbacks: { index: number; type: JudgeType; text: string }[];
  },
  code: { [key in MissionExamLanguages]?: string }
) => {
  console.log("コード保存用データ:", code);
  try {
    const MAX_LENGTH = 10000;
    //結果保存
    return await prisma.$transaction(async (tx) => {
      const progress = await tx.missionExamProgress.create({
        data: {
          examId,
          userId,
          progressId,
          point: result.score,
          isPassed: result.isPassed,
          good: result.good,
          bad: result.bad,
          feedbacks: result.feedbacks,
        },
      });

      //コード保存
      const userCodes: Prisma.MissionExamUserCodeCreateManyInput[] = [];

      for (const language of Object.keys(code) as MissionExamLanguages[]) {
        const value = code[language];
        if (!value || value.length > MAX_LENGTH) continue;

        userCodes.push({
          examProgressId: progress.id,
          language,
          code: value,
        });
      }

      if (userCodes.length > 0) {
        await tx.missionExamUserCode.createMany({
          data: userCodes,
        });
      }

      return progress;
    });
  } catch (error) {
    console.error(`${examId} の試験進捗作成に失敗`, error);
    return null;
  }
};


/**
 * 特定の missionId に対応する MissionExamProgress を取得
 * 
 * @param missionId 対象のミッションID
 * @param select Prismaのselect構文を指定（取得フィールドを制御）
 */
export const fetchMissionExamProgress = async (userId: string, examId: string, select: object) => {
  try {
    const result = await prisma.missionExamProgress.findMany({
      where: {
        userId: userId,
        examId: examId,
      },
      select,
      orderBy: {
        createdAt: "desc",
      },
    });

    return result;
  } catch (error) {
    console.log(`Service/missionExamProgressService/fetchMissionExamProgressでエラー\n${error}`);
    return null;
  }
};

/**
 * 特定の missionId に対応する 最新のMissionExamProgress を取得
 * 
 * @param missionId 対象のミッションID
 * @param select Prismaのselect構文を指定（取得フィールドを制御）
 */
export const fetchLatesMissionExamProgress = async (userId: string, examId: string, select: object) => {
  try {
    const result = await prisma.missionExamProgress.findFirst({
      where: {
        userId: userId,
        examId: examId,
      },
      select,
      orderBy: {
        createdAt: "desc",
      },
    });

    return result;
  } catch (error) {
    console.log(`Service/missionExamProgressService/fetchLatestMissionExamProgressでエラー\n${error}`);
    return null;
  }
};

/**
 * 選択したフィードバックを更新
 * 
 * @param progressId 
 * @param selectedIndex 
 * @param selectedJudgeType 
 * @returns 
 */
export const updateSelectedFeedback = async(userId: string, progressId: string, selectedIndex: number, selectedJudgeType: JudgeType, elapsedTimeSec: number) => {
  console.log("経過時間", elapsedTimeSec);
  try {
    //ユーザのデータがあるか確認
    const progress = await prisma.missionExamProgress.findFirst({
      where: {
        id: progressId,
        userId,
      },
    });

    if (!progress) return null;

    const result = await prisma.missionExamProgress.update({
      where: {
        id: progressId,
      },
      data: {
        selectedFeedbackIndex: selectedIndex,
        selectedFeedbackType: selectedJudgeType,
        learningTimeSec: elapsedTimeSec
      },
    });

    return result;
  } catch (error) {
    console.log(`Service/missionExamProgressService/updateSelectedFeedbackでエラー\n${error}`);
    return null;
  }
}