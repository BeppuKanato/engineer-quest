"use client";

import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import { Box, Chip, Paper, Stack, Typography } from "@mui/material";

import { ArrayCards, CodeBlock } from "./primitives";

type SceneContent = Record<string, unknown>;
type RuleExampleData = { title: string; before: number[]; after: number[]; description: string; didSwap: boolean };

const numberList = (value: unknown, fallback = [6, 3, 5, 2]) =>
  Array.isArray(value) && value.every((item) => typeof item === "number")
    ? value as number[]
    : fallback;

const FocusedArray = ({ values, label }: { values: number[]; label?: string }) => (
  <Stack spacing={1.25} alignItems="center">
    {label && <Chip label={label} color="primary" variant="outlined" sx={{ fontWeight: 900 }} />}
    <ArrayCards values={values} compareIndices={[0, 1]} />
    <Typography color="#475569" fontWeight={800}>位置0と位置1の、隣り合う2つの値を見ます。</Typography>
  </Stack>
);

const RuleExample = ({
  title,
  before,
  after,
  description,
  didSwap,
}: {
  title: string;
  before: number[];
  after: number[];
  description: string;
  didSwap: boolean;
}) => (
  <Paper elevation={0} sx={{ p: 2, border: "1px solid #bfdbfe", borderRadius: 2.5, bgcolor: "#fff" }}>
    <Typography fontWeight={950}>{title}</Typography>
    <Stack direction={{ xs: "column", sm: "row" }} alignItems="center" justifyContent="center" spacing={1.5} sx={{ my: 1.5 }}>
      <ArrayCards values={before} compareIndices={[0, 1]} compact />
      <ArrowDownwardIcon color="primary" sx={{ transform: { sm: "rotate(-90deg)" } }} />
      <ArrayCards values={after} swappedIndices={didSwap ? [0, 1] : undefined} compact />
    </Stack>
    <Typography sx={{ lineHeight: 1.75, color: "#334155" }}>{description}</Typography>
  </Paper>
);

const ComparisonRuleScene = ({ content }: { content: SceneContent }) => {
  const examples = Array.isArray(content.examples) ? content.examples as RuleExampleData[] : [];
  return (
  <Stack spacing={2.25}>
    <Typography component="h2" sx={{ fontSize: { xs: 18, sm: 20 }, fontWeight: 950 }}>比較と交換のルール</Typography>
    <Typography sx={{ lineHeight: 1.8, color: "#334155" }}>
      {typeof content.explanation === "string" ? content.explanation : ""}
    </Typography>
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 2 }}>
      {examples.map((example) => <RuleExample key={example.title} {...example} />)}
    </Box>
    <Paper elevation={0} sx={{ p: 2, bgcolor: "#eff6ff", border: "1px solid #93c5fd", borderRadius: 2.5, textAlign: "center" }}>
      <Typography fontWeight={950} color="#1d4ed8" sx={{ fontSize: { xs: 18, sm: 22 } }}>{typeof content.rule === "string" ? content.rule : ""}</Typography>
    </Paper>
  </Stack>
  );
};

const PythonComparisonScene = ({ values, content }: { values: number[]; content: SceneContent }) => (
  <Stack spacing={2}>
    <FocusedArray values={values} label="numbers[0] と numbers[1] を比較" />
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1.35fr) minmax(260px, .65fr)" }, gap: 2 }}>
      <Stack spacing={1}>
        <Typography fontWeight={950}>Pythonで表すと</Typography>
        <CodeBlock code={`numbers = [${values.join(", ")}]\n\n${String(content.comparisonCode ?? "")}`} activeLines={[3]} />
      </Stack>
      <Paper elevation={0} sx={{ p: 2, borderRadius: 2.5, border: "1px solid #bfdbfe", bgcolor: "#f8fbff" }}>
        <Stack direction="row" spacing={1} alignItems="flex-start">
          <LightbulbIcon color="primary" />
          <Box>
            <Typography fontWeight={950}>左の値が右の値より大きいとき、条件はTrueになります。</Typography>
            <Typography sx={{ mt: 1.5, lineHeight: 1.8 }}>{typeof content.explanation === "string" ? content.explanation : ""}</Typography>
          </Box>
        </Stack>
      </Paper>
    </Box>
  </Stack>
);

