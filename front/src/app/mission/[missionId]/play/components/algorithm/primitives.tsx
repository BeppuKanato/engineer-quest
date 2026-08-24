"use client";

import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import { Chip, Paper, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";
import {
  AlgorithmArray,
  AlgorithmStateLegend,
  AlgorithmValueCard,
  CodeLines,
  type AlgorithmCellState,
} from "@/features/learning/components";

const toCommonCellState = (
  state: "idle" | "compare" | "swap" | "confirmed" | "outside",
): AlgorithmCellState => ({
  idle: "idle",
  compare: "comparing",
  swap: "swapping",
  confirmed: "confirmed",
  outside: "excluded",
})[state] as AlgorithmCellState;

export function NumberCard({
  value,
  index,
  state = "idle",
  compact = false,
}: {
  value: number;
  index: number;
  state?: "idle" | "compare" | "swap" | "confirmed" | "outside";
  compact?: boolean;
}) {
  return (
    <AlgorithmValueCard
      value={value}
      index={index}
      state={toCommonCellState(state)}
      compact={compact}
      showIndex={false}
    />
  );
}

export function ArrayCards({
  values,
  compareIndices,
  swappedIndices,
  confirmedIndices = [],
  activeRange,
  compact = false,
  showIndices = false,
}: {
  values: number[];
  compareIndices?: [number, number];
  swappedIndices?: [number, number];
  confirmedIndices?: number[];
  activeRange?: [number, number];
  compact?: boolean;
  showIndices?: boolean;
}) {
  const states = Object.fromEntries(values.map((_, index) => {
    const outside = activeRange && (index < activeRange[0] || index > activeRange[1]);
    const state: AlgorithmCellState = swappedIndices?.includes(index)
      ? "swapping"
      : compareIndices?.includes(index)
        ? "comparing"
        : confirmedIndices.includes(index)
          ? "confirmed"
          : outside
            ? "excluded"
            : "idle";
    return [index, state];
  }));

  return <AlgorithmArray values={values} states={states} compact={compact} showIndices={showIndices} />;
}

export const IndexLabels = ({ count }: { count: number }) => (
  <Stack direction="row" spacing={1} flexWrap="wrap">
    {Array.from({ length: count }, (_, index) => (
      <Chip key={index} size="small" label={`index ${index}`} />
    ))}
  </Stack>
);

export const VariablePanel = ({ variables }: { variables: Record<string, string | number> }) => (
  <Stack direction="row" gap={1} flexWrap="wrap">
    {Object.entries(variables).map(([name, value]) => (
      <Chip key={name} label={`${name} = ${value}`} sx={{ fontWeight: 900 }} />
    ))}
  </Stack>
);

export const PassIndicator = ({ passIndex }: { passIndex?: number }) => (
  <Chip color="primary" variant="outlined" label={passIndex === undefined ? "開始前" : `${passIndex + 1}周目`} />
);

export const Pointer = ({ label, index }: { label: string; index: number }) => (
  <Stack alignItems="center" aria-label={`${label}は添字${index}`}>
    <Typography color="primary" fontWeight={950}>▼</Typography>
    <Chip size="small" label={`${label}: ${index}`} />
  </Stack>
);

export const RangeHighlight = ({ start, end }: { start: number; end: number }) => (
  <Typography fontWeight={850} color="#1d4ed8">
    比較範囲：index {start}〜{end}
  </Typography>
);

export const ComparisonMarker = ({ left, right }: { left: number; right: number }) => (
  <Chip color="primary" label={`比較中：${left} と ${right}`} />
);

export const ConfirmedRange = ({ indices }: { indices: number[] }) => (
  <Chip color="success" variant="outlined" label={`確定済み：${indices.join(", ") || "なし"}`} />
);

export const CodeBlock = ({
  code,
  activeLines = [],
  wrapLongLines = false,
}: {
  code: string;
  activeLines?: number[];
  wrapLongLines?: boolean;
}) => (
  <CodeLines code={code} activeLines={activeLines} wrapLongLines={wrapLongLines} />
);

export const AlgorithmLegend = () => <AlgorithmStateLegend />;

export function ProcessBlock({
  order,
  children,
  draggable = true,
}: {
  order?: number;
  children: ReactNode;
  draggable?: boolean;
}) {
  return (
    <Paper sx={{ p: 1.5, display: "flex", alignItems: "center", gap: 1, border: "1px solid #bfdbfe" }}>
      {draggable && <DragIndicatorIcon aria-label="ドラッグハンドル" />}
      {order && <Chip size="small" label={order} />}
      <Typography fontWeight={850}>{children}</Typography>
    </Paper>
  );
}
