import type { MissionVisualTone } from "./type";

export const visualToneStyle: Record<
  MissionVisualTone,
  { color: string; background: string; border: string; accent: string }
> = {
  blue: {
    color: "#1d4ed8",
    background: "#eff6ff",
    border: "#93c5fd",
    accent: "#2563eb",
  },
  green: {
    color: "#15803d",
    background: "#f0fdf4",
    border: "#86efac",
    accent: "#16a34a",
  },
  orange: {
    color: "#c2410c",
    background: "#fff7ed",
    border: "#fdba74",
    accent: "#f97316",
  },
  purple: {
    color: "#7e22ce",
    background: "#faf5ff",
    border: "#d8b4fe",
    accent: "#9333ea",
  },
  gray: {
    color: "#475569",
    background: "#f8fafc",
    border: "#cbd5e1",
    accent: "#64748b",
  },
};
