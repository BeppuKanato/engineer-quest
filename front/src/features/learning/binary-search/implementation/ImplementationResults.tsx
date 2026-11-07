import { Box, Typography } from "@mui/material";
import { motion, useReducedMotion } from "framer-motion";

import { DrawnCheck } from "../../app/DrawnCheck";
import { playerTokens } from "../../player/player.tokens";
import { binarySearchImplementationContent as content } from "./implementation.content";
import { resultKinds, type TestOutcome } from "./implementation";

import { IndexOutput } from "./IndexOutput";

const labels = content.display;

export function ImplementationResults({ outcomes, diagnostics = outcomes }: { outcomes: readonly TestOutcome[]; diagnostics?: readonly TestOutcome[] }) {
  const reducedMotion = useReducedMotion();
  const kinds = resultKinds(diagnostics);
  return <Box sx={{ color: playerTokens.text }}>
    {kinds.length > 0 && <Box role="status" aria-label={labels.errorLabel} sx={{ mb: 2 }}>
      {kinds.map(kind => <Typography component="p" key={kind} data-error-kind={kind}>{labels.messages[kind]}</Typography>)}
    </Box>}
    <Box component="ul" aria-label={labels.listLabel} sx={{ listStyle: "none", p: 0, m: 0 }}>
      {content.tests.map(test => {
        const outcome = outcomes.find(outcome => outcome.id === test.id);
        const status = !outcome ? labels.statuses.unexecuted : outcome.passed ? labels.statuses.passed : labels.statuses.failed;
        const statusKey = !outcome ? "unexecuted" : outcome.passed ? "passed" : "failed";
        const values = test.args[0] as readonly number[];
        const target = test.args[1] as number;
        return <Box component="li" key={test.id} data-test-id={test.id} sx={{ mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            {outcome?.passed && <Box sx={{ flexShrink: 0 }}><DrawnCheck size={22} /></Box>}
            <Typography component="p" sx={{ fontWeight: 700 }}>{test.label}：
              <Box component={motion.span} key={statusKey} data-test-status={statusKey}
                initial={reducedMotion ? false : { opacity: 0, scale: 0.86 }}
                animate={{ opacity: 1, scale: 1 }} transition={{ duration: reducedMotion ? 0 : 0.3 }}
                sx={{ display: "inline-block", color: outcome?.passed ? playerTokens.focus : playerTokens.text }}>
                <span aria-hidden="true">{status.icon} </span>{status.label}
              </Box>
            </Typography>
          </Box>
          {test.visibility === "display" && <>
            <Typography component="p" sx={{ fontSize: 16 }}>{labels.valuesLabel}：[{values.join(", ")}]、{labels.targetLabel}：{target}</Typography>
            <Typography component="p" sx={{ fontSize: 16 }}>{labels.expectedLabel}：</Typography>
            <IndexOutput values={values} actual={test.expected} />
            <Typography component="p" sx={{ fontSize: 16 }}>{labels.actualLabel}：
              {!outcome || outcome.error ? labels.noOutput : null}
            </Typography>
            {outcome && !outcome.error && <IndexOutput values={values} actual={outcome.actual} />}
          </>}
        </Box>;
      })}
    </Box>
  </Box>;
}
