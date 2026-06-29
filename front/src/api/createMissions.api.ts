import { fetcher } from "@/lib/fetcher";

export type BadgeTicketReward = {
  amount: number;
  reason: string;
  currentTickets: number;
  transactionId: string;
  createdAt: string;
} | null;

export type CreateMission = {
  id: string;
  courseId: string;
  courseTitle: string;
  title: string;
  theme: string;
  description: string;
  minimumRequirements: string[];
  advancedRequirements: string[];
  suggestedTechnologies: string[];
  starterCode: string | null;
  isUnlocked: boolean;
  workCount: number;
  latestWorkId: string | null;
  latestWorkUpdatedAt: string | null;
};

export type WorkReview = {
  id: string;
  goodPoints: string;
  improvements: string;
  nextTry: string;
  rawText: string;
  createdAt: string;
};

export type UserWork = {
  id: string;
  createMissionId: string;
  createMissionTitle: string;
  courseId: string;
  courseTitle: string;
  missionId: string | null;
  missionTitle: string | null;
  title: string;
  description: string;
  focusPoint: string;
  technologies: string[];
  code: string;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
  latestReview: WorkReview | null;
  reviews?: WorkReview[];
};

export type WorkPayload = {
  title: string;
  description: string;
  focusPoint: string;
  technologies: string[];
  code: string;
  isFavorite: boolean;
};

export type SaveWorkResponse = {
  workId: string;
  ticketReward: BadgeTicketReward;
};

export type ReviewWorkResponse = {
  review: WorkReview;
  ticketReward: BadgeTicketReward;
};

export const getCreateMissions = async (
  token: string
): Promise<CreateMission[]> => {
  return fetcher<CreateMission[]>("/create-missions", {
    method: "GET",
    token,
  });
};

export const getCreateMission = async (
  token: string,
  createMissionId: string
): Promise<CreateMission> => {
  return fetcher<CreateMission>(
    `/create-missions/${encodeURIComponent(createMissionId)}`,
    {
      method: "GET",
      token,
    }
  );
};

export const saveUserWork = async (
  token: string,
  createMissionId: string,
  payload: WorkPayload
): Promise<SaveWorkResponse> => {
  return fetcher<SaveWorkResponse>(
    `/create-missions/${encodeURIComponent(createMissionId)}/works`,
    {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    }
  );
};

export const getUserWorks = async (token: string): Promise<UserWork[]> => {
  return fetcher<UserWork[]>("/my-works", {
    method: "GET",
    token,
  });
};

export const updateUserWork = async (
  token: string,
  workId: string,
  payload: WorkPayload
): Promise<{ workId: string }> => {
  return fetcher<{ workId: string }>(`/my-works/${encodeURIComponent(workId)}`, {
    method: "PUT",
    token,
    body: JSON.stringify(payload),
  });
};

export const deleteUserWork = async (
  token: string,
  workId: string
): Promise<void> => {
  return fetcher<void>(`/my-works/${encodeURIComponent(workId)}`, {
    method: "DELETE",
    token,
  });
};

export const reviewUserWork = async (
  token: string,
  workId: string
): Promise<ReviewWorkResponse> => {
  return fetcher<ReviewWorkResponse>(
    `/my-works/${encodeURIComponent(workId)}/review`,
    {
      method: "POST",
      token,
    }
  );
};
