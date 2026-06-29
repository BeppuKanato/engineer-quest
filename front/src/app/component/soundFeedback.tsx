"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type SoundEffectName =
  | "activityComplete"
  | "badgeCommon"
  | "badgeRare"
  | "buttonClick"
  | "errorSoft"
  | "gachaStart"
  | "gachaReveal"
  | "levelUp"
  | "missionComplete"
  | "saveSuccess"
  | "ticket";

const soundFiles: Record<SoundEffectName, string> = {
  activityComplete: "/audio/SE/activity-complete.mp3",
  badgeCommon: "/audio/SE/badge-get-common.mp3",
  badgeRare: "/audio/SE/badge-get-rare.mp3",
  buttonClick: "/audio/SE/button-click.mp3",
  errorSoft: "/audio/SE/error-soft.mp3",
  gachaStart: "/audio/SE/gacha-start.mp3",
  gachaReveal: "/audio/SE/gacha_reval.mp3",
  levelUp: "/audio/SE/level-up.mp3",
  missionComplete: "/audio/SE/mission-complete.mp3",
  saveSuccess: "/audio/SE/save_success.mp3",
  ticket: "/audio/SE/ticket-level.mp3",
};

type SoundContextValue = {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  play: (name: SoundEffectName) => void;
};

const SoundContext = createContext<SoundContextValue | null>(null);

export const SoundProvider = ({ children }: { children: React.ReactNode }) => {
  const [enabled, setEnabledState] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("engineerQuestSoundEnabled");
    setEnabledState(stored === "true");
  }, []);

  const setEnabled = useCallback((nextEnabled: boolean) => {
    setEnabledState(nextEnabled);
    window.localStorage.setItem(
      "engineerQuestSoundEnabled",
      String(nextEnabled)
    );
  }, []);

  const play = useCallback(
    (name: SoundEffectName) => {
      if (!enabled) return;

      const audio = new Audio(soundFiles[name]);
      audio.volume = 0.38;
      audio.play().catch(() => undefined);
    },
    [enabled]
  );

  const value = useMemo(
    () => ({
      enabled,
      setEnabled,
      play,
    }),
    [enabled, play, setEnabled]
  );

  return (
    <SoundContext.Provider value={value}>{children}</SoundContext.Provider>
  );
};

export const useSoundEffect = () => {
  const context = useContext(SoundContext);

  if (!context) {
    return {
      enabled: false,
      setEnabled: () => undefined,
      play: () => undefined,
    } satisfies SoundContextValue;
  }

  return context;
};
