"use client";

import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import LockIcon from "@mui/icons-material/Lock";
import {
  Box,
  Chip,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import type { ReactNode } from "react";

import { ArrayCards, CodeBlock } from "./primitives";

type SceneContent = Record<string, unknown>;
type Pair = [number, number];
type PassRange = {
  label?: string;
  i?: number;
  values?: number[];
  pairs?: Pair[];
  comparisonCount?: number;
  result?: number[];
  confirmedIndices?: number[];
};
type FormulaRow = { label?: string; i?: number; expression?: string; result?: number };

const numberList = (value: unknown, fallback = [5, 2, 4, 1]) =>
  Array.isArray(value) && value.every((item) => typeof item === "number") ? value as number[] : fallback;

const pairs = (value: unknown): Pair[] =>
  Array.isArray(value)
    ? value.filter((item): item is Pair => Array.isArray(item) && item.length === 2 && item.every((index) => typeof index === "number"))
    : [];

const HighlightNote = ({ children }: { children: ReactNode }) => (
  <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2.5, border: "1px solid #fde68a", bgcolor: "#fffbeb" }}>
    <Stack direction="row" spacing={1} alignItems="center">
      <LightbulbIcon sx={{ color: "#d97706" }} />
      <Typography fontWeight={900} color="#92400e">{children}</Typography>
    </Stack>
  </Paper>
);

const PairChips = ({ items }: { items: Pair[] }) => (
  <Stack direction="row" gap={0.75} flexWrap="wrap" useFlexGap>
    {items.map(([left, right], index) => (
      <Chip key={`${left}-${right}-${index}`} icon={<CompareArrowsIcon />} label={`${index + 1}. 位置${left}と${right}`} variant="outlined" sx={{ fontWeight: 850 }} />
    ))}
  </Stack>
);

const RangeRedundancyScene = ({ content }: { content: SceneContent }) => {
  const initial = numberList(content.initialValues);
  const after = numberList(content.afterFirstPass, [2, 4, 1, 5]);
  const confirmed = numberList(content.confirmedIndices, [3]);
  const comparisonPairs = pairs(content.comparisonPairs);
  return (
    <Stack spacing={2}>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr auto 1fr" }, gap: 2, alignItems: "center" }}>
        <Stack alignItems="center" spacing={1}>
          <Chip label="初期の配列" color="primary" variant="outlined" sx={{ fontWeight: 900 }} />
          <ArrayCards values={initial} />
        </Stack>
        <ArrowForwardIcon color="primary" sx={{ transform: { xs: "rotate(90deg)", md: "none" }, justifySelf: "center" }} />
        <Stack alignItems="center" spacing={1}>
          <Chip label="一周目の後" color="success" variant="outlined" sx={{ fontWeight: 900 }} />
          <ArrayCards values={after} confirmedIndices={confirmed} />
        </Stack>
      </Box>
      <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2.5, border: "1px solid #bfdbfe", bgcolor: "#f8fbff" }}>
        <Typography color="primary" fontWeight={950} sx={{ mb: 1 }}>同じ範囲で二周目を行うと…</Typography>
        <PairChips items={comparisonPairs} />
        <Typography sx={{ mt: 1.25 }} fontWeight={850}>最後に位置2の1と、すでに確定した位置3の5を再び比較します。</Typography>
      </Paper>
      <HighlightNote>{typeof content.emphasis === "string" ? content.emphasis : "一周ごとに右側から位置が決まります。"}</HighlightNote>
    </Stack>
  );
};

const NextActiveRangeScene = ({ content, isCorrect }: { content: SceneContent; isCorrect: boolean }) => {
  const values = numberList(content.values, [2, 4, 1, 5]);
  const confirmed = numberList(content.confirmedIndices, [3]);
  const active = numberList(content.activeRange, [0, 2]);
  const comparisonPairs = pairs(content.comparisonPairs);
  return (
    <Stack spacing={2} alignItems="center">
      <Stack direction="row" gap={1} flexWrap="wrap" justifyContent="center">
        <Chip label="一周目の結果" color="primary" sx={{ fontWeight: 900 }} />
        <Chip icon={<LockIcon />} label="右端の5は確定済み" color="success" variant="outlined" sx={{ fontWeight: 900 }} />
      </Stack>
      <ArrayCards values={values} activeRange={active.length >= 2 ? [active[0], active[1]] : [0, 2]} confirmedIndices={confirmed} />
      {isCorrect ? (
        <Paper elevation={0} sx={{ width: "100%", p: 1.5, border: "1px solid #86efac", bgcolor: "#f0fdf4", borderRadius: 2.5 }}>
          <Typography color="#166534" fontWeight={950} sx={{ mb: 1 }}>{typeof content.correctRangeMessage === "string" ? content.correctRangeMessage : "確定済みを除いて比較します。"}</Typography>
          <PairChips items={comparisonPairs} />
        </Paper>
      ) : (
        <Typography fontWeight={900} color="#475569">確定済みの5を除き、どの隣接ペアまで確認するか選びましょう。</Typography>
      )}
    </Stack>
  );
};

