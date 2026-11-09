import type { Monaco } from "@monaco-editor/react";

/**
 * フェーズ7「自分で実装」の Monaco エディタ共有設定（全単元共通）。
 * テーマとカーソルの見え方はここで一元化し、各単元のプレビューは
 * theme={LEARNING_EDITOR_THEME} と beforeMount={setupLearningEditor} を渡すだけにする。
 */
export const LEARNING_EDITOR_THEME = "eq-light";

/**
 * beforeMount で共有テーマを定義する。
 * ベースは従来どおりライトテーマ "vs" だが、キャレット（入力位置の縦棒）の色を明示する。
 * 既定任せだと環境により白系になり、白いエディタ背景で入力位置が見えなくなるため（Issue #325）。
 */
export function setupLearningEditor(monaco: Monaco) {
  monaco.editor.defineTheme(LEARNING_EDITOR_THEME, {
    base: "vs",
    inherit: true,
    rules: [],
    colors: {
      "editorCursor.foreground": "#111827",
      "editorCursor.background": "#ffffff",
    },
  });
}

// I ビーム（マウスのテキストカーソル）も OS 標準だと白系で背景に埋もれることがあるため、
// 濃色で描いた SVG をデータ URI で直接指定する。白の下地を太く敷き、暗い場所でも輪郭が残るようにしている。
const textCursorSvg = "<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'>"
  + "<path d='M12 3 V21 M6 3 H18 M6 21 H18' fill='none' stroke='%23ffffff' stroke-width='6' stroke-linecap='square'/>"
  + "<path d='M12 3 V21 M6 3 H18 M6 21 H18' fill='none' stroke='%23111827' stroke-width='2.6' stroke-linecap='square'/></svg>";
export const learningEditorTextCursor = `url("data:image/svg+xml,${textCursorSvg}") 12 12, text`;
