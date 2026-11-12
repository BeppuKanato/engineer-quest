import { playerTokens } from "../player/player.tokens";
/** エディタ画面だけに使う（#149 でダーク基調を廃止し、アプリ・教材と同じ明色に統一した）。
 * エディタ領域の分離は暗色ではなく、枠と見出しで表す。教材キャンバスの状態色は playerTokens を保つ。 */
export const editorTokens = {
  background: playerTokens.background, panel: playerTokens.surface, panelAlt: playerTokens.layers.layer0,
  border: "#9ca3af", text: playerTokens.text, button: playerTokens.layers.layer0,
  focus: playerTokens.focus, onFocus: playerTokens.surface,
} as const;
