"use client";

import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CodeIcon from "@mui/icons-material/Code";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { Alert, Box, Button, Chip, Container, LinearProgress, Paper, Skeleton, Stack, Typography } from "@mui/material";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";
import { useEffect, useState } from "react";

import { getCreateQuests, type CreateQuest } from "@/api/create.api";
import { AppHeader } from "@/app/component/appHeader";
import { CreateBreadcrumbs } from "@/app/create/_components/createBreadcrumbs";
import { CreateThumbnail } from "@/app/create/_components/createThumbnail";
import { createQuestProblemLabel } from "@/app/create/_components/createQuestPresentation";
import { auth } from "@/lib/firebase";

const QuestCard = ({ quest }: { quest: CreateQuest }) => {
  const progress = quest.attempt ? Math.round((quest.attempt.bestScore / quest.maxScore) * 100) : 0;
  return (
    <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: "1px solid #dbe3ef", bgcolor: "#fff", display: "flex", flexDirection: "column", gap: 1.5 }}>
      <CreateThumbnail src={quest.thumbnailUrl} alt={`${quest.title}の完成イメージ`} height={190} />
      <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap>
        <Chip icon={<CodeIcon />} label="Python" size="small" color="primary" variant="outlined" />
        <Chip label={createQuestProblemLabel(quest.problemType)} size="small" />
        {quest.attempt?.status === "COMPLETED" && <Chip icon={<CheckCircleIcon />} label="クリア済み" size="small" color="success" />}
      </Stack>
      <Box sx={{ flex: 1 }}>
        <Typography variant="h5" fontWeight={950}>{quest.title}</Typography>
        <Typography color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.7 }}>{quest.description}</Typography>
      </Box>
      <Stack spacing={0.7}>
        <Stack direction="row" justifyContent="space-between">
          <Typography fontSize={13} fontWeight={900}>自己ベスト</Typography>
          <Typography fontSize={13} fontWeight={950}>{quest.attempt?.bestScore ?? 0} / {quest.maxScore}点</Typography>
        </Stack>
        <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 99 }} />
      </Stack>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Stack direction="row" spacing={0.5} alignItems="center" color="text.secondary"><AccessTimeIcon fontSize="small" /><Typography variant="body2">約{quest.estimatedMinutes}分</Typography></Stack>
        <Typography variant="body2" color="text.secondary">基本 {quest.basicScore}点 / 最大 {quest.maxScore}点</Typography>
      </Stack>
      <Button component={Link} href={`/create/quests/${encodeURIComponent(quest.id)}`} variant="contained" startIcon={<PlayArrowIcon />} sx={{ minHeight: 48, fontWeight: 950 }}>
        {quest.attempt ? "続きから作る" : "要件を見て始める"}
      </Button>
    </Paper>
  );
};

export default function CreatePage() {
  const [quests, setQuests] = useState<CreateQuest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => onAuthStateChanged(auth, async (user) => {
    if (!user) { setError("ログインが必要です。"); setLoading(false); return; }
    try { setQuests(await getCreateQuests(await user.getIdToken())); }
    catch (cause) { console.error(cause); setError("作る課題を取得できませんでした。"); }
    finally { setLoading(false); }
  }), []);

  return <Box sx={{ minHeight: "100vh", bgcolor: "#f3f7fc" }}>
    <AppHeader />
    <Container maxWidth={false} sx={{ maxWidth: 1180, py: 4 }}>
      <Stack spacing={3}>
        <CreateBreadcrumbs items={[{ label: "作る" }]} />
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
          <Box><Typography variant="h3" fontWeight={950}>作る</Typography><Typography color="text.secondary" sx={{ mt: 1 }}>Pythonで機能を完成させ、達成した要件の分だけ得点を伸ばします。</Typography></Box>
          <Button component={Link} href="/my-works" variant="outlined" sx={{ alignSelf: { md: "center" }, fontWeight: 900 }}>挑戦中・提出済み</Button>
        </Stack>
        <Alert severity="info">すべての要件は最初から確認できます。基本要件を満たすとクリアになり、追加要件は好きな順番で挑戦できます。関連コースは未修了でも課題を始められます。</Alert>
        {error && <Alert severity="error">{error}</Alert>}
        {loading ? <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 2 }}>{[0,1,2].map((item) => <Skeleton key={item} variant="rounded" height={470} />)}</Box> :
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 2 }}>{quests.map((quest) => <QuestCard key={quest.id} quest={quest} />)}</Box>}
      </Stack>
    </Container>
  </Box>;
}
