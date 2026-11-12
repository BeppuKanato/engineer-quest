import { playerTokens } from "../player/player.tokens";
/** 学習進捗だけプレイヤーと共有。キャンバスのアルゴリズム状態色は持ち込まない。 */
export const appLearningTokens = {
  background: "#f3f6fb", surface: "#ffffff", text: "#111827", border: "#dbe3ef",
  progress: { next: playerTokens.focus, completed: playerTokens.states.completed.fill, idle: playerTokens.states.idle.fill, stroke: playerTokens.states.idle.stroke },
} as const;
