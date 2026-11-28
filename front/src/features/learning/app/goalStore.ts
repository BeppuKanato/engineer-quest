"use client";

// 目標（自分の目標に採用した単元）の共有状態（2026-11-23 の再設計）。
// 目標は1つだけ：新しい単元で設定すると前の目標は外れる（ホームの目標帯が1つしか
// 表示できないため）。コース一覧の旗トグルと単元画面の帯ボタンが同じ状態を見る。
// 状態は localStorage に保存し、画面遷移や再読込でも保つ。サーバー側の保存は
// ホームの目標帯とあわせて別途検討する。
import { useSyncExternalStore } from "react";

const STORAGE_KEY = "engineer-quest:goal-course";

const readStored = (): string | null => {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};

let goalCourseId: string | null = null;
let initialized = false;
const ensureInitialized = () => {
  if (initialized) return;
  initialized = true;
  goalCourseId = readStored();
};
const persist = () => {
  try {
    if (goalCourseId) localStorage.setItem(STORAGE_KEY, goalCourseId);
    else localStorage.removeItem(STORAGE_KEY);
  } catch { /* 保存できなくても表示は続ける */ }
};

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

export const goalStore = {
  get: () => {
    ensureInitialized();
    return goalCourseId;
  },
  set: (id: string | null) => {
    ensureInitialized();
    goalCourseId = id;
    persist();
    emit();
  },
  toggle: (id: string) => {
    ensureInitialized();
    goalCourseId = goalCourseId === id ? null : id;
    persist();
    emit();
  },
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

export const useGoalCourseId = (): string | null =>
  useSyncExternalStore(goalStore.subscribe, goalStore.get, () => null);

// 目標の達成記録（2026-11-28）。目標の単元が完了していたら、ホームで達成を
// 記録して目標を取り消し、称賛と「取り消した」ことの通知を出すために使う。
// 記録は学習者が閉じるまで残る。目標そのものとは別キーで持つ（取り消した後も
// 「何を達成したか」を表示する必要があるため）。
export type GoalAchievement = { courseId: string; missionTitle: string; unitTitle: string };

const ACHIEVED_KEY = "engineer-quest:goal-achieved";

export const goalAchievement = {
  read: (): GoalAchievement | null => {
    try {
      const raw = localStorage.getItem(ACHIEVED_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as GoalAchievement;
      return parsed && typeof parsed.courseId === "string" ? parsed : null;
    } catch {
      return null;
    }
  },
  record: (achievement: GoalAchievement) => {
    try {
      localStorage.setItem(ACHIEVED_KEY, JSON.stringify(achievement));
    } catch { /* 保存できなくても取り消し自体は行う */ }
  },
  clear: () => {
    try {
      localStorage.removeItem(ACHIEVED_KEY);
    } catch { /* 表示側の状態で閉じる */ }
  },
};
