import { Request, Response } from "express";
import { fetchUser } from "../service/userService";

export const loginController = async(req: Request, res: Response) => {
    const { userId } = req.body;

    // const user = await getUser(name);
    const user = await fetchUser(userId, {
        name: true
    })

    if (user !== null) {
        res.status(200).json(user);
    }
    else {
        res.status(500).json({error: "ユーザデータ取得時にエラーが発生しました"});
    }
}