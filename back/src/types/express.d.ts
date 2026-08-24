// src/types/express.d.ts

import type { DecodedIdToken } from "firebase-admin/auth";

declare global {
  namespace Express {
    interface Request {
      authUser?: {
        id: string;
        firebaseUid: string;
        displayName: string | null;
        experience: number;
        badgeTickets: number;
        selectedTechIconBadgeId: string | null;
        selectedMascotId: string;
        selectedTargetAchievementId: string | null;
        hasHexadResponse: boolean;
      };
      firebaseUser?: DecodedIdToken;
    }
  }
}

export {};
