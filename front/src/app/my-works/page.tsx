"use client";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { Alert, Box, Button, Chip, Container, Paper, Skeleton, Stack, Typography } from "@mui/material";
import Link from "next/link";
import { useEffect, useState } from "react";

import { getCreateQuestAttempts, type CreateQuestAttemptListItem } from "@/api/create.api";
import { AppHeader } from "@/app/component/appHeader";
import { CreateBreadcrumbs } from "@/app/create/_components/createBreadcrumbs";
import { CreateThumbnail } from "@/app/create/_components/createThumbnail";
import { fetchClientQuery, peekClientQueryData, queryTags } from "@/lib/clientQueryCache";
import { useUserSession } from "@/app/component/userSession";

export default function MyWorksPage() {
  const { status, token } = useUserSession();
  const [cachedAttempts] = useState(() => peekClientQueryData<CreateQuestAttemptListItem[]>("my-works"));
  const [attempts, setAttempts] = useState<CreateQuestAttemptListItem[]>(cachedAttempts ?? []);
  const [loading, setLoading] = useState(!cachedAttempts);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (status === "loading") return;
    if (status !== "authenticated" || !token) { if (!cachedAttempts) { setError("ログインが必要です。"); setLoading(false); } return; }
    let active = true;
    fetchClientQuery("my-works", () => getCreateQuestAttempts(token), { staleTimeMs: 300_000, tags: [queryTags.works] })
      .then(next => { if (active) { setAttempts(next); setError(null); } })
      .catch(cause => { console.error(cause); if (active && !cachedAttempts) setError("挑戦中の課題を取得できませんでした。"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [status, token, cachedAttempts]);
  return <Box sx={{ minHeight: "100vh", bgcolor: "#f3f7fc" }}><AppHeader /><Container maxWidth={false} sx={{ maxWidth: 1440, pt: { xs: 3, md: 4 } }}><CreateBreadcrumbs items={[{ label: "作る", href: "/create" }, { label: "挑戦中・提出済み" }]} /></Container><Container maxWidth={false} sx={{ maxWidth: 1080, pt: 3, pb: 4 }}><Stack spacing={3}>
    <Box><Typography variant="h3" fontWeight={950}>挑戦中・提出済み</Typography><Typography color="text.secondary" sx={{ mt: 1 }}>保存したコード、自己ベスト、提出状況を確認できます。</Typography></Box>
    {error && <Alert severity="error">{error}</Alert>}
    {loading ? <Skeleton variant="rounded" height={280} /> : attempts.length === 0 ? <Paper elevation={0} sx={{ p: 4, border: "1px solid #dbe3ef", borderRadius: 2 }}><Typography fontWeight={950}>まだ作る課題を始めていません。</Typography><Button component={Link} href="/create" sx={{ mt: 1 }}>課題を探す</Button></Paper> : <Stack spacing={2}>{attempts.map((attempt) => <Paper key={attempt.id} elevation={0} sx={{ p: 2, border: "1px solid #dbe3ef", borderRadius: 2 }}><Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "180px 1fr auto" }, gap: 2, alignItems: "center" }}><CreateThumbnail src={attempt.quest.thumbnailUrl} alt={attempt.quest.title} height={120} /><Box><Stack direction="row" spacing={1} alignItems="center"><Typography variant="h5" fontWeight={950}>{attempt.quest.title}</Typography>{attempt.status === "COMPLETED" && <Chip icon={<CheckCircleIcon />} label="クリア済み" color="success" size="small" />}</Stack><Typography color="text.secondary" sx={{ mt: 0.5 }}>{attempt.quest.description}</Typography><Typography fontWeight={900} sx={{ mt: 1 }}>自己ベスト {attempt.bestScore}点</Typography></Box><Button component={Link} href={`/create/quests/${encodeURIComponent(attempt.questId)}/work`} variant="contained" startIcon={<PlayArrowIcon />} sx={{ fontWeight: 950 }}>続きを開く</Button></Box></Paper>)}</Stack>}
  </Stack></Container></Box>;
}
