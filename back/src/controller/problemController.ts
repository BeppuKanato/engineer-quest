import e, { Request, Response } from "express";
import { fetchMission, getAcceptedMissions, missionExamJudgeService } from "../service/missionService";
import { fetchStep } from "../service/stepService";
import { createMissionExamProgress, fetchLatesMissionExamProgress, fetchMissionExamProgress } from "../service/missionExamProgressService";
import { fetchUser, updateUser } from "../service/userService";
import { fetchMissionProgress, updateMissionProgress } from "../service/missionProgressService";
import { JudgeType, MissionExamLanguages, MissionStatus } from "@prisma/client";
import { createExperienceLog, fetchExperienceLogs } from "../service/experienceLogService";
import { fetchUsageTime } from "../service/usageTimeService";
import { checkAndUpdateRank } from "../service/rankService";
import { AuthRequest } from "../middleware/verifyToken";
import { createSharedMissionExamProgress } from "../service/shareMissionExamService";
import { requiredExperienceForLevel } from "../domain/level";
/**
 * @abstract ミッション選択API
 * @summary ユーザが受け入れたミッションの一覧を取得する
 * @example
 * // Request Body
 * {
 *   "userId": "user123" // ユ
 * }ーザのID
 * // Response Body
 * [
 * {
 * "id": "mission123", // ミッションのID
 * "component": "JavaScript", // ミッションのコンポーネント
 * "difficulty": { // ミッションの難易度情報
 * "name": "難易度名"
 * },
 * "missionProgresses": [ // ミッションの進行状況
 * {
 * "status": "NOT_STARTED", // 進行状況（NOT_STARTED, IN_PROGRESS, COMPLETED）
 * "currentStep": 0 // 現在のステップ番号
 * }
 * ]
 * },
 * ...
 * ]
 * @description
 * ユーザが受け入れたミッションの一覧を取得するAPIです。
 * ミッション選択画面の表示時に呼び出す必要があります。
 * ミッションデータの取得に失敗した場合、エラーメッセージを返します。
 * @param req 
 * @param res 
 */
export const missionSelectController = async(req: AuthRequest, res: Response) => {
    const userId  = req.user!.uid;

    const acceptedMission = await getAcceptedMissions(userId);

    if (acceptedMission !== null) {
        res.status(200).json(acceptedMission);
    }
    else {
        res.status(500).json({error: "ミッションデータ取得時にエラーが発生しました"});
    }
}

/**
 * @abstract ミッション確認API
 * @summary ミッションの詳細情報を取得する
 * @example
 * // Request Body
 * {
 *   "missionId": "mission123" // ミッションのID
 * }
 * // Response Body
 * {
 *  "id": "mission123", // ミッションのID
 * "component": "JavaScript", // ミッションのコンポーネント
 * "difficulty": { // ミッションの難易度情報
 *  "name": "難易度名"
 * },
 * "steps": [ // ミッションのステップ情報
 * {
 * "id": "step123", // ステップのID
 * "title": "ステップタイトル",
 * "detail": "ステップ詳細",
 * "_count": { // ステップの解説数と試験数
 * "explains": 3, // 解説数
 * "stepExams": 2 // 試験数
 * }
 * },
 * ...
 * ],
 * "missionProgresses": [ // ミッションの進行状況
 * {
 * "status": "IN_PROGRESS", // 進行状況（NOT_STARTED, IN_PROGRESS, COMPLETED）
 * "currentStep": 2 // 現在のステップ番号
 * }
 * ]
 * }
 * @description
 * ミッションの詳細情報を取得するAPIです。
 * ミッション開始前に呼び出す必要があります。
 * ミッションの詳細情報取得に失敗した場合、エラーメッセージを返します。
 * 
 * @param req 
 * @param res 
 */
export const missionConfirmController = async(req: AuthRequest, res: Response) => {
    const userId  = req.user!.uid;
    const {missionId} = req.body;
    const mission = await fetchMission(missionId, {
        component: true,
        exam: {
            select: {
                type: true,
                instructions: true,
                criteria: true
            }
        },
        difficulty: {
            select: {
                name: true
            }
        },
        steps: {
            select: {
                id: true,
                title: true,
                detail: true,
                _count: {
                    select: {
                        explains: true,
                        stepExams: true
                    },
                }
            },
            orderBy: {
                order: 'asc'
            },
        },
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
            }
        }
    });

    if (mission !== null) {
        res.status(200).json(mission);
    }
    else {
        res.status(500).json({error: "ミッションデータ取得時にエラーが発生しました"});
    }
}

