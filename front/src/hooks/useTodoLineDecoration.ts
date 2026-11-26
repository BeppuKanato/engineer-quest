import { useEffect, useRef, type RefObject } from "react";
import type { OnMount } from "@monaco-editor/react";

type EditorInstance = Parameters<OnMount>[0];

/**
 * フェーズ7エディタの「ここを書く」行ハイライト。
 * 骨格・穴埋めテンプレートのプレースホルダ行（「ここを書く」を含む行）に
 * Monaco の行デコレーションを付け、書くべき場所が文章を読まなくても
 * 見て分かるようにする。見た目は globals.css の
 * .eq-todo-line-highlight / .eq-todo-line-marker が担う。
 */
export function useTodoLineDecoration(editor: RefObject<EditorInstance | null>, editorReady: boolean, lines: readonly number[]) {
  const decorations = useRef<string[]>([]);
  const key = lines.join(",");
  useEffect(() => {
    const instance = editor.current;
    if (!instance) return;
    const model = instance.getModel();
    if (!model) return;
    const valid = lines.filter(line => line >= 1 && line <= model.getLineCount());
    decorations.current = instance.deltaDecorations(decorations.current, valid.map(line => ({
      range: { startLineNumber: line, startColumn: 1, endLineNumber: line, endColumn: 1 },
      options: { isWholeLine: true, className: "eq-todo-line-highlight", linesDecorationsClassName: "eq-todo-line-marker" },
    })));
    // key は lines の内容を表す安定した文字列。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, editorReady, key]);
}
