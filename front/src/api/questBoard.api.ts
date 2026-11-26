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

export type QuestBoardAuthorInfo = {
  authorName: string;
  authorMascotId: string | null;
  authorAchievement: { title: string; rarity: "COMMON" | "RARE" | "EPIC" | "LEGENDARY"; iconKey: string } | null;
};

export type QuestPostSummary = QuestBoardAuthorInfo & {
  id: string;
  category: QuestPostCategory;
  categoryLabel: string;
  title: string;
  body: string;
  excerpt: string;
  code: string | null;
  referenceUrl: string | null;
  status: QuestPostStatus;
  courseId: string | null;
  courseTitle: string | null;
  /** 関連する発展ミッション（発展ミッション実装時にサーバーが返す。未実装の間は常に未設定）。 */
  missionId?: string | null;
  missionTitle?: string | null;
  /** 作品共有に付く成果（スコアとランク）。 */
  workScore?: number;
  workRank?: string;
  commentCount: number;
  reactions: QuestBoardReactionSummary;
  canResolve: boolean;
  isOwner: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
};

export type QuestCommentReactionType = "HELPFUL" | "THANKS";

export type QuestCommentReactionSummary = {
  helpful: number;
  thanks: number;
  userTypes: QuestCommentReactionType[];
};

export type QuestComment = QuestBoardAuthorInfo & {
  id: string;
  body: string;
  /** 投稿者が「解決した回答」に指定した回答かどうか。 */
  isSolution?: boolean;
  /** 回答への評価（参考になった/ありがとう）。 */
  reactions?: QuestCommentReactionSummary;
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
};

export type QuestBoardListParams = {
  q?: string;
  category?: QuestPostCategory | "ALL";
  courseId?: string;
  status?: QuestPostStatus | "ALL";
  mine?: boolean;
};

const buildQuery = (params: QuestBoardListParams = {}) => {
  const search = new URLSearchParams();

  if (params.q) search.set("q", params.q);
  if (params.category && params.category !== "ALL") search.set("category", params.category);
  if (params.courseId) search.set("courseId", params.courseId);
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

/** 回答を「解決した回答」に指定する。投稿は解決済みになり、更新後の詳細を返す。 */
export const markQuestCommentSolution = async (
  token: string,
  postId: string,
  commentId: string
): Promise<QuestBoardDetailResponse> => {
  const result = await fetcher<QuestBoardDetailResponse>(
    `/quest-board/${encodeURIComponent(postId)}/comments/${encodeURIComponent(commentId)}/solution`,
    { method: "POST", token, body: JSON.stringify({}) }
  );
  invalidateClientQueries([queryTags.questBoard]);
  return result;
};

/** 回答へのリアクション（参考になった/ありがとう）の切り替え。 */
export const toggleQuestCommentReaction = async (
  token: string,
  postId: string,
  commentId: string,
  type: QuestCommentReactionType
): Promise<{ reactions: QuestCommentReactionSummary }> => {
  const result = await fetcher<{ reactions: QuestCommentReactionSummary }>(
    `/quest-board/${encodeURIComponent(postId)}/comments/${encodeURIComponent(commentId)}/reactions`,
    { method: "POST", token, body: JSON.stringify({ type }) }
  );
  invalidateClientQueries([queryTags.questBoard]);
  return result;
};
