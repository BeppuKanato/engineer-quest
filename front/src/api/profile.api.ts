import { fetcher } from "@/lib/fetcher";
import type { TechIconBadge } from "./badges.api";

export type ProfileHistoryType =
  | "mission_completed"
  | "achievement_unlocked"
  | "activity_completed"
  | "badge_acquired";

export type ProfileHistoryItem = {
  id: string;
  type: ProfileHistoryType;
  title: string;
  description: string;
  occurredAt: string;
  href: string | null;
};

export type ProfileResponse = {
  user: {
    displayName: string | null;
    rank: string;
    level: number;
    exp: number;
    completedCourseCount: number;
    completedMissionCount: number;
    badgeCount: number;
    selectedMascotId: string;
  };
  ticketBalance: number;
  selectedBadge: TechIconBadge | null;
  recentWorks: {
    id: string;
    title: string;
    description: string;
    createMissionTitle: string;
    isFavorite: boolean;
    updatedAt: string;
    href: string;
  }[];
  history: ProfileHistoryItem[];
};

export const getProfile = async (token: string): Promise<ProfileResponse> => {
  return fetcher<ProfileResponse>("/profile", {
    method: "GET",
    token,
  });
};

export const updateProfileMascot = async (
  token: string,
  mascotId: string
): Promise<{ selectedMascotId: string }> => {
  return fetcher<{ selectedMascotId: string }>("/profile/mascot", {
    method: "PATCH",
    token,
    body: JSON.stringify({ mascotId }),
  });
};