/**
 * @abstract ステップ解説情報取得API
 * @summary ステップ解説の情報を取得する
 * @example
 * // Request Body
 * {    
 *  "stepId": "step123" // ステップのID
 * }
 * // Response Body
 * {
 *   "id": "step123", // ステップのID
 *  "title": "ステップタイトル",
 * "explains": [ // ステップ解説の情報
 * {
 * "content": "解説内容",
 * "highlight": "解説のハイライト",
 * "supporter": { // 解説のサポーター情報
 *   "name": "サポーター名",
 *  "imagePath": "サポーター画像パス"
 * }
 * },
 * ...
 * ],
 * "mission": { // ステップが属するミッションの情報
 *  "id": "mission456", // ミッションのID
 * "component": "JavaScript" // ミッションのコンポーネント
 * }
 * }
 * @description 
 * ステップ解説の情報を取得するAPIです。
 * ステップ解説のコード提出後に呼び出す必要があります。
 * ステップ解説の情報取得に失敗した場合、エラーメッセージを返します。
 * 
 * @param req 
 * @param res 
 */
export const stepExplainController = async(req: Request, res: Response) => {
    const { stepId } = req.body;
    
    const stepAndExplain = await fetchStep(stepId, {
        id: true,
        title: true,
        explains: {
            select: {
                content: true,
                highlight: true,
                componentType: true,
                supporter: {
                    select: {
                        name: true,
                        imagePath: true
                    },
                },
                code: true
            },
            orderBy: {
                order: 'asc'
            },
        },
        mission: {
            select: {
                id: true,
                component: true,
            },
        }
    });

    if (stepAndExplain !== null) {
        res.status(200).json(stepAndExplain);
    }
    else {
        res.status(500).json({error: "ステップデータ取得時にエラーが発生しました"});
    }
}

/**
 * @abstract ステップ試験情報取得API
 * @summary ステップ試験の情報を取得する
 * @example
 * // Request Body
 * {    
 *  "stepId": "step123" // ステップのID
 * }
 * // Response Body
 * {
 *   "id": "step123", // ステップのID
 *  "title": "ステップタイトル",
 * "order": 1, // ステップの順番
 * "stepExams": [ // ステップ試験の情報
 *  {
 *  "content": "試験内容",
 * "answer": "試験の答え",
 * "highlight": "試験のハイライト",
 * "supporter": { // 試験のサポーター情報
 *   "name": "サポーター名",
 *  "imagePath": "サポーター画像パス"
 * }
 * },
 * ...
 * ],
 * "mission": { // ステップが属するミッションの情報
 *  "id": "mission456", // ミッションのID
 * "component": "JavaScript", // ミッションのコンポーネント
 * "steps": [ // ミッションのステップ情報
 * {
 *  "id": "step123", // ステップのID
 * "order": 1 // ステップの順番
 * },
 * ...
 * ]
 * }
 * }
 * }
 * @description 
 * ステップ試験の情報を取得するAPIです。
 * ステップ試験のコード提出前に呼び出す必要があります。
 * ステップ試験の情報取得に失敗した場合、エラーメッセージを返します。
 * 
 * @param req 
 * @param res 
 */
export const stepExamController = async(req: Request, res: Response) => {
    const { stepId } = req.body;

    const stepAndExam = await fetchStep(stepId, {
        id: true,
        title: true,
        order: true,
        stepExams: {
            select: {
                content: true,
                answer: true,
                highlight: true,
                componentType: true,
                instructions: true,
                supporter: {
                    select: {
                        name: true,
                        imagePath: true,
                    }
                }
            },
            orderBy: {
                order: 'asc'
            },
        },
        mission: {
            select: {
                id: true,
                component: true,
                steps: {
                    select: {
                        id: true,
                        order: true,
                    },
                    orderBy: {
                        order: 'asc'
                    },
                },
            },
        },
    })
    if (stepAndExam !== null) {
        res.status(200).json(stepAndExam);
    }
    else {
        res.status(500).json({error: "ステップデータ取得時にエラーが発生しました"});
    }
}

