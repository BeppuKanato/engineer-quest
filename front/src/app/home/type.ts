export type Mission = {
  id: string;
  title: string;
  difficulty: number;
  goalImg: string;
  description: string;
  progress?: number;
  ctaLabel: string;
  badgeLabel: string;
  href: string;
};

export type MissionTab = "today" | "achievement"

export type Status = "complete" | "incomplete";

export type TargetAchievement = {
  title: string;
  factor: {
    name: string;
    goal: number;
    progress: number;
  }[];
};
