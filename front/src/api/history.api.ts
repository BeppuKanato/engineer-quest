import { fetcher } from "@/lib/fetcher";

export type HistoryEventType =
  | "activity_completed"
  | "mission_completed"
  | "course_completed"
  | "exp_gained"
  | "badge_ticket"
  | "badge_acquired"
  | "knowledge_tip_acquired"
  | "achievement_unlocked"
  | "work_saved"
  | "ai_review";

export type HistoryEvent = {
  id: string;
  type: HistoryEventType;
  title: string;
  description: string;
  occurredAt: string;
  href: string | null;
  amount?: number;
};

export type HistoryGroup = {
  date: string;
  events: HistoryEvent[];
};

export type HistoryResponse = {
  events: HistoryEvent[];
  groups: HistoryGroup[];
};

export const getHistory = async (token: string): Promise<HistoryResponse> => {
  return fetcher<HistoryResponse>("/history", {
    method: "GET",
    token,
  });
};
