import { sendLearningEvents, type LearningEvent } from "../api/learning.api";

export type LearningObservation = { eventType: string; targetId?: string; payload?: Record<string, unknown> };
export type LearningObserver = (event: LearningObservation) => void;
type PendingEvent = { event: LearningEvent; retries: number };
type Transport = typeof sendLearningEvents;
const sequences = new Map<string, number>();
function nextSequence(sessionId: string): number {
  let previous = sequences.get(sessionId) ?? 0;
  try { previous = Math.max(previous, Number(sessionStorage.getItem(`engineer-quest:learning-sequence:${sessionId}`)) || 0); } catch { /* メモリ内の順序を保つ。 */ }
  const sequence = previous + 1;
  sequences.set(sessionId, sequence);
  try { sessionStorage.setItem(`engineer-quest:learning-sequence:${sessionId}`, String(sequence)); } catch { /* ストレージ無効でも記録を続ける。 */ }
  return sequence;
}
/** 分析用ログだけを扱う。進捗保存は独立したAPIで行う。 */
export class LearningEventQueue {
  private pending: PendingEvent[] = [];
  private sending = false;
  private closed = false;
  private token: string;
  constructor(private options: { sessionId: string; token: string; getToken: () => Promise<string>; send?: Transport }) { this.token = options.token; }
  enqueue(event: Omit<LearningEvent, "clientTimestamp">) {
    if (this.closed) return;
    this.pending.push({ event: { ...event, payload: { ...event.payload, sequence: nextSequence(this.options.sessionId) }, clientTimestamp: new Date().toISOString() }, retries: 0 });
    // ネットワーク断で無制限にメモリを使わない。進捗には影響させない。
    if (this.pending.length > 500) this.pending.shift();
    if (this.pending.length >= 20) void this.flush();
  }
  async flush(keepalive = false): Promise<void> {
    if (this.closed || (!keepalive && this.sending) || !this.pending.length) return;
    if (!keepalive) this.sending = true;
    try {
      if (!keepalive) this.token = await this.options.getToken();
      if (this.closed) return;
      let budget = 56_000;
      do {
        const batch: PendingEvent[] = [];
        for (const item of this.pending.slice(0, 20)) {
          const bytes = new TextEncoder().encode(JSON.stringify(item.event)).byteLength + 1;
          if (keepalive && bytes + 200 > budget) break;
          batch.push(item); budget -= bytes;
        }
        if (!batch.length) break;
        this.pending.splice(0, batch.length);
        try {
          await (this.options.send ?? sendLearningEvents)(this.token, this.options.sessionId, batch.map(item => item.event), keepalive);
        } catch {
          if (!keepalive && !this.closed) this.pending.unshift(...batch.filter(item => item.retries === 0).map(item => ({ ...item, retries: 1 })));
          break;
        }
      } while (!this.closed && this.pending.length && (!keepalive || budget > 200));
    } catch { /* 認証・通信の失敗で学習を止めない。次の5秒周期で軽く再試行する。 */ }
    finally { if (!keepalive) this.sending = false; }
  }
  close() { this.closed = true; this.pending = []; }
}
let tabSession: string | null = null;
export function learningSessionId(): string {
  if (tabSession) return tabSession;
  try {
    tabSession = sessionStorage.getItem("engineer-quest:learning-session");
    if (!tabSession) { tabSession = crypto.randomUUID(); sessionStorage.setItem("engineer-quest:learning-session", tabSession); }
  } catch { tabSession = crypto.randomUUID(); }
  return tabSession;
}

/** ルート離脱の子ビューcleanupまで待って残りを送る。学習操作は待たせない。 */
export function attachLearningEventQueue(queue: LearningEventQueue, isCurrentActor: () => boolean, onClosed = () => {}) {
  const leave = () => queueMicrotask(() => {
    if (isCurrentActor()) void queue.flush(true);
    else { queue.close(); onClosed(); }
  });
  const hide = () => { if (document.visibilityState === "hidden") leave(); };
  const timer = window.setInterval(() => void queue.flush(), 5000);
  window.addEventListener("pagehide", leave); document.addEventListener("visibilitychange", hide);
  return () => {
    window.clearInterval(timer); window.removeEventListener("pagehide", leave); document.removeEventListener("visibilitychange", hide);
    leave();
  };
}
