export type Mission = {
  id: string;
  title: string;
  difficulty: number;
  goalImg: string;
  description: string;
  progress?: number;
  ctaLabel: string;
  badgeLabel: string;
};

export type MissionTab = "resume" | "recommended"

export type Status = "complete" | "incomplete";