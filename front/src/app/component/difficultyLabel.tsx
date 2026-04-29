import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import { Stack, Typography } from "@mui/material";
import { Difficulty } from "../courses/type";

type DifficultyLabelProps = {
    difficulty: Difficulty;
    variant?: "chip" | "plain";
    size?: "small" | "medium";
};

const DIFFICULTY_LABEL: Record<Difficulty, string> = {
    easy: "やさしい",
    normal: "ふつう",
    hard: "難しめ",
};

const DIFFICULTY_LEVEL: Record<Difficulty, number> = {
    easy: 1,
    normal: 2,
    hard: 3,
};

const DIFFICULTY_STYLE: Record<Difficulty, { bgcolor: string; color: string; borderColor: string }> = {
    easy: {
        bgcolor: "#fffbeb",
        color: "#92400e",
        borderColor: "#fde68a",
    },
    normal: {
        bgcolor: "#eff6ff",
        color: "#1d4ed8",
        borderColor: "#bfdbfe",
    },
    hard: {
        bgcolor: "#faf5ff",
        color: "#7e22ce",
        borderColor: "#e9d5ff",
    },
};

export const DifficultyLabel: React.FC<DifficultyLabelProps> = ({
    difficulty,
    variant = "chip",
    size = "small",
}) => {
    const level = DIFFICULTY_LEVEL[difficulty];
    const style = DIFFICULTY_STYLE[difficulty];

    const iconSize = size === "small" ? 15 : 18;
    const fontSize = size === "small" ? 12 : 14;

    return (
        <Stack
            direction="row"
            alignItems="center"
            spacing={0.5}
            sx={{
                width: "fit-content",
                ...(variant === 'chip' && {
                    px: size === "small" ? 1 : 1.25,
                    py: size === "small" ? 0.4 : 0.6,
                    borderRadius: 999,
                    bgcolor: style.bgcolor,
                    color: style.color,
                    border: "1px solid",
                    borderColor: style.borderColor,
                    fontWeight: 800,
                }),
                ...(variant === "plain" && {
                    color: "text.primary",
                })
            }}
        >
            <Stack direction="row" spacing={0}>
                {[1, 2, 3].map((value) =>
                    value <= level ? (
                        <StarIcon
                            key={value}
                            sx={{
                                fontSize: iconSize,
                                color: "#f59e0b",
                            }}
                        />
                    ) : (
                        <StarBorderIcon
                            key={value}
                            sx={{
                                fontSize: iconSize,
                                color: "#cbd5e1",
                            }}
                        />
                    )
                )}
            </Stack>

            <Typography
                component="span"
                sx={{
                    fontSize,
                    fontWeight: 800,
                    lineHeight: 1,
                }}
            >
                {DIFFICULTY_LABEL[difficulty]}
            </Typography>
        </Stack>
    );
};