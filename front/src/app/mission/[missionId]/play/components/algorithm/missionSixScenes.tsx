"use client";

import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CodeIcon from "@mui/icons-material/Code";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import LoopIcon from "@mui/icons-material/Loop";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import { Box, Chip, Paper, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";

import { ArrayCards, CodeBlock } from "./primitives";

type SceneContent = Record<string, unknown>;
type Process = { code?: string; role?: string };

const stringList = (value: unknown) =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

const numberList = (value: unknown, fallback: number[]) =>
  Array.isArray(value) && value.every((item) => typeof item === "number") ? value as number[] : fallback;

const Notice = ({ children, success = false }: { children: ReactNode; success?: boolean }) => (
  <Paper
    elevation={0}
    sx={{
      p: 1.5,
      borderRadius: 2.5,
      border: `1px solid ${success ? "#86efac" : "#bfdbfe"}`,
      bgcolor: success ? "#f0fdf4" : "#eff6ff",
    }}
  >
    <Stack direction="row" spacing={1} alignItems="center">
      {success ? <CheckCircleIcon sx={{ color: "#16a34a" }} /> : <CodeIcon sx={{ color: "#2563eb" }} />}
      <Typography fontWeight={900} color={success ? "#166534" : "#1e3a8a"}>{children}</Typography>
    </Stack>
  </Paper>
);

const CompleteProcessReview = ({ content }: { content: SceneContent }) => {
  const processes = Array.isArray(content.processes) ? content.processes as Process[] : [];
  const flow = stringList(content.flow);
  return (
    <Stack spacing={2.5}>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" }, gap: 1.5 }}>
        {processes.map((process, index) => (
          <Paper key={index} elevation={0} sx={{ p: 1.75, borderRadius: 2.5, border: "1px solid #bfdbfe", bgcolor: "#fff" }}>
            <Stack direction="row" spacing={1.25} alignItems="flex-start">
              <Chip label={index + 1} color="primary" sx={{ fontWeight: 950 }} />
              <Stack spacing={1} sx={{ minWidth: 0 }}>
                <Typography component="code" sx={{ fontFamily: "ui-monospace, monospace", fontWeight: 900, color: "#1d4ed8", overflowWrap: "anywhere" }}>
                  {process.code}
                </Typography>
                <Typography fontWeight={800} color="#334155">{process.role}</Typography>
              </Stack>
            </Stack>
          </Paper>
        ))}
      </Box>
      <Box sx={{ overflowX: "auto", pb: 0.5 }}>
        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ minWidth: "max-content" }}>
          {flow.map((label, index) => (
            <Stack key={label} direction="row" spacing={0.75} alignItems="center">
              <Paper elevation={0} sx={{ px: 1.5, py: 1.25, border: "1px solid #93c5fd", borderRadius: 2, bgcolor: "#fff", fontWeight: 900 }}>
                {label}
              </Paper>
              {index < flow.length - 1 && <ArrowForwardIcon color="primary" />}
            </Stack>
          ))}
        </Stack>
      </Box>
      <Notice>{typeof content.emphasis === "string" ? content.emphasis : "4つの処理を組み合わせて完成させます。"}</Notice>
    </Stack>
  );
};

const LoopRoleReview = ({ content, isCorrect }: { content: SceneContent; isCorrect: boolean }) => (
  <Stack spacing={2}>
    <CodeBlock code={typeof content.code === "string" ? content.code : ""} activeLines={[1, 2]} />
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5 }}>
      <Paper elevation={0} sx={{ p: 1.75, borderRadius: 2.5, border: "2px solid #2563eb", bgcolor: "#eff6ff" }}>
        <Stack direction="row" spacing={1.25} alignItems="center">
          <Chip label="i" color="primary" sx={{ fontSize: 20, fontWeight: 950 }} />
          <Stack><Typography fontWeight={950}>外側のループ</Typography><Typography color="#475569" fontWeight={800}>何周目の処理かを管理する</Typography></Stack>
        </Stack>
      </Paper>
      <Paper elevation={0} sx={{ p: 1.75, borderRadius: 2.5, border: "2px solid #16a34a", bgcolor: "#f0fdf4" }}>
        <Stack direction="row" spacing={1.25} alignItems="center">
          <Chip label="j" color="success" sx={{ fontSize: 20, fontWeight: 950 }} />
          <Stack><Typography fontWeight={950}>内側のループ</Typography><Typography color="#475569" fontWeight={800}>その周回で比較する位置を管理する</Typography></Stack>
        </Stack>
      </Paper>
    </Box>
    {isCorrect && <Notice success>iとjは、別々の繰り返しを担当しています。</Notice>}
  </Stack>
);

const ExecutionOrder = ({ content }: { content: SceneContent }) => (
  <Stack spacing={2}>
    <CodeBlock code={typeof content.code === "string" ? content.code : ""} activeLines={[4, 5, 6, 7]} />
    <Stack direction="row" gap={1} flexWrap="wrap" useFlexGap>
      {["① 周回", "② 比較", "③ 必要なら交換", "④ 右へ移動", "⑤ 次の周回"].map((label) => (
        <Chip key={label} label={label} variant="outlined" color="primary" sx={{ fontWeight: 900 }} />
      ))}
    </Stack>
  </Stack>
);