/**
 * @abstract ミッション試験情報取得API
 * @summary ミッション試験の情報を取得する
 * @example
 * // Request Body
 * {    
 *  "missionId": "mission123" // ミッションのID
 * }
 * // Response Body
 * {
 *   "id": "mission123", // ミッションのID
 *  "title": "ミッションタイトル",
 *  "component": "JavaScript", // ミッションのコンポーネント
 *  "exam": { // ミッション試験の情報
 *   "id": "exam456", // 試験のID
 *  "criteria": 70 // 合格基準のスコア
 * }
 * }
 * @description
 * ミッション試験の情報を取得するAPIです。
 * ミッション試験のコード提出前に呼び出す必要があります。
 * ミッション試験の情報取得に失敗した場合、エラーメッセージを返します。
 * 
 * @param req 
 * @param res 
 */
export const missionExamController = async(req: Request, res: Response) => {
    const { missionId } = req.body;

    const missionExam = await fetchMission(missionId, {
        id: true,
        title: true,
        exam: {
            select: {
                id: true,
                type: true,
                component: true,
                instructions: true,
                language: true,
            }
        }
    })
    if (missionExam !== null) {
        res.status(200).json(missionExam);
    }
    else {
        res.status(500).json({error: "ミッションデータ取得時にエラーが発生しました"});
    }
}

//フィードバックバリデーション
const isValidFeedbacks = (
    feedbacks: { index: number; type: string; text: string }[],
    expectedLength: number
): feedbacks is { index: number; type: JudgeType; text: string }[] => {
    //フィードバック量が期待値と異なる場合は不正
    if (feedbacks.length !== expectedLength) return false;

    const judgeTypeValues = Object.values(JudgeType);
    //順番が違う、型が違う、typeが不正(JudgeTypeではない)場合は不正
    return feedbacks.every((f, i) =>
        typeof f.index === "number" &&
        f.index === i &&
        typeof f.text === "string" &&
        judgeTypeValues.includes(f.type as JudgeType)
    );
};


/**
 * @abstract ミッション試験AI採点API
 * @summary ミッション試験のコードをAIで採点し、結果を保存する
 * @example
 * // Request Body
 * {
 *   "missionId": "mission123", // ミッションのID
 *  "examId": "exam456", // 試験のID
 *  "userId": "user789", // ユーザのID
 *  "missionCode": "function solution() { return true; }", // ミッションのコード
 * "userCode": "function solution() { return false; }", // ユーザのコード
 * "factor": "コードの正確性と効率性", // 採点の観点
 * "criteria_score": 70 // 合格基準のスコア
 * }
 * // Response Body
 * {
 *  "score": 85, // AIによる採点スコア
 * "reason": "コードは正確で効率的です", // 採点理由
 * "feedback": "よくできました！" // フィードバック
 * }
 * @description
 * ミッション試験のコードをAIで採点し、結果を保存するAPIです。
 * ミッション試験のコード提出後に呼び出す必要があります。
 * AIによる採点結果をもとにミッション進行状況を更新し、試験結果を保存します。   
 * ミッション進行状況の更新や試験結果の保存に失敗した場合、エラーメッセージを返します。
 * AIによる採点に失敗した場合、デフォルトのスコアとメッセージを返します。
 * 
 * @param req 
 * @param res 
 * @returns 
 */
