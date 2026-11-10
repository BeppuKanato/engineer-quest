"use client";
import FlagIcon from "@mui/icons-material/Flag";
import { Alert, Box, CircularProgress, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";

import {
  getBigGoalProposal,
  getCurrentBigGoal,
  requestBigGoalProposal,
  type BigGoalProposal,
} from "@/api/bigGoal.api";
import type { AchievedBigGoal } from "@/api/learning.api";
import { playerTokens } from "../../player/player.tokens";
import { BigGoalSetting } from "./BigGoalSetting";

const POLL_INTERVAL_MS = 1500;

type SectionState =
  | { kind: "loading" }
  | { kind: "hidden" }
  | { kind: "setting"; proposal: BigGoalProposal }
  | { kind: "settled"; text: string }
  | { kind: "failed" };

/**
 * 大目標の達成に続く、次の目標の提案（Issue #369、タイミングB）。
 * フィードバック専用画面の後段に置き、達成の事実を示したうえで、
 * 提案 API（ON_ACHIEVEMENT）で得た候補を BigGoalSetting（開始時と共有）で
 * 提示する。候補が無い・生成が失敗した場合は達成の提示だけに留め、
 * 学習の流れは止めない。確定済みの提案が再表示された場合は、
 * 選ばれている次の目標を事実として示す。
 */
export function BigGoalNextProposal({ achievedGoal, getToken }: {
  achievedGoal: AchievedBigGoal;
  getToken: () => Promise<string>;
}) {
  const [state, setState] = useState<SectionState>({ kind: "loading" });

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
        setState(proposal.failureCode === "NO_CANDIDATES" ? { kind: "hidden" } : { kind: "failed" });
        return;
      }
      if (proposal.selectedCandidateKey) {
        const selected = (proposal.candidates ?? []).find((c) => c.candidateKey === proposal.selectedCandidateKey);
        setState(selected ? { kind: "settled", text: selected.displayText } : { kind: "hidden" });
        return;
      }
      setState({ kind: "setting", proposal });
    };
    const poll = async (proposalId: string) => {
      try {
        const token = await getToken();
        applyProposal(await getBigGoalProposal(token, proposalId));
      } catch {
        if (!stopped) setState({ kind: "hidden" });
      }
    };
    void (async () => {
      try {
        const token = await getToken();
        applyProposal(await requestBigGoalProposal(token, { timing: "ON_ACHIEVEMENT", achievedGoalId: achievedGoal.id }));
      } catch {
        if (!stopped) setState({ kind: "hidden" });
      }
    })();
    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
    };
  }, [achievedGoal.id, getToken]);

  return (
    <Box component="section" aria-label="大目標の達成と次の目標" sx={{ width: "100%", maxWidth: 640 }}>
      <Stack spacing={2}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box sx={{
            width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
            display: "grid", placeItems: "center",
            bgcolor: playerTokens.focus, color: playerTokens.surface,
          }}>
            <FlagIcon fontSize="small" />
          </Box>
          <Typography sx={{ fontWeight: 900, fontSize: 18 }}>大目標を達成しました</Typography>
        </Stack>
        <Typography sx={{ fontWeight: 700, fontSize: 16 }}>{achievedGoal.displayText}</Typography>
        {state.kind === "loading" && (
          <Stack direction="row" spacing={1.5} alignItems="center">
            <CircularProgress size={20} aria-label="次の目標の提案を準備しています" />
            <Typography role="status" color="text.secondary">次の目標の提案を準備しています。</Typography>
          </Stack>
        )}
        {state.kind === "setting" && (
          <BigGoalSetting
            proposal={state.proposal}
            heading="次の目標を決めましょう"
            intro={<>「{achievedGoal.displayText}」を達成しました。次に取り組む目標を1つ選びましょう。選んだ目標はホームに表示され、学習の進み具合の目安になります。</>}
            proceedLabel="あとで決める"
            getToken={getToken}
            onConfirmed={() => {
              // 確定した目標の表示文は、現在の大目標を取り直して事実として示す。
              void (async () => {
                try {
                  const token = await getToken();
                  const { goal } = await getCurrentBigGoal(token);
                  setState({ kind: "settled", text: goal?.displayText ?? "" });
                } catch {
                  setState({ kind: "settled", text: "" });
                }
              })();
            }}
            onProceedAnyway={() => setState({ kind: "hidden" })}
          />
        )}
        {state.kind === "settled" && state.text && (
          <Typography sx={{ fontWeight: 700 }}>次の目標：{state.text}</Typography>
        )}
        {state.kind === "settled" && !state.text && (
          <Typography sx={{ fontWeight: 700 }}>次の目標を決めました。ホームで確認できます。</Typography>
        )}
        {state.kind === "failed" && (
          <Alert severity="warning">次の目標の提案を作成できませんでした。ホームや次の単元の開始時に、あらためて提案します。</Alert>
        )}
      </Stack>
    </Box>
  );
}