const RangeByPassScene = ({ content }: { content: SceneContent }) => {
  const ranges = Array.isArray(content.passRanges) ? content.passRanges as PassRange[] : [];
  if (ranges.length === 0) return <Typography color="error">周回データを読み込めませんでした。</Typography>;
  return (
    <Stack spacing={1.5}>
      {ranges.map((range, index) => {
        const values = numberList(range.values);
        const result = numberList(range.result, values);
        const i = range.i ?? index;
        const end = Math.max(0, values.length - 1 - i);
        const confirmedBefore = Array.from({ length: i }, (_, offset) => values.length - 1 - offset);
        return (
          <Paper key={index} elevation={0} sx={{ p: 1.5, borderRadius: 2.5, border: "1px solid #dbeafe", bgcolor: index === 0 ? "#f8fbff" : "#fff" }}>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "140px minmax(250px,1fr) minmax(250px,1fr) 100px" }, gap: 1.5, alignItems: "center" }}>
              <Stack><Chip label={range.label ?? `${index + 1}周目`} color={index === 0 ? "primary" : index === 1 ? "success" : "warning"} sx={{ fontWeight: 950 }} /><Typography textAlign="center" fontWeight={850} sx={{ mt: .5 }}>i = {i}</Typography></Stack>
              <Stack spacing={0.5} alignItems="center">
                <Typography fontSize={12} fontWeight={850}>周回開始時</Typography>
                <ArrayCards values={values} activeRange={[0, end]} confirmedIndices={confirmedBefore} compact />
                <ArrowForwardIcon color="primary" sx={{ transform: "rotate(90deg)" }} />
                <Typography fontSize={12} fontWeight={850}>周回結果</Typography>
                <ArrayCards values={result} confirmedIndices={range.confirmedIndices ?? []} compact />
              </Stack>
              <PairChips items={range.pairs ?? []} />
              <Stack alignItems="center"><Typography fontSize={28} fontWeight={950} color="primary">{range.comparisonCount ?? range.pairs?.length ?? 0}回</Typography><Typography fontSize={13} fontWeight={850}>比較</Typography></Stack>
            </Box>
          </Paper>
        );
      })}
      <HighlightNote>{typeof content.emphasis === "string" ? content.emphasis : "周回ごとに比較回数が減ります。"}</HighlightNote>
    </Stack>
  );
};

const RangeFormulaScene = ({ content }: { content: SceneContent }) => {
  const rows = Array.isArray(content.rows) ? content.rows as FormulaRow[] : [];
  return (
    <Stack spacing={2}>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 1.5 }}>
        <Paper elevation={0} sx={{ p: 2, border: "1px solid #bfdbfe", borderRadius: 2.5, bgcolor: "#eff6ff" }}>
          <Typography color="#1d4ed8" fontWeight={950}>最初の周回</Typography>
          <Typography sx={{ mt: 1 }} fontSize={{ xs: 24, sm: 30 }} fontWeight={950} textAlign="center">比較回数 = n - 1</Typography>
        </Paper>
        <Paper elevation={0} sx={{ p: 2, border: "1px solid #fed7aa", borderRadius: 2.5, bgcolor: "#fff7ed" }}>
          <Typography color="#c2410c" fontWeight={950}>周回が進んだとき</Typography>
          <Typography component="code" sx={{ mt: 1, display: "block", fontSize: { xs: 28, sm: 36 }, fontWeight: 950, color: "#c2410c", textAlign: "center" }}>{typeof content.formula === "string" ? content.formula : "n - 1 - i"}</Typography>
        </Paper>
      </Box>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 1.25 }}>
        {rows.map((row, index) => (
          <Paper key={index} elevation={0} sx={{ p: 1.5, border: "1px solid #cbd5e1", borderRadius: 2.5, textAlign: "center" }}>
            <Typography fontWeight={950}>{row.label}</Typography>
            <Chip label={`i = ${row.i ?? index}`} size="small" sx={{ my: 1, fontWeight: 900 }} />
            <Typography component="code" fontWeight={850}>{row.expression}</Typography>
            <Typography color="primary" fontSize={28} fontWeight={950}>= {row.result}回</Typography>
          </Paper>
        ))}
      </Box>
      <HighlightNote>{typeof content.emphasis === "string" ? content.emphasis : "iが増えるほど比較範囲は短くなります。"}</HighlightNote>
    </Stack>
  );
};

