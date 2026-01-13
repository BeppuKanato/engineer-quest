import { MissionStatus } from "@prisma/client"
import { prisma } from "../lib/prisma"

/**
 * @abstract ミッション進捗を取得
 * @summary ユーザのミッション進捗を取得する
 * @param missionId
 * @param userId
 * @param extraWhere
 * @param select
 * @returns ミッション進捗情報、もしくはnull
 * @example
 * Request
 * {
 *   "missionId": "1",
 *   "userId": "1"
 * }
 * Response
 * {
 *   "id": "1",
 *   "missionId": "1",
 *  "userId": "1",
 *  "status": "IN_PROGRESS",
 *  "currentStep": 2,
 *  "createdAt": "2024-01-01T00:00:00.000Z",
 *  "updatedAt": "2024-01-02T00:00:00.000Z"
 * }
 * @description
 * ユーザの特定のミッションに対する進捗情報を取得するAPIです。
 * ミッションIDとユーザIDを指定して、進捗情報をデータベースから取得します。
 * 成功した場合は、進捗情報をJSON形式で返します。
 * 失敗した場合は、エラーメッセージを返します。
 * extraWhereとselectパラメータを使用して、追加のフィルタリングや選択を行うことができます。
 * extraWhereは進捗情報のフィルタリング条件を指定し、selectは返されるフィールドを指定します。
 * 例えば、extraWhereに{status: 'IN_PROGRESS'}を指定すると、進行中のミッション進捗のみを取得できます。
 * selectに{status: true, currentStep: true}を指定すると、statusとcurrentStepフィールドのみが返されます。
 * これにより、必要な情報だけを効率的に取得できます。
 * 
 */
export const fetchMissionProgress = async(missionId: string, userId: string, extraWhere: object, select: object) => {
    try {
        const progres = await prisma.missionProgress.findFirst({
            where: {
                missionId: missionId,
                userId: userId,
                ...extraWhere,
            },
            select
        })

        return progres;
    }
    catch(error) {
        console.log(`Service/missionProgressService/fetchWorkingMissionProgressでエラー${error}`)
        return null
    }
}

/**
 * @abstract ミッション進捗を更新
 * @summary ミッション進捗を更新する
 * @example
 * Request
 * {
 *   "progressId": "1",
 *  "data": {
 *    "status": "COMPLETED",
 *   "currentStep": 3
 * }
 * }
 * Response
 * {
 *  "id": "1",
 * "missionId": "1",
 * "userId": "1",
 * "status": "COMPLETED",
 * "currentStep": 3,
 * "createdAt": "2024-01-01T00:00:00.000Z",
 * "updatedAt": "2024-01-02T00:00:00.000Z"
 * }
 * @description
 * ミッション進捗を更新するAPIです。
 * 進捗IDと更新データをリクエストボディで受け取り、指定された進捗情報をデータベースで更新します。
 * 成功した場合は、更新された進捗情報をJSON形式で返します。
 * 失敗した場合は、エラーメッセージを返します。
 * @param progressId
 * @param data
 * @returns 更新されたミッション進捗情報、もしくはnull
 */
export const updateMissionProgress = async(progressId: string, data: object) => {
    try {
        const updated = await prisma.missionProgress.update({
            where: {
                id: progressId
            },
            data,
        });

        return updated;
    }
    catch(error) {
        console.log(`Service/missionProgressService/updateMissionProgressでエラー\n${error}`);
    }
}

/**
 * @abstract ミッション進捗を作成
 * @summary ミッション進捗をデータベースに保存する
 * @example
 * Request
 * {
 *   "missionId": "1",
 *  "userId": "1"
 * }
 * Response
 * {
 *  "id": "1",
 * "missionId": "1",
 * "userId": "1",
 * "status": "NOT_STARTED",
 * "currentStep": 1,
 * "createdAt": "2024-01-01T00:00:00.000Z",
 * "updatedAt": "2024-01-01T00:00:00.000Z"
 * }
 * @description
 * ミッション進捗をデータベースに保存するAPIです。
 * ミッションIDとユーザIDをリクエストボディで受け取り、進捗情報をデータベースに保存します。
 * 成功した場合は、保存された進捗情報をJSON形式で返します。
 * 失敗した場合は、エラーメッセージを返します。
 * 
 * @param missionId 
 * @param userId 
 * @returns 
 */
export const createMissionProgress =async(missionId: string, userId: string) => {
    try {
        const progress = await prisma.missionProgress.create({
            data: {
                missionId: missionId,
                userId: userId,
                status: MissionStatus.NOT_STARTED,
                currentStep: 1,
            }
        })

        return progress
    }
    catch(error) {
        console.log(`${missionId}を進行中ミッションに追加中にエラー${error}`)
        return null;
    }
}