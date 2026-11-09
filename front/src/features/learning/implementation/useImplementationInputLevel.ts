"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  defaultImplementationInputLevel, readImplementationDraft, writeImplementationDraft,
  type ImplementationInputLevel,
} from "./inputLevel";

/** 単元ごとに用意する、レベル別の初期テンプレート。 */
export type ImplementationLevelTemplates = Readonly<Record<ImplementationInputLevel, string>>;

/**
 * フェーズ7の入力量レベルとコード下書きの状態（Issue #328）。
 * コードは編集のたびに現在のレベルの下書きキーへ保存されるため、レベルを切り替えても
 * 別レベルの下書きは壊れない。切り替え時は対象レベルの下書き（無ければそのレベルのテンプレート）を読み込む。
 */
export function useImplementationInputLevel({ draftBaseKey, templates, onDraftError }: {
  draftBaseKey: string;
  templates: ImplementationLevelTemplates;
  onDraftError?: (failed: boolean) => void;
}) {
  const [level, setLevel] = useState<ImplementationInputLevel>(defaultImplementationInputLevel);
  const [code, setCodeState] = useState<string>(
    () => readImplementationDraft(draftBaseKey, defaultImplementationInputLevel) ?? templates[defaultImplementationInputLevel],
  );
  const levelRef = useRef(level);
  const errorRef = useRef(onDraftError);
  useEffect(() => { errorRef.current = onDraftError; }, [onDraftError]);

  const setCode = useCallback((next: string) => {
    setCodeState(next);
    errorRef.current?.(!writeImplementationDraft(draftBaseKey, levelRef.current, next));
  }, [draftBaseKey]);

  const selectLevel = useCallback((next: ImplementationInputLevel) => {
    if (next === levelRef.current) return;
    levelRef.current = next;
    setLevel(next);
    setCodeState(readImplementationDraft(draftBaseKey, next) ?? templates[next]);
  }, [draftBaseKey, templates]);

  return { level, code, setCode, selectLevel };
}
