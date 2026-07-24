"use client";

import { useCallback, useEffect, useState } from "react";

export type AchievementNotificationMode = "modal" | "snackbar" | "none";

export const ACHIEVEMENT_NOTIFICATION_MODE_STORAGE_KEY =
  "engineerQuest.achievementNotificationMode";

export const DEFAULT_ACHIEVEMENT_NOTIFICATION_MODE: AchievementNotificationMode =
  "modal";

const isAchievementNotificationMode = (
  value: string | null
): value is AchievementNotificationMode =>
  value === "modal" || value === "snackbar" || value === "none";

export const useAchievementNotificationMode = () => {
  const [mode, setModeState] = useState<AchievementNotificationMode>(
    DEFAULT_ACHIEVEMENT_NOTIFICATION_MODE
  );
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const storedMode = window.localStorage.getItem(
      ACHIEVEMENT_NOTIFICATION_MODE_STORAGE_KEY
    );
    if (isAchievementNotificationMode(storedMode)) {
      setModeState(storedMode);
    }
    setIsReady(true);
  }, []);

  const setMode = useCallback((nextMode: AchievementNotificationMode) => {
    setModeState(nextMode);
    window.localStorage.setItem(
      ACHIEVEMENT_NOTIFICATION_MODE_STORAGE_KEY,
      nextMode
    );
  }, []);

  return { mode, setMode, isReady };
};
