import { prisma } from "../lib/prisma"
import { AIResponse } from "../type";

import { JudgeType, MissionExamLanguages, MissionStatus } from "@prisma/client";
import { fetchUser } from "./userService";
import { examJudgeWithFeedback } from "./ContentsForLLM/examJudgeWithFeedback";
import OpenAI from "openai";

const feedbackTypeMap: { [key: string]: JudgeType[] } = {
  //java-mission_7 0,2,3,4
  "7f25d965-18b1-41f7-8ac8-d2be355f1d93": [
    JudgeType.PHILANTHROPIST,
    JudgeType.FREE_SPIRIT,
    JudgeType.SOCIALIZER,
    JudgeType.PLAYER,
  ],

  //java-mission_8 0,2,3,5
  "e8e65c4a-2e9d-4008-872c-c4bcc3e7eb2a": [
    JudgeType.PHILANTHROPIST,
    JudgeType.FREE_SPIRIT,
    JudgeType.SOCIALIZER,
    JudgeType.DISRUPTOR,
  ],

  //java-mission_9 0,2,4,5
  "2f4945f5-e27f-45a7-a8a4-94c572c5941b": [
    JudgeType.PHILANTHROPIST,
    JudgeType.FREE_SPIRIT,
    JudgeType.PLAYER,
    JudgeType.DISRUPTOR,
  ],

  //java-promotion-1 0,3,4,5
  "1631f289-3231-44c4-ad34-f9b08acf6324": [
    JudgeType.PHILANTHROPIST,
    JudgeType.SOCIALIZER,
    JudgeType.PLAYER,
    JudgeType.DISRUPTOR,
  ],

  //java-mission-10 1,2,3,4
  "c740ff2b-7845-42af-80c2-2629800f965e": [
    JudgeType.ACHIEVER,
    JudgeType.FREE_SPIRIT,
    JudgeType.SOCIALIZER,
    JudgeType.PLAYER,
  ],

  //java-mission-11 1,2,3,5
  "6ca3f051-9a7d-4beb-ae80-021832cf5ebb": [
    JudgeType.ACHIEVER,
    JudgeType.FREE_SPIRIT,
    JudgeType.SOCIALIZER,
    JudgeType.DISRUPTOR,
  ],

  //java-mission-12 1,2,4,5
  "795c4209-9586-4a3d-9a2a-41375a93015f": [
    JudgeType.ACHIEVER,
    JudgeType.FREE_SPIRIT,
    JudgeType.PLAYER,
    JudgeType.DISRUPTOR,
  ],

  //java-mission-13 1,3,4,5
  "cf8adad3-9b10-4f04-b371-f01e6dc6e7cd": [
    JudgeType.ACHIEVER,
    JudgeType.SOCIALIZER,
    JudgeType.PLAYER,
    JudgeType.DISRUPTOR,
  ],

  //java-promotion-2 2,3,4,5
  "8defd706-9ef5-480f-9b39-caf71187cfb0": [
    JudgeType.FREE_SPIRIT,
    JudgeType.SOCIALIZER,
    JudgeType.PLAYER,
    JudgeType.DISRUPTOR,
  ],
   //java-mission-14 0,1,2,3
  "6963306e-2a5b-4c12-9664-103af23e668c": [
    JudgeType.PHILANTHROPIST,
    JudgeType.ACHIEVER,
    JudgeType.FREE_SPIRIT,
    JudgeType.SOCIALIZER,
  ],

  //java-mission-15 0,1,2,4
  "4250056f-23b8-4a05-913f-ee10aacb6c39": [
    JudgeType.PHILANTHROPIST,
    JudgeType.ACHIEVER,
    JudgeType.FREE_SPIRIT,
    JudgeType.PLAYER,
  ],

  //java-mission-16 0,1,2,5
  "3e57ca19-8d65-47a3-9776-6117475c35fc": [
    JudgeType.PHILANTHROPIST,
    JudgeType.ACHIEVER,
    JudgeType.FREE_SPIRIT,
    JudgeType.DISRUPTOR,
  ],

  //java-mission-17 0,1,3,4
  "f555e100-569b-42d9-a9c0-c65b665fe972": [
    JudgeType.PHILANTHROPIST,
    JudgeType.ACHIEVER,
    JudgeType.SOCIALIZER,
    JudgeType.PLAYER,
  ],

  //java-mission-18 0,1,3,5
  "163c1679-b1bb-4115-9827-e85de6195aa5": [
    JudgeType.PHILANTHROPIST,
    JudgeType.ACHIEVER,
    JudgeType.SOCIALIZER,
    JudgeType.DISRUPTOR,
  ],

  //java-promotion-3 0,1,4,5
  "ce7ebec0-570d-4ca5-bfd0-4ea24ce70bdf": [
    JudgeType.PHILANTHROPIST,
    JudgeType.ACHIEVER,
    JudgeType.PLAYER,
    JudgeType.DISRUPTOR,
  ],
};


