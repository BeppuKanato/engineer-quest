import { fetcher } from "@/lib/fetcher";

export type AuthUser = {
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

export type GetMeResponse = {
  user: AuthUser;
};

export const getMe = async (token: string): Promise<GetMeResponse> => {
  return fetcher<GetMeResponse>("/auth/me", {
    method: "GET",
    token,
  });
};
