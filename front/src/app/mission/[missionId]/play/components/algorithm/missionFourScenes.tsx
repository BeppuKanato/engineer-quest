"use client";

import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { Box, Chip, Paper, Stack, Typography } from "@mui/material";

import { ArrayCards, CodeBlock } from "./primitives";

type SceneContent = Record<string, unknown>;
type PassState = { label?: string; values?: number[]; message?: string; confirmedIndices?: number[] };
type SequenceQuestion = { currentPair?: [number, number]; afterMessage?: string };
type PassMapping = { label?: string; i?: number };
type LoopMapping = { i?: number; js?: number[] };
type CodeRole = {
  id?: string;
  label?: string;
  code?: string;
  role?: string;
  tone?: "blue" | "green" | "amber" | "purple";
};

const roleTone = {
  blue: { border: "#93c5fd", bg: "#eff6ff", text: "#1d4ed8" },
  green: { border: "#86efac", bg: "#f0fdf4", text: "#166534" },
  amber: { border: "#fcd34d", bg: "#fffbeb", text: "#b45309" },
  purple: { border: "#c4b5fd", bg: "#f5f3ff", text: "#6d28d9" },
} as const;

const numberList = (value: unknown, fallback = [5, 2, 4, 1]) =>
  Array.isArray(value) && value.every((item) => typeof item === "number") ? value as number[] : fallback;

const answerInfo = (answer: unknown) => {
  if (!answer || typeof answer !== "object" || Array.isArray(answer)) return { values: [] as string[], step: 0 };
  const record = answer as { values?: unknown; currentStep?: unknown };
  const values = Array.isArray(record.values)
    ? record.values.filter((item): item is string => typeof item === "string" && item.length > 0)
    : [];
  return { values, step: typeof record.currentStep === "number" ? record.currentStep : values.length };
};

const OnePassIncompleteScene = ({ content }: { content: SceneContent }) => {
  const before = numberList(content.beforeValues);
  const after = numberList(content.afterValues, [2, 4, 1, 5]);
  const unsorted = numberList(content.unsortedIndices, [1, 2]);
  const confirmed = numberList(content.confirmedIndices, [3]);
  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="center" justifyContent="center">
        <Stack alignItems="center" spacing={1}>
          <Chip label="はじめの配列" variant="outlined" sx={{ fontWeight: 900 }} />
          <ArrayCards values={before} />
        </Stack>
        <ArrowDownwardIcon color="primary" sx={{ transform: { md: "rotate(-90deg)" }, fontSize: 34 }} />
        <Stack alignItems="center" spacing={1}>
          <Chip label="一周後" color="success" variant="outlined" sx={{ fontWeight: 900 }} />
          <ArrayCards values={after} swappedIndices={unsorted.length >= 2 ? [unsorted[0], unsorted[1]] : undefined} confirmedIndices={confirmed} />
        </Stack>
      </Stack>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 1.5 }}>
        <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, border: "1px solid #86efac", bgcolor: "#f0fdf4" }}>
          <Typography color="#166534" fontWeight={950}>最も大きい5は右端へ移動しました。</Typography>
        </Paper>
        <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, border: "1px solid #fed7aa", bgcolor: "#fff7ed" }}>
          <Typography color="#9a3412" fontWeight={950}>4と1はまだ昇順になっていません。</Typography>
        </Paper>
      </Box>
      <Typography textAlign="center" fontWeight={950} color="#c2410c">一周だけでは、配列全体の並べ替えは終わりません。</Typography>
    </Stack>
  );
};

const SecondPassSequenceScene = ({ content, answer, isCorrect }: { content: SceneContent; answer: unknown; isCorrect: boolean }) => {
  const questions = Array.isArray(content.sequenceQuestions) ? content.sequenceQuestions as SequenceQuestion[] : [];
  const states = Array.isArray(content.sequenceStates) ? content.sequenceStates.map((state) => numberList(state, [2, 4, 1, 5])) : [];
  const info = answerInfo(answer);
  const currentIndex = Math.min(info.step, Math.max(questions.length - 1, 0));
  const values = isCorrect ? numberList(content.finalValues, [2, 1, 4, 5]) : states[currentIndex] ?? numberList(content.values, [2, 4, 1, 5]);
  const pair: [number, number] = questions[currentIndex]?.currentPair ?? [0, 1];
  return (
    <Stack spacing={1.5} alignItems="center">
      <Stack direction="row" gap={1} flexWrap="wrap" justifyContent="center">
        <Chip color="primary" label="二周目（i = 1）" sx={{ fontWeight: 950 }} />
        <Chip label={`ステップ ${currentIndex + 1} / ${questions.length || 3}`} variant="outlined" sx={{ fontWeight: 900 }} />
        <Chip label={`j = ${currentIndex}`} variant="outlined" sx={{ fontWeight: 900 }} />
      </Stack>
      <ArrayCards values={values} compareIndices={isCorrect ? undefined : pair} confirmedIndices={isCorrect ? [2, 3] : [3]} />
      {!isCorrect && (
        <Typography color="#475569" fontWeight={900}>
          回答済み {info.values.filter(Boolean).length} / {questions.length} ステップ。青い枠の2つについて下で判断してください。
        </Typography>
      )}
      {isCorrect && <Typography color="#166534" fontWeight={950}>二周目の結果は[2, 1, 4, 5]です。2と1には、もう一周必要です。</Typography>}
    </Stack>
  );
};

