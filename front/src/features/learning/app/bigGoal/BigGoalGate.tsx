"use client";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import { useEffect, useState, type ReactNode } from "react";

import {
  getBigGoalProposal,
  requestBigGoalProposal,
  type BigGoalProposal,
} from "@/api/bigGoal.api";
import { BigGoalSetting } from "./BigGoalSetting";

type GatePhase =
  | { kind: "checking" }
  | { kind: "setting"; proposal: BigGoalProposal }
  | { kind: "unavailable" }
  | { kind: "passed" };

const POLL_INTERVAL_MS = 1500;

/**
 * 単元開始時の大目標ゲート（Issue #367、タイミングA）。
 * 有効な大目標がその単元をカバーしていない状態で学習画面を開いたら、
 * 学習開始の前に目標設定を挟む。提案の取得は G2 の提案 API（機会ごとの
 * eventKey で冪等）を使い、確定は学習者の合意操作でのみ行う。
 * 目標まわりの障害（API エラー等）で学習自体を止めないため、取得に失敗した
 * 場合はそのまま学習へ進める。生成が失敗した提案だけは、理由を示したうえで
 * 学習へ進む導線を出す。
 * 候補提示の本体は BigGoalSetting（達成時の提示と共有、#369）。
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
    <Box sx={{ flex: 1, overflowY: "auto", p: 3 }}>
      <Box sx={{ maxWidth: 760, mx: "auto", py: 2 }}>
        <BigGoalSetting
          proposal={phase.proposal}
          heading="目標を決めましょう"
          headingComponent="h1"
          intro={<>「{unitTitle}」をはじめる前に、取り組む目標を1つ選びましょう。選んだ目標はホームに表示され、学習の進み具合の目安になります。</>}
          proceedLabel="学習をはじめる"
          getToken={getToken}
          onConfirmed={() => setPhase({ kind: "passed" })}
          onProceedAnyway={() => setPhase({ kind: "passed" })}
        />
      </Box>
    </Box>
  );
}
