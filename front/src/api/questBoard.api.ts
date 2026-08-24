import { fetcher } from "@/lib/fetcher";
import { fetchClientQuery, invalidateClientQueries, queryTags } from "@/lib/clientQueryCache";

export type QuestPostCategory =
  | "QUESTION"
  | "ERROR_HELP"
  | "WORK_SHARE"
  | "CODE_SHARE"
  | "MEMO"
  | "REFERENCE";

export type QuestPostStatus = "OPEN" | "RESOLVED";

export type QuestReactionType = "LIKE" | "HELPFUL" | "SAVED_ME";

export type QuestBoardOption = {
  value: string;
  label: string;
};

export type QuestBoardReactionSummary = {
  total: number;
  byType: Record<QuestReactionType, number>;
  userReactedTypes: QuestReactionType[];
};

export type QuestPostSummary = {
  id: string;
  category: QuestPostCategory;
  categoryLabel: string;
  title: string;
  body: string;
  excerpt: string;
  code: string | null;
  referenceUrl: string | null;
  status: QuestPostStatus;
  authorName: string;
  courseId: string | null;
  courseTitle: string | null;
  missionId: string | null;
  missionTitle: string | null;
  commentCount: number;
  reactions: QuestBoardReactionSummary;
  canResolve: boolean;
  isOwner: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
};

export type QuestComment = {
  id: string;
  body: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
};

export type QuestPostDetail = QuestPostSummary & {
  comments: QuestComment[];
};

export type QuestBoardOptions = {
  categories: QuestBoardOption[];
  statuses: QuestBoardOption[];
  reactionTypes: QuestBoardOption[];
};

export type QuestBoardListResponse = {
  posts: QuestPostSummary[];
  options: QuestBoardOptions;
};

export type QuestBoardDetailResponse = {
  post: QuestPostDetail;
  options: QuestBoardOptions;
};

export type CreateQuestPostPayload = {
  category: QuestPostCategory;
  title: string;
  body: string;
  code?: string;
  referenceUrl?: string;
  courseId?: string;
  missionId?: string;
  workId?: string;
};

export type QuestBoardListParams = {
  q?: string;
  category?: QuestPostCategory | "ALL";
  courseId?: string;
  missionId?: string;
  status?: QuestPostStatus | "ALL";
  mine?: boolean;
};

const buildQuery = (params: QuestBoardListParams = {}) => {
  const search = new URLSearchParams();

  if (params.q) search.set("q", params.q);
  if (params.category && params.category !== "ALL") search.set("category", params.category);
  if (params.courseId) search.set("courseId", params.courseId);
  if (params.missionId) search.set("missionId", params.missionId);
  if (params.status && params.status !== "ALL") search.set("status", params.status);
  if (params.mine) search.set("mine", "true");

  const query = search.toString();
  return query ? `?${query}` : "";
};

export const getQuestBoardPosts = async (
  token: string,
  params: QuestBoardListParams = {}
): Promise<QuestBoardListResponse> => {
  const query = buildQuery(params);
  return fetchClientQuery(
    `quest-board:list${query}`,
    () => fetcher<QuestBoardListResponse>(`/quest-board${query}`, { method: "GET", token }),
    { staleTimeMs: 10_000, tags: [queryTags.questBoard] }
  );
};

export const createQuestPost = async (
  token: string,
  payload: CreateQuestPostPayload
): Promise<{ postId: string }> => {
  const result = await fetcher<{ postId: string }>("/quest-board", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
  invalidateClientQueries([queryTags.questBoard]);
  return result;
};

export const updateQuestPost = async (
  token: string,
  postId: string,
  payload: CreateQuestPostPayload
): Promise<QuestBoardDetailResponse> => {
  const result = await fetcher<QuestBoardDetailResponse>(
    `/quest-board/${encodeURIComponent(postId)}`,
    {
      method: "PATCH",
      token,
      body: JSON.stringify(payload),
    }
  );
  invalidateClientQueries([queryTags.questBoard]);
  return result;
};

export const deleteQuestPost = async (
  token: string,
  postId: string
): Promise<{ postId: string; deletedAt: string }> => {
  const result = await fetcher<{ postId: string; deletedAt: string }>(
    `/quest-board/${encodeURIComponent(postId)}`,
    {
      method: "DELETE",
      token,
    }
  );
  invalidateClientQueries([queryTags.questBoard]);
  return result;
};

export const getQuestPost = async (
  token: string,
  postId: string
): Promise<QuestBoardDetailResponse> => {
  return fetchClientQuery(
    `quest-board:detail:${postId}`,
    () => fetcher<QuestBoardDetailResponse>(
      `/quest-board/${encodeURIComponent(postId)}`,
      { method: "GET", token }
    ),
    { staleTimeMs: 10_000, tags: [queryTags.questBoard] }
  );
};

export const addQuestComment = async (
  token: string,
  postId: string,
  body: string
): Promise<{ comment: QuestComment }> => {
  const result = await fetcher<{ comment: QuestComment }>(
    `/quest-board/${encodeURIComponent(postId)}/comments`,
    {
      method: "POST",
      token,
      body: JSON.stringify({ body }),
    }
  );
  invalidateClientQueries([queryTags.questBoard]);
  return result;
};

export const toggleQuestReaction = async (
  token: string,
  postId: string,
  type: QuestReactionType
): Promise<{ reactions: QuestBoardReactionSummary }> => {
  const result = await fetcher<{ reactions: QuestBoardReactionSummary }>(
    `/quest-board/${encodeURIComponent(postId)}/reactions`,
    {
      method: "POST",
      token,
      body: JSON.stringify({ type }),
    }
  );
  invalidateClientQueries([queryTags.questBoard]);
  return result;
};

export const updateQuestPostStatus = async (
  token: string,
  postId: string,
  status: QuestPostStatus
): Promise<{ status: QuestPostStatus; updatedAt: string }> => {
  const result = await fetcher<{ status: QuestPostStatus; updatedAt: string }>(
    `/quest-board/${encodeURIComponent(postId)}/status`,
    {
      method: "POST",
      token,
      body: JSON.stringify({ status }),
    }
  );
  invalidateClientQueries([queryTags.questBoard]);
  return result;
};