const RangeFillScene = ({ content, isCorrect }: { content: SceneContent; isCorrect: boolean }) => (
  <Stack spacing={1.5}>
    <Stack direction="row" spacing={1} alignItems="center"><CompareArrowsIcon color="primary" /><Typography fontWeight={950}>内側のfor文を完成させよう</Typography></Stack>
    <CodeBlock code={isCorrect && typeof content.completedCode === "string" ? content.completedCode : typeof content.code === "string" ? content.code : "for j in range(＿＿＿＿):"} activeLines={[2]} />
    <HighlightNote>最初のn - 1回から、すでに終わった周回数iを引きます。</HighlightNote>
  </Stack>
);

const OptimizationCompareScene = ({ content, isCorrect }: { content: SceneContent; isCorrect: boolean }) => {
  const resultA = numberList(content.resultA, [1, 2, 4, 5]);
  const resultB = numberList(content.resultB, [1, 2, 4, 5]);
  return (
    <Stack spacing={2}>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 520px), 1fr))", gap: 1.5 }}>
        <Paper elevation={0} sx={{ minWidth: 0, p: 1.5, border: "1px solid #bfdbfe", borderRadius: 2.5 }}>
          <Chip label="コードA：毎周同じ範囲" color="primary" variant="outlined" sx={{ mb: 1, fontWeight: 900 }} />
          <CodeBlock code={typeof content.codeA === "string" ? content.codeA : "for j in range(n - 1):"} activeLines={[2]} wrapLongLines />
          <Stack direction={{ xs: "column", sm: "row" }} gap={1} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} sx={{ mt: 1 }}><ArrayCards values={resultA} compact /><Chip label={`${Number(content.comparisonCountA) || 9}回比較`} sx={{ fontWeight: 900 }} /></Stack>
        </Paper>
        <Paper elevation={0} sx={{ minWidth: 0, p: 1.5, border: isCorrect ? "2px solid #22c55e" : "1px solid #bbf7d0", bgcolor: "#f8fff9", borderRadius: 2.5 }}>
          <Chip icon={isCorrect ? <CheckCircleIcon /> : undefined} label="コードB：範囲を短くする" color="success" variant="outlined" sx={{ mb: 1, fontWeight: 900 }} />
          <CodeBlock code={typeof content.codeB === "string" ? content.codeB : "for j in range(n - 1 - i):"} activeLines={[2]} wrapLongLines />
          <Stack direction={{ xs: "column", sm: "row" }} gap={1} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} sx={{ mt: 1 }}><ArrayCards values={resultB} compact /><Chip color="success" label={`${Number(content.comparisonCountB) || 6}回比較`} sx={{ fontWeight: 900 }} /></Stack>
        </Paper>
      </Box>
      {isCorrect && <HighlightNote>結果はどちらも[1, 2, 4, 5]。コードBは確定済みの右側を除き、比較を3回減らせます。</HighlightNote>}
    </Stack>
  );
};

export const MissionFiveScene = ({ rendererKey, content, isCorrect }: { rendererKey: string; content: SceneContent; isCorrect?: boolean }) => {
  if (rendererKey === "RANGE_REDUNDANCY") return <RangeRedundancyScene content={content} />;
  if (rendererKey === "NEXT_ACTIVE_RANGE") return <NextActiveRangeScene content={content} isCorrect={isCorrect === true} />;
  if (rendererKey === "RANGE_BY_PASS") return <RangeByPassScene content={content} />;
  if (rendererKey === "RANGE_FORMULA") return <RangeFormulaScene content={content} />;
  if (rendererKey === "RANGE_FILL") return <RangeFillScene content={content} isCorrect={isCorrect === true} />;
  if (rendererKey === "OPTIMIZATION_COMPARE") return <OptimizationCompareScene content={content} isCorrect={isCorrect === true} />;
  throw new Error(`Unsupported Mission 5 renderer: ${rendererKey}`);
};
