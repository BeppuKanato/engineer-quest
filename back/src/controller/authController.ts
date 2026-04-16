import { Response } from "express";
import { prisma } from "../lib/prisma";
import { AuthRequest } from "../middleware/verifyToken";

export const ensureUserExistController = async (req: AuthRequest, res: Response) => {
    const uid = req.user?.uid;

    if (!uid) {
        return res.status(401).json({
            ok: false,
            message: "Unauthorized",
        });
    }

    try {
        await prisma.$transaction(async (tx) => {
            const existingUser = await tx.user.findUnique({
                where: { id: uid },
            });

            if (existingUser) {
                return;
            }

            const initialRank = await tx.rank.findUnique({
                where: { slug: "rank-1" },
                select: { id: true },
            });

            if (!initialRank) {
                throw new Error("初期ランク(rank-1)が見つかりません");
            }

            await tx.user.create({
                data: {
                    id: uid,
                    name: "エンジニア",
                    level: 1,
                    experience: 0,
                    rankId: initialRank.id,
                },
            });
        });

        return res.status(200).json({ ok: true });
    } catch (error) {
        console.error("ensureUserExistController error:", error);
        return res.status(500).json({
            ok: false,
            message: "Internal Server Error",
        });
    }
};