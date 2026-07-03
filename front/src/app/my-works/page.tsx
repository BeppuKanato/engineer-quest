"use client";

import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import PublicIcon from "@mui/icons-material/Public";
import VisibilityIcon from "@mui/icons-material/Visibility";
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";
import { useEffect, useState } from "react";

import { getMyWorks, type CreateWork } from "@/api/create.api";
import { AppHeader } from "@/app/component/appHeader";
import { auth } from "@/lib/firebase";

const formatDate = (value: string) =>
  new Date(value).toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

const WorkCard = ({ work }: { work: CreateWork }) => (
  <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: "1px solid #dbe3ef", bgcolor: "#fff" }}>
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
        <Box>
          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 1 }}>
            <Chip label={work.themeTitle} size="small" sx={{ fontWeight: 800 }} />
            <Chip label={work.status === "COMPLETED" ? "完成" : "下書き"} size="small" color={work.status === "COMPLETED" ? "success" : "default"} />
            {work.visibility === "SHARED" && <Chip icon={<PublicIcon />} label="共有中" size="small" color="primary" />}
          </Stack>
          <Typography variant="h5" fontWeight={900}>{work.title}</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.7 }}>{work.description}</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
          {formatDate(work.updatedAt)}
        </Typography>
      </Stack>
      <Stack direction="row" spacing={1} flexWrap="wrap">
        {work.techStack.map((tag) => <Chip key={tag} label={tag} size="small" />)}
      </Stack>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
        <Button component={Link} href={`/my-works/${encodeURIComponent(work.id)}`} variant="contained" startIcon={<VisibilityIcon />} sx={{ fontWeight: 900 }}>
          詳細を見る
        </Button>
        <Button component={Link} href={`/my-works/${encodeURIComponent(work.id)}/edit`} variant="outlined" startIcon={<EditIcon />} sx={{ fontWeight: 900 }}>
          編集
        </Button>
      </Stack>
    </Stack>
  </Paper>
);

export default function MyWorksPage() {
  const [works, setWorks] = useState<CreateWork[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        if (!mounted) return;
        setErrorMessage("ログインが必要です。");
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        const token = await user.getIdToken();
        const data = await getMyWorks(token);
        if (!mounted) return;
        setWorks(data);
        setErrorMessage(null);
      } catch (error) {
        console.error(error);
        if (!mounted) return;
        setErrorMessage("My Worksを取得できませんでした。");
      } finally {
        if (mounted) setIsLoading(false);
      }
    });
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f3f7fc" }}>
      <AppHeader />
      <Container maxWidth={false} sx={{ maxWidth: 1120, py: 4 }}>
        <Stack spacing={3}>
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
            <Box>
              <Typography variant="h3" fontWeight={900}>My Works</Typography>
              <Typography color="text.secondary" sx={{ mt: 1 }}>保存した制作記録を確認・編集できます。</Typography>
            </Box>
            <Button component={Link} href="/create" variant="contained" startIcon={<AddIcon />} sx={{ alignSelf: { md: "center" }, fontWeight: 900 }}>
              テーマを選ぶ
            </Button>
          </Stack>
          {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
          {isLoading ? (
            <Stack spacing={2}>{[0, 1, 2].map((index) => <Skeleton key={index} variant="rounded" height={210} sx={{ borderRadius: 2 }} />)}</Stack>
          ) : works.length === 0 ? (
            <Alert severity="info" action={<Button component={Link} href="/create" color="inherit">作る</Button>}>まだ制作記録がありません。</Alert>
          ) : (
            <Stack spacing={2}>{works.map((work) => <WorkCard key={work.id} work={work} />)}</Stack>
          )}
        </Stack>
      </Container>
    </Box>
  );
}
