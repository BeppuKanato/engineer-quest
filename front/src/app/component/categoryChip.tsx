import { Chip } from "@mui/material";
import { CourseCategory } from "../type";

type CategoryChipProps = {
    category: CourseCategory;
};

const CATEGORY_LABEL: Record<CourseCategory, string> = {
    game: "ゲーム",
    algorithm: "アルゴリズム",
    tool: "便利ツール",
    ui: "画面操作",
    data: "データ管理",
};

export const CategoryChip: React.FC<CategoryChipProps> = ({ category }) => {
    return (
        <Chip
            label={CATEGORY_LABEL[category]}
            size="small"
            sx={{
                bgcolor: "#eef2ff",
                color: "#4f46e5",
                fontWeight: 700,
            }} 
        />
    );
};

export const getCategoryLabel = (category: CourseCategory) => CATEGORY_LABEL[category];