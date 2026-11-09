import { Box, Typography } from "@mui/material";

import { ImplementationTestResults, type ImplementationTestRow } from "../../implementation/ImplementationTestResults";
import { MazeGridDrawing } from "../../player/MazeGridDrawing";
import { playerTokens } from "../../player/player.tokens";
import { wallExtensionImplementationContent as content } from "./implementation.content";
import { isMazeGridValue, mazeGridCanvas, resultKinds, type TestOutcome } from "./implementation";

import { MazeGridOutput } from "./MazeGridOutput";

const labels = content.display;

export function ImplementationResults({ outcomes, diagnostics = outcomes }: { outcomes: readonly TestOutcome[]; diagnostics?: readonly TestOutcome[] }) {
  const kinds = resultKinds(diagnostics);
  const rows: ImplementationTestRow[] = content.tests.map(test => {
    const outcome = outcomes.find(outcome => outcome.id === test.id);
    const status = !outcome ? labels.statuses.unexecuted : outcome.passed ? labels.statuses.passed : labels.statuses.failed;
    const statusKey = !outcome ? "unexecuted" : outcome.passed ? "passed" : "failed";
    const [size, choices] = test.args as [number, readonly number[]];
    const expectedCanvas = isMazeGridValue(test.expected) ? mazeGridCanvas(test.expected) : null;
    return {
      id: test.id, label: test.label, statusKey, statusIcon: status.icon, statusLabel: status.label,
      details: test.visibility === "display" ? <>
        <Typography component="p" sx={{ fontSize: 16 }}>{labels.sizeLabel}：{size}×{size}、{labels.choicesLabel}：{choices.join(", ")}</Typography>
        <Typography component="p" sx={{ fontSize: 16 }}>{labels.expectedLabel}：</Typography>
        {expectedCanvas && <Box sx={{ height: 210, display: "flex", bgcolor: playerTokens.surface, border: "1px solid #e5e7eb", borderRadius: 1, my: 1 }}><MazeGridDrawing canvas={expectedCanvas} label={labels.expectedLabel} /></Box>}
        <Typography component="p" sx={{ fontSize: 16 }}>{labels.actualLabel}：
          {!outcome || outcome.error ? labels.noOutput : null}
        </Typography>
        {outcome && !outcome.error && <MazeGridOutput expected={test.expected} actual={outcome.actual} />}
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
