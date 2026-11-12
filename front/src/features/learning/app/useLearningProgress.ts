"use client";
import { useCallback, useEffect, useState } from "react";
import { useUserSession } from "@/lib/session/userSession";
import { getLearningProgress, type LearningProgress } from "@/api/learning.api";
import { ApiError } from "@/lib/fetcher";

export const learningErrorMessage = (error: unknown) => error instanceof ApiError && error.status === 401 ? "ログインの有効期限が切れました。再ログインしてください。" :
  error instanceof ApiError && error.status === 404 ? "公開されている単元情報が見つかりません。" : "学習情報を取得できませんでした。もう一度お試しください。";
export function useLearningProgress(courseId: string | undefined) {
  const { firebaseUser, status } = useUserSession();
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState<{ owner: string; courseId: string; data?: LearningProgress; error?: string } | null>(null);
  useEffect(() => {
    if (!firebaseUser || !courseId) return;
    let current = true;
    setState(null);
    void firebaseUser.getIdToken().then(token => getLearningProgress(token, courseId)).then(data => {
      if (current) setState({ owner: firebaseUser.uid, courseId, data });
    }, error => { if (current) setState({ owner: firebaseUser.uid, courseId, error: learningErrorMessage(error) }); });
    return () => { current = false; };
  }, [firebaseUser, courseId, revision]);
  const matching = state?.owner === firebaseUser?.uid && state?.courseId === courseId ? state : null;
  return { progress: matching?.data, error: matching?.error, loading: status === "loading" || (!!firebaseUser && !!courseId && !matching),
    authenticated: status === "authenticated", reload: useCallback(() => setRevision(current => current + 1), []) };
}
