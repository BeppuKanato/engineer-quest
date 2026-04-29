import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import { CourseCategory, CourseFilterState, CourseStatus, Difficulty } from "../type";
import { DifficultyLabel } from "../../component/difficultyLabel";
import { getCategoryLabel } from "../../component/categoryChip";
import { ACTION_BEFORE_REFRESH } from "../../../../node_modules/next/dist/next-devtools/dev-overlay/shared";

type CourseFilterProps = {
    value: CourseFilterState;
    onChange: (value: CourseFilterState) => void;
};

const categoryOptions: {value: CourseCategory | "all", label: string}[] = [
    { value: "all", label: "すべて" },
    { value: "game", label: "ゲーム" },
    { value: "algorithm", label: "アルゴリズム"},
    { value: "tool", label: "便利ツール"},
    { value: "ui", label: "画面操作" },
    { value: "data", label: "データ管理"},
];

const statusOptions: { value: CourseStatus | "all", label: string}[] = [
    { value: "all", label: "すべて" },
    { value: "not_started", label: "未着手" },
    { value: "in_progress", label: "進行中"},
    { value: "completed", label: "クリア済み"},
];

const difficultyOptions: { value: Difficulty | "all", label: string}[] = [
    { value: "all", label: "すべて" },
    { value: "easy", label: "やさしい" },
    { value: "normal", label: "ふつう"},
    { value: "hard", label: "難しめ"}
]

type FilterGroupProps = {
    title: string;
    children: React.ReactNode;
}

const FilterGroup: React.FC<FilterGroupProps> = ({ title, children }) => {
    return (
        <Stack spacing={1.5}>
            <Typography variant="subtitle2" fontWeight={700}>
                {title}
            </Typography>
            <Stack direction="row" flexWrap="wrap" gap={1.25}>
                {children}
            </Stack>
        </Stack>
    );
};

type FilterButtonProps = {
    selected: boolean;
    onClick: () => void;
    children: React.ReactNode;
};

const FilterButton: React.FC<FilterButtonProps> = ({ selected, onClick, children}) => {
    return(
        <Button
            variant={selected ? "contained" : "outlined"}
            onClick={onClick}
            sx={{
                borderRadius: 999,
                px: 2.5,
                py: 1,
                minHeight: 42,
                bgcolor: selected ? "primary.main" : "#fff",
                color: selected ? "#fff" : "text.primary",
                borderColor: selected ? "primary.main" : "#cbd5e1",
                fontWeight: 700,
                boxShadow: selected ? "0 6px 14px rgba(37, 99, 235, 0.25)" : "none",
                "&:hover": {
                    bgcolor: selected ? "primary.dark" : "#f8fafc",
                    borderColor: selected ? "primary.dark" : "#94a3b8",
                },
            }}
        >
            {children}
        </Button>
    )
}
export const CourseFilter: React.FC<CourseFilterProps> = ({ value, onChange}) => {
    return (
        <Paper
            elevation={0}
            sx={{
                p: 3,
                borderRadius: 4,
                border: "1px solid",
                borderColor: "primary.100",
                bgcolor: "linear-gradient(135deg, #eff6ff 0%, #faf5ff 100%)",
                boxShadow: "0 6px 18px rgba(15, 23, 42, 0.08)",
            }}
        >
            <Stack spacing={3}>
                <FilterGroup title="作りたいもの">
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

                <Stack direction={{ xs: "column", md: "row" }} spacing={4}>
                    <Box flex={1}>
                        <FilterGroup title="状態">
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
                    </Box>

                    <Box flex={1}>
                        <FilterGroup title="難易度">
                            {difficultyOptions.map((option) => (
                                <FilterButton
                                    key={option.value}
                                    selected={value.difficulty === option.value}
                                    onClick={() => onChange({ ...value, difficulty: option.value })}
                                >
                                    {option.value === "all" ? (
                                        option.label
                                    ) : (
                                        <DifficultyLabel difficulty={option.value} variant="plain" />
                                    )}
                                </FilterButton>
                            ))}
                        </FilterGroup>
                    </Box>
                </Stack>
            </Stack>
        </Paper>
    )
}