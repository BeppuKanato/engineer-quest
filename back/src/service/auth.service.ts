import { prisma } from "../lib/prisma";

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
    },
  });

  return {
    id: user.id,
    firebaseUid: user.firebaseUid,
    displayName: user.displayName,
  };
};

export const getUserByFirebaseUidService = async (firebaseUid: string) => {
  const user = await prisma.user.findUnique({
    where: {
      firebaseUid,
    },
  });

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    firebaseUid: user.firebaseUid,
    displayName: user.displayName,
  };
};