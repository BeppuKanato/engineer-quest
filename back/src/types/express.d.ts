// src/types/express.d.ts

import type { DecodedIdToken } from "firebase-admin/auth";

declare global {
  namespace Express {
    interface Request {
      authUser?: {
        id: string;
        firebaseUid: string;
        displayName: string | null;
      };
      firebaseUser?: DecodedIdToken;
    }
  }
}

export {};