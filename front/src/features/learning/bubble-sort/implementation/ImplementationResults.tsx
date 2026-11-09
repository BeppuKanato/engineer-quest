import { Box, Typography } from "@mui/material";

import { ImplementationTestResults, type ImplementationTestRow } from "../../implementation/ImplementationTestResults";
import { ArrayDrawing } from "../../player/ArrayDrawing";
import { playerTokens } from "../../player/player.tokens";
import { bubbleSortImplementationContent as content } from "./implementation.content";
import { arrayBarsCanvas, isDrawableArrayValue, resultKinds, type TestOutcome } from "./implementation";

import { ArrayOutput } from "./ArrayOutput";

const labels = content.display;

export function ImplementationResults({ outcomes, diagnostics = outcomes }: { outcomes: readonly TestOutcome[]; diagnostics?: readonly TestOutcome[] }) {
  const kinds = resultKinds(diagnostics);
  const rows: ImplementationTestRow[] = content.tests.map(test => {
    const outcome = outcomes.find(outcome => outcome.id === test.id);
    const status = !outcome ? labels.statuses.unexecuted : outcome.passed ? labels.statuses.passed : labels.statuses.failed;
    const statusKey = !outcome ? "unexecuted" : outcome.passed ? "passed" : "failed";
    const input = test.args[0];
    const expectedCanvas = isDrawableArrayValue(test.expected) ? arrayBarsCanvas(test.expected) : null;
    return {
      id: test.id, label: test.label, statusKey, statusIcon: status.icon, statusLabel: status.label,
      details: test.visibility === "display" ? <>
        <Typography component="p" sx={{ fontSize: 16 }}>{labels.inputLabel}：{Array.isArray(input) ? `[${input.join(", ")}]` : labels.noOutput}</Typography>
        <Typography component="p" sx={{ fontSize: 16 }}>{labels.expectedLabel}：</Typography>
        {expectedCanvas && <Box sx={{ height: 210, display: "flex", bgcolor: playerTokens.surface, border: "1px solid #e5e7eb", borderRadius: 1, my: 1 }}><ArrayDrawing canvas={expectedCanvas} label={labels.expectedLabel} /></Box>}
        <Typography component="p" sx={{ fontSize: 16 }}>{labels.actualLabel}：
          {!outcome || outcome.error ? labels.noOutput : null}
        </Typography>
        {outcome && !outcome.error && <ArrayOutput expected={test.expected} actual={outcome.actual} />}
      </> : undefined,
    };
  });
  return <ImplementationTestResults listLabel={labels.listLabel} rows={rows}
    diagnostics={kinds.length > 0 ? <Box role="status" aria-label={labels.errorLabel} sx={{ mb: 2 }}>
      {kinds.map(kind => <Typography component="p" key={kind} data-error-kind={kind}>{labels.messages[kind]}</Typography>)}
    </Box> : undefined} />;
}
