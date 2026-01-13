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
                    rankId: "1fea258a-2708-4e5c-862e-cef83dcf2d62"
                },
            });
        }
        res.status(200).json({ok: true});
    }
    catch(error) {
        console.log("ユーザ確認・作成時にエラーが発生しました" + error);
        res.status(500).json({ok: false});
    }
}