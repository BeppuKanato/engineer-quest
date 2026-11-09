import { useEffect, useRef, type RefObject } from "react";
import type { OnMount } from "@monaco-editor/react";

type EditorInstance = Parameters<OnMount>[0];

/**
 * フェーズ7エディタのエラー行ハイライト（全単元共通）。
 * line が指す行に Monaco の行デコレーションを付け、line が undefined になる
 * （コード変更・再実行・エラーなし）と消す。見た目は globals.css の
 * .eq-error-line-highlight / .eq-error-line-marker が担う。
 */
export function useErrorLineDecoration(editor: RefObject<EditorInstance | null>, editorReady: boolean, line: number | undefined) {
  const decorations = useRef<string[]>([]);
  useEffect(() => {
    const instance = editor.current;
    if (!instance) return;
    const model = instance.getModel();
    const valid = line !== undefined && model !== null && line >= 1 && line <= model.getLineCount();
    decorations.current = instance.deltaDecorations(decorations.current, valid ? [{
      range: { startLineNumber: line, startColumn: 1, endLineNumber: line, endColumn: 1 },
      options: { isWholeLine: true, className: "eq-error-line-highlight", linesDecorationsClassName: "eq-error-line-marker" },
    }] : []);
  }, [editor, editorReady, line]);
}
