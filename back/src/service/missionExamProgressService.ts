import { JudgeType } from "@prisma/client"
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
export const createMissionExamProgress = async (examId: string, userId: string, progressId: string, result: {score: number, isPassed: boolean, good: string[], bad: string[], feedback: string | null}, judgeType: JudgeType) => {
    try {
        const progress = await prisma.missionExamProgress.create({
            data: {
                examId: examId,
                userId: userId,
                progressId: progressId,
                point: result.score,
                isPassed: result.isPassed,
                good: result.good,
                bad: result.bad,
                feedback: result.feedback,
                judgeType: judgeType,
            }
        })

        return progress
    }
    catch(error) {
        console.log(`${examId}の状況の追加に失敗`)
        return null;
    }
}

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