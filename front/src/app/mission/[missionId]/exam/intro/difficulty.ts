import type { Difficulty, DifficultyMeta } from "./type";

export const defaultExamDifficulty: Difficulty = "normal";

export const difficultyOrder: Difficulty[] = ["easy", "normal", "hard"];

export const difficultyMeta: Record<Difficulty, DifficultyMeta> = {
  easy: {
    label: "Easy",
    title: "やさしい",
    inputAmount: "少なめ",
    hintAmount: "多め",
    description: "少ない入力で流れを確認できます。",
    color: "success",
  },
  normal: {
    label: "Normal",
    title: "ふつう",
    inputAmount: "ふつう",
    hintAmount: "ふつう",
    description: "重要なコードを自分で入力します。",
    color: "primary",
  },
  hard: {
    label: "Hard",
    title: "むずかしい",
    inputAmount: "多め",
    hintAmount: "少なめ",
    description: "多めのコードを自力で再現します。",
    color: "error",
  },
};