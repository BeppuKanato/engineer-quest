// import { Request, Response } from "express";
// import { fetchUser } from "../../service/userService";

import { Response } from "express"
import { AuthRequest } from "../../middleware/authMiddleware"

// export const loginController = async(req: Request, res: Response) => {
//     const { userId } = req.body;
//     console.log("ログインテスト", userId);
//     // const user = await getUser(name);
//     const user = await fetchUser(userId, {
//         name: true
//     })

//     if (user !== null) {
//         res.status(200).json(user);
//     }
//     else {
//         res.status(500).json({error: "ユーザデータ取得時にエラーが発生しました"});
//     }
// }

export const userController = async(req: AuthRequest, res: Response) => {
    return res.status(400).json({ "error": "メンテ中"})
}