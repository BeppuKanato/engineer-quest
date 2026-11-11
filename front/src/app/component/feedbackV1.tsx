"use client";
import { useEffect, useState, useRef } from "react";
import { Alert, Button, Paper, Stack, Typography } from "@mui/material";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getFeedbackV1, feedbackCandidates, type FeedbackCandidate, type FeedbackV1Result } from "@/api/feedbackV1.api";
export type { FeedbackV1Result } from "@/api/feedbackV1.api";
import { ApiError, fetcher } from "@/lib/fetcher";

// Keep target/state identifiers, never copy shared code/body or arbitrary query text into telemetry.
function canonicalRoute(route: string) {
  const url = new URL(route, window.location.origin);
  if (url.origin !== window.location.origin) return url.origin;
  const params = new URLSearchParams();
  for (const key of ["cardId", "focus", "category", "missionId", "courseId", "phase", "review", "targetId", "new"]) {
    const value = url.searchParams.get(key); if (value !== null) params.set(key, value);
  }
  return url.pathname + (params.size ? `?${params.toString()}` : "") + url.hash;
}

type Result = FeedbackV1Result;
export type FeedbackV1Kind = "mission" | "create" | "phase" | "unit";

/**
 * フィードバック v1 の取得と生成待ちポーリング（#202）。
 * 依頼（POST）は冪等で、先行生成済みなら即返る。生成中は1.5秒間隔で読み直す。
 * 実験割り当てなし（409）は適用外として即座に unavailable。
 * 完了イベントがまだ見えない 404 は、保存直後の競合でありうるため（#321）、
 * 少し待って依頼し直してから unavailable と判断する。
 */
export function useFeedbackV1(kind: FeedbackV1Kind, eventId: string) {
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState(false);
  // No experiment assignment (409) or no such completion event (404): feedback
  // simply does not apply to this user/event.
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => {
    setResult(null); setError(false); setUnavailable(false);
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    let notFoundRetries = 0;
    const unsubscribe = onAuthStateChanged(auth, async user => {
      if (!user) return;
      const token = await user.getIdToken();
      const load = async (method: string) => {
        try {
          const data = await getFeedbackV1(token, kind, eventId, method);
          if (stopped) return;
          notFoundRetries = 0;
          setResult(data);
          if (data.status === "GENERATING") timer = setTimeout(() => void load("GET"), 1500);
        } catch (e) {
          if (stopped) return;
          if (e instanceof ApiError && e.status === 409) { setUnavailable(true); return; }
          if (e instanceof ApiError && e.status === 404) {
            if (method === "POST" && notFoundRetries < 2) { notFoundRetries += 1; timer = setTimeout(() => void load("POST"), 1500); return; }
            setUnavailable(true); return;
          }
          setError(true);
        }
      };
      void load("POST");
    });
    return () => { stopped = true; clearTimeout(timer); unsubscribe(); };
  }, [eventId, kind]);
  return { result, error, unavailable };
}

export function FeedbackV1({ kind, eventId, onAction }: {
  kind: FeedbackV1Kind;
  eventId: string;
  // Called when the recommended action is clicked. Return true to handle the
  // navigation in-app (e.g. moving between phases) instead of following the link.
  onAction?: (href: string | null) => boolean;
}) {
  const { result, error, unavailable } = useFeedbackV1(kind, eventId);
  const f = result?.feedback;
  if (unavailable) return null;
  return <Paper data-feedback-scope variant="outlined" sx={{ p: 3, my: 2 }}>
    {error || result?.status === "FAILED" ? <Alert severity="warning">フィードバックを生成できませんでした。学習は続けられます。</Alert> : !f ? <Alert severity="info">フィードバックを準備しています。</Alert> : <Stack spacing={2}>
      <FeedbackObservation id={result.id} href={f.actionHref} candidates={feedbackCandidates(f)} />
      {([["現在の状態", f.currentState], ["次の目標", f.nextGoal]] as const).map(([label, body]) => <div key={label}><Typography fontWeight={900}>{label}</Typography><Typography>{body}</Typography></div>)}
      <FeedbackCandidates candidates={feedbackCandidates(f)} onAction={onAction} />
    </Stack>}
  </Paper>;
}

export function FeedbackCandidates({ candidates, onAction }: { candidates: FeedbackCandidate[]; onAction?: (href: string | null) => boolean }) {
  return <Stack spacing={1.5} aria-label="次の学習候補（実行は任意）">
    <Typography variant="body2" color="text.secondary">取り組むかどうかは自分で選べます。そのまま次へ進むこともできます。</Typography>
    {candidates.map((candidate,index)=><Paper component="article" variant="outlined" key={candidate.candidateId} data-feedback-candidate-id={candidate.candidateId} sx={{ p: 1.5, borderRadius: 2 }}>
      <Typography fontWeight={700} sx={{ overflowWrap: "anywhere" }}>{index+1}. {candidate.nextStep}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, overflowWrap: "anywhere" }}>{candidate.reason}</Typography>
      {candidate.actionHref && <Button component={Link} href={candidate.actionHref} variant={index === 0 ? "contained" : "outlined"}
        sx={{ mt: 1, minHeight: 44, maxWidth: "100%", overflowWrap: "anywhere" }} onClick={event=>{if(onAction?.(candidate.actionHref)) event.preventDefault();}}>{candidate.actionLabel}</Button>}
    </Paper>)}
  </Stack>;
}

