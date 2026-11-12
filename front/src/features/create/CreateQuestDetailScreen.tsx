"use client";

import { PageLayout } from "@/components/layouts/PageLayout";

import type { PageIntegration } from "@/types/pageIntegration";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import SchoolIcon from "@mui/icons-material/School";
import StarIcon from "@mui/icons-material/Star";
import { Alert, Box, Button, Chip, Divider, Paper, Skeleton, Stack, Typography } from "@mui/material";
import Link from "next/link";
import { useEffect, useState } from "react";

import { getCreateQuest, type CreateQuest } from "@/api/create.api";
import { CreateBreadcrumbs } from "@/features/create/components/CreateBreadcrumbs";
import { CreateThumbnail } from "@/features/create/components/CreateThumbnail";
import { createQuestMethodMessage, createQuestProblemLabel } from "@/features/create/createQuestPresentation";
import { fetchClientQuery, peekClientQueryData, queryTags } from "@/lib/clientQueryCache";
import { useUserSession } from "@/lib/session/userSession";

const kindLabel = { BASIC: "基本要件", OPTIONAL: "追加要件" } as const;

export function CreateQuestDetailScreen({ header, FeedbackDestination, questId }: PageIntegration & { questId: string }) {
  const { status, token } = useUserSession();
  const detailKey = `create-quest:${questId}`;
  const [cachedQuest] = useState(() => peekClientQueryData<CreateQuest>(detailKey));
  const [quest, setQuest] = useState<CreateQuest | null>(cachedQuest ?? null);
  const [loading, setLoading] = useState(!cachedQuest);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (status === "loading") return;
    if (status !== "authenticated" || !token) { if (!cachedQuest) { setError("ログインが必要です。"); setLoading(false); } return; }
    let active = true;
    fetchClientQuery(detailKey, () => getCreateQuest(token, questId), { staleTimeMs: 300_000, tags: [queryTags.works] })
      .then(next => { if (active) { setQuest(next); setError(null); } })
      .catch(cause => { console.error(cause); if (active && !cachedQuest) setError("作る課題を取得できませんでした。"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [status, token, questId, detailKey, cachedQuest]);

  return <Box sx={{ minHeight: "100vh", bgcolor: "#f3f7fc" }}>
    {header}<FeedbackDestination failed={!!error} ready={!!quest && !error} />
    <PageLayout variant="breadcrumbs">
        <CreateBreadcrumbs items={[{ label: "作る", href: "/create" }, { label: quest?.title ?? "課題" }]} />
      </PageLayout>
    <PageLayout variant="detail">
      {loading ? <Skeleton variant="rounded" height={700} /> : <Stack spacing={3}>
        {error && <Alert severity="error">{error}</Alert>}
        {quest && <>
          <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, border: "1px solid #dbe3ef" }}>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "0.9fr 1.1fr" }, gap: 3, alignItems: "center" }}>
              <CreateThumbnail src={quest.thumbnailUrl} alt={quest.title} height={300} />
              <Stack spacing={2}>
                <Stack direction="row" spacing={1}><Chip label="Python" color="primary" /><Chip label={createQuestProblemLabel(quest.problemType)} /></Stack>
                <Box><Typography variant="h2" fontWeight={950}>{quest.title}</Typography><Typography color="text.secondary" sx={{ mt: 1.2, lineHeight: 1.8 }}>{quest.scenario}</Typography></Box>
                <Alert severity="info" icon={<InfoOutlinedIcon />}>基本要件と追加要件は最初からすべて表示されています。{createQuestMethodMessage(quest.problemType)}</Alert>
                <Stack direction="row" spacing={2}><Typography fontWeight={900}>クリアライン {quest.basicScore}点</Typography><Typography fontWeight={900}>最大 {quest.maxScore}点</Typography></Stack>
                <Button component={Link} href={`/create/quests/${encodeURIComponent(quest.id)}/work`} variant="contained" size="large" startIcon={<PlayArrowIcon />} sx={{ minHeight: 56, fontWeight: 950 }}>
                  {quest.attempt ? "続きから作る" : "この課題を始める"}
                </Button>
              </Stack>
            </Box>
          </Paper>

          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid #dbe3ef" }}>
            <Typography variant="h4" fontWeight={950}>採点される要件</Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5 }}>すべて自動テストで判定します。追加要件は目標として選べますが、選んでいなくても達成すれば加点されます。</Typography>
            <Divider sx={{ my: 2 }} />
            <Stack spacing={1.25}>{quest.requirements.map((requirement) => <Paper key={requirement.id} elevation={0} sx={{ p: 2, border: "1px solid #e2e8f0", borderRadius: 2 }}>
              <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={1}>
                <Stack direction="row" spacing={1} alignItems="flex-start"><CheckCircleIcon color={requirement.kind === "BASIC" ? "primary" : "success"} /><Box><Stack direction="row" spacing={1} flexWrap="wrap"><Typography fontWeight={950}>{requirement.title}</Typography><Chip label={kindLabel[requirement.kind]} size="small" color={requirement.kind === "BASIC" ? "primary" : "default"} /></Stack><Typography color="text.secondary" sx={{ mt: 0.4 }}>{requirement.description}</Typography></Box></Stack>
                <Chip icon={<StarIcon />} label={`+${requirement.points}点`} color="warning" sx={{ fontWeight: 950, alignSelf: "flex-start" }} />
              </Stack>
            </Paper>)}</Stack>
          </Paper>

          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid #dbe3ef" }}>
            <Stack direction="row" spacing={1} alignItems="center"><SchoolIcon color="primary" /><Typography variant="h4" fontWeight={950}>役立つコース</Typography></Stack>
            <Typography color="text.secondary" sx={{ mt: 0.75 }}>未修了でもこの課題に挑戦できます。必要になった時点でコースへ移動できます。</Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" }, gap: 2, mt: 2 }}>{quest.relatedCourses.map((course) => <Paper key={course.id} elevation={0} sx={{ p: 2, border: "1px solid #c7d8f7", borderRadius: 2 }}><Stack direction="row" justifyContent="space-between"><Typography fontWeight={950}>{course.title}</Typography>{course.isCompleted && <Chip label="修了済み" size="small" color="success" />}</Stack><Typography color="text.secondary" sx={{ mt: 0.7, lineHeight: 1.7 }}>{course.reason}</Typography><Button component={Link} href="/courses" sx={{ mt: 1, fontWeight: 900 }}>コースを見る</Button></Paper>)}</Box>
          </Paper>
        </>}
      </Stack>}
    </PageLayout>
  </Box>;
}
