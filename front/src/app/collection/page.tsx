"use client";

import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import { Alert, Box, Button, Chip, Container, Paper, Skeleton, Stack, Typography } from "@mui/material";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getCollection, type CollectionResponse } from "@/api/collection.api";
import { AppBreadcrumbs } from "@/app/component/appBreadcrumbs";
import { AppHeader } from "@/app/component/appHeader";
import { auth } from "@/lib/firebase";

export default function CollectionPage() {
  const router = useRouter();
  const [data, setData] = useState<CollectionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => onAuthStateChanged(auth, async (user) => {
    if (!user) return setError("ログインが必要です。");
    try { setData(await getCollection(await user.getIdToken())); } catch { setError("コレクションを取得できませんでした。"); }
  }), []);
  const recent = useMemo(() => data ? [
    ...data.knowledgeTips.items.filter((x) => x.collectedAt).map((x) => ({ id: x.id, title: x.title, type: "知識カード", at: x.collectedAt! })),
    ...data.achievements.items.filter((x) => x.achievedAt).map((x) => ({ id: x.id, title: x.title, type: `${x.rarity} 実績`, at: x.achievedAt! })),
  ].sort((a, b) => Date.parse(b.at) - Date.parse(a.at)).slice(0, 8) : [], [data]);
  return <Box sx={{ minHeight: "100vh", bgcolor: "#f5f8fc" }}><AppHeader /><Container maxWidth="lg" sx={{ py: 5 }}><Stack spacing={3}>
    <AppBreadcrumbs items={[{ label: "コレクション" }]} />
    <Box><Typography variant="h2" fontWeight={900}>コレクション</Typography><Typography color="text.secondary">学びの発見と、挑戦の証をまとめて確認できます。</Typography></Box>
    {error && <Alert severity="error">{error}</Alert>}
    {!data ? <Skeleton variant="rounded" height={300} /> : <>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3 }}>
        <CollectionCard icon={<MenuBookIcon sx={{ fontSize: 60 }} />} color="#7e22ce" title="知識カード" description="コースから一歩外へ学びを広げる、番号付きの発見カードです。" count={`${data.knowledgeTips.collectedCount} / ${data.knowledgeTips.totalCount} 枚`} action="カードを見る" onClick={() => router.push("/knowledge-cards")} />
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
