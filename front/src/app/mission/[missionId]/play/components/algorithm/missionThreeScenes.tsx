"use client";

import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import { Box, Chip, Paper, Stack, Typography } from "@mui/material";
import { useMemo } from "react";

import { ArrayCards, CodeBlock } from "./primitives";

type SceneContent = Record<string, unknown>;
type Mapping = { j?: number; pair?: [number, number] };
type SequenceQuestion = { currentPair?: [number, number]; afterMessage?: string };

const numberList = (value: unknown, fallback = [6, 3, 5, 2]) =>
  Array.isArray(value) && value.every((item) => typeof item === "number")
    ? value as number[]
    : fallback;

const answerValues = (answer: unknown) => {
  if (!answer || typeof answer !== "object" || Array.isArray(answer)) return [];
  const values = (answer as { values?: unknown }).values;
  return Array.isArray(values) ? values.filter((item): item is string => typeof item === "string" && item.length > 0) : [];
};

const answerStep = (answer: unknown, fallback: number) => {
  if (!answer || typeof answer !== "object" || Array.isArray(answer)) return fallback;
  const currentStep = (answer as { currentStep?: unknown }).currentStep;
  return typeof currentStep === "number" ? currentStep : fallback;
};

const NextPairScene = ({ content, answer }: { content: SceneContent; answer: unknown }) => {
  const values = numberList(content.values);
  const questions = Array.isArray(content.sequenceQuestions) ? content.sequenceQuestions as SequenceQuestion[] : [];
  const answered = answerValues(answer);
  const currentIndex = Math.min(answerStep(answer, answered.length), Math.max(questions.length - 1, 0));
  const pair: [number, number] = questions[currentIndex]?.currentPair ?? [0, 1];
  return (
    <Stack spacing={1.5} alignItems="center">
      <Stack direction="row" gap={1} flexWrap="wrap" justifyContent="center">
        <Chip color="primary" label={`ステップ ${currentIndex + 1} / ${questions.length || 3}`} sx={{ fontWeight: 900 }} />
        <Chip label={`現在：位置${pair[0]} と 位置${pair[1]}`} variant="outlined" sx={{ fontWeight: 900 }} />
      </Stack>
      <ArrayCards values={values} compareIndices={pair} />
      <Typography fontWeight={900}>青い枠の2つを見て、その次の位置を考えよう。</Typography>
      {currentIndex > 0 && questions[currentIndex - 1]?.afterMessage && (
        <Typography color="#166534" fontWeight={850}>{questions[currentIndex - 1].afterMessage}</Typography>
      )}
    </Stack>
  );
};

const JPositionMappingScene = ({ content }: { content: SceneContent }) => {
  const values = numberList(content.values);
  const mappings = Array.isArray(content.mappings) ? content.mappings as Mapping[] : [];
  return (
    <Stack spacing={2}>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 1.5 }}>
        {mappings.map((mapping, index) => {
          const j = typeof mapping.j === "number" ? mapping.j : index;
          const pair = mapping.pair ?? [j, j + 1];
          return (
            <Paper key={j} elevation={0} sx={{ p: 1.5, border: "1px solid #bfdbfe", borderRadius: 2.5, bgcolor: "#fff" }}>
              <Typography textAlign="center" color="primary" fontWeight={950}>j = {j} のとき</Typography>
              <ArrayCards values={values} compareIndices={pair} compact />
              <Typography component="code" sx={{ display: "block", fontFamily: "monospace", textAlign: "center", fontWeight: 850 }}>numbers[{j}] と numbers[{j + 1}]</Typography>
            </Paper>
          );
        })}
      </Box>
      <CodeBlock code={"numbers[j]\nnumbers[j + 1]"} activeLines={[1, 2]} />
      <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, bgcolor: "#eff6ff", border: "1px solid #bfdbfe" }}>
        <Stack direction="row" spacing={1} alignItems="center"><LightbulbIcon color="primary" /><Typography fontWeight={900}>{typeof content.emphasis === "string" ? content.emphasis : "jが1増えると比較位置も右へ1つ移動します。"}</Typography></Stack>
      </Paper>
    </Stack>
  );
};