/**
 * @abstract ミッションを取得
 * @summary 特定のミッションをデータベースから取得する
 * @param id ミッションID
 * @param select 取得するフィールド
 * @returns ミッション情報、もしくはnull
 * @example
 * Request
 * {
 *   "id": "1",
 *   "select": {
 *     "title": true,
 *     "description": true
 *   }
 * }
 * Response
 * {
 *   "id": "1",
 *   "title": "Sample Mission",
 *   "description": "This is a sample mission."
 * }
 * @description
 * 特定のミッションをデータベースから取得するAPIです。
 * ミッションIDと取得したいフィールドを指定して、ミッション情報をデータベースから取得します。
 * 成功した場合は、ミッション情報をJSON形式で返します。
 * 失敗した場合は、エラーメッセージを返します。
 * 
 */
export const fetchMission = async(id: string, select: object) => {
    try {
        const mission = await prisma.mission.findUnique({
            where: {
                id: id,
            },
            select
        })

        return mission
    }
    catch(error) {
        console.log(`Service/missionService/fetchMissionでエラー${error}`)
        return null
    }
}

import { Prisma } from "@prisma/client";

export const fetchMissions = async (
  args: Prisma.MissionFindManyArgs
) => {
  try {
    return await prisma.mission.findMany(args);
  } catch (error) {
    console.log(`fetchMissions error`, error);
    return null;
  }
};

/**
 * @abstract ミッション試験の採点
 * @summary ミッション試験のコードをAIで採点する
 * @example
 * Request
 * {
 *   "missionCode": "function add(a, b) { return a + b; }",
 *  "userCode": "function add(a, b) { return a - b; }",
 *  "factor": "コードの正確性、効率性、可読性"
 * }
 * Response
 * {
 *  "score": 72,
 * "reason": "機能は正しく実装されており、基本要件を満たしている。変数名や関数の分割で改善余地がある。",
 * "feedback": "基本の機能をしっかり実装できています！特に〇〇の部分は工夫が感じられました。次は関数を分けて整理できると、さらに冒険が進みやすくなりますよ。"
 * }
 * @description
 * ミッション試験のコードをAIで採点するAPIです。
 * ミッションコードとユーザコード、採点要素をリクエストボディで受け取り、AIを使用して採点します。
 * 成功した場合は、採点結果をJSON形式で返します。
 * 失敗した場合は、エラーメッセージを返します。
 * 
 * @param missionCode 
 * @param userCode 
 * @param factor 
 * @returns 
 */
export const missionExamJudgeService = async(missionId: string, missionCode: {[key in MissionExamLanguages]?: string}, userCode: {[key in MissionExamLanguages]?: string}, factor: string[], instructions: string[]) => {
    const selectedJudgeTypes = feedbackTypeMap[missionId];
    const settings = examJudgeWithFeedback(
        missionCode,
        userCode,
        factor,
        instructions,
        selectedJudgeTypes
    );
    try {
        //openai API 呼び出し
        const ai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        });
        const response = await ai.responses.create({
            model: "gpt-4o-mini", 
            input: [
            {
                role: "system",
                content: settings.systemInstruction,
            },
            {
                role: "user",
                content: settings.contents,
            },
        ],
            temperature: 0.2,
            top_p: 0.1,
        });

        const text = response.output_text;
        if (!text) return null;

        // ```json ... ``` を除去
        const cleaned = text
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

        const json: AIResponse = JSON.parse(cleaned);

        if (json === null) {
            return null;
        }

        return json
    }
    catch(error) {
        console.log(`service/missionExamJudgeServiceでエラー: ${error}`)
        return null;
    }
}

type UserProgressData = {
  level: number;
  userAchievements: { achievementId: string }[];
  missionProgresses: { missionId: string }[];
  rank: { id: string; order: number };
};

/**
 * @abstract 受けられるミッションを取得
 * @summary ユーザが受けられるミッションを取得する
 * @param userId ユーザーID
 * @returns 受けられるミッションの配列、もしくはnull
 * @example
 * Request
 * {
 *  "userId": "1"
 * }
 * Response
 * [
 * {
 *  "id": "1",
 * "title": "Sample Mission",
 * "detail": "This is a sample mission.",
 * "type": "MAIN",
 * "client": {
 *   "id": "1",
 *  "name": "Client A",
 *  "imagePath": "/images/clientA.png"
 * },
 * "difficulty": {
 *   "id": "1",
 *  "name": "Easy"
 * },
 * "unlockByLevel": [
 *   {
 *   "id": "1",
 *  "level": 5
 * }
 * ],
 * "unlockByAchievement": [],
 * "unlockByMission": [],
 * "unlockByRank": [
 *   {
 *   "id": "1",
 *  "rank": {
 *    "id": "1",
 *   "name": "Bronze",
 *   "order": 1
 *  }
 * }
 * ],
 * "beforeSentences": [
 *   {
 *     "id": "1",
 *     "text": "このミッションでは、あなたのスキルを試すことができます。"
 *   }
 * ]    
 * }
 * ]
 * @description 
 * ユーザが受けられるミッションをデータベースから取得するAPIです。
 * ユーザIDを指定して、受けられるミッションをデータベースから取得します。
 * ミッションは、ユーザのレベル、達成済み実績、完了済みミッション、ランクに基づいてフィルタリングされます。
 * 成功した場合は、受けられるミッションの配列をJSON形式で返します。
 * 失敗した場合は、エラーメッセージを返します。
 * 
 */
