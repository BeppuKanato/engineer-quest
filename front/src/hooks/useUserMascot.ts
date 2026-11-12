"use client";

import { useUserSession } from "@/lib/session/userSession";
import { defaultMascotId, isMascotId } from "@/config/mascots";

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
