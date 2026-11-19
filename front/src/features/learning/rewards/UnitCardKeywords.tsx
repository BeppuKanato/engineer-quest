"use client";
import { Alert, Box, Button, Chip, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { getUnitCardKeywords, type UnitCardKeywords as Card } from "@/api/knowledgeCardReference.api";
import { useUserSession } from "@/app/component/userSession";

export function UnitCardKeywordLinks({ cards }: { cards: readonly Card[] }) {
  const searchable = cards.filter(card => card.searchKeywords.length > 0);
  if (!searchable.length) return null;
  return <Box component="section" aria-label="もっと調べるキーワード" data-unit-card-keywords sx={{ width: "100%", maxWidth: 640, p: 2, border: "1px solid #dbe3ef", borderRadius: 2, bgcolor: "#fff" }}>
    <Typography component="h2" fontSize={20} fontWeight={800}>もっと調べるキーワード</Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>この単元で手に入れた知識カードから、気になる言葉を外部検索できます。</Typography>
    <Stack spacing={2} sx={{ mt: 2 }}>{searchable.map(card => <Box key={card.id}>
      <Typography fontWeight={800} sx={{ mb: 1 }}>{card.title}</Typography>
      <Stack direction="row" gap={1} flexWrap="wrap">{card.searchKeywords.map(word => <Chip key={word} component="a" clickable label={word} href={`https://www.google.com/search?q=${encodeURIComponent(word)}`} target="_blank" rel="noopener noreferrer" aria-label={`${word}を外部検索（新しいタブ）`} />)}</Stack>
    </Box>)}</Stack>
  </Box>;
}
/** 全単元共通の最終結果のrenderRewardsだけに配置する。 */
export function UnitCardKeywords({ courseId }: { courseId: string }) {
  const { token, status } = useUserSession();
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState<{ token: string; courseId: string; cards?: Card[]; failed?: boolean } | null>(null);
  useEffect(() => {
    if (status !== "authenticated" || !token) return;
    let active = true;
    void getUnitCardKeywords(token, courseId).then(data => { if (active) setState({ token, courseId, cards: data.items }); }, () => { if (active) setState({ token, courseId, failed: true }); });
    return () => { active = false; };
  }, [token, status, courseId, revision]);
  const current = status === "authenticated" && state?.token === token && state?.courseId === courseId ? state : null;
  if (current?.failed) return <Alert severity="info" action={<Button onClick={() => setRevision(value => value + 1)}>再読み込み</Button>}>キーワードを取得できませんでした。ほかの操作は続けられます。</Alert>;
  return current?.cards ? <UnitCardKeywordLinks cards={current.cards} /> : null;
}
