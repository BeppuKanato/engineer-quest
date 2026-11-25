"use client";
/**
 * ミッションストーリーの閲覧フラグ（単元ごと1つだけ）。
 * 役割分担（2026-11-23 決定）：
 * - 開始前の入口（一覧のボタン・単元画面の帯）は「選ぶ動機」。任意に開く。
 * - 段階1の初回開始時のゲートは「枠付けの保証」。未見の人だけに（スキップ可能で）出す。
 * どこかで最後まで見たら見た扱い。途中で閉じたら未見のまま（開始時に出る）。
 * 自動表示はどこにも置かないので、GPT 案のような入口別の閲覧履歴の同期は要らない。
 */
import { useSyncExternalStore } from "react";

const seen = new Set<string>();
const listeners = new Set<() => void>();
const emit = () => { listeners.forEach(listener => listener()); };

export const hasSeenMissionStory = (courseId: string) => seen.has(courseId);

export function markMissionStorySeen(courseId: string) {
  if (seen.has(courseId)) return;
  seen.add(courseId);
  emit();
}

export function useMissionStorySeen(courseId: string) {
  return useSyncExternalStore(
    onStoreChange => { listeners.add(onStoreChange); return () => { listeners.delete(onStoreChange); }; },
    () => seen.has(courseId),
    () => false,
  );
}