export function FeedbackObservation({ id, href, candidates }: { id: string; href?: string | null; candidates?: FeedbackCandidate[] }) {
  const marker = useRef<HTMLSpanElement>(null);
  const serialized = JSON.stringify(candidates ?? [{candidateId:"candidate-1",actionHref:href ?? null}]);
  useEffect(() => {
    const items = JSON.parse(serialized) as {candidateId:string;actionHref:string|null}[];
    const scope = marker.current?.closest("[data-feedback-scope]") ?? marker.current?.parentElement;
    const log = async (type: string, data: Record<string, unknown> = {}) => {
      const user = auth.currentUser;
      if (!user) return;
      await fetcher(`/feedback-v1/${encodeURIComponent(id)}/interactions/log`, { method: "POST", token: await user.getIdToken(), body: JSON.stringify({ id: crypto.randomUUID(), type, data: { occurredAt: new Date().toISOString(), ...data } }) }).catch(() => {});
    };
    const presented = items.map((item,index)=>({candidateId:item.candidateId,order:index+1,href:item.actionHref ? canonicalRoute(item.actionHref) : null}));
    for (const item of presented) void log("PRESENTED", item);
    sessionStorage.setItem("feedback-v1-active", JSON.stringify({ id, expected: href ? canonicalRoute(href) : null, candidates:presented }));
    sessionStorage.removeItem("feedback-v1-pending");
    const viewed = new Set<string>();
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        const candidateId = entry.target.getAttribute("data-feedback-candidate-id") ?? "candidate-1";
        if (!viewed.has(candidateId) && entry.isIntersecting && document.visibilityState === "visible") {
          viewed.add(candidateId); void log("VIEWED", {candidateId,definition:"viewport_intersection_not_read_confirmation"});
        }
      }
    });
    const nodes = scope?.querySelectorAll("[data-feedback-candidate-id]");
    if (nodes?.length) nodes.forEach(node=>observer.observe(node));
    else if (marker.current) observer.observe(marker.current);
    let start = document.visibilityState === "visible" ? performance.now() : null;
    let durationMs = 0;
    const flush = () => { if (start !== null) durationMs += performance.now() - start; start = document.visibilityState === "visible" ? performance.now() : null; void log("VISIBLE_DURATION", { durationMs }); };
    const click = (event: MouseEvent) => {
      const target = (event.target as Element).closest("a,button");
      if (!target) return;
      const rawRoute = target.getAttribute("href") ?? target.getAttribute("data-feedback-href");
      const skip = target.hasAttribute("data-feedback-skip");
      if (!rawRoute && !skip) return;
      const route = rawRoute ? canonicalRoute(rawRoute) : null;
      const candidateId = target.closest("[data-feedback-candidate-id]")?.getAttribute("data-feedback-candidate-id");
      const chosen = presented.find(c=>c.candidateId===candidateId) ?? presented.find(c=>c.href && c.href===route);
      const expected = chosen?.href ?? presented[0]?.href ?? null;
      const choiceId = crypto.randomUUID();
      const selectedAt = new Date().toISOString();
      void log(chosen ? "CLICKED" : "NAVIGATION_SELECTED", { href: route, expected, isRecommendation: !!chosen, candidateId:chosen?.candidateId ?? null,
        notSelectedCandidateIds:presented.filter(c=>c.candidateId!==chosen?.candidateId).map(c=>c.candidateId), choiceId, selectedAt, skipped:skip });
      if (!route || sessionStorage.getItem("feedback-v1-pending")) return;
      sessionStorage.setItem("feedback-v1-pending", JSON.stringify({ id, href: route, expected, candidateId:chosen?.candidateId ?? null, selectedAt, choiceId }));
    };
    document.addEventListener("visibilitychange", flush);
    document.addEventListener("click", click, true);
    return () => { observer.disconnect(); flush(); document.removeEventListener("visibilitychange", flush); document.removeEventListener("click", click, true); };
  }, [id, href, serialized]);
  return <span ref={marker} aria-hidden="true" />;
}

// Mount only after the target data/state was successfully rendered.
export function FeedbackDestination({ ready, targetId, failed = false, actualRoute }: { ready: boolean; targetId?: string | null; failed?: boolean; actualRoute?: string }) {
  useEffect(() => {
    if (!ready && !failed) return;
    const raw = sessionStorage.getItem("feedback-v1-pending");
    if (!raw || !auth.currentUser) return;
    const pending = JSON.parse(raw) as { id: string; href: string; expected: string | null; selectedAt: string; choiceId: string };
    const actual = canonicalRoute(actualRoute ?? window.location.href);
    if (pending.href !== actual) return;
    // For a specific card, collection-list rendering alone is not an arrival.
    const cardId = new URLSearchParams(window.location.search).get("cardId");
    if (!failed && cardId && cardId !== targetId) return;
    sessionStorage.removeItem("feedback-v1-pending");
    void auth.currentUser.getIdToken().then(token => fetcher(`/feedback-v1/${encodeURIComponent(pending.id)}/interactions/log`, { method: "POST", token, body: JSON.stringify({ id: crypto.randomUUID(), type: failed ? "ARRIVAL_FAILED" : "ARRIVED", data: { ...pending, actual, targetId: targetId ?? null, matches: pending.expected === actual, occurredAt: new Date().toISOString(), ruleVersion: "first-selection-v1" } }) })).catch(() => {});
  }, [ready, targetId, failed, actualRoute]);
  return null;
}
