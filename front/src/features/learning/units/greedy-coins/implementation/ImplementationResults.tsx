import { Box, Typography } from "@mui/material";

import { ImplementationTestResults, type ImplementationTestRow } from "../../../implementation/ImplementationTestResults";
import { greedyCoinsImplementationContent as content } from "./implementation.content";
import { resultKinds, type TestOutcome } from "./implementation";
import { CoinListOutput } from "./CoinListOutput";

const labels = content.display;

export function ImplementationResults({ outcomes, diagnostics = outcomes }: { outcomes: readonly TestOutcome[]; diagnostics?: readonly TestOutcome[] }) {
  const kinds = resultKinds(diagnostics);
  const rows: ImplementationTestRow[] = content.tests.map(test => {
    const outcome = outcomes.find(outcome => outcome.id === test.id);
    const status = !outcome ? labels.statuses.unexecuted : outcome.passed ? labels.statuses.passed : labels.statuses.failed;
    const statusKey = !outcome ? "unexecuted" : outcome.passed ? "passed" : "failed";
    const [amount, coins] = test.args as unknown as readonly [number, readonly number[]];
    const expected = test.expected as readonly number[];
    return {
      id: test.id, label: test.label, statusKey, statusIcon: status.icon, statusLabel: status.label,
      details: test.visibility === "display" ? <>
        <Typography component="p" sx={{ fontSize: 16 }}>{labels.amountLabel}：{amount}円</Typography>
        <Typography component="p" sx={{ fontSize: 16 }}>{labels.coinsLabel}：[{coins.join(", ")}]</Typography>
        <Typography component="p" sx={{ fontSize: 16 }}>{labels.expectedLabel}：[{expected.join(", ")}]（{expected.length}枚）</Typography>
        <CoinListOutput expected={test.expected} actual={test.expected} amount={amount} coins={coins} />
        <Typography component="p" sx={{ fontSize: 16 }}>{labels.actualLabel}：
          {!outcome || outcome.error ? labels.noOutput : null}
        </Typography>
        {outcome && !outcome.error && <CoinListOutput expected={test.expected} actual={outcome.actual} amount={amount} coins={coins} />}
      </> : undefined,
    };
  });
  return <ImplementationTestResults listLabel={labels.listLabel} rows={rows}
    diagnostics={kinds.length > 0 ? <Box role="status" aria-label={labels.errorLabel} sx={{ mb: 2 }}>
      {kinds.map(kind => {
        const line = diagnostics.find(outcome => outcome.error === kind)?.errorLine;
        return <Typography component="p" key={kind} data-error-kind={kind} data-error-line={line}>{labels.messages[kind]}{line ? labels.lineNote.replace("{line}", String(line)) : ""}</Typography>;
      })}
    </Box> : undefined} />;
}
