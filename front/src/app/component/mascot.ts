"use client";

import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";

import { getProfile } from "@/api/profile.api";
import { auth } from "@/lib/firebase";

export const mascotOptions = [
  {
    id: "red-panda",
    label: "レッサーパンダ",
    personality: "元気で前向き",
    message: "一緒に少しずつ進めよう。",
  },
  {
    id: "penguin",
    label: "ペンギン",
    personality: "落ち着いた伴走役",
    message: "焦らず、一つずつ確認していこう。",
  },
  {
    id: "owl",
    label: "フクロウ",
    personality: "じっくり考える観察役",
    message: "仕組みを見つけるのは得意だよ。",
  },
] as const;

export type MascotId = (typeof mascotOptions)[number]["id"];
export type MascotState =
  | "normal"
  | "happy"
  | "cheer"
  | "thinking"
  | "surprise"
  | "celebrate"
  | "face";

export const defaultMascotId: MascotId = "red-panda";

export const isMascotId = (value: string | null | undefined): value is MascotId =>
  mascotOptions.some((mascot) => mascot.id === value);

export const getMascot = (mascotId: string | null | undefined) =>
  mascotOptions.find((mascot) => mascot.id === mascotId) ?? mascotOptions[0];

export const getMascotImagePath = (
  mascotId: string | null | undefined,
  state: MascotState = "normal"
) => {
  const normalizedState = state === "surprise" ? "suprise" : state;
  return `/images/mascots/${getMascot(mascotId).id}/${normalizedState}.png`;
};

export const useUserMascot = () => {
  const [mascotId, setMascotId] = useState<MascotId>(defaultMascotId);

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        if (isMounted) setMascotId(defaultMascotId);
        return;
      }

      try {
        const token = await user.getIdToken();
        const profile = await getProfile(token);

        if (!isMounted) return;
        setMascotId(
          isMascotId(profile.user.selectedMascotId)
            ? profile.user.selectedMascotId
            : defaultMascotId
        );
      } catch (error) {
        console.error(error);
        if (isMounted) setMascotId(defaultMascotId);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  return mascotId;
};

export const useUserMascotState = () => {
  const [mascotId, setMascotId] = useState<MascotId | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        if (!isMounted) return;
        setMascotId(null);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const token = await user.getIdToken();
        const profile = await getProfile(token);

        if (!isMounted) return;
        setMascotId(
          isMascotId(profile.user.selectedMascotId)
            ? profile.user.selectedMascotId
            : defaultMascotId
        );
      } catch (error) {
        console.error(error);
        if (isMounted) setMascotId(defaultMascotId);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  return { mascotId, isLoading };
};
