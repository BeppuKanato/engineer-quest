"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { getDailyReview, type DailyReview } from "@/api/dailyReview.api";
import { useUserSession } from "@/app/component/userSession";
export const reviewDateKey = (now = new Date()) => new Date(now.getTime() + 9 * 3600000).toISOString().slice(0, 10);
export function useDailyReview() {
  const { status, token } = useUserSession();
  const scope = `${status}:${token ?? ""}`;
  const scopeRef = useRef(scope);
  scopeRef.current = scope;
  const [review, setReviewState] = useState<DailyReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [revision, setRevision] = useState(0);
  const reload = useCallback(() => setRevision(value => value + 1), []);
  useEffect(() => {
    let current = true;
    setReviewState(null); setError(false); setLoading(true);
    if (status === "loading") return;
    if (status !== "authenticated" || !token) { setLoading(false); return; }
    void getDailyReview(token).then(data => { if (current) { if (data.review && data.review.date !== reviewDateKey()) { setError(true); } else setReviewState(data.review); } })
      .catch(() => { if (current) setError(true); }).finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [status, token, revision]);
  useEffect(() => {
    const nextMidnight = Date.parse(`${reviewDateKey()}T00:00:00+09:00`) + 86400000;
    const timer = setTimeout(reload, Math.max(1, nextMidnight - Date.now() + 50));
    const onVisible = () => { if (document.visibilityState === "visible") reload(); };
    window.addEventListener("focus", reload); document.addEventListener("visibilitychange", onVisible);
    return () => { clearTimeout(timer); window.removeEventListener("focus", reload); document.removeEventListener("visibilitychange", onVisible); };
  }, [reload, revision]);
  const setReview = useCallback((value: DailyReview | null) => {
    if (scopeRef.current !== scope) return;
    if (value && value.date !== reviewDateKey()) { reload(); return; }
    setReviewState(value);
  }, [reload, scope]);
  return { review, loading, error, reload, setReview, token, status };
}
