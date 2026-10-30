import { fetcher } from "@/lib/fetcher";

export type AuthUser = {
  id: string;
  firebaseUid: string;
  displayName: string | null;
  experience: number;
  knowledgeCardTableNumber: number;
  selectedProfileAchievementId: string | null;
  selectedMascotId: string;
  selectedTargetAchievementId: string | null;
  hasHexadResponse: boolean;
};

export type GetMeResponse = {
  user: AuthUser;
};

export const getMe = async (token: string): Promise<GetMeResponse> => {
  return fetcher<GetMeResponse>("/auth/me", {
    method: "GET",
    token,
  });
};

export const ensureUser = async (
  token: string,
  displayName: string | null
): Promise<GetMeResponse> => {
  return fetcher<GetMeResponse>("/auth/ensure", {
    method: "POST",
    token,
    body: JSON.stringify({ displayName }),
  });
};