const MissingCondition = ({ content, isCorrect }: { content: SceneContent; isCorrect: boolean }) => (
  <Stack spacing={2}>
    <Stack direction="row" spacing={1} alignItems="center">
      {isCorrect ? <CheckCircleIcon color="success" /> : <ErrorOutlineIcon color="warning" />}
      <Typography fontWeight={950}>{isCorrect ? "比較条件を追加したコード" : "値の大小を確認せず、毎回交換しているコード"}</Typography>
    </Stack>
    <CodeBlock code={isCorrect && typeof content.correctedCode === "string" ? content.correctedCode : typeof content.code === "string" ? content.code : ""} activeLines={isCorrect ? [6] : [6]} />
    <Notice success={isCorrect}>{isCorrect ? "左の値が右の値より大きい場合だけ交換します。" : "『交換してよいか判断する処理』があるか探してみよう。"}</Notice>
  </Stack>
);

const CodeRepair = ({ content, answer, isCorrect }: { content: SceneContent; answer: unknown; isCorrect: boolean }) => {
  const record = answer && typeof answer === "object" && !Array.isArray(answer) ? answer as { values?: Record<string, string> } : {};
  const values = record.values ?? {};
  return (
    <Stack spacing={2}>
      <CodeBlock code={isCorrect && typeof content.correctedCode === "string" ? content.correctedCode : typeof content.code === "string" ? content.code : ""} activeLines={[5, 6]} />
      <Stack direction="row" gap={1} flexWrap="wrap" useFlexGap>
        <Chip label={`比較範囲: ${values.range ?? "range(n)"}`} color={values.range === "range(n - 1 - i)" ? "success" : "warning"} variant="outlined" sx={{ fontWeight: 900 }} />
        <Chip label={`比較演算子: ${values.operator ?? "<"}`} color={values.operator === ">" ? "success" : "warning"} variant="outlined" sx={{ fontWeight: 900 }} />
      </Stack>
      {isCorrect && <Notice success>比較範囲と昇順の条件を、どちらも正しく修正できました。</Notice>}
    </Stack>
  );
};

const CompleteCodeBuild = () => (
  <Stack spacing={2}>
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(4, 1fr)" }, gap: 1.25 }}>
      {[
        { icon: <LoopIcon />, label: "外側の周回", indent: 0 },
        { icon: <ArrowForwardIcon />, label: "比較位置", indent: 1 },
        { icon: <CodeIcon />, label: "比較条件", indent: 2 },
        { icon: <SwapHorizIcon />, label: "交換処理", indent: 3 },
      ].map((item, index) => (
        <Paper key={item.label} elevation={0} sx={{ p: 1.5, border: "1px solid #93c5fd", borderRadius: 2.5, bgcolor: "#fff" }}>
          <Stack direction="row" spacing={1} alignItems="center" color="#1d4ed8">{item.icon}<Typography fontWeight={950}>{index + 1}. {item.label}</Typography></Stack>
          <Typography variant="caption" color="#64748b" fontWeight={800}>インデント {item.indent}段</Typography>
        </Paper>
      ))}
    </Box>
    <Notice>外側から順に入れ子へ配置すると、完成コードの形になります。</Notice>
  </Stack>
);

const CompleteCodeMatch = ({ content, isCorrect }: { content: SceneContent; isCorrect: boolean }) => {
  const initial = numberList(content.initialValues, [6, 3, 5, 2]);
  const result = numberList(content.resultValues, [2, 3, 5, 6]);
  return (
    <Stack spacing={2}>
      <CodeBlock code={typeof content.code === "string" ? content.code : ""} activeLines={[4, 5, 6, 7]} />
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr auto 1fr" }, alignItems: "center", gap: 1.5 }}>
        <Stack alignItems="center" spacing={0.75}><Chip label="実行前" /><ArrayCards values={initial} compact /></Stack>
        <ArrowForwardIcon color="primary" sx={{ justifySelf: "center", transform: { xs: "rotate(90deg)", sm: "none" } }} />
        <Stack alignItems="center" spacing={0.75}><Chip label="実行後" color="success" /><ArrayCards values={result} confirmedIndices={isCorrect ? result.map((_, index) => index) : []} compact /></Stack>
      </Box>
      {isCorrect && <Notice success>Mission 6クリア目前！コードの役割まで説明できました。</Notice>}
    </Stack>
  );
};

export const MissionSixScene = ({ rendererKey, content, answer, isCorrect = false }: { rendererKey: string; content: SceneContent; answer?: unknown; isCorrect?: boolean }) => {
  if (rendererKey === "COMPLETE_PROCESS_REVIEW") return <CompleteProcessReview content={content} />;
  if (rendererKey === "LOOP_ROLE_REVIEW") return <LoopRoleReview content={content} isCorrect={isCorrect} />;
  if (rendererKey === "EXECUTION_ORDER") return <ExecutionOrder content={content} />;
  if (rendererKey === "MISSING_CONDITION") return <MissingCondition content={content} isCorrect={isCorrect} />;
  if (rendererKey === "CODE_REPAIR") return <CodeRepair content={content} answer={answer} isCorrect={isCorrect} />;
  if (rendererKey === "COMPLETE_CODE_BUILD") return <CompleteCodeBuild />;
  if (rendererKey === "COMPLETE_CODE_MATCH") return <CompleteCodeMatch content={content} isCorrect={isCorrect} />;
  throw new Error(`Unsupported Mission 6 renderer: ${rendererKey}`);
};
