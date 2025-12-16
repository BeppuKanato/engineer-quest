import { prisma } from "../lib/prisma"

/**
 * @abstract ステップを取得
 * @summary 特定のステップをデータベースから取得する
 * @example
 * Request
 * {
 *  "id": "1",
 * "select": {
 *   "title": true,
 *   "description": true
 * }
 * }
 * Response
 * {
 *   "id": "1",
 *   "title": "Sample Step",
 *   "description": "This is a sample step."
 * }
 * @description
 * 特定のステップをデータベースから取得するAPIです。
 * ステップIDと取得したいフィールドを指定して、ステップ情報をデータベースから取得します。
 * 成功した場合は、ステップ情報をJSON形式で返します。
 * 失敗した場合は、エラーメッセージを返します。
 * 
 * @param id ステップID
 * @param select 取得するフィールド
 * @returns ステップ情報、もしくはnull
 */
export const fetchStep = async(id: string, select: object) => {
    try {
        const step = await prisma.step.findUnique({
            where: {
                id: id
            },
            select
        })

        return step
    }
    catch(error) {
        console.log(`Service/stepService/fetchStepでエラー\n${error}`)
        return null
    }
}