const PythonSwapScene = ({ values, content }: { values: number[]; content: SceneContent }) => {
  const swapped = numberList(content.resultValues, [values[1], values[0], ...values.slice(2)]);
  return (
    <Stack spacing={2}>
      <Typography component="h2" sx={{ fontSize: { xs: 18, sm: 20 }, fontWeight: 950 }}>2つの値を1行で入れ替える</Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 2, alignItems: "center" }}>
        <Stack spacing={1.5}>
          <FocusedArray values={values} label="交換前" />
          <CodeBlock code={typeof content.swapCode === "string" ? content.swapCode : ""} activeLines={[1]} />
          <Typography sx={{ lineHeight: 1.8 }}>右側の値を先に読み取り、反対側の位置へまとめて代入します。</Typography>
        </Stack>
        <Paper elevation={0} sx={{ p: 2, border: "1px solid #bfdbfe", borderRadius: 2.5, bgcolor: "#fff" }}>
          <Stack spacing={1.25} alignItems="center">
            <Chip label="交換前" color="primary" variant="outlined" />
            <ArrayCards values={values} compareIndices={[0, 1]} compact />
            <ArrowDownwardIcon color="primary" />
            <Chip label="交換後" color="success" variant="outlined" />
            <ArrayCards values={swapped} confirmedIndices={[0, 1]} compact />
          </Stack>
        </Paper>
      </Box>
      <Paper elevation={0} sx={{ p: 1.75, bgcolor: "#eff6ff", borderRadius: 2, border: "1px solid #bfdbfe" }}>
        <Typography fontWeight={900}>左右の値を逆の位置へ代入することで、2つの値を交換できます。</Typography>
      </Paper>
      <Typography color="#64748b" fontSize={14}>補足：他の言語では一時変数を使う場合がありますが、Pythonでは同時代入で簡潔に書けます。</Typography>
    </Stack>
  );
};

const ExerciseFocusScene = ({ values, mode }: { values: number[]; mode: "condition" | "swap" | "build" | "decision" }) => (
  <Stack spacing={2}>
    <FocusedArray values={values} label={mode === "decision" ? "左と右を比べよう" : "今回比較する位置"} />
    {mode === "condition" && <CodeBlock code={'if numbers[0] ＿＿ numbers[1]:\n    # 交換する'} activeLines={[1]} />}
    {mode === "swap" && <CodeBlock code="numbers[0], numbers[1] = ＿＿＿＿＿＿＿＿" activeLines={[1]} />}
    {mode === "build" && (
      <Paper elevation={0} sx={{ p: 1.75, borderRadius: 2, bgcolor: "#eff6ff", border: "1px solid #bfdbfe" }}>
        <Stack direction="row" spacing={1} alignItems="center"><SwapHorizIcon color="primary" /><Typography fontWeight={900}>まず比較し、条件が成立した場合だけ2つの値を交換します。</Typography></Stack>
      </Paper>
    )}
  </Stack>
);

export const MissionTwoScene = ({
  rendererKey,
  content,
}: {
  rendererKey: string;
  content: SceneContent;
}) => {
  const values = numberList(content.values ?? content.algorithmValues);

  if (rendererKey === "COMPARISON_RULE") return <ComparisonRuleScene content={content} />;
  if (rendererKey === "PYTHON_COMPARISON") return <PythonComparisonScene values={values} content={content} />;
  if (rendererKey === "PYTHON_SWAP") return <PythonSwapScene values={values} content={content} />;
  if (rendererKey === "CONDITION_FILL") return <ExerciseFocusScene values={values} mode="condition" />;
  if (rendererKey === "SWAP_FILL") return <ExerciseFocusScene values={values} mode="swap" />;
  if (rendererKey === "IF_SWAP_BUILD") return <ExerciseFocusScene values={values} mode="build" />;

  throw new Error(`Unsupported Mission 2 renderer: ${rendererKey}`);
};
