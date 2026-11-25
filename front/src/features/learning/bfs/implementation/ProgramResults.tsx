import { useState } from "react";
import { Box, Button, Typography } from "@mui/material";

import { DistanceValues } from "./DistanceOutput";
import { GraphFigure, graphFromInput } from "./GraphFigure";
import { bfsImplementationContent as content } from "./implementation.content";
import { resultKinds, type TestOutcome } from "./implementation";

const labels = content.display;

/** 例外が取れたら、分類名ではなく「何が起きたか」の定型文を返す。 */
export function exceptionText(outcome: { errorException?: string; errorName?: string }): { title: string; guidance: string } | undefined {
  if (!outcome.errorException) return undefined;
  const template = labels.exceptionMessages[outcome.errorException];
  if (!template) return undefined;
  const title = outcome.errorName ? template.title.replace("{name}", outcome.errorName) : (template.titleNoName ?? template.title);
  return { title, guidance: template.guidance };
}

const isNumberList = (value: unknown): value is number[] =>
  Array.isArray(value) && value.every(item => typeof item === "number" && Number.isFinite(item));

/**
 * テストタブの表示方針（プログラム形式）：
 * - 詳細に開くのは「不一致の公開テスト」だけ。入力の図と、期待／実際の距離を比べて見せる。
 * - 出力の形の問題（空・数値でない・個数違い）は、実行エラーと分けて一文で知らせる。
 * - 全テストが同じエラーで実行できなかった回は、1枚のエラーパネルに集約する。
 * - コード編集後は前回の結果を「前回」と明示して残す（stale）。判定には使わない。
 */
