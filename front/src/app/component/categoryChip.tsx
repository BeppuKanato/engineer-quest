import { Chip } from "@mui/material";
import type { CourseCategory } from "../courses/type";

type CategoryChipProps = { category: CourseCategory };

const CATEGORY_LABEL: Record<CourseCategory, string> = {
  sort: "ソート",
  search: "データ探索",
  graph: "グラフ",
  data_structure: "データ構造",
  dynamic_programming: "動的計画法",
  algorithm: "アルゴリズム",
  game: "ゲーム",
  tool: "ツール",
  ui: "UI",
  data: "データ",
};

export const CategoryChip = ({ category }: CategoryChipProps) => (
  <Chip
    label={CATEGORY_LABEL[category] ?? "アルゴリズム"}
    size="small"
    sx={{ bgcolor: "#eef2ff", color: "#4f46e5", fontWeight: 700 }}
  />
);

export const getCategoryLabel = (category: CourseCategory) =>
  CATEGORY_LABEL[category] ?? "アルゴリズム";
