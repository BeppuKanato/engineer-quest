import { Box, Typography } from "@mui/material";
import { IndexFigure } from "./IndexFigure";
import { binarySearchEditorText as text } from "./editor.content";
import { exceptionText } from "./ProgramResults";
import { editorTokens as colors } from "./editor.tokens";
import { freeDisplayCase, freeOutputLimit, type FreeExecutionResult } from "./freeExecution";

const isNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

export function FreeExecutionConsole({ result, busy }: { result: FreeExecutionResult | null; busy: boolean }) {
  const errorLine = result && !result.returned ? result.errorLine : undefined;
  return <Box aria-label={text.freeTitle} sx={{ p: 1.5, bgcolor: colors.panel, color: colors.text, fontSize: 16 }}>
    <Typography component="p" sx={{ mb: 1 }}>{text.input}</Typography>
    {freeDisplayCase && <Box component="pre" sx={{ m: 0, mb: 2, p: 1.5, bgcolor: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 1.5, fontFamily: "monospace", fontSize: 15 }}>{freeDisplayCase.inputText}</Box>}
    <Typography component="p" sx={{ mb: 2 }}>{text.nonGrading}</Typography>
    {!result ? <Typography component="p">{busy ? text.running : text.empty}</Typography> : <>
      <Typography component="p" role="status" data-free-error-kind={result.error ?? undefined} data-free-error-line={errorLine} sx={{ fontWeight: 700, mb: 2 }}>{result.error ? ((result.error === "runtime" ? exceptionText(result)?.title : undefined) ?? text.errors[result.error]) + (errorLine ? text.errorLineSuffix.replace("{line}", String(errorLine)) : "") : text.success}</Typography>
      {result.error === "runtime" && exceptionText(result) && <Typography component="p" sx={{ mb: 2 }}>{exceptionText(result)!.guidance}</Typography>}
      {result.error === "syntax" && <Typography component="p" sx={{ mb: 2 }}>{text.syntaxNote}</Typography>}
      {result.returned && isNumber(result.actual) && freeDisplayCase && <>
        <Typography component="h3" sx={{ fontSize: 16, fontWeight: 700 }}>{text.returned}</Typography>
        <Box data-free-return sx={{ mt: 1, mb: 2 }}>
          <Typography component="p" sx={{ fontSize: 18, fontWeight: 900 }}>{result.actual}</Typography>
          <IndexFigure values={freeDisplayCase.values} highlight={result.actual} label="試しに実行の結果の位置" />
        </Box>
      </>}
      <Typography component="h3" sx={{ fontSize: 16, fontWeight: 700 }}>{text.stdout}</Typography>
      <Box component="pre" data-free-stdout sx={{ fontFamily: "monospace", fontSize: 16, whiteSpace: "pre-wrap", overflowWrap: "anywhere", my: 1 }}>{result.stdout || text.noOutput}</Box>
      {result.outputTruncated && <Typography component="p">{text.truncated.replace("{limit}", String(freeOutputLimit))}</Typography>}
    </>}
  </Box>;
}
