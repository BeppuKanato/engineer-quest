"use client";

import { useUserSession } from "./userSession";

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
  const { appUser } = useUserSession();
  return isMascotId(appUser?.selectedMascotId)
    ? appUser.selectedMascotId
    : defaultMascotId;
};

export const useUserMascotState = () => {
  const { status, appUser, isAppUserLoading } = useUserSession();
  const mascotId = isMascotId(appUser?.selectedMascotId)
    ? appUser.selectedMascotId
    : status === "authenticated" && !isAppUserLoading
      ? defaultMascotId
      : null;

  return {
    mascotId,
    isLoading: status === "loading" || isAppUserLoading,
  };
};