export function ProgramResults({ outcomes, diagnostics = outcomes, stale = false, code, onFocusLine, onShowHints }: {
  outcomes: readonly TestOutcome[];
  diagnostics?: readonly TestOutcome[];
  stale?: boolean;
  code?: string;
  onFocusLine?: (line: number) => void;
  onShowHints?: () => void;
}) {
  const [expandedPassed, setExpandedPassed] = useState<ReadonlySet<string>>(new Set());
  const kinds = resultKinds(diagnostics);
  const passed = outcomes.filter(outcome => outcome.passed).length;
  const autoOutcome = outcomes.find(outcome => outcome.id === "AUTO");
  const namedOutcomes = outcomes.filter(outcome => outcome.id !== "AUTO");
  const totalChecks = content.tests.length + 1;
  const statusOf = (outcome: TestOutcome | undefined) => !outcome ? labels.statuses.unexecuted
    : outcome.passed ? labels.statuses.passed
    : outcome.error === "syntax" ? labels.statuses.errorSyntax
    : outcome.error === "runtime" ? labels.statuses.errorRuntime
    : outcome.error === "timeout" ? labels.statuses.errorTimeout
    : labels.statuses.failed;
  // 全件が同一種のエラー＝プログラム自体が実行できていないので、テスト別の行は作らない。
  const aggregatedKind = !stale && namedOutcomes.length === content.tests.length && namedOutcomes.every(outcome => outcome.error)
    ? (new Set(namedOutcomes.map(outcome => outcome.error)).size === 1 ? namedOutcomes[0].error : undefined)
    : undefined;
  if (aggregatedKind) {
    const line = namedOutcomes.find(outcome => outcome.errorLine !== undefined)?.errorLine;
    const lineText = line !== undefined && code ? code.split("\n")[line - 1]?.trim() : undefined;
    const guidance = labels.guidance[aggregatedKind];
    const exception = aggregatedKind === "runtime" ? exceptionText(namedOutcomes[0]) : undefined;
    return <Box>
      <Box role="alert" sx={{ border: "2px solid #111827", borderRadius: 2, bgcolor: "#fff", p: 2 }}>
        <Typography component="p" sx={{ fontSize: 18, fontWeight: 900 }}>
          {exception ? exception.title : aggregatedKind === "syntax" ? "文法エラー" : aggregatedKind === "runtime" ? "実行時エラー" : "タイムアウト"}
          {line ? `（${line}行目付近）` : ""}
        </Typography>
        {exception
          ? <Typography component="p" sx={{ fontSize: 16, mt: 1 }}>{exception.guidance}</Typography>
          : <>
              <Typography component="p" sx={{ fontSize: 16, mt: 1 }}>{labels.messages[aggregatedKind]}</Typography>
              {guidance && <Typography component="p" sx={{ fontSize: 14, mt: 1 }}>{guidance}</Typography>}
            </>}
        {lineText && <Box component="pre" sx={{ m: 0, mt: 1.5, p: 1.5, bgcolor: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 1.5, fontFamily: "monospace", fontSize: 15, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{line}行目：{lineText}</Box>}
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 1.5 }}>
          {line !== undefined && onFocusLine && <Button variant="outlined" onClick={() => onFocusLine(line)}
            sx={{ minHeight: 44, fontWeight: 700, color: "#111827", borderColor: "#111827" }}>エラー箇所を確認</Button>}
          {onShowHints && <Button onClick={onShowHints}
            sx={{ minHeight: 44, fontWeight: 700, color: "#2563eb" }}>ヒントを見る</Button>}
        </Box>
      </Box>
      <Typography component="p" sx={{ fontSize: 15, fontWeight: 700, mt: 2 }}>{aggregatedKind === "syntax" ? labels.notExecuted : labels.notJudged}</Typography>
    </Box>;
  }
  return <Box>
    {stale && <Typography component="p" sx={{ fontSize: 14, fontWeight: 700, mb: 1.5 }}>前回のテスト結果です。コードが変更されています。再実行すると更新されます。</Typography>}
    {kinds.length > 0 && <Box role="status" aria-label={labels.errorLabel} sx={{ mb: 2 }}>
      {kinds.map(kind => {
        const line = diagnostics.find(outcome => outcome.error === kind)?.errorLine;
        const guidance = kind !== "mismatch" ? labels.guidance[kind] : undefined;
        return <Box key={kind} sx={{ mb: 1 }}>
          <Typography component="p" data-error-kind={kind} data-error-line={line} sx={{ fontSize: 16, fontWeight: 700 }}>{labels.messages[kind]}{line ? labels.lineNote.replace("{line}", String(line)) : ""}</Typography>
          {guidance && <Typography component="p" sx={{ fontSize: 14, mt: 0.25 }}>{guidance}</Typography>}
        </Box>;
      })}
    </Box>}
    <Box sx={{ display: "flex", alignItems: "baseline", gap: 1.5, mb: 1 }}>
      <Typography component="p" sx={{ fontSize: 22, fontWeight: 900 }}>{stale ? "前回 " : ""}{passed} / {totalChecks} 件通過</Typography>
    </Box>
    {content.tests.map(test => {
      const outcome = outcomes.find(item => item.id === test.id);
      const status = statusOf(outcome);
      const actual = outcome && !outcome.error && isNumberList(outcome.actual) ? outcome.actual : null;
      const graph = graphFromInput(test.inputText);
      const expandable = test.visibility === "display" && Boolean(outcome) && !outcome!.error;
      const expanded = Boolean(outcome) && !outcome!.passed && test.visibility === "display"
        || expandedPassed.has(test.id);
      const differentCount = actual ? test.expected.filter((value, index) => actual[index] !== value).length : 0;
      return <Box key={test.id} sx={{ borderTop: "1px solid #e5e7eb", py: 1.25 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, flexWrap: "wrap" }}>
          <Typography component="p" sx={{ fontSize: 16, fontWeight: 900, minWidth: 26 }}>{status.icon}</Typography>
          <Typography component="p" sx={{ fontSize: 16, fontWeight: 800, flex: 1, minWidth: 120 }}>{test.label}</Typography>
          <Typography component="p" sx={{ fontSize: 14, fontWeight: 700 }}>{status.label}</Typography>
          {expandable && outcome!.passed && <Button size="small" onClick={() => setExpandedPassed(current => {
            const next = new Set(current);
            if (next.has(test.id)) next.delete(test.id); else next.add(test.id);
            return next;
          })} sx={{ minHeight: 36, fontWeight: 700, color: "#2563eb" }}>{expandedPassed.has(test.id) ? "詳細を閉じる" : "詳細を見る"}</Button>}
        </Box>
        {outcome?.formatIssue && <Typography component="p" sx={{ fontSize: 14, fontWeight: 700, mt: 0.75 }}>{labels.format[outcome.formatIssue]}</Typography>}
        {expanded && <Box sx={{ mt: 1.25, display: "grid", gap: 1.25 }}>
          <Box>
            <Typography component="p" sx={{ fontSize: 14, fontWeight: 700, mb: 0.5 }}>{labels.inputLabel}</Typography>
            <Box sx={{ height: 170, border: "1px solid #e5e7eb", borderRadius: 1, overflow: "hidden" }}>
              <GraphFigure nodes={graph.nodes} edges={graph.edges} start={graph.start} label={`${test.label}の入力`} />
            </Box>
            <Box component="pre" sx={{ m: 0, mt: 0.75, p: 1.25, bgcolor: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 1.5, fontFamily: "monospace", fontSize: 14 }}>{test.inputText}</Box>
          </Box>
          <Box>
            <Typography component="p" sx={{ fontSize: 14, fontWeight: 700, mb: 0.5 }}>{labels.expectedLabel}</Typography>
            <DistanceValues nodes={test.nodes} values={test.expected} />
          </Box>
          {actual && <Box>
            <Typography component="p" sx={{ fontSize: 14, fontWeight: 700, mb: 0.5 }}>{labels.actualLabel}{differentCount > 0 ? `（${labels.different.replace("{count}", String(differentCount))}）` : ""}</Typography>
            <DistanceValues nodes={test.nodes} values={actual} expected={test.expected} />
          </Box>}
          {outcome && !outcome.error && !actual && !outcome.formatIssue && <Typography component="p" sx={{ fontSize: 14 }}>{labels.noOutput}</Typography>}
        </Box>}
      </Box>;
    })}
    <Box sx={{ borderTop: "1px solid #e5e7eb", py: 1.25 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, flexWrap: "wrap" }}>
        <Typography component="p" sx={{ fontSize: 16, fontWeight: 900, minWidth: 26 }}>{statusOf(autoOutcome).icon}</Typography>
        <Typography component="p" sx={{ fontSize: 16, fontWeight: 800, flex: 1, minWidth: 120 }}>{content.freeForm.autoLabel}</Typography>
        <Typography component="p" sx={{ fontSize: 14, fontWeight: 700 }}>{statusOf(autoOutcome).label}</Typography>
      </Box>
      <Typography component="p" sx={{ fontSize: 14, mt: 0.75 }}>
        {!autoOutcome ? content.freeForm.autoCaptionNone
          : autoOutcome.passed ? content.freeForm.autoCaptionPassed.replace("{total}", String(autoOutcome.autoTotal ?? 0))
          : autoOutcome.error ? labels.messages[autoOutcome.error]
          : content.freeForm.autoCaptionFailed.replace("{total}", String(autoOutcome.autoTotal ?? 0)).replace("{passed}", String(autoOutcome.autoPassed ?? 0))}
      </Typography>
    </Box>
  </Box>;
}
