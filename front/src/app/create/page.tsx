"use client";

import AccessTimeIcon from "@mui/icons-material/AccessTime";
import AddIcon from "@mui/icons-material/Add";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  IconButton,
  Paper,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";
import { useEffect, useState } from "react";

import { getCreateThemes, type CreateTheme } from "@/api/create.api";
import { AppHeader } from "@/app/component/appHeader";
import { CreateBreadcrumbs } from "@/app/create/_components/createBreadcrumbs";
import { CreateThumbnail } from "@/app/create/_components/createThumbnail";
import { auth } from "@/lib/firebase";

const difficultyLabel = {
  EASY: "やさしい",
  NORMAL: "ふつう",
  HARD: "むずかしい",
} as const;

const categoryLabel: Record<CreateTheme["category"], string> = {
  UI: "UI",
  HTML_CSS: "HTML/CSS",
  JAVASCRIPT: "JavaScript",
  FORM: "フォーム",
  DATA_DISPLAY: "一覧表示",
  API: "API",
  CRUD: "CRUD",
  GAME: "ゲーム",
};

const getRecommendationReason = (theme: CreateTheme) => {
  if (theme.recommendedCourses.length === 0) {
    return "今の学習状況から取り組みやすいテーマです。";
  }

  const courseNames = theme.recommendedCourses
    .slice(0, 2)
    .map((course) => course.title)
    .join(" / ");
  return `${courseNames}の学習内容に近いテーマです。`;
};

const ThemeCard = ({ theme }: { theme: CreateTheme }) => (
  <Paper
    elevation={0}
    sx={{
      p: 2,
      borderRadius: 2,
      border: theme.isRecommendedForUser ? "2px solid #7dd3a8" : "1px solid #dbe3ef",
      bgcolor: "#fff",
      boxShadow: theme.isRecommendedForUser ? "0 18px 38px rgba(16, 185, 129, 0.13)" : "0 12px 28px rgba(15, 23, 42, 0.06)",
      display: "flex",
      flexDirection: "column",
      gap: 1.4,
      minHeight: 420,
    }}
  >
    <Box sx={{ position: "relative" }}>
      <CreateThumbnail src={theme.defaultThumbnailUrl} alt={`${theme.title}の作例サムネイル`} height={176} />
      {theme.isRecommendedForUser && (
        <Chip
          label="今取り組みやすい"
          color="success"
          size="small"
          sx={{ position: "absolute", top: 10, right: 10, fontWeight: 900, bgcolor: "#dcfce7" }}
        />
      )}
      <Tooltip title={theme.description}>
        <IconButton
          aria-label={`${theme.title}の簡易情報`}
          size="small"
          sx={{ position: "absolute", top: 10, left: 10, bgcolor: "rgba(255,255,255,0.92)" }}
        >
          <InfoOutlinedIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>

    {theme.isRecommendedForUser && (
      <Alert
        severity="success"
        icon={false}
        sx={{
          py: 0.7,
          px: 1.2,
          border: "1px solid #bbf7d0",
          bgcolor: "#f0fdf4",
          color: "#166534",
          "& .MuiAlert-message": { p: 0, fontWeight: 900, fontSize: 13 },
        }}
      >
        {getRecommendationReason(theme)}
      </Alert>
    )}

    <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap>
      <Chip label={categoryLabel[theme.category]} size="small" sx={{ fontWeight: 900 }} />
      <Chip label={difficultyLabel[theme.difficulty]} size="small" color="primary" variant="outlined" sx={{ fontWeight: 900 }} />
    </Stack>

    <Box sx={{ flex: 1 }}>
      <Typography variant="h5" fontWeight={900} sx={{ lineHeight: 1.25 }}>
        {theme.title}
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.65 }}>
        {theme.description}
      </Typography>
    </Box>

    <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap>
      {theme.tags.slice(0, 3).map((tag) => (
        <Chip key={tag} label={tag} size="small" sx={{ bgcolor: "#eef2ff", color: "#1d4ed8", fontWeight: 800 }} />
      ))}
    </Stack>

    <Stack direction="row" alignItems="center" justifyContent="space-between">
      <Stack direction="row" spacing={0.75} alignItems="center" color="text.secondary">
        <AccessTimeIcon fontSize="small" />
        <Typography variant="body2">約{theme.estimatedMinutes}分</Typography>
      </Stack>
      <Stack direction="row" spacing={0.75} alignItems="center" color="text.secondary">
        <SaveOutlinedIcon fontSize="small" />
        <Typography variant="body2">保存 {theme.workCount}件</Typography>
      </Stack>
    </Stack>

    <Button
      component={Link}
      href={`/create/themes/${encodeURIComponent(theme.id)}`}
      variant="contained"
      startIcon={<AddIcon />}
      sx={{ minHeight: 46, borderRadius: 2, fontWeight: 900 }}
    >
      このテーマで作る
    </Button>
  </Paper>
);

export default function CreatePage() {
  const [themes, setThemes] = useState<CreateTheme[]>([]);
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
        const data = await getCreateThemes(token);
        if (!mounted) return;
        setThemes(data);
        setErrorMessage(null);
      } catch (error) {
        console.error(error);
        if (!mounted) return;
        setErrorMessage("テーマ一覧を取得できませんでした。");
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
          <CreateBreadcrumbs items={[{ label: "作る" }]} />

          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
            <Box>
              <Typography variant="h3" fontWeight={900}>
                作る
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                テーマを選び、ローカル開発で作った作品を記録できます。
              </Typography>
            </Box>
            <Button component={Link} href="/my-works" variant="outlined" sx={{ alignSelf: { md: "center" }, fontWeight: 900 }}>
              My Works
            </Button>
          </Stack>

          <Alert severity="info">
            コース進行とは別に、いつでも取り組めます。学習状況に合いそうなテーマには「今取り組みやすい」ラベルを表示しています。
          </Alert>
          {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

          {isLoading ? (
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 2 }}>
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} variant="rounded" height={420} sx={{ borderRadius: 2 }} />
              ))}
            </Box>
          ) : (
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 2 }}>
              {themes.map((theme) => (
                <ThemeCard key={theme.id} theme={theme} />
              ))}
            </Box>
          )}
        </Stack>
      </Container>
    </Box>
  );
}
