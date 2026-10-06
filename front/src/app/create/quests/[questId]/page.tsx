"use client";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import SchoolIcon from "@mui/icons-material/School";
import StarIcon from "@mui/icons-material/Star";
import { Alert, Box, Button, Chip, Container, Divider, Paper, Skeleton, Stack, Typography } from "@mui/material";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { getCreateQuest, type CreateQuest } from "@/api/create.api";
import { AppHeader } from "@/app/component/appHeader";
import { CreateBreadcrumbs } from "@/app/create/_components/createBreadcrumbs";
import { CreateThumbnail } from "@/app/create/_components/createThumbnail";
import { createQuestMethodMessage, createQuestProblemLabel } from "@/app/create/_components/createQuestPresentation";
import { auth } from "@/lib/firebase";

const kindLabel = { BASIC: "基本要件", OPTIONAL: "追加要件" } as const;

export default function CreateQuestDetailPage() {
  const { questId } = useParams<{ questId: string }>();
  const [quest, setQuest] = useState<CreateQuest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => onAuthStateChanged(auth, async (user) => {
    if (!user) { setError("ログインが必要です。"); setLoading(false); return; }
    try { setQuest(await getCreateQuest(await user.getIdToken(), questId)); }
    catch (cause) { console.error(cause); setError("作る課題を取得できませんでした。"); }
    finally { setLoading(false); }
  }), [questId]);

  return <Box sx={{ minHeight: "100vh", bgcolor: "#f3f7fc" }}>
    <AppHeader />
    <Container maxWidth={false} sx={{ maxWidth: 1120, py: 4 }}>
      {loading ? <Skeleton variant="rounded" height={700} /> : <Stack spacing={3}>
        <CreateBreadcrumbs items={[{ label: "作る", href: "/create" }, { label: quest?.title ?? "課題" }]} />
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
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" }, gap: 2, mt: 2 }}>{quest.relatedCourses.map((course) => <Paper key={course.id} elevation={0} sx={{ p: 2, border: "1px solid #c7d8f7", borderRadius: 2 }}><Stack direction="row" justifyContent="space-between"><Typography fontWeight={950}>{course.title}</Typography>{course.isCompleted && <Chip label="修了済み" size="small" color="success" />}</Stack><Typography color="text.secondary" sx={{ mt: 0.7, lineHeight: 1.7 }}>{course.reason}</Typography><Button component={Link} href={`/courses/roadmap/${encodeURIComponent(course.id)}`} sx={{ mt: 1, fontWeight: 900 }}>コースを見る</Button></Paper>)}</Box>
          </Paper>
        </>}
      </Stack>}
    </Container>
  </Box>;
}
