"use client";

import { FeedbackDestination } from "@/app/component/feedbackV1";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import { Alert, Box, Button, Chip, Container, Paper, Skeleton, Stack, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getCollection, type CollectionResponse } from "@/api/collection.api";
import { AppBreadcrumbs } from "@/app/component/appBreadcrumbs";
import { AppHeader } from "@/app/component/appHeader";
import { fetchClientQuery, peekClientQueryData, queryTags } from "@/lib/clientQueryCache";
import { useUserSession } from "@/app/component/userSession";

export default function CollectionPage() {
  const router = useRouter();
  const { status, token } = useUserSession();
  const [cachedCollection] = useState(() => peekClientQueryData<CollectionResponse>("collection"));
  const [data, setData] = useState<CollectionResponse | null>(cachedCollection ?? null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (status === "loading") return;
    if (status !== "authenticated" || !token) { if (!cachedCollection) setError("ログインが必要です。"); return; }
    let active = true;
    fetchClientQuery("collection", () => getCollection(token), { staleTimeMs: 300_000, tags: [queryTags.collection] })
      .then(next => { if (active) { setData(next); setError(null); } })
      .catch(() => { if (active && !cachedCollection) setError("コレクションを取得できませんでした。"); });
    return () => { active = false; };
  }, [status, token, cachedCollection]);
  const recent = useMemo(() => data ? [
    ...data.knowledgeTips.items.filter((x) => x.collectedAt).map((x) => ({ id: x.id, title: x.title, type: "知識カード", at: x.collectedAt! })),
    ...data.achievements.items.filter((x) => x.achievedAt).map((x) => ({ id: x.id, title: x.title, type: `${x.rarity} 実績`, at: x.achievedAt! })),
  ].sort((a, b) => Date.parse(b.at) - Date.parse(a.at)).slice(0, 8) : [], [data]);
  return <Box sx={{ minHeight: "100vh", bgcolor: "#f5f8fc" }}><AppHeader /><FeedbackDestination failed={!!error} ready={!!data && !error} /><Container maxWidth={false} sx={{ maxWidth: 1440, pt: { xs: 3, md: 4 } }}><AppBreadcrumbs items={[{ label: "コレクション" }]} /></Container><Container maxWidth="lg" sx={{ pt: 3, pb: 5 }}><Stack spacing={3}>
    <Box><Typography variant="h2" fontWeight={900}>コレクション</Typography><Typography color="text.secondary">学びの発見と、挑戦の証をまとめて確認できます。</Typography></Box>
    {error && <Alert severity="error">{error}</Alert>}
    {!data ? <Skeleton variant="rounded" height={300} /> : <>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3 }}>
        <CollectionCard icon={<MenuBookIcon sx={{ fontSize: 60 }} />} color="#7e22ce" title="知識カード" description="コースから一歩外へ学びを広げる、番号付きの発見カードです。" count={`${data.knowledgeTips.collectedCount} / ${data.knowledgeTips.totalCount} 枚・あと${data.knowledgeTips.totalCount - data.knowledgeTips.collectedCount}枚`} action="カードを見る" onClick={() => router.push("/knowledge-cards")} />
        <CollectionCard icon={<EmojiEventsIcon sx={{ fontSize: 60 }} />} color="#b45309" title="実績" description="学習や作る課題で達成したことを、レアリティ付きの証として残します。" count={`${data.achievements.achievedCount} / ${data.achievements.totalCount} 件`} action="実績を見る" onClick={() => router.push("/achievements")} />
      </Box>
      <Paper elevation={0} sx={{ p: 3, border: "1px solid #dbe3ef", borderRadius: 3 }}><Typography variant="h5" fontWeight={900} mb={2}>最近の獲得</Typography><Stack spacing={1}>
        {recent.length ? recent.map((x) => <Stack key={`${x.type}-${x.id}`} direction="row" alignItems="center" spacing={2} sx={{ py: 1, borderBottom: "1px solid #eef2f7" }}><Chip label={x.type} size="small" /><Typography fontWeight={800} flex={1}>{x.title}</Typography><Typography color="text.secondary">{new Date(x.at).toLocaleDateString("ja-JP")}</Typography></Stack>) : <Typography color="text.secondary">まだ獲得したものはありません。</Typography>}
      </Stack></Paper>
    </>}
  </Stack></Container></Box>;
}

function CollectionCard({ icon, color, title, description, count, action, onClick }: { icon: React.ReactNode; color: string; title: string; description: string; count: string; action: string; onClick: () => void }) {
  return <Paper elevation={0} sx={{ p: 3, border: "1px solid #dbe3ef", borderTop: `5px solid ${color}`, borderRadius: 3 }}><Stack spacing={2}>
    <Box sx={{ color }}>{icon}</Box><Typography variant="h4" fontWeight={900}>{title}</Typography><Typography color="text.secondary" minHeight={52}>{description}</Typography><Chip label={count} sx={{ alignSelf: "flex-start", fontWeight: 900 }} /><Button variant="contained" endIcon={<ArrowForwardIosIcon />} onClick={onClick}>{action}</Button>
  </Stack></Paper>;
}
