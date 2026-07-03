"use client";

import AccessTimeIcon from "@mui/icons-material/AccessTime";
import AddIcon from "@mui/icons-material/Add";
import CollectionsBookmarkIcon from "@mui/icons-material/CollectionsBookmark";
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

import { getCreateThemes, type CreateTheme } from "@/api/create.api";
import { AppHeader } from "@/app/component/appHeader";
import { auth } from "@/lib/firebase";

const difficultyLabel = {
  EASY: "やさしい",
  NORMAL: "ふつう",
  HARD: "難しめ",
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

const ThemeVisual = ({ theme }: { theme: CreateTheme }) => (
  <Box
    sx={{
      height: 156,
      borderRadius: 2,
      bgcolor: "#eef6ff",
      border: "1px solid #dbeafe",
      display: "grid",
      placeItems: "center",
      overflow: "hidden",
    }}
  >
    <CollectionsBookmarkIcon sx={{ fontSize: 72, color: "#0b6bcb" }} />
    <Box component="span" sx={{ position: "absolute", width: 1, height: 1, overflow: "hidden" }}>
      {theme.title}のサムネイルが入る想定
    </Box>
  </Box>
);

const ThemeCard = ({ theme }: { theme: CreateTheme }) => (
  <Paper
    elevation={0}
    sx={{
      p: 2,
      borderRadius: 2,
      border: "1px solid #dbe3ef",
      bgcolor: "#fff",
      display: "flex",
      flexDirection: "column",
      gap: 1.5,
      minHeight: 390,
    }}
  >
    <ThemeVisual theme={theme} />
    <Stack direction="row" spacing={1} flexWrap="wrap">
      <Chip label={categoryLabel[theme.category]} size="small" sx={{ fontWeight: 800 }} />
      <Chip label={difficultyLabel[theme.difficulty]} size="small" color="primary" variant="outlined" />
    </Stack>
    <Box sx={{ flex: 1 }}>
      <Typography variant="h6" fontWeight={900}>
        {theme.title}
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.7 }}>
        {theme.description}
      </Typography>
    </Box>
    <Stack direction="row" spacing={1} flexWrap="wrap">
      {theme.tags.slice(0, 3).map((tag) => (
        <Chip key={tag} label={tag} size="small" sx={{ bgcolor: "#eef2ff", color: "#1d4ed8", fontWeight: 800 }} />
      ))}
    </Stack>
    <Stack direction="row" alignItems="center" justifyContent="space-between">
      <Stack direction="row" spacing={0.75} alignItems="center" color="text.secondary">
        <AccessTimeIcon fontSize="small" />
        <Typography variant="body2">約{theme.estimatedMinutes}分</Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary">
        保存 {theme.workCount}件
      </Typography>
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
        setErrorMessage("制作テーマを取得できませんでした。");
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
      <Container maxWidth={false} sx={{ maxWidth: 1440, py: 4 }}>
        <Stack spacing={3}>
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
            ここではコードを書きません。VS Codeや外部AIで作った内容を、条件チェックと制作記録として残します。
          </Alert>
          {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

          {isLoading ? (
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)", xl: "repeat(4, 1fr)" }, gap: 2 }}>
              {Array.from({ length: 8 }).map((_, index) => (
                <Skeleton key={index} variant="rounded" height={390} sx={{ borderRadius: 2 }} />
              ))}
            </Box>
          ) : (
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)", xl: "repeat(4, 1fr)" }, gap: 2 }}>
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
