"use client";

import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import ForumIcon from "@mui/icons-material/Forum";
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
import { CreateBreadcrumbs } from "@/app/create/_components/createBreadcrumbs";
import { CreateThumbnail } from "@/app/create/_components/createThumbnail";
import { buildWorkShareHref } from "@/app/my-works/_utils/workShare";
import { auth } from "@/lib/firebase";

const formatDate = (value: string) =>
  new Date(value).toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

const statusLabel = (work: CreateWork) => {
  if (work.visibility === "SHARED") return { label: "掲示板共有済み", color: "primary" as const };
  if (work.status === "COMPLETED") return { label: "完成", color: "success" as const };
  return { label: "下書き", color: "default" as const };
};

const WorkCard = ({ work }: { work: CreateWork }) => {
  const status = statusLabel(work);
  const thumbnail = work.imageUrl || work.theme.defaultThumbnailUrl;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 2,
        border: work.visibility === "SHARED" ? "2px solid #93c5fd" : "1px solid #dbe3ef",
        bgcolor: "#fff",
        boxShadow: "0 12px 28px rgba(15, 23, 42, 0.06)",
        display: "flex",
        flexDirection: "column",
        gap: 1.3,
        minHeight: 430,
      }}
    >
      <Box sx={{ position: "relative" }}>
        <CreateThumbnail src={thumbnail} alt={`${work.title}のサムネイル`} height={168} />
        {work.visibility === "SHARED" && (
          <Chip
            icon={<PublicIcon />}
            label="掲示板共有済み"
            color="primary"
            size="small"
            sx={{ position: "absolute", top: 10, right: 10, fontWeight: 900 }}
          />
        )}
      </Box>
      <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
        <Chip label={work.themeTitle} size="small" sx={{ fontWeight: 800 }} />
        <Chip label={status.label} size="small" color={status.color} sx={{ fontWeight: 800 }} />
      </Stack>
      <Box sx={{ flex: 1 }}>
        <Typography variant="h5" fontWeight={900} sx={{ lineHeight: 1.25 }}>
          {work.title}
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.65 }}>
          {work.description}
        </Typography>
      </Box>
      <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
        {work.techStack.slice(0, 4).map((tag) => (
          <Chip key={tag} label={tag} size="small" sx={{ bgcolor: "#eef2ff", color: "#1d4ed8", fontWeight: 800 }} />
        ))}
      </Stack>
      <Typography variant="body2" color="text.secondary">
        更新日 {formatDate(work.updatedAt)}
      </Typography>
      <Stack direction="row" spacing={1}>
        <Button
          component={Link}
          href={`/my-works/${encodeURIComponent(work.id)}`}
          variant="contained"
          startIcon={<VisibilityIcon />}
          fullWidth
          sx={{ fontWeight: 900 }}
        >
          詳細を見る
        </Button>
        <Button
          component={Link}
          href={`/my-works/${encodeURIComponent(work.id)}/edit`}
          variant="outlined"
          startIcon={<EditIcon />}
          fullWidth
          sx={{ fontWeight: 900 }}
        >
          編集
        </Button>
      </Stack>
      <Button
        component={Link}
        href={buildWorkShareHref(work)}
        variant={work.visibility === "SHARED" ? "outlined" : "contained"}
        startIcon={<ForumIcon />}
        sx={{ fontWeight: 900 }}
      >
        {work.visibility === "SHARED" ? "再共有する" : "掲示板で共有する"}
      </Button>
    </Paper>
  );
};

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
      <Container maxWidth={false} sx={{ maxWidth: 1200, py: 4 }}>
        <Stack spacing={3}>
          <CreateBreadcrumbs items={[{ label: "作る", href: "/create" }, { label: "My Works" }]} />
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
            <Box>
              <Typography variant="h3" fontWeight={900}>
                My Works
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                My Worksは自分の制作物を管理する場所です。公開して交流したい作品は掲示板へ共有できます。
              </Typography>
            </Box>
            <Button component={Link} href="/create" variant="contained" startIcon={<AddIcon />} sx={{ alignSelf: { md: "center" }, fontWeight: 900 }}>
              テーマを選ぶ
            </Button>
          </Stack>
          {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
          {isLoading ? (
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 2 }}>
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <Skeleton key={index} variant="rounded" height={430} sx={{ borderRadius: 2 }} />
              ))}
            </Box>
          ) : works.length === 0 ? (
            <Alert severity="info" action={<Button component={Link} href="/create" color="inherit">テーマを選ぶ</Button>}>
              まだ制作記録がありません。
            </Alert>
          ) : (
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 2 }}>
              {works.map((work) => (
                <WorkCard key={work.id} work={work} />
              ))}
            </Box>
          )}
        </Stack>
      </Container>
    </Box>
  );
}
