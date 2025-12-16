import { MissionStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";

/**
 * @abstract ユーザを取得
 * @summary 特定のユーザをデータベースから取得する
 * @example
 * Request
 * {
 *  "id": "1",
 * "select": {
 *  "name": true,
 *  "email": true
 * }
 * }
 * Response
 * {
 *   "id": "1",
 *   "name": "Sample User",
 *   "email": "sample@example.com"
 * }
 * @description
 * 特定のユーザをデータベースから取得するAPIです。
 * ユーザIDと取得したいフィールドを指定して、ユーザ情報をデータベースから取得します。
 * 成功した場合は、ユーザ情報をJSON形式で返します。
 * 失敗した場合は、エラーメッセージを返します。
 * 
 * @param id 
 * @param select 
 * @returns 
 */
export const fetchUser = async(id: string, select: object) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: id
      },
      select
    })

    return user
  }
  catch(error) {
    console.log(`Service/userService/fetchUserでエラー\n${error}`)
    return null
  }
}

// /**
//  * @abstract ユーザの学習時間を取得
//  * @summary ユーザの今日、今週、総合の学習時間を取得する
//  * @example
//  * Request
//  * {
//  *   "userId": "1"
//  * }
//  * Response
//  * {
//  *  "today": 120,
//  * "week": 600,
//  * "total": 3600
//  * }
//  * @description
//  * ユーザの今日、今週、総合の学習時間を取得するAPIです。
//  * ユーザIDを指定して、学習時間をデータベースから取得します。
//  * 成功した場合は、学習時間をJSON形式で返します。
//  * 失敗した場合は、エラーメッセージを返します。
//  * 
//  * @param userId 
//  * @returns 
//  */
// export const getUserLearningTime = async(userId: string) => {
//   const now = new Date();

//   //今日の日付開始時刻
//   const startOfToday = new Date(now)
//   startOfToday.setHours(0, 0, 0, 0)

//   //今日の曜日を取得
//   const dayOfWeek = now.getDate();
//   const startOfWeek = new Date(startOfToday)
//   //週の開始日を計算する
//   //dayOfWeek = 0: 日曜日
//   startOfWeek.setDate(startOfToday.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

//   try {
//     //今日の学習時間
//     const todayUsage = await prisma.dailyUsage.aggregate({
//       where: {
//         userId: userId,s
//         date: { gte: startOfToday}
//       },
//       _sum: {
//         usageTime: true
//       }
//     });
//     //週の学習時間
//     const weekUsage = await prisma.dsailyUsage.aggregate({
//       where: {
//         userId: userId,
//         date: { gte: startOfWeek}
//       },
//       _sum: {
//         usageTime: true
//       }
//     });
//     //総合学習時間
//     const totalUsage = await prisma.dailyUsage.aggregate({
//       where: {
//         userId: userId
//       },
//       _sum: {
//         usageTime: true
//       }
//     });

//     return {
//       today: todayUsage._sum.usageTime ?? 0,
//       week: weekUsage._sum.usageTime ?? 0,
//       total: totalUsage._sum.usageTime ?? 0
//     }
//   }
//   catch(error) {
//     console.log(`service/userService/getUserLearningTimeでエラー\n${error}`)

//     return null
//   }
// }

export const updateUser = async(id: string, data: object) => {
  try {
    const updated = await prisma.user.update({
      where: { id },
      data
    })

    return updated
  }
  catch(error) {
    console.log(`service/userService/updateUserでエラー\n${error}`)
    return null
  }
}