"use client";

import { Alert, Box, Button, LinearProgress, Stack, Typography } from "@mui/material";
import Link from "next/link";
import { useEffect, useRef, type ReactNode } from "react";

import {
  FeedbackObservation,
  useFeedbackV1,
  type FeedbackV1Kind,
} from "@/app/component/feedbackV1";
import { playerTokens } from "../../player/player.tokens";

/** 専用画面に出す大目標の進捗。数値は API のコード計算の結果をそのまま使う。 */
export type FeedbackGoalSummary = {
  displayText: string;
  /** 達成条件の部分充足（0〜1）。定義できない型は null */
  progress: number | null;
  fact: string | null;
};

const headingSx = {
  color: playerTokens.text, fontWeight: 700, textAlign: "center",
  fontSize: "clamp(20px, 1.8vw, 32px)", outline: "none",
} as const;

const primaryButtonSx = {
  minHeight: 48, px: 3, fontSize: 16, fontWeight: 700, whiteSpace: "nowrap",
  bgcolor: playerTokens.focus, color: playerTokens.surface,
  "&:hover": { bgcolor: playerTokens.states.processing.stroke },
} as const;

/**
 * フィードバック専用画面（Issue #369、#299 の実装）。
 * 結果画面の後に続く独立した画面として、現在位置の図と4項目
 * （現在の状態／次の目標／次の一歩／この一歩の理由）を提示する。
 * 推薦する行動が画面の主ボタンで、「そのまま次へ」の副次的な出口は
 * 生成中・失敗時を含め常時置く（着手は学習者の任意のまま）。
 * 称賛演出は直前の結果画面で済んでいるため、ここでは繰り返さず、
 * 到達の事実と進捗の表示で達成感を引き継ぐ（#370 と整合）。
 * フィードバックが適用されない学習者（割り当てなし等）では、
 * 画面に留めず onUnavailable で本来の導線へ自動で進める。
 */
export function FeedbackScreen({ kind, eventId, heading, figure, goalSummary, onAction, onProceed, proceedLabel, onUnavailable, children }: {
  kind: Extract<FeedbackV1Kind, "phase" | "unit">;
  eventId: string;
  heading: string;
  /** 現在位置の図。学習状態を持つ単元コンテナが組み立てて渡す。 */
  figure: ReactNode;
  goalSummary?: FeedbackGoalSummary | null;
  // Called when the recommended action is clicked. Return true to handle the
  // navigation in-app (e.g. moving between phases) instead of following the link.
  onAction?: (href: string | null) => boolean;
  onProceed: () => void;
  proceedLabel: string;
  onUnavailable: () => void;
  /** 達成した大目標への次の目標の提案など、画面後段への差し込み。 */
  children?: ReactNode;
}) {
  const { result, error, unavailable } = useFeedbackV1(kind, eventId);
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => { headingRef.current?.focus(); }, []);
  const proceededRef = useRef(false);
  useEffect(() => {
    if (unavailable && !proceededRef.current) {
      proceededRef.current = true;
      onUnavailable();
    }
  }, [unavailable, onUnavailable]);
  const f = result?.feedback;
  const failed = error || result?.status === "FAILED";
  return <Box component="section" aria-label={heading}
    sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, p: 2, width: "100%" }}>
    <Typography ref={headingRef} component="h2" tabIndex={-1} sx={headingSx}>{heading}</Typography>
    {figure}
    {goalSummary && <Box sx={{ width: "100%", maxWidth: 640 }}>
      <Typography sx={{ fontSize: 13, fontWeight: 800, color: playerTokens.control }}>大目標</Typography>
      <Typography sx={{ fontWeight: 700, fontSize: 16 }}>{goalSummary.displayText}</Typography>
      {goalSummary.progress !== null && <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 0.75 }}>
        <LinearProgress variant="determinate" value={Math.round(goalSummary.progress * 100)}
          aria-label="大目標の進み具合"
          sx={{ flex: 1, height: 8, borderRadius: 999, bgcolor: "#e2e8f0", "& .MuiLinearProgress-bar": { bgcolor: playerTokens.focus, borderRadius: 999 } }} />
        <Typography sx={{ fontWeight: 800, fontSize: 15 }}>{Math.round(goalSummary.progress * 100)}%</Typography>
      </Box>}
      {goalSummary.fact && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{goalSummary.fact}</Typography>}
    </Box>}
    {unavailable ? <Typography role="status" color="text.secondary">フィードバックはありません。次へ進みます。</Typography>
      : failed ? <Alert severity="warning" sx={{ width: "100%", maxWidth: 640 }}>フィードバックを生成できませんでした。学習は続けられます。</Alert>
      : !f ? <Alert severity="info" sx={{ width: "100%", maxWidth: 640 }}>フィードバックを準備しています。</Alert>
      : <Stack spacing={2} sx={{ width: "100%", maxWidth: 640 }}>
          <FeedbackObservation id={result.id} href={f.actionHref} />
          {([["現在の状態", f.currentState], ["次の目標", f.nextGoal], ["次の一歩", f.nextStep], ["この一歩の理由", f.reason]] as const).map(([label, body]) => (
            <div key={label}>
              <Typography fontWeight={900}>{label}</Typography>
              <Typography sx={{ fontSize: 16 }}>{body}</Typography>
            </div>
          ))}
        </Stack>}
    {children}
    <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap sx={{ justifyContent: "center", mt: 1 }}>
      {f?.actionHref && <Button component={Link} href={f.actionHref} variant="contained"
        onClick={event => { if (onAction?.(f.actionHref)) event.preventDefault(); }}
        sx={primaryButtonSx}>{f.actionLabel}</Button>}
      <Button variant={f?.actionHref ? "text" : "contained"} onClick={onProceed}
        sx={f?.actionHref ? { minHeight: 48, px: 2, fontSize: 15, fontWeight: 700, color: playerTokens.control } : primaryButtonSx}>
        {proceedLabel}
      </Button>
    </Stack>
  </Box>;
}
