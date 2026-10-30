"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const SOUND_STORAGE_KEY = "engineerQuest.sound.enabled";
const SOUND_VOLUME_STORAGE_KEY = "engineerQuest.sound.masterVolume";
const DEFAULT_MASTER_VOLUME = 0.82;
const SAME_SOUND_COOLDOWN_MS = 90;

const soundConfig = {
  uiSelect: { src: "/audio/se/ui-select.ogg", volume: 0.22 },
  dragPickup: { src: "/audio/se/drag-pickup.ogg", volume: 0.24 },
  dragDrop: { src: "/audio/se/drag-drop.ogg", volume: 0.24 },
  saveSuccess: { src: "/audio/se/save-success.ogg", volume: 0.3 },
  answerCorrect: { src: "/audio/se/answer-correct.ogg", volume: 0.34 },
  answerIncorrect: { src: "/audio/se/answer-incorrect.ogg", volume: 0.24 },
  cardFlip: { src: "/audio/se/card-flip.ogg", volume: 0.34 },
  cardAcquired: { src: "/audio/se/card-acquired.ogg", volume: 0.4 },
  achievementUnlocked: { src: "/audio/se/achievement-unlocked.ogg", volume: 0.45 },
  missionCompleted: { src: "/audio/se/mission-completed.ogg", volume: 0.5 },
  likePop: { src: "/audio/se/like-pop.ogg", volume: 0.24 },
} as const;

export type SoundEffectName = keyof typeof soundConfig;

type SoundContextValue = {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  masterVolume: number;
  setMasterVolume: (volume: number) => void;
  play: (name: SoundEffectName) => void;
};

const SoundContext = createContext<SoundContextValue | null>(null);

const clampVolume = (volume: number) => Math.min(1, Math.max(0, volume));

export const SoundProvider = ({ children }: { children: React.ReactNode }) => {
  const [enabled, setEnabledState] = useState(true);
  const [masterVolume, setMasterVolumeState] = useState(DEFAULT_MASTER_VOLUME);
  const audioCacheRef = useRef<Partial<Record<SoundEffectName, HTMLAudioElement>>>({});
  const lastPlayedAtRef = useRef<Partial<Record<SoundEffectName, number>>>({});

  useEffect(() => {
    const legacyStored = window.localStorage.getItem("engineerQuestSoundEnabled");
    const stored = window.localStorage.getItem(SOUND_STORAGE_KEY);
    const storedVolume = window.localStorage.getItem(SOUND_VOLUME_STORAGE_KEY);

    if (stored !== null) {
      setEnabledState(stored === "true");
    } else if (legacyStored !== null) {
      setEnabledState(legacyStored === "true");
    }

    if (storedVolume !== null) {
      const parsedVolume = Number(storedVolume);
      if (Number.isFinite(parsedVolume)) {
        setMasterVolumeState(clampVolume(parsedVolume));
      }
    }

    (Object.keys(soundConfig) as SoundEffectName[]).forEach((name) => {
      const config = soundConfig[name];
      const audio = new Audio(config.src);
      audio.preload = "auto";
      audio.volume = clampVolume(config.volume * DEFAULT_MASTER_VOLUME);
      audioCacheRef.current[name] = audio;
    });
  }, []);

  const setEnabled = useCallback((nextEnabled: boolean) => {
    setEnabledState(nextEnabled);
    window.localStorage.setItem(SOUND_STORAGE_KEY, String(nextEnabled));
    window.localStorage.setItem("engineerQuestSoundEnabled", String(nextEnabled));
  }, []);

  const setMasterVolume = useCallback((nextVolume: number) => {
    const normalizedVolume = clampVolume(nextVolume);
    setMasterVolumeState(normalizedVolume);
    window.localStorage.setItem(SOUND_VOLUME_STORAGE_KEY, String(normalizedVolume));
  }, []);

  const play = useCallback(
    (name: SoundEffectName) => {
      if (!enabled || typeof window === "undefined") return;

      const now = window.performance.now();
      const lastPlayedAt = lastPlayedAtRef.current[name] ?? 0;
      if (now - lastPlayedAt < SAME_SOUND_COOLDOWN_MS) return;
      lastPlayedAtRef.current[name] = now;

      const config = soundConfig[name];
      const cachedAudio =
        audioCacheRef.current[name] ??
        (() => {
          const audio = new Audio(config.src);
          audio.preload = "auto";
          audioCacheRef.current[name] = audio;
          return audio;
        })();

      const audio = cachedAudio.cloneNode(true) as HTMLAudioElement;
      audio.volume = clampVolume(config.volume * masterVolume);
      audio.currentTime = 0;
      void audio.play().catch(() => undefined);
    },
    [enabled, masterVolume]
  );

  const value = useMemo(
    () => ({
      enabled,
      setEnabled,
      masterVolume,
      setMasterVolume,
      play,
    }),
    [enabled, masterVolume, play, setEnabled, setMasterVolume]
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
      masterVolume: DEFAULT_MASTER_VOLUME,
      setMasterVolume: () => undefined,
      play: () => undefined,
    } satisfies SoundContextValue;
  }

  return context;
};
