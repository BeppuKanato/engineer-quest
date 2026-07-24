import { fetcher } from "@/lib/fetcher";

export type CreateThemeCategory =
  | "UI"
  | "HTML_CSS"
  | "JAVASCRIPT"
  | "FORM"
  | "DATA_DISPLAY"
  | "API"
  | "CRUD"
  | "GAME";

export type CourseDifficulty = "EASY" | "NORMAL" | "HARD";
export type CreateWorkStatus = "DRAFT" | "COMPLETED";
export type CreateWorkVisibility = "PRIVATE" | "SHARED";

export type CreateChecklistItem = {
  id: string;
  label: string;
  description: string | null;
};

export type CreateRecommendedCourse = {
  id: string;
  title: string;
};

export type CreateTheme = {
  id: string;
  title: string;
  description: string;
  category: CreateThemeCategory;
  difficulty: CourseDifficulty;
  estimatedMinutes: number;
  tags: string[];
  defaultThumbnailUrl: string | null;
  workCount: number;
  isRecommendedForUser: boolean;
  recommendedCourses: CreateRecommendedCourse[];
  requirements: CreateChecklistItem[];
  challenges: CreateChecklistItem[];
};

export type CreateWork = {
  id: string;
  themeId: string;
  courseId: string | null;
  themeTitle: string;
  title: string;
  description: string;
  learnedNote: string | null;
  techStack: string[];
  publicUrl: string | null;
  repositoryUrl: string | null;
  imageUrl: string | null;
  status: CreateWorkStatus;
  visibility: CreateWorkVisibility;
  createdAt: string;
  updatedAt: string;
  sharedAt: string | null;
  theme: CreateTheme;
  checkedRequirementIds: string[];
  checkedChallengeIds: string[];
};

export type CreateWorkPayload = {
  title: string;
  description: string;
  learnedNote: string;
  techStack: string[];
  publicUrl: string;
  repositoryUrl: string;
  imageUrl: string;
  status: CreateWorkStatus;
  visibility: CreateWorkVisibility;
  requirementIds: string[];
  challengeIds: string[];
};

export const getCreateThemes = async (token: string): Promise<CreateTheme[]> =>
  fetcher<CreateTheme[]>("/create-themes", { method: "GET", token });

export const getCreateTheme = async (
  token: string,
  themeId: string
): Promise<CreateTheme> =>
  fetcher<CreateTheme>(`/create-themes/${encodeURIComponent(themeId)}`, {
    method: "GET",
    token,
  });

export const createMyWork = async (
  token: string,
  themeId: string,
  payload: CreateWorkPayload
): Promise<{ workId: string }> =>
  fetcher<{ workId: string }>(`/create-themes/${encodeURIComponent(themeId)}/works`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });

export const getMyWorks = async (token: string): Promise<CreateWork[]> =>
  fetcher<CreateWork[]>("/my-works", { method: "GET", token });

export const getMyWork = async (token: string, workId: string): Promise<CreateWork> =>
  fetcher<CreateWork>(`/my-works/${encodeURIComponent(workId)}`, {
    method: "GET",
    token,
  });

export const updateMyWork = async (
  token: string,
  workId: string,
  payload: CreateWorkPayload
): Promise<{ workId: string }> =>
  fetcher<{ workId: string }>(`/my-works/${encodeURIComponent(workId)}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  });

export const deleteMyWork = async (token: string, workId: string): Promise<void> =>
  fetcher<void>(`/my-works/${encodeURIComponent(workId)}`, {
    method: "DELETE",
    token,
  });

export const shareMyWork = async (
  token: string,
  workId: string
): Promise<{ workId: string }> =>
  fetcher<{ workId: string }>(`/my-works/${encodeURIComponent(workId)}/share`, {
    method: "POST",
    token,
  });

export const unshareMyWork = async (
  token: string,
  workId: string
): Promise<{ workId: string }> =>
  fetcher<{ workId: string }>(`/my-works/${encodeURIComponent(workId)}/unshare`, {
    method: "POST",
    token,
  });

export const getSharedWorks = async (): Promise<CreateWork[]> =>
  fetcher<CreateWork[]>("/shared-works", { method: "GET" });
