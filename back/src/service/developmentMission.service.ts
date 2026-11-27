import { AppError } from "../error/appError";
import { prisma } from "../lib/prisma";

// フロントの教材データ（developmentMissions）と対応する、実在するミッションの id。
// 定義そのものはフロントが正本で、ここでは記録の受け入れ可否だけを判定する。
export const DEVELOPMENT_MISSION_IDS = ["dungeon-escape", "island-count", "first-broken-version", "minimum-energy-delivery", "rescue-fastest-route"] as const;

export type DevelopmentMissionBest = {
  missionId: string;
  points: number;
  count: number;
  attempts: number;
  lastAttemptAt: string;
};

const bestsOf = async (userId: string): Promise<DevelopmentMissionBest[]> => {
  const attempts = await prisma.developmentMissionAttempt.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { missionId: true, points: true, count: true, createdAt: true },
  });
  const byMission = new Map<string, DevelopmentMissionBest>();
  for (const attempt of attempts) {
    const current = byMission.get(attempt.missionId);
    if (!current) {
      byMission.set(attempt.missionId, {
        missionId: attempt.missionId, points: attempt.points, count: attempt.count,
        attempts: 1, lastAttemptAt: attempt.createdAt.toISOString(),
      });
    } else {
      current.attempts += 1;
      if (attempt.points > current.points) {
        current.points = attempt.points;
        current.count = attempt.count;
      }
    }
  }
  return [...byMission.values()];
};

export const getDevelopmentMissionBests = async (userId: string) => ({ bests: await bestsOf(userId) });

export const recordDevelopmentMissionAttempt = async (
  userId: string,
  missionId: string,
  input: { points?: unknown; count?: unknown; code?: unknown },
) => {
  if (!(DEVELOPMENT_MISSION_IDS as readonly string[]).includes(missionId)) {
    throw new AppError(404, "MISSION_NOT_FOUND", "その発展ミッションは見つかりません。");
  }
  const { points, count, code } = input;
  if (typeof points !== "number" || !Number.isInteger(points) || points < 0 || points > 1000) {
    throw new AppError(400, "INVALID_MISSION_SCORE", "スコアが不正です。");
  }
  if (typeof count !== "number" || !Number.isInteger(count) || count < 0) {
    throw new AppError(400, "INVALID_MISSION_SCORE", "計測回数が不正です。");
  }
  if (typeof code !== "string" || code.length > 100_000) {
    throw new AppError(400, "INVALID_MISSION_CODE", "プログラムが不正です。");
  }
  const before = (await bestsOf(userId)).find((best) => best.missionId === missionId) ?? null;
  await prisma.developmentMissionAttempt.create({ data: { userId, missionId, points, count, code } });
  const best = (await bestsOf(userId)).find((entry) => entry.missionId === missionId) ?? null;
  return { best, isNewBest: best !== null && (before === null || best.points > before.points) };
};
