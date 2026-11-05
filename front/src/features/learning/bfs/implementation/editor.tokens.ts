import { playerTokens } from "../../player/player.tokens";
/** エディタのUIだけに使う。教材キャンバスの状態色はplayerTokensを保つ。 */
export const editorTokens = {
  background: "#1e1e1e", panel: "#252526", border: "#666666", text: "#e7e7e7",
  button: "#333333", focus: playerTokens.focus, onFocus: playerTokens.surface,
} as const;
