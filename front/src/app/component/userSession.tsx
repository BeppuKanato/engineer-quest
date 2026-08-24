"use client";

import type { User } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { getMe, type AuthUser } from "@/api/auth.api";
import { auth } from "@/lib/firebase";
import { setClientQueryCacheScope } from "@/lib/clientQueryCache";

type SessionStatus = "loading" | "authenticated" | "unauthenticated";

type UserSessionValue = {
  status: SessionStatus;
  firebaseUser: User | null;
  token: string | null;
  appUser: AuthUser | null;
  isAppUserLoading: boolean;
  error: Error | null;
  refreshAppUser: () => Promise<AuthUser | null>;
  setAppUser: (user: AuthUser | null) => void;
  updateAppUser: (updates: Partial<AuthUser>) => void;
};

const UserSessionContext = createContext<UserSessionValue | null>(null);
const isAuthPage = (pathname: string) => pathname.startsWith("/auth/");

export const UserSessionProvider = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const [status, setStatus] = useState<SessionStatus>("loading");
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [appUser, setAppUserState] = useState<AuthUser | null>(null);
  const [isAppUserLoading, setIsAppUserLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const loadSequence = useRef(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      const sequence = ++loadSequence.current;
      setClientQueryCacheScope(nextUser?.uid ?? null);
      setFirebaseUser(nextUser);
      setError(null);

      if (!nextUser) {
        setToken(null);
        setAppUserState(null);
        setIsAppUserLoading(false);
        setStatus("unauthenticated");
        return;
      }

      setStatus("loading");
      try {
        const nextToken = await nextUser.getIdToken();
        if (sequence !== loadSequence.current) return;
        setToken(nextToken);
        setStatus("authenticated");
      } catch (nextError) {
        if (sequence !== loadSequence.current) return;
        setToken(null);
        setAppUserState(null);
        setError(nextError instanceof Error ? nextError : new Error("Failed to initialize session"));
        setStatus("unauthenticated");
      }
    });

    return () => {
      loadSequence.current += 1;
      unsubscribe();
    };
  }, []);

  const refreshAppUser = useCallback(async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setAppUserState(null);
      return null;
    }

    const sequence = ++loadSequence.current;
    setIsAppUserLoading(true);
    setError(null);

    try {
      const currentToken = await currentUser.getIdToken();
      const response = await getMe(currentToken);
      if (sequence !== loadSequence.current) return null;
      setFirebaseUser(currentUser);
      setToken(currentToken);
      setAppUserState(response.user);
      setStatus("authenticated");
      return response.user;
    } catch (nextError) {
      if (sequence === loadSequence.current) {
        setError(nextError instanceof Error ? nextError : new Error("Failed to load user session"));
      }
      return null;
    } finally {
      if (sequence === loadSequence.current) setIsAppUserLoading(false);
    }
  }, []);

  useEffect(() => {
    if (
      status !== "authenticated" ||
      !token ||
      appUser ||
      isAppUserLoading ||
      isAuthPage(pathname)
    ) return;

    void refreshAppUser();
  }, [appUser, isAppUserLoading, pathname, refreshAppUser, status, token]);

  const setAppUser = useCallback((user: AuthUser | null) => {
    setAppUserState(user);
    setError(null);
    setIsAppUserLoading(false);
    const currentUser = auth.currentUser;
    if (user && currentUser) {
      setFirebaseUser(currentUser);
      setStatus("authenticated");
      void currentUser.getIdToken().then((currentToken) => {
        if (auth.currentUser?.uid === currentUser.uid) setToken(currentToken);
      });
    }
  }, []);

  const updateAppUser = useCallback((updates: Partial<AuthUser>) => {
    setAppUserState((current) => (current ? { ...current, ...updates } : current));
  }, []);

  const value = useMemo<UserSessionValue>(
    () => ({
      status,
      firebaseUser,
      token,
      appUser,
      isAppUserLoading,
      error,
      refreshAppUser,
      setAppUser,
      updateAppUser,
    }),
    [appUser, error, firebaseUser, isAppUserLoading, refreshAppUser, setAppUser, status, token, updateAppUser]
  );

  return <UserSessionContext.Provider value={value}>{children}</UserSessionContext.Provider>;
};

export const useUserSession = () => {
  const value = useContext(UserSessionContext);
  if (!value) throw new Error("useUserSession must be used within UserSessionProvider");
  return value;
};
