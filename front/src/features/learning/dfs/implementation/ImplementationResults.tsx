import { Box, Typography } from "@mui/material";
import { ConsolidationGraph } from "../../bfs/consolidation/ConsolidationGraph";
import { bfsImplementationContent } from "../../bfs/implementation/implementation.content";
import { resultKinds, type TestOutcome } from "../../bfs/implementation/implementation";
import { ImplementationTestResults, type ImplementationTestRow } from "../../implementation/ImplementationTestResults";
import { playerTokens } from "../../player/player.tokens";
import { dfsImplementationContent as content } from "./implementation.content";

const labels = bfsImplementationContent.display;
const formatOrder = (order: readonly string[]) => order.length ? order.join(" → ") : "空のリスト";

function excessNodes(left: readonly string[], right: readonly string[]) {
  const available = new Map<string, number>();
  for (const node of right) available.set(node, (available.get(node) ?? 0) + 1);
  return left.filter(node => {
    const count = available.get(node) ?? 0;
    if (count === 0) return true;
    available.set(node, count - 1);
    return false;
  });
}

export function VisitOrderOutput({ expected, actual }: { expected: readonly string[]; actual: unknown }) {
  if (!Array.isArray(actual) || !actual.every(node => typeof node === "string")) return <span>場所の名前を並べたリストを返してください。</span>;
  const missing = excessNodes(expected, actual);
  const extra = excessNodes(actual, expected);
  const orderDiffers = missing.length === 0 && extra.length === 0 && actual.some((node, index) => node !== expected[index]);
  return <Box component="span" sx={{ overflowWrap: "anywhere" }}>
    <span data-visit-order>{formatOrder(actual)}</span>
    {missing.length > 0 && <Box component="span" sx={{ display: "block" }}>不足している場所（{missing.join("、")}）</Box>}
    {extra.length > 0 && <Box component="span" sx={{ display: "block" }}>余分に入っている場所（{extra.join("、")}）</Box>}
    {orderDiffers && <Box component="span" sx={{ display: "block" }}>訪問順が期待値と異なります。</Box>}
  </Box>;
}

export function DfsImplementationResults({ outcomes, diagnostics = outcomes }: {
  outcomes: readonly TestOutcome[]; diagnostics?: readonly TestOutcome[];
}) {
  const kinds = resultKinds(diagnostics);
  const rows: ImplementationTestRow[] = content.tests.map(test => {
    const outcome = outcomes.find(item => item.id === test.id);
    const statusKey = !outcome ? "unexecuted" : outcome.passed ? "passed" : "failed";
    const status = labels.statuses[statusKey];
    const scene = content.displayScenes.find(item => item.testId === test.id);
    return {
      id: test.id, label: test.label, statusKey, statusIcon: status.icon, statusLabel: status.label,
      details: scene ? <>
        <Box sx={{ height: 210, display: "flex", bgcolor: playerTokens.surface, border: `1px solid ${playerTokens.layers.layer1}`, borderRadius: 1, my: 1 }}>
          <ConsolidationGraph graph={scene.graph} start={scene.start} minHeight={0} />
        </Box>
        <Typography component="p">期待する訪問順　{formatOrder(test.expected)}</Typography>
        <Typography component="p">実際の出力　{!outcome || outcome.error ? labels.noOutput
          : <VisitOrderOutput expected={test.expected} actual={outcome.actual} />}</Typography>
      </> : undefined,
    };
  });
  return <ImplementationTestResults listLabel={labels.listLabel} rows={rows}
    diagnostics={kinds.length > 0 && <Box role="status" aria-label={labels.errorLabel} sx={{ mb: 2 }}>
      {kinds.map(kind => {
        const line = diagnostics.find(outcome => outcome.error === kind)?.errorLine;
        return <Typography component="p" key={kind} data-error-kind={kind} data-error-line={line}>
          {labels.messages[kind]}{line ? labels.lineNote.replace("{line}", String(line)) : ""}
        </Typography>;
      })}
    </Box>} />;
}
