import {
  BadgeTicketReason,
  Prisma,
  TechIconBadge,
  UserTechIconBadge,
} from "@prisma/client";

import { AppError } from "../error/appError";
import { prisma } from "../lib/prisma";

type TechIconBadgeWithOwned = TechIconBadge & {
  userTechIconBadges: Pick<UserTechIconBadge, "acquiredAt">[];
};

const toBadgeItem = (
  badge: TechIconBadgeWithOwned,
  selectedBadgeId: string | null
) => {
  const acquiredAt = badge.userTechIconBadges[0]?.acquiredAt ?? null;
  const isOwned = Boolean(acquiredAt);

  return {
    id: badge.id,
    name: isOwned ? badge.name : "???",
    description: isOwned
      ? badge.description
      : "まだ獲得していないTech Icon Badgeです。",
    iconUrl: badge.iconUrl,
    rarity: badge.rarity,
    isOwned,
    acquiredAt: acquiredAt?.toISOString() ?? null,
    isSelected: isOwned && selectedBadgeId === badge.id,
  };
};

const toOwnedBadge = (badge: TechIconBadge) => ({
  id: badge.id,
  name: badge.name,
  description: badge.description,
  iconUrl: badge.iconUrl,
  rarity: badge.rarity,
});

const getUserByFirebaseUid = async (firebaseUid: string) => {
  const user = await prisma.user.findUnique({
    where: { firebaseUid },
    select: {
      id: true,
      badgeTickets: true,
      selectedTechIconBadgeId: true,
      selectedTechIconBadge: true,
    },
  });

  if (!user) {
    throw new AppError(404, "USER_NOT_FOUND", "User not found");
  }

  return user;
};

export const awardBadgeTickets = async (
  tx: Prisma.TransactionClient,
  {
    userId,
    amount,
    reason,
    sourceId,
    note,
  }: {
    userId: string;
    amount: number;
    reason: BadgeTicketReason;
    sourceId?: string | null;
    note?: string | null;
  }
) => {
  if (amount <= 0) {
    return null;
  }

  const updatedUser = await tx.user.update({
    where: { id: userId },
    data: {
      badgeTickets: {
        increment: amount,
      },
    },
    select: {
      badgeTickets: true,
    },
  });

  const transaction = await tx.badgeTicketTransaction.create({
    data: {
      userId,
      amount,
      reason,
      sourceId,
      note,
    },
  });

  return {
    amount,
    reason,
    currentTickets: updatedUser.badgeTickets,
    transactionId: transaction.id,
    createdAt: transaction.createdAt.toISOString(),
  };
};

export const getBadgeCollectionByFirebaseUid = async (firebaseUid: string) => {
  const user = await getUserByFirebaseUid(firebaseUid);

  const badges = await prisma.techIconBadge.findMany({
    where: { isPublished: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: {
      userTechIconBadges: {
        where: {
          userId: user.id,
        },
        select: {
          acquiredAt: true,
        },
      },
    },
  });

  const ownedCount = badges.filter(
    (badge) => badge.userTechIconBadges.length > 0
  ).length;

  return {
    ticketBalance: user.badgeTickets,
    ownedCount,
    totalCount: badges.length,
    selectedBadge: user.selectedTechIconBadge
      ? toOwnedBadge(user.selectedTechIconBadge)
      : null,
    badges: badges.map((badge) =>
      toBadgeItem(badge, user.selectedTechIconBadgeId)
    ),
  };
};

export const drawTechIconBadgeByFirebaseUid = async (firebaseUid: string) => {
  const user = await getUserByFirebaseUid(firebaseUid);

  if (user.badgeTickets <= 0) {
    throw new AppError(
      400,
      "BADGE_TICKET_INSUFFICIENT",
      "Badge Ticket is insufficient"
    );
  }

  const ownedBadges = await prisma.userTechIconBadge.findMany({
    where: { userId: user.id },
    select: { badgeId: true },
  });
  const ownedBadgeIds = ownedBadges.map((badge) => badge.badgeId);
  const candidates = await prisma.techIconBadge.findMany({
    where: {
      isPublished: true,
      id: {
        notIn: ownedBadgeIds,
      },
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  if (candidates.length === 0) {
    throw new AppError(
      400,
      "BADGE_COLLECTION_COMPLETE",
      "All Tech Icon Badges are already collected"
    );
  }

  const selectedBadge =
    candidates[Math.floor(Math.random() * candidates.length)];

  const result = await prisma.$transaction(async (tx) => {
    const updatedUser = await tx.user.update({
      where: {
        id: user.id,
        badgeTickets: {
          gt: 0,
        },
      },
      data: {
        badgeTickets: {
          decrement: 1,
        },
      },
      select: {
        badgeTickets: true,
      },
    });

    await tx.badgeTicketTransaction.create({
      data: {
        userId: user.id,
        amount: -1,
        reason: BadgeTicketReason.BADGE_GACHA,
        sourceId: selectedBadge.id,
        note: `Tech Icon Badge: ${selectedBadge.name}`,
      },
    });

    const userBadge = await tx.userTechIconBadge.create({
      data: {
        userId: user.id,
        badgeId: selectedBadge.id,
      },
      include: {
        badge: true,
      },
    });

    return {
      ticketBalance: updatedUser.badgeTickets,
      acquiredAt: userBadge.acquiredAt.toISOString(),
      badge: userBadge.badge,
    };
  });

  return {
    ticketBalance: result.ticketBalance,
    acquiredAt: result.acquiredAt,
    badge: toOwnedBadge(result.badge),
  };
};

export const setSelectedTechIconBadgeByFirebaseUid = async ({
  firebaseUid,
  badgeId,
}: {
  firebaseUid: string;
  badgeId: string;
}) => {
  const user = await getUserByFirebaseUid(firebaseUid);

  const ownedBadge = await prisma.userTechIconBadge.findUnique({
    where: {
      userId_badgeId: {
        userId: user.id,
        badgeId,
      },
    },
    include: {
      badge: true,
    },
  });

  if (!ownedBadge) {
    throw new AppError(
      403,
      "BADGE_NOT_OWNED",
      "You can only select an owned Tech Icon Badge"
    );
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      selectedTechIconBadgeId: badgeId,
    },
  });

  return {
    selectedBadge: toOwnedBadge(ownedBadge.badge),
  };
};
