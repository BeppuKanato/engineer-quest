import { Box, Typography } from "@mui/material";

import { bfsImplementationContent as content } from "./implementation.content";
import type { TestOutcome } from "./implementation";

export function ImplementationResults({ outcomes }: { outcomes: readonly TestOutcome[] }) {
  return <Box component="ul" aria-label="テスト結果一覧" sx={{ listStyle: "none", p: 0, m: 0 }}>
    {content.tests.map(test => {
      const outcome = outcomes.find(outcome => outcome.id === test.id);
      return <Box component="li" key={test.id} data-test-id={test.id} sx={{ mb: 2 }}>
        <Typography component="p" sx={{ fontWeight: 700 }}>{test.id} {test.label}：{!outcome ? "未実行" : outcome.passed ? "通過" : "未通過"}</Typography>
        {test.visibility === "display" && <Box sx={{ "pre": { m: 0, fontSize: 16, whiteSpace: "pre-wrap", overflowWrap: "anywhere" } }}>
          <pre>入力：{JSON.stringify(test.args)}</pre>
          <pre>期待値：{JSON.stringify(test.expected)}</pre>
          <pre>実際の出力：{!outcome ? "—" : outcome.error ? content.status.error : JSON.stringify(outcome.actual) ?? "戻り値がありません"}</pre>
        </Box>}
      </Box>;
    })}
  </Box>;
}
