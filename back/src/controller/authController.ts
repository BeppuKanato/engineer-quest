import { Response } from "express";
import { prisma } from "../lib/prisma";
import { AuthRequest } from "../middleware/verifyToken";

export const ensureUserExitController = async (req: AuthRequest, res: Response) => {
    const uid = req.user!.uid;

    try {
        //idがuidのユーザを取得
        let user = await prisma.user.findUnique({
            where: {id: uid}
        });
        //ユーザがいない場合(初回ログイン)
        if (!user) {
            user = await prisma.user.create({
                data : {
                    id: uid,
                    name: "エンジニア",
                    level: 1, 
                    experience: 0,
                    //初期のランクのID
                    rankId: "ee7d33f0-cd78-4f55-bf15-cb065d37e558"
                },
            });
        }
        res.status(200).json({ok: true});
    }
    catch {
        res.status(500).json({ok: false});
    }
}