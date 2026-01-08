import { GoogleGenAI } from "@google/genai";
import { prisma } from "../lib/prisma"
import { AIResponse } from "../type";
import { realpathSync, unwatchFile } from "fs";
import { ClientRequest } from "http";
import { JudgeType, MissionExamLanguages, MissionStatus } from "@prisma/client";
import { triggerAsyncId } from "async_hooks";
import { fetchUser } from "./userService";
import { examJudgeWithFeedbackc } from "./ContentsForGeminiAPI/examJudgeWithFeedback";
import { examJudgeWithoutFeedback } from "./ContentsForGeminiAPI/examJudgeWithoutFeedback";

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
export const missionExamJudgeService = async(missionCode: {[key in MissionExamLanguages]?: string}, userCode: {[key in MissionExamLanguages]?: string}, factor: string[], instructions: string[], judgeType: JudgeType) => {
    const  ai = new GoogleGenAI({});
    let settings: { contents: string; systemInstruction: string } ={contents: "", systemInstruction: ""} ;
    //フィードバック付きの採点
    if (judgeType === JudgeType.WITH_FEEDBACK) {
        settings = examJudgeWithFeedbackc(missionCode, userCode, factor, instructions);
    }
    //スコアのみの採点
    else if(judgeType === JudgeType.WITHOUT_FEEDBACK) {
        settings = examJudgeWithoutFeedback(missionCode, userCode, factor, instructions);
    }
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: settings.contents,
            config: {
                responseMimeType: "application/json",
                systemInstruction: settings.systemInstruction,

                temperature: 0.2,
                topP: 0.1,
                topK: 1,
            }
        })

        if (response.text === undefined) {
            return null;
        }

        const json: AIResponse = JSON.parse(response.text);
        // reason がなければ空で作る
        if (!json.reason) {
            json.reason = { good: [], bad: [] };
        }

        // feedback も初期化
        if (json.feedback === undefined) {
            json.feedback = null;
        }

        if (judgeType === JudgeType.WITHOUT_FEEDBACK) {
            json.reason.good = [];
            json.reason.bad = [];
            json.feedback = null;
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