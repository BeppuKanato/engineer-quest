"use client";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import TipsAndUpdatesIcon from "@mui/icons-material/TipsAndUpdates";
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { getCreateTheme, type CreateTheme } from "@/api/create.api";
import { AppHeader } from "@/app/component/appHeader";
import { auth } from "@/lib/firebase";

export default function CreateThemeDetailPage() {
  const params = useParams<{ themeId: string }>();
  const [theme, setTheme] = useState<CreateTheme | null>(null);
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
        const data = await getCreateTheme(token, params.themeId);
        if (!mounted) return;
        setTheme(data);
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
  }, [params.themeId]);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f3f7fc" }}>
      <AppHeader />
      <Container maxWidth={false} sx={{ maxWidth: 1120, py: 4 }}>
        {isLoading ? (
          <Stack spacing={2}>
            <Skeleton variant="rounded" height={240} sx={{ borderRadius: 2 }} />
            <Skeleton variant="rounded" height={360} sx={{ borderRadius: 2 }} />
          </Stack>
        ) : (
          <Stack spacing={3}>
            {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
            {theme && (
              <>
                <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: 2, border: "1px solid #dbe3ef" }}>
                  <Stack direction={{ xs: "column", md: "row" }} spacing={3} alignItems={{ md: "center" }}>
                    <Box
                      sx={{
                        width: { xs: "100%", md: 220 },
                        height: 180,
                        borderRadius: 2,
                        bgcolor: "#eef6ff",
                        border: "1px solid #dbeafe",
                        display: "grid",
                        placeItems: "center",
                        color: "#0b6bcb",
                      }}
                    >
                      <TipsAndUpdatesIcon sx={{ fontSize: 84 }} />
                    </Box>
                    <Stack spacing={2} sx={{ flex: 1 }}>
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        {theme.tags.map((tag) => (
                          <Chip key={tag} label={tag} sx={{ fontWeight: 800 }} />
                        ))}
                      </Stack>
                      <Box>
                        <Typography variant="h3" fontWeight={900}>
                          {theme.title}
                        </Typography>
                        <Typography color="text.secondary" sx={{ mt: 1, lineHeight: 1.8 }}>
                          {theme.description}
                        </Typography>
                      </Box>
                      <Button
                        component={Link}
                        href={`/create/themes/${encodeURIComponent(theme.id)}/work`}
                        variant="contained"
                        size="large"
                        startIcon={<PlayArrowIcon />}
                        sx={{ alignSelf: "flex-start", minHeight: 52, px: 4, borderRadius: 2, fontWeight: 900 }}
                      >
                        制作記録を作る
                      </Button>
                    </Stack>
                  </Stack>
                </Paper>

                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
                  <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: "1px solid #dbe3ef" }}>
                    <Typography variant="h5" fontWeight={900}>作るときの条件</Typography>
                    <Divider sx={{ my: 2 }} />
                    <Stack spacing={1.5}>
                      {theme.requirements.map((item) => (
                        <Stack key={item.id} direction="row" spacing={1.25} alignItems="flex-start">
                          <CheckCircleIcon color="primary" />
                          <Typography fontWeight={700}>{item.label}</Typography>
                        </Stack>
                      ))}
                    </Stack>
                  </Paper>
                  <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: "1px solid #dbe3ef" }}>
                    <Typography variant="h5" fontWeight={900}>挑戦したい人向け</Typography>
                    <Divider sx={{ my: 2 }} />
                    <Stack spacing={1.5}>
                      {theme.challenges.map((item) => (
                        <Stack key={item.id} direction="row" spacing={1.25} alignItems="flex-start">
                          <TipsAndUpdatesIcon color="warning" />
                          <Typography fontWeight={700}>{item.label}</Typography>
                        </Stack>
                      ))}
                    </Stack>
                  </Paper>
                </Box>
              </>
            )}
          </Stack>
        )}
      </Container>
    </Box>
  );
}
