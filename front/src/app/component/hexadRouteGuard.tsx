"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { useUserSession } from "./userSession";

const isGuardExempt = (pathname: string) =>
  pathname.startsWith("/auth/") ||
  pathname === "/hexad" ||
  pathname === "/profile";

export const HexadRouteGuard = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { status, appUser, isAppUserLoading } = useUserSession();

  useEffect(() => {
    if (isGuardExempt(pathname)) return;

    if (status === "unauthenticated") {
      router.replace("/auth/login");
      return;
    }

    if (
      status === "authenticated" &&
      !isAppUserLoading &&
      appUser &&
      !appUser.hasHexadResponse
    ) {
      router.replace("/hexad");
    }
  }, [appUser, isAppUserLoading, pathname, router, status]);

  return null;
};