const ILoopMappingScene = ({ content }: { content: SceneContent }) => {
  const mappings = Array.isArray(content.passMappings) ? content.passMappings as PassMapping[] : [];
  return (
    <Stack spacing={2}>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "minmax(0, .8fr) minmax(0, 1.2fr)" }, gap: 2 }}>
        <Stack spacing={1}>
          <Typography fontWeight={950}>周回を制御するコード</Typography>
          <CodeBlock code={typeof content.loopCode === "string" ? content.loopCode : "for i in range(n - 1):"} activeLines={[1]} />
          <Typography color="#475569">iを0からn - 2まで増やしながら、一周分の処理を繰り返します。</Typography>
        </Stack>
        <Paper elevation={0} sx={{ p: 1.5, border: "1px solid #bfdbfe", borderRadius: 2.5 }}>
          <Typography color="primary" fontWeight={950}>周回とiの対応</Typography>
          <Stack spacing={1} sx={{ mt: 1.25 }}>
            {mappings.map((mapping, index) => <Stack key={index} direction="row" justifyContent="space-between" sx={{ p: 1, borderBottom: "1px solid #e2e8f0" }}><Typography fontWeight={850}>{mapping.label}</Typography><Typography component="code" color="primary" fontWeight={950}>i = {mapping.i ?? index}</Typography></Stack>)}
          </Stack>
        </Paper>
      </Box>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 1.5 }}>
        <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, bgcolor: "#eff6ff", border: "1px solid #bfdbfe" }}><Typography fontWeight={950} color="#1d4ed8">i：何周目かを表す</Typography><Typography sx={{ mt: .5 }}>一周分の処理を何回実行したか管理します。</Typography></Paper>
        <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, bgcolor: "#f0fdf4", border: "1px solid #bbf7d0" }}><Typography fontWeight={950} color="#166534">j：周回内の比較位置</Typography><Typography sx={{ mt: .5 }}>その周回で、どの隣接ペアを見ているか管理します。</Typography></Paper>
      </Box>
      <Typography fontWeight={950} color="#b45309">{typeof content.emphasis === "string" ? content.emphasis : "要素数がnなら最大n - 1周します。"}</Typography>
    </Stack>
  );
};

const NestedLoopStructureScene = ({ content }: { content: SceneContent }) => {
  const mappings = Array.isArray(content.loopMappings) ? content.loopMappings as LoopMapping[] : [];
  const codeRoles = Array.isArray(content.codeRoles) ? content.codeRoles as CodeRole[] : [];
  return (
    <Stack spacing={2}>
      <Typography fontWeight={950}>コードの各行と役割の対応</Typography>
      <Stack spacing={1}>
        {codeRoles.map((item, index) => {
          const colors = roleTone[item.tone ?? "blue"];
          return (
            <Paper key={item.id ?? index} elevation={0} sx={{ p: 1.5, border: `1px solid ${colors.border}`, borderRadius: 2.5, bgcolor: colors.bg }}>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) auto minmax(240px, .8fr)" }, gap: 1.5, alignItems: "center" }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                  <Chip label={index + 1} sx={{ bgcolor: colors.text, color: "#fff", fontWeight: 950 }} />
                  <Typography component="code" sx={{ minWidth: 0, fontFamily: "ui-monospace, monospace", fontWeight: 900, overflowWrap: "anywhere" }}>{item.code}</Typography>
                </Stack>
                <ArrowForwardIcon sx={{ color: colors.text, transform: { xs: "rotate(90deg)", md: "none" }, justifySelf: "center" }} />
                <Box>
                  <Typography fontWeight={950} color={colors.text}>{item.label}</Typography>
                  <Typography fontWeight={750} color="#334155">{item.role}</Typography>
                </Box>
              </Box>
            </Paper>
          );
        })}
      </Stack>
      <Typography color="primary" fontWeight={950}>周回（i）ごとに、内側のjがどう動くか</Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 1 }}>
        {mappings.map((mapping, index) => <Paper key={index} elevation={0} sx={{ p: 1.25, border: "1px solid #bfdbfe", borderRadius: 2 }}><Typography color="primary" fontWeight={950}>i = {mapping.i ?? index}</Typography><Stack direction="row" spacing={.5} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>{(mapping.js ?? []).map((j) => <Chip key={j} size="small" label={`j=${j}`} />)}</Stack></Paper>)}
      </Box>
      <Paper elevation={0} sx={{ p: 1.5, border: "1px solid #fed7aa", bgcolor: "#fff7ed", borderRadius: 2 }}><Typography color="#9a3412" fontWeight={900}>{typeof content.warning === "string" ? content.warning : "現在は毎周同じ範囲を比較します。"}</Typography></Paper>
    </Stack>
  );
};

