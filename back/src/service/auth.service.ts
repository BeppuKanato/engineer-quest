import { prisma } from "../lib/prisma";
import { randomInt } from "node:crypto";

type EnsureUserInput = {
  firebaseUid: string;
  displayName?: string | null;
};

export const ensureUserService = async ({
  firebaseUid,
  displayName,
}: EnsureUserInput) => {
  const user = await prisma.user.upsert({
    where: {
      firebaseUid,
    },
    update: {
      displayName: displayName ?? null,
    },
    create: {
      firebaseUid,
      displayName: displayName ?? null,
      knowledgeCardTableNumber: randomInt(1, 16),
    },
    include: {
      hexadResponse: {
        select: { id: true },
      },
    },
  });

  return {
    id: user.id,
    firebaseUid: user.firebaseUid,
    displayName: user.displayName,
    experience: user.experience,
    knowledgeCardTableNumber: user.knowledgeCardTableNumber,
    selectedProfileAchievementId: user.selectedProfileAchievementId,
    selectedMascotId: user.selectedMascotId,
    selectedTargetAchievementId: user.selectedTargetAchievementId,
    hasHexadResponse: user.hexadResponse !== null,
  };
};

export const getUserByFirebaseUidService = async (firebaseUid: string) => {
  const user = await prisma.user.findUnique({
    where: {
      firebaseUid,
    },
    include: {
      hexadResponse: {
        select: { id: true },
      },
    },
  });

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    firebaseUid: user.firebaseUid,
    displayName: user.displayName,
    experience: user.experience,
    knowledgeCardTableNumber: user.knowledgeCardTableNumber,
    selectedProfileAchievementId: user.selectedProfileAchievementId,
    selectedMascotId: user.selectedMascotId,
    selectedTargetAchievementId: user.selectedTargetAchievementId,
    hasHexadResponse: user.hexadResponse !== null,
  };
};
