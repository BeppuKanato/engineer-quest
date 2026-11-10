"use client";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  Typography,
} from "@mui/material";
import { useState, type ReactNode } from "react";

import {
  confirmBigGoalProposal,
  type BigGoalProposal,
} from "@/api/bigGoal.api";
import { ApiError } from "@/lib/fetcher";
import { bigGoalTypeLabel } from "./bigGoalPresentation";

/** 画面に出すのは本命＋他の候補2件まで。API は全候補を返す。 */
const DISPLAY_CANDIDATE_LIMIT = 3;

/**
 * 大目標の候補提示と合意（Issue #367 の設定画面の本体）。
 * 単元開始時（タイミングA、BigGoalGate）と、大目標の達成時
 * （タイミングB、BigGoalNextProposal）で共有する。
 * 本命（おすすめ）を先頭に強調し、全候補に適合度と根拠を付ける。
 * 確定は学習者の合意操作（confirm API）でのみ行い、黙って有効化はしない。
 * 見出しと導入文は、提示の文脈（開始時／達成時）に応じて呼び出し側が渡す。
 */
export function BigGoalSetting({
  proposal,
  heading,
  headingComponent = "h2",
  intro,
  confirmLabel = "この目標ではじめる",
  proceedLabel,
  getToken,
  onConfirmed,
  onProceedAnyway,
}: {
  proposal: BigGoalProposal;
  heading: string;
  headingComponent?: "h1" | "h2";
  intro: ReactNode;
  confirmLabel?: string;
  /** 確定できなくなった場合に学習へ進む導線の文言。 */
  proceedLabel: string;
  getToken: () => Promise<string>;
  onConfirmed: () => void;
  onProceedAnyway: () => void;
}) {
  const candidates = proposal.candidates ?? [];
  const ordered = [
    ...candidates.filter((c) => c.candidateKey === proposal.recommendedCandidateKey),
    ...candidates.filter((c) => c.candidateKey !== proposal.recommendedCandidateKey),
  ].slice(0, DISPLAY_CANDIDATE_LIMIT);
  const [selectedKey, setSelectedKey] = useState<string | null>(
    proposal.recommendedCandidateKey ?? ordered[0]?.candidateKey ?? null
  );
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stale, setStale] = useState(false);

  const confirm = async () => {
    if (!selectedKey || confirming) return;
    setConfirming(true);
    setError(null);
    try {
      const token = await getToken();
      await confirmBigGoalProposal(token, proposal.id, selectedKey);
      onConfirmed();
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        // 確定時点の状態で候補が合わなくなった。学習者を閉じ込めず、進む導線を出す。
        setStale(true);
        setError("学習の状態が変わったため、この提案では確定できませんでした。");
      } else {
        setError("目標を確定できませんでした。もう一度お試しください。");
      }
    } finally {
      setConfirming(false);
    }
  };

  return (
    <Stack spacing={3} sx={{ width: "100%" }}>
      <Box>
        <Typography component={headingComponent} variant="h5" sx={{ fontWeight: 950, mb: 1 }}>
          {heading}
        </Typography>
        <Typography color="text.secondary">{intro}</Typography>
      </Box>

      <Stack spacing={2} role="radiogroup" aria-label="大目標の候補">
        {ordered.map((candidate) => {
          const recommended = candidate.candidateKey === proposal.recommendedCandidateKey;
          const selected = candidate.candidateKey === selectedKey;
          return (
            <Card
              key={candidate.candidateKey}
              role="radio"
              aria-checked={selected}
              tabIndex={0}
              onClick={() => setSelectedKey(candidate.candidateKey)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setSelectedKey(candidate.candidateKey);
                }
              }}
              sx={{
                cursor: "pointer",
                borderRadius: 3,
                border: "2px solid",
                borderColor: selected ? "#0057e7" : recommended ? "#93c5fd" : "#e2e8f0",
                boxShadow: selected ? "0 12px 30px rgba(0,87,231,0.14)" : "0 6px 18px rgba(15,23,42,0.05)",
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Stack spacing={1.5}>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                    {recommended && (
                      <Chip label="おすすめ" size="small" sx={{ fontWeight: 900, bgcolor: "#0057e7", color: "#fff" }} />
                    )}
                    <Chip label={bigGoalTypeLabel(candidate.type)} size="small" variant="outlined" sx={{ fontWeight: 800 }} />
                    {candidate.score !== null && (
                      <Chip label={`適合度 ${candidate.score}`} size="small" sx={{ fontWeight: 800, bgcolor: "#eff6ff", color: "#0b4ac8" }} />
                    )}
                  </Stack>
                  <Typography variant="h6" sx={{ fontWeight: 900, lineHeight: 1.4 }}>
                    {candidate.displayText}
                  </Typography>
                  {candidate.rationale && (
                    <Typography variant="body2" color="text.secondary">
                      {candidate.rationale}
                    </Typography>
                  )}
                </Stack>
              </CardContent>
            </Card>
          );
        })}
      </Stack>

      {error && <Alert severity="warning">{error}</Alert>}
      <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
        <Button
          variant="contained"
          size="large"
          disabled={!selectedKey || confirming || stale}
          onClick={() => void confirm()}
          sx={{ fontWeight: 900 }}
        >
          {confirming ? "確定しています…" : confirmLabel}
        </Button>
        {stale && (
          <Button variant="outlined" onClick={onProceedAnyway} sx={{ fontWeight: 900 }}>
            {proceedLabel}
          </Button>
        )}
      </Stack>
    </Stack>
  );
}