export const missionExamAIJudgeController = async (req: AuthRequest, res: Response) => {
    const { missionId, examId, userCode } = req.body;
    const userId = req.user!.uid;

    const examData = await fetchMission(missionId, {
        exam: {
            select: {
                criteria: true,
                instructions: true,
                exampleCode: true
            }
        }
    }) as {
        exam: {
            criteria: {score: number, factor: string[]},
            instructions: string[],
            exampleCode: {[key in MissionExamLanguages]?: string}
        }
    }
    const aiJudge = await missionExamJudgeService(examData.exam.exampleCode, userCode, examData.exam.criteria.factor, examData.exam.instructions);

    if (!aiJudge) {
        return res.status(500).json({
            message: "AIによる採点に失敗しました。時間をおいて再度お試しください。",
        });
    }

    //4タイプのフィードバックを生成なので、要素数が4でない場合はエラー
    if (!isValidFeedbacks(aiJudge.feedbacks, 4)) {
        console.log("AIフィードバックの要素数エラー:", aiJudge.feedbacks);
        return res.status(500).json({
            message: "AIによるフィードバックの生成に失敗しました。時間をおいて再度お試しください。",
        });
    }

    const isPassed = Number(aiJudge.score) >= Number(examData.exam.criteria.score);
    // ミッション進行状況の更新と試験結果の保存
    const missionProgress = await fetchMissionProgress(
        missionId,
        userId,
        { status: MissionStatus.IN_PROGRESS },
        { id: true }
    ) as { id: string } | null;

    if (!missionProgress) {
        console.log("進行中のミッションが見つかりません");
        return res.status(500).json({
            message: "進行中のミッションが見つかりません。開発者に連絡してください。",
        })
    }

    const process = await createMissionExamProgress(
        examId,
        userId,
        missionProgress.id,
        {
            score: aiJudge.score,
            isPassed,
            good: aiJudge.reason.good ,
            bad: aiJudge.reason.bad,
            feedbacks: aiJudge.feedbacks,
        },
        userCode as { [key in MissionExamLanguages]?: string }
    );

    if (!process?.id) {
        console.log("試験結果保存時にエラー");
        return res.status(500).json({
            message: "試験の結果を保存できませんでした。時間をおいてお試しください",
        });
    }

    const responseData: {
        score: number,
        reason: {
            "good": string[],
            "bad": string[]
        },
        feedbacks: { index: number; type: JudgeType; text: string }[],
        isPassed: boolean
    } = 
    {
        score: aiJudge.score,
        reason: aiJudge.reason,
        feedbacks: aiJudge.feedbacks,
        isPassed: isPassed 
    }
    return res.status(200).json(responseData);
};

/**
 * 
 * @abstract ミッションリザルトAPI
 * @summary ミッション完了後のリザルト情報を取得する
 * @example
 * // Request Body
 * {    
 *  "missionId": "mission123", // ミッションのID
 *  "userId": "user456"    // ユーザのID
 * }
 * // Response Body
 * {
 *   "missionData": { // ミッションの基本情報
 *     "title": "ミッションタイトル",
 *    "detail": "ミッション詳細",
 *    "experience": 100, // 獲得経験値
 *   "steps": [ // ミッションのステップ情報
 *    {
 *     "title": "ステップ1タイトル"
 *   },
 *  ...
 *  ],
 *  "difficulty": { // ミッションの難易度情報
 *   "name": "難易度名"
 *  },
 * "afterSentences": [ // ミッション完了後のセリフ情報
 *   {
 *    "speaker": { // 話者情報
 *    "name": "話者名",
 *   "imagePath": "話者画像パス"    
 *  },
 *   "sentence": "セリフ内容"
 *  },
 * ...
 * ],
 * "_count": { // ミッションのステップ数
 *  "steps": 5
 * }
 * },
 * "user": { // ユーザの基本情報
 * "name": "ユーザ名",
 * "level": 10, // ユーザのレベル
 * "experience": 1500, // ユーザの経験値
 * "rank": { // ユーザのランク情報
 *  "name": "ランク名"
 * },
 * "levelRequirement": { // 次のレベルまでの必要経験値
 *  "requiredExperience": 2000
 * }
 * },
 * "examResult": { // 試験結果情報
 *  "missionExamProgress": {
 *   "point": 85, // 試験の得点
 *  "isPassed": true, // 試験の合否
 *  "feedback": "よくできました！" // 試験のフィードバック
 *  "judgeType": "WITH_FEEDBACK" // 採点タイプ
 * }
 * },
 * "learningTime": 3600 // ユーザの学習時間（秒）
 * }
 * @description
 * ミッション完了後のリザルト情報を取得するAPIです。
 * ミッション完了後に呼び出す必要があります。
 * ミッションデータ、ユーザデータ、試験結果、学習時間をまとめて返します。
 * いずれかのデータの取得に失敗した場合、エラーメッセージを返します。
 * 
 * @param req 
 * @param res 
 * @returns 
 */