const MultiPassBuildScene = ({ content }: { content: SceneContent }) => (
  <Stack spacing={1.5}>
    <Typography fontWeight={950}>コードの土台</Typography>
    <CodeBlock code={typeof content.codePreviewPrefix === "string" ? content.codePreviewPrefix : "numbers = [5, 2, 4, 1]\nn = len(numbers)"} activeLines={[1, 2]} />
    <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="center" justifyContent="center">
      {[
        "周回を繰り返す",
        "比較位置を動かす",
        "交換条件",
        "交換処理",
      ].map((label, index) => <Stack key={label} direction="row" spacing={1} alignItems="center"><Chip label={label} color={index === 0 ? "primary" : "default"} sx={{ fontWeight: 900 }} />{index < 3 && <ArrowForwardIcon color="primary" sx={{ transform: { xs: "rotate(90deg)", sm: "none" } }} />}</Stack>)}
    </Stack>
  </Stack>
);

const MultiPassResultScene = ({ content, isCorrect }: { content: SceneContent; isCorrect: boolean }) => {
  const values = numberList(content.values, [6, 3, 5, 2]);
  const states = Array.isArray(content.passStates) ? content.passStates as PassState[] : [];
  return (
    <Stack spacing={2}>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "minmax(230px, .6fr) minmax(0, 1.4fr)" }, gap: 2, alignItems: "center" }}>
        <Stack alignItems="center"><Typography fontWeight={950}>開始前</Typography><ArrayCards values={values} /></Stack>
        <CodeBlock code={typeof content.code === "string" ? content.code : "for i in range(n - 1):"} activeLines={[3, 4, 5, 6]} />
      </Box>
      {isCorrect && (
        <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2.5, border: "1px solid #86efac", bgcolor: "#f0fdf4" }}>
          <Typography color="#166534" fontWeight={950}>すべての周回の結果</Typography>
          <Stack direction="row" gap={1} flexWrap="wrap" alignItems="center" sx={{ mt: 1 }}>
            {states.map((state, index) => <Stack key={index} direction="row" alignItems="center" spacing={1}><Stack alignItems="center"><Typography fontSize={12} fontWeight={900}>{state.label}</Typography><ArrayCards values={numberList(state.values, values)} confirmedIndices={index === states.length - 1 ? values.map((_, valueIndex) => valueIndex) : []} compact /></Stack>{index < states.length - 1 && <ArrowForwardIcon color="primary" />}</Stack>)}
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1.5 }}><CheckCircleIcon color="success" /><Typography fontWeight={900}>一周分の処理を繰り返し、すべての値が昇順に並びました。</Typography></Stack>
          <Typography sx={{ mt: 1, color: "#9a3412", fontWeight: 850 }}>現在のコードは整列済みの右側も毎周比較します。次のMissionで比較範囲を短くします。</Typography>
        </Paper>
      )}
    </Stack>
  );
};

export const MissionFourScene = ({ rendererKey, content, answer, isCorrect }: { rendererKey: string; content: SceneContent; answer?: unknown; isCorrect?: boolean }) => {
  if (rendererKey === "ONE_PASS_INCOMPLETE") return <OnePassIncompleteScene content={content} />;
  if (rendererKey === "SECOND_PASS_SEQUENCE") return <SecondPassSequenceScene content={content} answer={answer} isCorrect={isCorrect === true} />;
  if (rendererKey === "I_LOOP_MAPPING") return <ILoopMappingScene content={content} />;
  if (rendererKey === "NESTED_LOOP_STRUCTURE") return <NestedLoopStructureScene content={content} />;
  if (rendererKey === "MULTI_PASS_BUILD") return <MultiPassBuildScene content={content} />;
  if (rendererKey === "MULTI_PASS_RESULT") return <MultiPassResultScene content={content} isCorrect={isCorrect === true} />;
  throw new Error(`Unsupported Mission 4 renderer: ${rendererKey}`);
};
