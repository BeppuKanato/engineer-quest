import { Response } from "express";
import { AuthRequest } from "../middleware/verifyToken";
import { fetchLatesMissionExamProgress } from "../service/missionExamProgressService";
import { createSharedMissionExamProgress, fetchSharedMissions } from "../service/shareMissionExamService";
import { fetchMissions } from "../service/missionService";
import { MissionType } from "@prisma/client";
import { Prisma } from "@prisma/client";

type SharedMissionWithProgress =
  Prisma.SharedMissionExamProgressGetPayload<{
    include: {
      user: { select: { name: true } };
      examProgress: {
        select: {
          point: true;
          good: true;
          bad: true;
          userCodes: {
            select: {
              code: true;
              language: true;
              fileName: true;
            };
          };
        };
      };
    };
  }>;


export const shareMissionExamController = async(req: AuthRequest, res: Response) => {
    const {examId} = req.body;
    const userId = req.user!.uid;
    //最新の試験結果を共有する
    const latest = await fetchLatesMissionExamProgress(userId, examId, {
        id: true
    }) as {id: string};

    //共有済み
    if (!latest) {
        return res.send(404);
    }

    const result = await createSharedMissionExamProgress(userId, latest.id);

    //共有に失敗
    if (!result) {
        return res.sendStatus(409);
    }

    return res.sendStatus(200);
}

export const selectFilterdMissionController = async(req: AuthRequest, res: Response) => {
    const {difficulty, star, language, type} = req.body;
    const missions = await fetchMissions({
        where: {
            difficulty: difficulty ? {
                slug: difficulty
            } : undefined,
            exam: language ?{
                is: {
                    language: {
                        has: language
                    }
                }   
            }: undefined,
            type: type ? type as MissionType : undefined,
            star: star ? star: undefined,
        },
        select: {
            title: true,
            detail: true,
            star: true,
            type: true,
            difficulty: {
                select: {
                    name: true,
                }
            },
            exam: {
                select: {
                    id: true,
                    language: true
                }
            }
        }
    })

    if (!missions) {
        return res.sendStatus(500);
    }

    return res.status(200).json(missions);
}

export const mainController = async(req: AuthRequest, res: Response) => {
    const {examId} = req.body;
    const sharedMissions = await fetchSharedMissions({
        where: {
            examProgress: {
            examId: examId
            }
        },
        select: {
            user: {
            select: {
                name: true
            }
            },
            examProgress: {
            select: {
                point: true,
                good: true,
                bad: true,
                userCodes: {
                select: {
                    code: true,
                    language: true,
                    fileName: true
                }
                }
            }
            }
        },
        orderBy: [
        {
            examProgress: {
            point: "asc"
            }
        },
        {
            createdAt: "desc"
        }
        ]

    }) as SharedMissionWithProgress[];


    if (!sharedMissions) {
        return res.sendStatus(500);
    }

    const points = sharedMissions.map(m => m.examProgress.point)
    const stats =
    points.length === 0 ? 
    { count: 0, average: 0, max: 0, min: 0 } : 
    {
        count: points.length,
        average: Math.round(points.reduce((a, b) => a + b, 0) / points.length),
        max: Math.max(...points),
        min: Math.min(...points),
    };


    return res.status(200).json({
        sharedMissions,
        stats
    })
}