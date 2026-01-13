import { Request, Response } from "express";
import { getAcceptableMissions } from "../service/missionService";
import { fetchUser } from "../service/userService";
import { createMissionProgress } from "../service/missionProgressService";
import { AuthRequest } from "../middleware/verifyToken";
import { requiredExperienceForLevel } from "../domain/level";

/**
 * @abstract ホーム画面表示API
 * @summary 受注可能なミッションとユーザ情報を取得する
 * @example
 * Request
 * {
 *   "userId": 1
 * }
 * Response
 * {
 *  "acceptableMission": [
 *   {
 *    "id": 1,
 *   "title": "ミッション1",
 *   "description": "ミッション1の説明",
 *  "rewardExperience": 100,
 *  "rewardRankPoint": 10,
 *  "levelRequirement": 1
 *  },
 *  ...
 * ],
 * "user": {
 *  "id": 1,
 * "name": "ユーザ1",
 * "level": 1,
 * "experience": 100,
 * "rank": {
 *   "name": "ランク1"
 *  },
 * "levelRequirement": {
 *   "requiredExperience": 100
 *  }
 * }
 * }
 * @description
 * 受注可能なミッションとユーザ情報を取得するAPIです。
 * ミッションはユーザのレベルに応じてフィルタリングされます。
 * ユーザ情報には、現在のレベル、経験値、ランク、および次のレベルに必要な経験値が含まれます。
 * ミッションが存在しない場合、もしくはデータ取得に失敗した場合はエラーメッセージを返します。
 * 成功した場合は、受注可能なミッションとユーザ情報をJSON形式で返します。
 * 
 * @param req 
 * @param res 
 */
export const homeController = async (req: AuthRequest, res: Response) => {
  const userId = req.user!.uid;

  const acceptableMission = await getAcceptableMissions(userId);
  const user = await fetchUser(userId, {
    name: true,
    level: true,
    experience: true,
    rank: {
      select: { name: true },
    },
  }) as {
    name: string,
    level: number,
    experience: number,
    rank: {
        name: string
    }
  };

  if (!user) {
    return res.status(500).json({ error: "ユーザ取得失敗" });
  }

  // 次のレベルに必要な経験値
  const requiredExpForNextLevel = requiredExperienceForLevel(user.level);

  // 残り経験値
  const remainingExp = Math.max(requiredExpForNextLevel - user.experience, 0);

  res.status(200).json({
    acceptableMission,
    user,
    experienceStatus: {
      currentLevel: user.level,
      currentExp: user.experience,
      requiredExpForNextLevel,
      remainingExp,
      progressRate:
        requiredExpForNextLevel > 0
          ? user.experience / requiredExpForNextLevel
          : 0,
    },
  });
};

/**
 * @abstract ミッション受注API
 * @summary ミッションを受注し、ミッション進捗を作成する
 * @example
 * Request
 * {
 *   "missionId": 1,
 *   "userId": 1
 * }
 * Response
 * {
 *   "userId": 1
 * }
 * 
 * @description
 * ミッションを受注し、ミッション進捗を作成するAPIです。
 * ミッションIDとユーザIDをリクエストボディで受け取り、ミッション進捗をデータベースに保存します。
 * 成功した場合は、受注したユーザIDをJSON形式で返します。
 * 失敗した場合はエラーメッセージを返します。
 * 
 * @param req
 * @param res
 */
export const acceptController = async(req: AuthRequest, res: Response) => {
    const { missionId } = req.body;

    const userId = req.user!.uid;

    const progress = await createMissionProgress(missionId, userId)

    if (progress !== null) {
        res.status(200).json({userId: userId});
    }
    else {
        res.status(500).json({error: "ミッションの受注に失敗しました"});
    }
}