export const missionResultController = async (req: AuthRequest, res: Response) => {
  const { missionId } = req.body;
  const userId = req.user!.uid;

  try {
    // --- ミッションデータ取得 ---
    const missionData = await fetchMission(missionId, {
      title: true,
      detail: true,
      experience: true,
      steps: { select: { title: true }, orderBy: { order: 'asc' } },
      difficulty: { select: { name: true } },
      star: true,
      afterSentences: {
        select: {
          speaker: { select: { name: true, imagePath: true } },
          sentence: true,
        },
        orderBy: { order: 'asc' },
      },
      exam: {
        select: {
            id: true
        }
      },
      _count: { select: { steps: true } },
    }) as {
      title: string;
      detail: string;
      experience: number | null;
      steps: { title: string }[];
      difficulty: { name: string } | null;
      afterSentences: { speaker: { name: string; imagePath: string | null }; sentence: string }[];
      exam: {id: string}
      _count: { steps: number };
    } | null;

    if (!missionData) return res.status(500).json({ error: "ミッションリザルトの取得に失敗しました" });

    // --- 学習時間 ---
    const dayUsagetime = await fetchUsageTime(userId, "day");
    const weekUsagetime = await fetchUsageTime(userId, "week");
    const totalUsagetime = await fetchUsageTime(userId, "total");
    if (dayUsagetime === null || weekUsagetime === null || totalUsagetime === null) {
        return res.status(500).json({ error: "ユーザの学習時間の取得に失敗しました" });
    }

    const examResult = await fetchMissionExamProgress(userId, missionData.exam.id,{
        point: true,
        isPassed: true,
        judgeType: true,
        createdAt: true
    })

    if (!examResult) return res.status(500).json({ error: "ユーザの試験結果の取得に失敗しました" });

    // --- ユーザ情報 ---
    let user = await fetchUser(userId, {
        name: true,
        level: true,
        experience: true,
        rank: { select: { name: true } },
    }) as {
        name: string;
        level: number;
        experience: number;
        rank: { name: string } | null;
    } | null;

    if (!user) return res.status(409).json({error: "ユーザデータが見つかりません。"});

    // --- 進行中ミッション確認 ---
    const missionProgress = await fetchMissionProgress(
      missionId,
      userId,
      { status: MissionStatus.IN_PROGRESS },
      { id: true }
    ) as { id: string } | null;

    if (!missionProgress) return res.status(409).json({error: "進行中のミッションが見つかりません"});
    
    type ExperienceUpdate = {
        oldLevel: number;
        newLevel: number;
        oldExperience: number;
        newExperience: number;

        oldLevelRequiredExp: number;
        newLevelRequiredExp: number;
    };

    let experienceUpdate: ExperienceUpdate | null = null;

    // --- 経験値加算・レベルアップ処理 ---
    const experienceLogs = await fetchExperienceLogs(
        userId,
        { missionProgressId: missionProgress.id },
        { id: true, experience: true }
    ) as { id: string; experience: number }[] | null;

    // 二重加算防止
    if (!experienceLogs || experienceLogs.length === 0) {
        const experienceToAdd = missionData.experience ?? 0;

        const oldLevel = user.level;
        const oldExperience = user.experience;

        let newLevel = oldLevel;
        let newExperience = oldExperience + experienceToAdd;

        // レベルアップ判定
        while (true) {
            const requiredExp = requiredExperienceForLevel(newLevel);
            if (requiredExp <= 0) break;
            if (newExperience < requiredExp) break;

            newExperience -= requiredExp;
            newLevel += 1;
        }

        // 必要EXPは「最終レベル」に対して必ず計算
        experienceUpdate = {
            oldLevel,
            newLevel,
            oldExperience,
            newExperience,

            oldLevelRequiredExp: requiredExperienceForLevel(oldLevel),
            newLevelRequiredExp: requiredExperienceForLevel(newLevel),
        };

        // ユーザ更新
        await updateUser(userId, {
            level: newLevel,
            experience: newExperience,
        });

        // 経験値ログ（加算量のみ記録）
        await createExperienceLog(
            userId,
            missionProgress.id,
            experienceToAdd
        );
    }
    else {
        experienceUpdate = {
            oldLevel: user.level,
            newLevel: user.level,
            oldExperience: user.experience,
            newExperience: user.experience,
            oldLevelRequiredExp: requiredExperienceForLevel(user.level),
            newLevelRequiredExp: requiredExperienceForLevel(user.level),
        };
    }
    //ミッション完了処理
    await updateMissionProgress(missionProgress.id, {
        status: MissionStatus.COMPLETED,
        completedAt: new Date(),
    });

    //ランクアップ処理
    const updateRankResult = await checkAndUpdateRank(userId, missionId);
    const updatedRank = updateRankResult?.name ? updateRankResult.name : null;
    
    // 更新ユーザ情報再取得
    user = await fetchUser(userId, {
        name: true,
        level: true,
        experience: true,
        rank: { select: { name: true } },
    }) as typeof user;

    // --- リターンデータ ---
    const returnData = {
        missionData,
        user,
        examResult,
        dayUsagetime,
        weekUsagetime,
        totalUsagetime,
        experienceUpdate,
        updatedRank
    };

    console.log(experienceUpdate)
    res.status(200).json(returnData);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "リザルト処理中にエラーが発生しました" });
    }
};

