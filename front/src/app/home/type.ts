export type Mission = {
  id: string;
  title: string;
  difficulty: number;
  goalImg: string;
  description: string;
  progress?: number;
  estimatedMinutes: number;
  rewardExp: number;
  activityCount: number;
  ctaLabel: string;
  badgeLabel: string;
  reason: string;
  href: string;
};

export type MissionTab = "today" | "achievement"

export type Status = "complete" | "incomplete";

export type TargetAchievement = {
  title: string;
  href?: string;
  actionLabel?: string;
  factor: {
    name: string;
    goal: number;
    progress: number;
  }[];
};
