import { Button, Paper, Stack, Typography } from "@mui/material";
import { DifficultyLabel } from "../../component/difficultyLabel";
import { getCategoryLabel } from "../../component/categoryChip";
import { CourseCategory, CourseFilterState, Difficulty, ProgressStatus } from "../type";

type CourseFilterProps = {
  value: CourseFilterState;
  onChange: (value: CourseFilterState) => void;
};

const categoryOptions: { value: CourseCategory | "all"; label: string }[] = [
  { value: "all", label: "すべて" },
  { value: "sort", label: "ソート" },
  { value: "search", label: "探索" },
  { value: "graph", label: "グラフ" },
  { value: "data_structure", label: "データ構造" },
  { value: "dynamic_programming", label: "動的計画法" },
];

const statusOptions: { value: ProgressStatus | "all"; label: string }[] = [
  { value: "all", label: "すべて" },
  { value: "in_progress", label: "進行中" },
  { value: "not_started", label: "未着手" },
  { value: "completed", label: "クリア済み" },
];

const difficultyOptions: { value: Difficulty | "all"; label: string }[] = [
  { value: "all", label: "すべて" },
  { value: "easy", label: "やさしい" },
  { value: "normal", label: "ふつう" },
  { value: "hard", label: "難しめ" },
];

type FilterButtonProps = {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
};

const FilterButton: React.FC<FilterButtonProps> = ({ selected, onClick, children }) => {
  return (
    <Button
      variant={selected ? "contained" : "text"}
      onClick={onClick}
      sx={{
        borderRadius: 999,
        px: 2.2,
        py: 0.85,
        minHeight: 38,
        minWidth: "auto",
        bgcolor: selected ? "#0057e7" : "#f3f4f6",
        color: selected ? "#fff" : "#111827",
        fontWeight: 900,
        lineHeight: 1,
        whiteSpace: "nowrap",
        boxShadow: selected ? "0 8px 18px rgba(0, 87, 231, 0.22)" : "none",
        "&:hover": {
          bgcolor: selected ? "#0046c7" : "#e5e7eb",
          boxShadow: selected ? "0 8px 18px rgba(0, 87, 231, 0.22)" : "none",
        },
      }}
    >
      {children}
    </Button>
  );
};

type FilterGroupProps = {
  label: string;
  children: React.ReactNode;
};

const FilterGroup: React.FC<FilterGroupProps> = ({ label, children }) => {
  return (
    <Stack direction={{ xs: "column", md: "row" }} spacing={1.25} alignItems={{ xs: "stretch", md: "center" }}>
      <Typography fontWeight={950} sx={{ minWidth: 76, color: "#111827" }}>
        {label}
      </Typography>
      <Stack direction="row" flexWrap="wrap" gap={1}>
        {children}
      </Stack>
    </Stack>
  );
};

export const CourseFilter: React.FC<CourseFilterProps> = ({ value, onChange }) => {
  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, md: 2.5 },
        borderRadius: 2,
        border: "1px solid #e2e8f0",
        bgcolor: "#fff",
        boxShadow: "0 10px 28px rgba(15,23,42,0.05)",
      }}
    >
      <Stack spacing={2}>
        <FilterGroup label="カテゴリ:">
          {categoryOptions.map((option) => (
            <FilterButton
              key={option.value}
              selected={value.category === option.value}
              onClick={() => onChange({ ...value, category: option.value })}
            >
              {option.value === "all" ? option.label : getCategoryLabel(option.value)}
            </FilterButton>
          ))}
        </FilterGroup>

        <Stack direction={{ xs: "column", lg: "row" }} spacing={{ xs: 2, lg: 4 }}>
          <FilterGroup label="状態:">
            {statusOptions.map((option) => (
              <FilterButton
                key={option.value}
                selected={value.status === option.value}
                onClick={() => onChange({ ...value, status: option.value })}
              >
                {option.label}
              </FilterButton>
            ))}
          </FilterGroup>

          <FilterGroup label="難易度:">
            {difficultyOptions.map((option) => (
              <FilterButton
                key={option.value}
                selected={value.difficulty === option.value}
                onClick={() => onChange({ ...value, difficulty: option.value })}
              >
                {option.value === "all" ? option.label : <DifficultyLabel difficulty={option.value} variant="plain" />}
              </FilterButton>
            ))}
          </FilterGroup>
        </Stack>
      </Stack>
    </Paper>
  );
};