const JPairChoiceScene = ({ content, isCorrect }: { content: SceneContent; isCorrect: boolean }) => {
  const values = numberList(content.values, [7, 2, 6, 4]);
  const j = typeof content.j === "number" ? content.j : 1;
  return (
    <Stack spacing={2} alignItems="center">
      <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems="stretch" sx={{ width: "100%" }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography fontWeight={950} sx={{ mb: 0.75 }}>このActivityで使う配列と変数</Typography>
          <CodeBlock code={`numbers = [${values.join(", ")}]\nj = ${j}`} activeLines={[2]} wrapLongLines />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography fontWeight={950} sx={{ mb: 0.75 }}>確認する式</Typography>
          <CodeBlock code={typeof content.code === "string" ? content.code : "numbers[j] > numbers[j + 1]"} activeLines={[1]} wrapLongLines />
        </Box>
      </Stack>
      <ArrayCards values={values} compareIndices={isCorrect ? [j, j + 1] : undefined} showIndices />
      {isCorrect ? (
        <Paper elevation={0} sx={{ width: "100%", p: 1.5, border: "1px solid #86efac", bgcolor: "#f0fdf4", borderRadius: 2 }}>
          <Typography color="#166534" fontWeight={950} textAlign="center">
            numbers[{j}]は{values[j]}、numbers[{j + 1}]は{values[j + 1]}です。
          </Typography>
        </Paper>
      ) : (
        <Typography fontWeight={900} color="#475569" textAlign="center">
          jを添字へ置き換え、index表示を手がかりに2つの値を選びましょう。
        </Typography>
      )}
    </Stack>
  );
};

const OnePassLoopScene = ({ content }: { content: SceneContent }) => {
  const values = numberList(content.values);
  const code = typeof content.code === "string" ? content.code : "for j in range(n - 1):";
  return (
    <Stack spacing={2}>
      <Paper elevation={0} sx={{ p: 1.5, border: "1px solid #bfdbfe", borderRadius: 2.5, bgcolor: "#f8fbff" }}>
        <Typography color="primary" fontWeight={950} sx={{ mb: 1 }}>このActivityで使う配列</Typography>
        <CodeBlock code={`numbers = [${values.join(", ")}]\nn = len(numbers)  # nは要素数なので${values.length}`} wrapLongLines />
        <Typography color="#475569" fontWeight={800} sx={{ mt: 1 }}>
          下のfor文に出てくるnumbersはこの配列、nはこの配列に入っている値の個数を表します。
        </Typography>
      </Paper>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "minmax(0, .8fr) minmax(0, 1.2fr)" }, gap: 2 }}>
        <Paper elevation={0} sx={{ p: 2, border: "1px solid #bfdbfe", borderRadius: 2.5 }}>
          <Typography fontWeight={950}>n = len(numbers) = {values.length}</Typography>
          <Typography sx={{ mt: 1 }}>隣り合う組は n - 1 = {values.length - 1} 組です。</Typography>
          <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mt: 1.5 }}>
            {Array.from({ length: values.length - 1 }, (_, j) => <Chip key={j} label={`j = ${j}`} color="primary" variant="outlined" />)}
          </Stack>
        </Paper>
        <Stack spacing={1}>
          {[0, 1, 2].map((j) => <Paper key={j} elevation={0} sx={{ p: 1, border: "1px solid #dbeafe", borderRadius: 2 }}><Typography color="primary" fontWeight={900}>j = {j}</Typography><ArrayCards values={values} compareIndices={[j, j + 1]} compact /></Paper>)}
        </Stack>
      </Box>
      <CodeBlock code={code} activeLines={[1, 2, 3]} />
      <Typography color="#1d4ed8" fontWeight={900}>{typeof content.emphasis === "string" ? content.emphasis : "jは位置2まで動かします。"}</Typography>
    </Stack>
  );
};

const OnePassBuildScene = ({ content }: { content: SceneContent }) => (
  <Stack spacing={1.5}>
    <Typography fontWeight={950}>コードの土台</Typography>
    <CodeBlock code={typeof content.codePreviewPrefix === "string" ? content.codePreviewPrefix : "numbers = [6, 3, 5, 2]\nn = len(numbers)"} activeLines={[1, 2]} />
    <Paper elevation={0} sx={{ p: 1.5, bgcolor: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 2 }}>
      <Typography fontWeight={900}>「位置を動かす → 比べる → 入れ替える」の3段を、下の操作エリアで組み立てよう。</Typography>
    </Paper>
  </Stack>
);

const OnePassResultScene = ({ content, isCorrect }: { content: SceneContent; isCorrect: boolean }) => {
  const values = numberList(content.values);
  const steps = Array.isArray(content.resultSteps) ? content.resultSteps.map((step) => numberList(step, values)) : [];
  return (
    <Stack spacing={2}>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "minmax(240px, .65fr) minmax(0, 1.35fr)" }, gap: 2, alignItems: "center" }}>
        <Stack alignItems="center" spacing={1}><Typography fontWeight={950}>初期配列</Typography><ArrayCards values={values} /></Stack>
        <CodeBlock code={typeof content.code === "string" ? content.code : "for j in range(n - 1):"} activeLines={[1, 2, 3]} />
      </Box>
      {isCorrect && steps.length > 0 && (
        <Paper elevation={0} sx={{ p: 1.5, border: "1px solid #86efac", bgcolor: "#f0fdf4", borderRadius: 2.5 }}>
          <Typography color="#166534" fontWeight={950}>一周分の実行過程</Typography>
          <Stack direction="row" gap={1} flexWrap="wrap" alignItems="center" sx={{ mt: 1 }}>
            {steps.map((step, index) => (
              <Box key={index} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Stack alignItems="center"><Typography fontSize={12} fontWeight={850}>{index === 0 ? "初期" : `j = ${index - 1}`}</Typography><ArrayCards values={step} confirmedIndices={index === steps.length - 1 ? [step.length - 1] : []} compact /></Stack>
                {index < steps.length - 1 && <ArrowForwardIcon color="primary" />}
              </Box>
            ))}
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}><CheckCircleIcon color="success" /><Typography fontWeight={900}>最も大きい6が右端へ移動しました。配列全体はまだ昇順ではありません。</Typography></Stack>
        </Paper>
      )}
    </Stack>
  );
};

export const MissionThreeScene = ({
  rendererKey,
  content,
  answer,
  isCorrect,
}: {
  rendererKey: string;
  content: SceneContent;
  answer?: unknown;
  isCorrect?: boolean;
}) => {
  const scene = useMemo(() => rendererKey, [rendererKey]);

  if (scene === "NEXT_PAIR_SEQUENCE") return <NextPairScene content={content} answer={answer} />;
  if (scene === "J_POSITION_MAPPING") return <JPositionMappingScene content={content} />;
  if (scene === "J_PAIR_CHOICE") return <JPairChoiceScene content={content} isCorrect={isCorrect === true} />;
  if (scene === "ONE_PASS_LOOP") return <OnePassLoopScene content={content} />;
  if (scene === "ONE_PASS_BUILD") return <OnePassBuildScene content={content} />;
  if (scene === "ONE_PASS_RESULT") return <OnePassResultScene content={content} isCorrect={isCorrect === true} />;

  throw new Error(`Unsupported Mission 3 renderer: ${rendererKey}`);
};