export const getAcceptableMissions = async(userId: string) => {
    try {
        const notAccept = await prisma.mission.findMany({
            where: {
                missionProgresses: {
                    none: {userId}
                },
            },
            include: {
                difficulty: true,
                client: true,
                unlockByLevel: true,
                unlockByAchievement: true,
                unlockByMission: true,
                unlockByRank: {
                    include: {
                        rank: true
                    }
                },
                beforeSentences: {
                    include: {
                        speaker: {
                            select: {
                                name: true,
                                imagePath: true
                            }
                        }
                    },
                    orderBy: {
                        order: "asc"
                    }
                },
            },
        });

        const userData = await fetchUser(userId, {
            level: true,
            userAchievements: {
                select: {
                    id: true,
                },
            },
            missionProgresses: {
                where: {
                    status: MissionStatus.COMPLETED,
                },
                select: {
                    missionId: true
                },
            },
            rank: {
                select: {
                    id: true,
                    order: true,
                },
            },
        }) as UserProgressData | null

        if (userData === null) {
            console.log("service/getAcceptableMissionでuserDataがNULL")
            return null;
        }
        //ミッション毎にフィールターに通す
        const availableMissions = notAccept.filter(mission => 
            mission.unlockByLevel.every(l => userData.level >= l.level) &&
            mission.unlockByMission.every(m => userData.missionProgresses.some(p => p.missionId === m.requiredId)) &&
            mission.unlockByAchievement.every(a => userData.userAchievements.some(ua => ua.achievementId === a.requiredId)) &&
            mission.unlockByRank.every(r => userData.rank.order >= r.rank.order)
        );

        return availableMissions
    }
    catch(error) {
        console.log(`service/getAcceptableMissionでエラー: ${error}`)
        return null;
    }
}

/**
 * @abstract 受けたミッションを取得
 * @summary ユーザが受けたミッションを取得する
 * @example
 * Request
 * {
 *  "userId": "1"
 * }
 * Response
 * [
 * {
 * "id": "1",
 * "title": "Sample Mission",
 * "detail": "This is a sample mission.",
 * "type": "MAIN",
 * "client": {
 *  "id": "1",
 * "name": "Client A",
 * "imagePath": "/images/clientA.png"
 * },
 * "difficulty": {
 *  "id": "1",
 * "name": "Easy"
 * },
 * "missionProgresses": [
 * {
 * "id": "1",
 * "status": "IN_PROGRESS",
 * "currentStep": 2,
 * "completedAt": null
 * }
 * ]
 * }
 * ]
 * * @description
 * ユーザが受けたミッションをデータベースから取得するAPIです。
 * ユーザIDを指定して、受けたミッションをデータベースから取得します。
 * ミッションは、進行中または未開始のミッションにフィルタリングされます。
 * 成功した場合は、受けたミッションの配列をJSON形式で返します。
 * 失敗した場合は、エラーメッセージを返します。
 * 
 * @param userId ユーザーID
 * @returns 受けたミッションの配列、もしくはnull
 */
export const getAcceptedMissions = async(userId: string) => {
    try {
        const accepted = await prisma.mission.findMany({
            where: {
                missionProgresses: {
                    some: {
                        userId: userId,
                        status: {
                            in: [MissionStatus.IN_PROGRESS, MissionStatus.NOT_STARTED]
                        }
                    }
                }
            },
            select: {
                id: true,
                title: true,
                detail: true,
                type: true,
                client: true,
                missionProgresses: {
                    where: {
                        userId: userId,
                        status: {
                            in: [MissionStatus.IN_PROGRESS, MissionStatus.NOT_STARTED]
                        },
                    },
                    select: {
                        status: true,
                        currentStep: true,
                        completedAt: true
                    }
                },
                difficulty: {
                    select: {
                        name: true
                    }
                },
                _count: {
                    select: {
                        steps: true
                    }
                }
            }
        })

        return accepted
    }
    catch(error) {
        console.error(`service/getAcceptedMissionでエラー: ${error}`);
        return null
    }
}