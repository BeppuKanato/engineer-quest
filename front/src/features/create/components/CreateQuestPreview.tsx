import { Box, Chip, Paper, Stack, Typography } from "@mui/material";

import type { CreateQuest, RequirementResult } from "@/api/create.api";

const firstPassedActual = (results: RequirementResult[]) =>
  results.flatMap((result) => result.testResults).find((test) => test.passed && test.actual !== undefined)?.actual;

export function CreateQuestPreview({ quest, results }: { quest: CreateQuest; results: RequirementResult[] }) {
  const data = quest.previewData;
  const actual = firstPassedActual(results);

  if (data.kind === "SORT") {
    const tested = results.flatMap((item) => item.testResults).find((item) => item.id === "mixed-party")?.actual;
    const characters = Array.isArray(tested) ? tested : data.characters ?? [];
    return <PreviewShell title={data.previewTitle ?? "戦闘プレビュー"} description={data.previewDescription ?? "テスト後は実行結果の行動順を表示します。"}>
      <Stack spacing={0.8}>{characters.map((character, index) => <Stack key={`${character.id}-${index}`} direction="row" justifyContent="space-between" sx={{ p: 1, borderRadius: 1.5, bgcolor: index === 0 ? "#dbeafe" : "#f8fafc" }}><Typography fontWeight={900}>{index + 1}. {character.name}</Typography><Typography fontWeight={900}>SPD {character.speed}</Typography></Stack>)}</Stack>
    </PreviewShell>;
  }

  if (data.kind === "ROUTE") {
    const route = Array.isArray(actual) ? actual.map(String) : [];
    return <PreviewShell title={data.previewTitle ?? "ダンジョンマップ"} description={data.previewDescription ?? "部屋のつながりを確認できます。"}>
      <Stack direction="row" flexWrap="wrap" gap={0.7}>{Object.entries(data.passages ?? {}).map(([room, next]) => <Chip key={room} label={`${room} → ${(next as string[]).join(", ") || "行き止まり"}`} color={room === data.start ? "primary" : room === data.goal ? "success" : "default"} />)}</Stack>
      {route.length > 0 && <Box sx={{ mt: 1.5, p: 1.2, bgcolor: "#ecfdf5", borderRadius: 1.5 }}><Typography fontSize={12} fontWeight={900}>テストで見つけた経路</Typography><Typography fontWeight={950}>{route.join(" → ")}</Typography></Box>}
    </PreviewShell>;
  }

  if (data.kind === "TEXT_SEARCH") {
    const position = typeof actual === "number" ? actual : null;
    return <PreviewShell title={data.previewTitle ?? "メッセージ確認"} description={data.previewDescription ?? "本文と検索語を確認できます。"}>
      <Typography component="div" sx={{ p: 1.3, bgcolor: "#f8fafc", borderRadius: 1.5, lineHeight: 1.8, wordBreak: "break-all" }}>{data.text}</Typography>
      <Stack direction="row" spacing={1} sx={{ mt: 1.2 }}><Chip label={`検索語：${data.keyword}`} color="primary" /><Chip label={position == null ? "位置：テスト後に表示" : `位置：${position}`} color={position == null ? "default" : "success"} /></Stack>
    </PreviewShell>;
  }

  if (data.kind === "PRODUCT_SEARCH") {
    return <PreviewShell title={data.previewTitle ?? "商品番号検索"} description={data.previewDescription ?? "番号順の商品一覧を確認できます。"}>
      <Stack spacing={0.7}>{(data.products ?? []).map((product) => <Stack key={product.id} direction="row" justifyContent="space-between" sx={{ p: 1, bgcolor: product.id === data.targetId ? "#dbeafe" : "#f8fafc", borderRadius: 1.5 }}><Typography fontWeight={900}>#{product.id} {product.name}</Typography><Typography>在庫 {product.stock}</Typography></Stack>)}</Stack>
      <Chip sx={{ mt: 1.2 }} label={`探す番号：${data.targetId}`} color="primary" />
    </PreviewShell>;
  }

  const found = Array.isArray(actual) ? actual.map(String) : [];
  return <PreviewShell title={data.previewTitle ?? "データプレビュー"} description={data.previewDescription ?? "テスト対象のデータを確認できます。"}>
    <Stack spacing={0.7}>{Object.entries(data.graph ?? {}).map(([skill, next]) => <Box key={skill} sx={{ p: 1, bgcolor: skill === data.start ? "#dbeafe" : "#f8fafc", borderRadius: 1.5 }}><Typography fontWeight={900}>{skill}</Typography><Typography fontSize={12} color="text.secondary">派生：{(next as string[]).join("、") || "なし"}</Typography></Box>)}</Stack>
    {found.length > 0 && <Typography sx={{ mt: 1.2 }} fontSize={13} fontWeight={900}>テストで見つけたもの：{found.join("、")}</Typography>}
  </PreviewShell>;
}

function PreviewShell({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <Paper elevation={0} sx={{ p: 2, border: "1px solid #dbe3ef", borderRadius: 2 }}>
    <Typography fontWeight={950}>{title}</Typography>
    <Typography fontSize={13} color="text.secondary" sx={{ mt: 0.5, mb: 1.5 }}>{description}</Typography>
    {children}
  </Paper>;
}
