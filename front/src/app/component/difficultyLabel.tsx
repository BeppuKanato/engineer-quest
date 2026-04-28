import { Stack, Typography } from "@mui/material";
import { Difficulty } from "../courses/type"
import StarIcon from '@mui/icons-material/Star';

type DifficultyLabelProps = {
    difficulty: Difficulty;
};

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
    easy: "やさしい",
    normal: "ふつう",
    hard: "難しめ",
}

const DIFFICULTY_LEVEL: Record<Difficulty, number> = {
    easy: 1,
    normal: 2,
    hard: 3,
}

export const DifficultyLabel: React.FC<DifficultyLabelProps> = ({ difficulty }) => {
    const level = DIFFICULTY_LEVEL[difficulty];

    return (
        <Stack direction="row" alignItems="center" spacing={0.5}>
            <Stack direction="row" spacing={0}>
                {[1, 2, 3].map((value) => 
                    value <= level ? (
                        <StarIcon key={value} sx={{ fontSize: 16, color: "#f59e0b" }}/>
                    ) : (
                        <StarIcon key={value} sx={{ fontSize: 16, color: "#cbd5e1" }}/>
                    )
                )}
            </Stack>
            <Typography variant="body2" fontWeight={700}>
                {DIFFICULTY_LABELS[difficulty]}
            </Typography>
        </Stack>
    )
}