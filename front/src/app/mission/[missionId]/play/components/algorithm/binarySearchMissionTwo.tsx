"use client";

import { Box, Chip, Paper, Stack, Typography } from "@mui/material";
import {
  AlgorithmArray,
  CodeLines,
  type AlgorithmCellState,
  type AlgorithmPointer,
} from "@/features/learning/components";

import type { MissionActivityContentData } from "../../type";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value && typeof value === "object" && !Array.isArray(value));

const numberArray = (value: unknown): number[] =>
  Array.isArray(value) && value.every((item) => typeof item === "number")
    ? value
    : [];

const InlineCodeText = ({ text }: { text: string }) => (
  <>
    {text.split(/(`[^`]+`)/g).map((part, index) =>
      part.startsWith("`") && part.endsWith("`") ? (
        <Box
          key={`${part}-${index}`}
          component="code"
          sx={{ px: 0.75, py: 0.25, borderRadius: 1, bgcolor: "#dcfce7", fontWeight: 950 }}
        >
          {part.slice(1, -1)}
        </Box>
      ) : (
        part
      )
    )}
  </>
);

const StaticArray = ({
  values,
  midIndex,
  showRangeLabels = false,
}: {
  values: number[];
  midIndex: number;
  showRangeLabels?: boolean;
}) => {
  const states: Partial<Record<number, AlgorithmCellState>> = { [midIndex]: "comparing" };
  const pointers: AlgorithmPointer[] = [
    { index: midIndex, label: "中央", tone: "secondary" },
    ...(showRangeLabels && values.length > 2
      ? [
          { index: 1, label: "小さい値", tone: "primary" as const },
          { index: values.length - 2, label: "大きい値", tone: "primary" as const },
        ]
      : []),
  ];
  return <AlgorithmArray values={values} states={states} pointers={pointers} compact />;
};

const CentralComparisonScene = ({ content }: { content: MissionActivityContentData }) => {
  const values = numberArray(content.values);
  const midIndex = typeof content.midIndex === "number" ? content.midIndex : 0;
  const target = typeof content.target === "number" ? content.target : null;
  const rules = Array.isArray(content.comparisonRules)
    ? content.comparisonRules.filter(isRecord)
    : [];

  return (
    <Stack spacing={2.5}>
      {target !== null && (
        <Chip
          label={`探す値：${target}`}
          color="primary"
          sx={{ alignSelf: "flex-start", fontSize: 16, fontWeight: 950 }}
        />
      )}
      <StaticArray values={values} midIndex={midIndex} />

      <Paper
        elevation={0}
        sx={{ p: 2, border: "1px solid #bfdbfe", borderRadius: 2.5, bgcolor: "#eff6ff" }}
      >
        <Stack spacing={0.75} alignItems="center">
          <Typography variant="h6" fontWeight={950} color="#0f172a" textAlign="center">
            {typeof content.comparisonText === "string" ? content.comparisonText : ""}
          </Typography>
          <Typography aria-hidden fontSize={24} color="#2563eb" fontWeight={950}>
            ↓
          </Typography>
          <Typography variant="h6" fontWeight={950} color="#1d4ed8" textAlign="center">
            {typeof content.nextRangeText === "string" ? content.nextRangeText : ""}
          </Typography>
        </Stack>
      </Paper>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
          gap: 1.25,
        }}
      >
        {rules.map((rule, index) => (
          <Paper
            key={`${String(rule.condition)}-${index}`}
            elevation={0}
            sx={{ p: 1.75, border: "1px solid #dbeafe", borderRadius: 2.5, bgcolor: "#fff" }}
          >
            <Typography component="code" color="#1e3a8a" fontWeight={950}>
              {typeof rule.condition === "string" ? rule.condition : ""}
            </Typography>
            <Typography sx={{ mt: 0.75 }} color="#475569" fontWeight={850}>
              → {typeof rule.result === "string" ? rule.result : ""}
            </Typography>
          </Paper>
        ))}
      </Box>

      <Stack spacing={1}>
        <Typography component="h3" fontWeight={950} color="#0f172a">
          Pythonでの表し方
        </Typography>
        <CodeLines code={typeof content.pythonCode === "string" ? content.pythonCode : ""} />
        {typeof content.midNote === "string" && (
          <Typography color="#475569" fontWeight={800}>
            {content.midNote}
          </Typography>
        )}
      </Stack>
    </Stack>
  );
};

const SortedRequirementScene = ({ content }: { content: MissionActivityContentData }) => {
  const sortedValues = numberArray(content.sortedValues);
  const unsortedValues = numberArray(content.unsortedValues);
  const midIndex = typeof content.midIndex === "number" ? content.midIndex : 0;

  return (
    <Stack spacing={2.5}>
      <Paper
        elevation={0}
        sx={{ p: { xs: 1.5, sm: 2 }, border: "1px solid #bfdbfe", borderRadius: 2.5 }}
      >
        <Stack spacing={1}>
          <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap">
            <Chip label="小さい順に並んでいる" color="primary" sx={{ fontWeight: 950 }} />
            {typeof content.target === "number" && (
              <Typography fontWeight={950}>探す値：{content.target}</Typography>
            )}
          </Stack>
          <StaticArray values={sortedValues} midIndex={midIndex} showRangeLabels />
          <Typography color="#334155" fontWeight={800} lineHeight={1.8}>
            {typeof content.sortedExplanation === "string" ? content.sortedExplanation : ""}
          </Typography>
        </Stack>
      </Paper>

      <Paper
        elevation={0}
        sx={{ p: { xs: 1.5, sm: 2 }, border: "1px solid #e2e8f0", borderRadius: 2.5, bgcolor: "#f8fafc" }}
      >
        <Stack spacing={1}>
          <Chip label="順番に並んでいない" sx={{ alignSelf: "flex-start", fontWeight: 950 }} />
          <AlgorithmArray values={unsortedValues} compact />
          <Typography color="#334155" fontWeight={800} lineHeight={1.8}>
            {typeof content.unsortedExplanation === "string" ? content.unsortedExplanation : ""}
          </Typography>
        </Stack>
      </Paper>

      {typeof content.premise === "string" && (
        <Paper
          elevation={0}
          sx={{ p: 2, border: "1px solid #86efac", borderRadius: 2.5, bgcolor: "#f0fdf4" }}
        >
          <Typography color="#166534" fontWeight={950} lineHeight={1.8}>
            <InlineCodeText text={content.premise} />
          </Typography>
        </Paper>
      )}
    </Stack>
  );
};

const RangeState = ({
  values,
  leftIndex = 0,
  rightIndex = values.length - 1,
  midIndex,
}: {
  values: number[];
  leftIndex?: number;
  rightIndex?: number;
  midIndex?: number;
}) => {
  const states: Partial<Record<number, AlgorithmCellState>> = {};
  values.forEach((_, index) => {
    states[index] = index === midIndex
      ? "comparing"
      : index < leftIndex || index > rightIndex
        ? "excluded"
        : "active";
  });
  const pointers: AlgorithmPointer[] = [
    { index: leftIndex, label: "left", tone: "primary" },
    ...(midIndex === undefined ? [] : [{ index: midIndex, label: "mid", tone: "secondary" as const }]),
    { index: rightIndex, label: "right", tone: "primary" },
  ];
  return <AlgorithmArray values={values} states={states} pointers={pointers} compact />;
};

const BinarySearchCourseLessonScene = ({ content }: { content: MissionActivityContentData }) => {
  const values = numberArray(content.values);
  const leftIndex = typeof content.leftIndex === "number" ? content.leftIndex : 0;
  const rightIndex = typeof content.rightIndex === "number" ? content.rightIndex : values.length - 1;
  const midIndex = typeof content.midIndex === "number" ? content.midIndex : undefined;
  const examples = Array.isArray(content.examples) ? content.examples.filter(isRecord) : [];

  return (
    <Stack spacing={2.25}>
      {values.length > 0 && (
        <RangeState values={values} leftIndex={leftIndex} rightIndex={rightIndex} midIndex={midIndex} />
      )}
      {typeof content.formula === "string" && (
        <Paper elevation={0} sx={{ p: 2, borderRadius: 2.5, border: "1px solid #bfdbfe", bgcolor: "#eff6ff", textAlign: "center" }}>
          <Typography component="code" fontSize={{ xs: 17, sm: 20 }} fontWeight={950} color="#1d4ed8" sx={{ whiteSpace: "pre-line" }}>
            {content.formula}
          </Typography>
        </Paper>
      )}
      {examples.length > 0 && (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: examples.length > 1 ? "repeat(2, minmax(0, 1fr))" : "1fr" }, gap: 1.5 }}>
          {examples.map((example, index) => {
            const exampleValues = numberArray(example.values);
            return (
              <Paper key={typeof example.id === "string" ? example.id : index} elevation={0} sx={{ p: 2, borderRadius: 2.5, border: "1px solid #dbeafe" }}>
                {typeof example.title === "string" && <Typography fontWeight={950}>{example.title}</Typography>}
                {exampleValues.length > 0 && (
                  <RangeState
                    values={exampleValues}
                    leftIndex={typeof example.leftIndex === "number" ? example.leftIndex : 0}
                    rightIndex={typeof example.rightIndex === "number" ? example.rightIndex : exampleValues.length - 1}
                    midIndex={typeof example.midIndex === "number" ? example.midIndex : undefined}
                  />
                )}
                {typeof example.text === "string" && (
                  <Typography color="#334155" fontWeight={800} lineHeight={1.8} sx={{ whiteSpace: "pre-line" }}>{example.text}</Typography>
                )}
                {typeof example.code === "string" && <Box sx={{ mt: 1 }}><CodeLines code={example.code} /></Box>}
              </Paper>
            );
          })}
        </Box>
      )}
      {typeof content.pythonCode === "string" && <CodeLines code={content.pythonCode} />}
      {typeof content.sceneConclusion === "string" && (
        <Paper elevation={0} sx={{ p: 2, borderRadius: 2.5, border: "1px solid #86efac", bgcolor: "#f0fdf4" }}>
          <Typography color="#166534" fontWeight={950} lineHeight={1.8}>{content.sceneConclusion}</Typography>
        </Paper>
      )}
    </Stack>
  );
};

export const BinarySearchCourseScene = ({
  rendererKey,
  content,
}: {
  rendererKey: string;
  content: MissionActivityContentData;
}) => {
  switch (rendererKey) {
    case "BINARY_SEARCH_CENTRAL_COMPARISON":
      return <CentralComparisonScene content={content} />;
    case "BINARY_SEARCH_SORTED_REQUIREMENT":
      return <SortedRequirementScene content={content} />;
    case "BINARY_SEARCH_INDEX_RANGE":
    case "BINARY_SEARCH_MID_CALCULATION":
    case "BINARY_SEARCH_RANGE_UPDATE":
    case "BINARY_SEARCH_RECALCULATE_MID":
    case "BINARY_SEARCH_ONE_ITERATION":
    case "BINARY_SEARCH_WHILE_LOOP":
    case "BINARY_SEARCH_ENDINGS":
      return <BinarySearchCourseLessonScene content={content} />;
    default:
      throw new Error(`Unsupported binary-search renderer: ${rendererKey}`);
  }
};
