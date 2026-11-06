"use client";
import { useEffect, useState, useRef } from "react";
import { Alert, Button, Paper, Stack, Typography } from "@mui/material";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { ApiError, fetcher } from "@/lib/fetcher";

// Keep target/state identifiers, never copy shared code/body or arbitrary query text into telemetry.
function canonicalRoute(route: string) {
  const url = new URL(route, window.location.origin);
  if (url.origin !== window.location.origin) return url.origin;
  const params = new URLSearchParams();
  for (const key of ["cardId", "focus", "category", "missionId", "courseId", "review", "targetId", "new"]) {
    const value = url.searchParams.get(key); if (value !== null) params.set(key, value);
  }
  return url.pathname + (params.size ? `?${params.toString()}` : "") + url.hash;
}

type Result = { id: string; status: string; feedback: null | { currentState: string; nextGoal: string; nextStep: string; actionLabel: string; actionHref: string | null } };
export function FeedbackV1({ kind, eventId, onAction }: {
  kind: "mission" | "create" | "phase" | "unit";
  eventId: string;
  // Called when the recommended action is clicked. Return true to handle the
  // navigation in-app (e.g. moving between phases) instead of following the link.
  onAction?: (href: string | null) => boolean;
}) {
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState(false);
  // No experiment assignment (409) or no such completion event (404): feedback
  // simply does not apply to this user/event, so render nothing.
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    const unsubscribe = onAuthStateChanged(auth, async user => {
      if (!user) return;
      const token = await user.getIdToken();
      const url = `/feedback-v1/${kind}/${encodeURIComponent(eventId)}`;
      const load = async (method: string) => {
        try {
          const data = await fetcher<Result>(url, { method, token });
          if (stopped) return;
          setResult(data);
          if (data.status === "GENERATING") timer = setTimeout(() => void load("GET"), 1500);
        } catch (e) {
          if (stopped) return;
          if (e instanceof ApiError && (e.status === 404 || e.status === 409)) { setUnavailable(true); return; }
          setError(true);
        }
      };
      void load("POST");
    });
    return () => { stopped = true; clearTimeout(timer); unsubscribe(); };
  }, [eventId, kind]);
  const f = result?.feedback;
  if (unavailable) return null;
  return <Paper variant="outlined" sx={{ p: 3, my: 2 }}>
    {error || result?.status === "FAILED" ? <Alert severity="warning">フィードバックを生成できませんでした。学習は続けられます。</Alert> : !f ? <Alert severity="info">フィードバックを準備しています。</Alert> : <Stack spacing={2}>
      <FeedbackObservation id={result.id} href={f.actionHref} />
      {([["現在の状態", f.currentState], ["次の目標", f.nextGoal], ["次の一歩", f.nextStep]] as const).map(([label, body]) => <div key={label}><Typography fontWeight={900}>{label}</Typography><Typography>{body}</Typography></div>)}
      {f.actionHref && <Button component={Link} href={f.actionHref} variant="contained" onClick={event => { if (onAction?.(f.actionHref)) event.preventDefault(); }}>{f.actionLabel}</Button>}
    </Stack>}
  </Paper>;
}

export function FeedbackObservation({ id, href }: { id: string; href?: string | null }) {
  const marker = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const log = async (type: string, data: Record<string, unknown> = {}) => {
      const user = auth.currentUser;
      if (!user) return;
      await fetcher(`/feedback-v1/${encodeURIComponent(id)}/interactions/log`, { method: "POST", token: await user.getIdToken(), body: JSON.stringify({ id: crypto.randomUUID(), type, data: { occurredAt: new Date().toISOString(), ...data } }) }).catch(() => {});
    };
    void log("PRESENTED", { href: href ? canonicalRoute(href) : null });
    sessionStorage.setItem("feedback-v1-active", JSON.stringify({ id, expected: href ? canonicalRoute(href) : null }));
    sessionStorage.removeItem("feedback-v1-pending");
    let viewed = false;
    const observer = new IntersectionObserver(entries => {
      if (!viewed && entries.some(e => e.isIntersecting) && document.visibilityState === "visible") { viewed = true; void log("VIEWED", { definition: "viewport_intersection_not_read_confirmation" }); }
    });
    if (marker.current) observer.observe(marker.current);
    let start = document.visibilityState === "visible" ? performance.now() : null;
    let durationMs = 0;
    const flush = () => { if (start !== null) durationMs += performance.now() - start; start = document.visibilityState === "visible" ? performance.now() : null; void log("VISIBLE_DURATION", { durationMs }); };
    const click = (event: MouseEvent) => {
      const target = (event.target as Element).closest("a,button");
      if (!target) return;
      const rawRoute = target.getAttribute("href") ?? target.getAttribute("data-feedback-href");
      if (!rawRoute) return;
      const route = canonicalRoute(rawRoute);
      const expected = href ? canonicalRoute(href) : null;
      const isRecommendation = route === expected;
      const choiceId = crypto.randomUUID();
      const selectedAt = new Date().toISOString();
      void log(isRecommendation ? "CLICKED" : "NAVIGATION_SELECTED", { href: route, expected, isRecommendation, choiceId, selectedAt });
      if (sessionStorage.getItem("feedback-v1-pending")) return;
      sessionStorage.setItem("feedback-v1-pending", JSON.stringify({ id, href: route, expected, selectedAt, choiceId }));
    };
    document.addEventListener("visibilitychange", flush);
    document.addEventListener("click", click, true);
    return () => { observer.disconnect(); flush(); document.removeEventListener("visibilitychange", flush); document.removeEventListener("click", click, true); };
  }, [id, href]);
  return <span ref={marker} aria-hidden="true" />;
}

// Mount only after the target data/state was successfully rendered.
export function FeedbackDestination({ ready, targetId, failed = false }: { ready: boolean; targetId?: string | null; failed?: boolean }) {
  useEffect(() => {
    if (!ready && !failed) return;
    const raw = sessionStorage.getItem("feedback-v1-pending");
    if (!raw || !auth.currentUser) return;
    const pending = JSON.parse(raw) as { id: string; href: string; expected: string | null; selectedAt: string; choiceId: string };
    const actual = canonicalRoute(window.location.href);
    if (pending.href !== actual) return;
    // For a specific card, collection-list rendering alone is not an arrival.
    const cardId = new URLSearchParams(window.location.search).get("cardId");
    if (!failed && cardId && cardId !== targetId) return;
    sessionStorage.removeItem("feedback-v1-pending");
    void auth.currentUser.getIdToken().then(token => fetcher(`/feedback-v1/${encodeURIComponent(pending.id)}/interactions/log`, { method: "POST", token, body: JSON.stringify({ id: crypto.randomUUID(), type: failed ? "ARRIVAL_FAILED" : "ARRIVED", data: { ...pending, actual, targetId: targetId ?? null, matches: pending.expected === actual, occurredAt: new Date().toISOString(), ruleVersion: "first-selection-v1" } }) })).catch(() => {});
  }, [ready, targetId, failed]);
  return null;
}
