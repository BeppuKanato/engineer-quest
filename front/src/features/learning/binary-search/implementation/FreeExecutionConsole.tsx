import { Box, Typography } from "@mui/material";
import { IndexOutput } from "./IndexOutput";
import { binarySearchEditorText as text } from "./editor.content";
import { editorTokens as colors } from "../../implementation/editor.tokens";
import { freeDisplayCase, freeOutputLimit, type FreeExecutionResult } from "./freeExecution";

export function FreeExecutionConsole({ result, busy }: { result: FreeExecutionResult | null; busy: boolean }) {
  const errorLine = result && !result.returned ? result.errorLine : undefined;
  return <Box aria-label={text.freeTitle} sx={{ p: 1.5, bgcolor: colors.panel, color: colors.text, fontSize: 16 }}>
    <Typography component="p" sx={{ mb: 1 }}>{text.input}</Typography>
    <Typography component="p" sx={{ mb: 2 }}>{text.nonGrading}</Typography>
    {!result ? <Typography component="p">{busy ? text.running : text.empty}</Typography> : <>
      <Typography component="p" role="status" data-free-error-kind={result.error ?? undefined} data-free-error-line={errorLine} sx={{ fontWeight: 700, mb: 2 }}>{result.error ? text.errors[result.error] + (errorLine ? text.errorLineSuffix.replace("{line}", String(errorLine)) : "") : text.success}</Typography>
      {result.error === "syntax" && <Typography component="p" sx={{ mb: 2 }}>{text.syntaxNote}</Typography>}
      <Typography component="h3" sx={{ fontSize: 16, fontWeight: 700 }}>{text.stdout}</Typography>
      <Box component="pre" data-free-stdout sx={{ fontFamily: "monospace", fontSize: 16, whiteSpace: "pre-wrap", overflowWrap: "anywhere", my: 1 }}>{result.stdout || text.noOutput}</Box>
      {result.outputTruncated && <Typography component="p">{text.truncated.replace("{limit}", String(freeOutputLimit))}</Typography>}
      {result.returned && freeDisplayCase && <>
        <Typography component="h3" sx={{ mt: 2, fontSize: 16, fontWeight: 700 }}>{text.returned}</Typography>
        <Box data-free-return sx={{ mt: 1 }}><IndexOutput values={freeDisplayCase.args[0] as readonly number[]} actual={result.actual} height={260} /></Box>
      </>}
    </>}
  </Box>;
}
