"use client";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import { useEffect, useState, type ReactNode } from "react";

import {
  confirmBigGoalProposal,
  getBigGoalProposal,
  requestBigGoalProposal,
  type BigGoalProposal,
} from "@/api/bigGoal.api";
import { ApiError } from "@/lib/fetcher";
import { bigGoalTypeLabel } from "./bigGoalPresentation";

type GatePhase =
  | { kind: "checking" }
  | { kind: "setting"; proposal: BigGoalProposal }
  | { kind: "unavailable" }
  | { kind: "passed" };

const POLL_INTERVAL_MS = 1500;
/** 画面に出すのは本命＋他の候補2件まで（Issue #367）。API は全候補を返す。 */
const DISPLAY_CANDIDATE_LIMIT = 3;

/**
 * 単元開始時の大目標ゲート（Issue #367、タイミングA）。
 * 有効な大目標がその単元をカバーしていない状態で学習画面を開いたら、
 * 学習開始の前に目標設定を挟む。提案の取得は G2 の提案 API（機会ごとの
 * eventKey で冪等）を使い、確定は学習者の合意操作でのみ行う。
 * 目標まわりの障害（API エラー等）で学習自体を止めないため、取得に失敗した
 * 場合はそのまま学習へ進める。生成が失敗した提案だけは、理由を示したうえで
 * 学習へ進む導線を出す。
 */
export function BigGoalGate({
  courseId,
  unitTitle,
  getToken,
  children,
}: {
  courseId: string;
  unitTitle: string;
  getToken: () => Promise<string>;
  children: ReactNode;
}) {
  const [phase, setPhase] = useState<GatePhase>({ kind: "checking" });

  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const applyProposal = (proposal: BigGoalProposal) => {
      if (stopped) return;
      if (proposal.status === "GENERATING") {
        timer = setTimeout(() => void poll(proposal.id), POLL_INTERVAL_MS);
        return;
      }
      if (proposal.status === "FAILED") {
        // 候補が無いのは、カバー済みの単元か完了済みの単元。設定は不要。
        setPhase(proposal.failureCode === "NO_CANDIDATES" ? { kind: "passed" } : { kind: "unavailable" });
        return;
      }
      // GENERATED：過去に合意済みなら設定を挟まず学習へ進む。
      setPhase(proposal.selectedCandidateKey ? { kind: "passed" } : { kind: "setting", proposal });
    };
    const poll = async (proposalId: string) => {
      try {
        const token = await getToken();
        const proposal = await getBigGoalProposal(token, proposalId);
        applyProposal(proposal);
      } catch {
        if (!stopped) setPhase({ kind: "passed" });
      }
    };
    void (async () => {
      try {
        const token = await getToken();
        const proposal = await requestBigGoalProposal(token, { timing: "UNIT_START", startCourseId: courseId });
        applyProposal(proposal);
      } catch {
        if (!stopped) setPhase({ kind: "passed" });
      }
    })();
    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
    };
  }, [courseId, getToken]);

  if (phase.kind === "passed") return <>{children}</>;
  if (phase.kind === "checking") {
    return (
      <Box sx={{ flex: 1, display: "grid", placeItems: "center", p: 3 }}>
        <Stack spacing={2} alignItems="center">
          <CircularProgress aria-label="目標を確認しています" />
          <Typography role="status" color="text.secondary">
            目標を確認しています。あなたに合う目標の提案には少し時間がかかります。
          </Typography>
        </Stack>
      </Box>
    );
  }
  if (phase.kind === "unavailable") {
    return (
      <Box sx={{ flex: 1, display: "grid", placeItems: "center", p: 3 }}>
        <Stack spacing={2} sx={{ maxWidth: 560 }}>
          <Alert severity="warning">目標の提案を作成できませんでした。目標なしでも学習は始められます。</Alert>
          <Button variant="contained" onClick={() => setPhase({ kind: "passed" })} sx={{ alignSelf: "flex-start", fontWeight: 900 }}>
            学習をはじめる
          </Button>
        </Stack>
      </Box>
    );
  }
  return (
    <BigGoalSetting
      proposal={phase.proposal}
      unitTitle={unitTitle}
      getToken={getToken}
      onConfirmed={() => setPhase({ kind: "passed" })}
      onProceedAnyway={() => setPhase({ kind: "passed" })}
    />
  );
}

function BigGoalSetting({
  proposal,
  unitTitle,
  getToken,
  onConfirmed,
  onProceedAnyway,
}: {
  proposal: BigGoalProposal;
  unitTitle: string;
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
    <Box sx={{ flex: 1, overflowY: "auto", p: 3 }}>
      <Stack spacing={3} sx={{ maxWidth: 760, mx: "auto", py: 2 }}>
        <Box>
          <Typography component="h1" variant="h5" sx={{ fontWeight: 950, mb: 1 }}>
            目標を決めましょう
          </Typography>
          <Typography color="text.secondary">
            「{unitTitle}」をはじめる前に、取り組む目標を1つ選びましょう。選んだ目標はホームに表示され、学習の進み具合の目安になります。
          </Typography>
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
            {confirming ? "確定しています…" : "この目標ではじめる"}
          </Button>
          {stale && (
            <Button variant="outlined" onClick={onProceedAnyway} sx={{ fontWeight: 900 }}>
              学習をはじめる
            </Button>
          )}
        </Stack>
      </Stack>
    </Box>
  );
}