/**
 * @abstract ミッション開始API
 * @summary ミッションの進行状況を未開始から進行中に更新する
 * 
 * @example
 * // Request Body
 * {
 *   "missionId": "mission123", // ミッションのID
 *   "user  Id": "user456"    // ユーザのID
 * }       
 * // Response Body
 * {
 *   "result": "success" // ミッション開始成功
 * }    
 * @description
 * ミッション開始前のミッション進行状況を未開始から進行中に更新するAPIです。
 * ミッション開始前に呼び出す必要があります。
 * ミッション進行状況の更新に失敗した場合、エラーメッセージを返します。
 * ミッション進行状況が見つからない場合もエラーメッセージを返します。
 * ミッション進行状況の更新に成功した場合、成功メッセージを返します。
 * 
 * @param req 
 * @param res 
 * @returns 
 */
export const startMissionController = async(req: Request, res: Response) => {
    const { missionId, userId } = req.body;

    //開始前のミッションのIDを取得
    const missionProgress = await fetchMissionProgress(
        missionId, 
        userId,
        {
            status: MissionStatus.NOT_STARTED,
        },
        {
            id: true
        }
    ) as {id: string} | null

    if (missionProgress === null) {
        return res.status(500).json({error: "ミッション進捗状況の獲得に失敗しました"})
    }

    //ミッションの状況を進行中に更新
    const updatedProgress = await updateMissionProgress(
        missionProgress.id,
        {
            status: MissionStatus.IN_PROGRESS
        }
    )

    if (updatedProgress === null) {
        return res.status(500).json({error: "ミッション進行状況の更新に失敗しました"})
    }

    return res.status(200).json({result: "success"})
}

/**
 * @abstract ステップ完了API
 * @summary ミッションの進行状況の現在のステップを更新する
 * @example
 * // Request Body
 * {
 *   "missionId": "mission123", // ミッションのID
 *   "userId": "user456",    // ユーザのID
 *   "updateStepNum": 2 // 更新するステップ番号
 * }
 * // Response Body
 * {
 *   "result": "success" // ステップ完了成功
 * }
 * 
 * @description
 * ミッションの進行状況の現在のステップを更新するAPIです。
 * ステップ完了時に呼び出す必要があります。
 * ミッション進行状況の更新に失敗した場合、エラーメッセージを返します。
 * ミッション進行状況が見つからない場合もエラーメッセージを返します。
 * ミッション進行状況の更新に成功した場合、成功メッセージを返します。
 * 
 * @param req 
 * @param res 
 * @returns 
 */
export const completeStepController = async(req: AuthRequest, res: Response) => {
    const { missionId, updateStepNum } = req.body;
    const userId = req.user!.uid;
    //進行状態のミッションのIDを取得
    const missionProgress = await fetchMissionProgress(
        missionId, 
        userId,
        {
            status: MissionStatus.IN_PROGRESS,
        },
        {
            id: true
        }
    ) as {id: string} | null

    if (missionProgress === null) {
        return res.status(500).json({error: "ミッション進捗状況の獲得に失敗しました"})
    }

    const updatedProgress = await updateMissionProgress(
        missionProgress.id, 
        {
            currentStep: updateStepNum
        }
    )

    if (updatedProgress === null) {
        return res.status(500).json({error: "ミッション進行状況の更新に失敗しました"})
    }

    return res.status(200).json({result: "success"})
}

export const shareMissionExamController = async(req: AuthRequest, res: Response) => {
    const {examId} = req.body;
    const userId = req.user!.uid;
    console.log("動作確認");
    //最新の試験結果を共有する
    const latest = await fetchLatesMissionExamProgress(userId, examId, {
        id: true
    }) as {id: string};

    //共有済み
    if (!latest) {
        return res.sendStatus(404);
    }

    const result = await createSharedMissionExamProgress(userId, latest.id);

    //共有に失敗
    if (!result) {
        return res.sendStatus(409);
    }

    return res.sendStatus(200);
}