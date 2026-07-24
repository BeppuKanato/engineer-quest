"use client";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StarBorderRoundedIcon from "@mui/icons-material/StarBorderRounded";
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
import { CreateBreadcrumbs } from "@/app/create/_components/createBreadcrumbs";
import { CreateThumbnail } from "@/app/create/_components/createThumbnail";
import { ImagePreviewDialog } from "@/app/create/_components/imagePreviewDialog";
import { MascotHint } from "@/app/create/_components/mascotHint";
import { auth } from "@/lib/firebase";

const ChecklistCard = ({
  title,
  icon,
  items,
}: {
  title: string;
  icon: React.ReactNode;
  items: { id: string; label: string; description: string | null }[];
}) => (
  <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: "1px solid #dbe3ef", bgcolor: "#fff" }}>
    <Stack direction="row" alignItems="center" spacing={1}>
      {icon}
      <Typography variant="h5" fontWeight={900}>
        {title}
      </Typography>
    </Stack>
    <Divider sx={{ my: 2 }} />
    <Stack spacing={1.5}>
      {items.map((item) => (
        <Stack key={item.id} direction="row" spacing={1.25} alignItems="flex-start">
          <CheckCircleIcon color="success" sx={{ mt: 0.1 }} />
          <Box>
            <Typography fontWeight={800}>{item.label}</Typography>
            {item.description && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                {item.description}
              </Typography>
            )}
          </Box>
        </Stack>
      ))}
    </Stack>
  </Paper>
);

export default function CreateThemeDetailPage() {
  const params = useParams<{ themeId: string }>();
  const [theme, setTheme] = useState<CreateTheme | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

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
        setErrorMessage("テーマ詳細を取得できませんでした。");
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
      <Container maxWidth={false} sx={{ maxWidth: 1200, py: 4 }}>
        {isLoading ? (
          <Stack spacing={2}>
            <Skeleton variant="rounded" height={300} sx={{ borderRadius: 2 }} />
            <Skeleton variant="rounded" height={260} sx={{ borderRadius: 2 }} />
          </Stack>
        ) : (
          <Stack spacing={3}>
            <CreateBreadcrumbs items={[{ label: "作る", href: "/create" }, { label: theme?.title ?? "テーマ詳細" }]} />
            <Box>
              <Typography variant="h3" fontWeight={900}>
                テーマ詳細
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                テーマの内容や条件を確認して、制作記録を作りましょう。
              </Typography>
            </Box>
            {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
            {theme && (
              <>
                <Paper elevation={0} sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 2, border: "1px solid #dbe3ef" }}>
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.05fr 1fr" }, gap: 3, alignItems: "center" }}>
                    <Box>
                      <Box sx={{ position: "relative" }}>
                        <CreateThumbnail
                          src={theme.defaultThumbnailUrl}
                          alt={`${theme.title}の作例`}
                          height={{ xs: 260, md: 310 }}
                          onClick={() => setPreviewOpen(true)}
                        />
                        <Button
                          type="button"
                          variant="outlined"
                          startIcon={<OpenInFullIcon />}
                          onClick={() => setPreviewOpen(true)}
                          sx={{ position: "absolute", right: 14, bottom: 14, bgcolor: "white", fontWeight: 900 }}
                        >
                          拡大して見る
                        </Button>
                      </Box>
                    </Box>
                    <Stack spacing={2.2}>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        {theme.tags.map((tag) => (
                          <Chip key={tag} label={tag} sx={{ fontWeight: 900, bgcolor: "#eef2ff", color: "#1d4ed8" }} />
                        ))}
                      </Stack>
                      <Box>
                        <Typography variant="h2" fontWeight={900} sx={{ lineHeight: 1.15 }}>
                          {theme.title}
                        </Typography>
                        <Typography sx={{ mt: 1.3, lineHeight: 1.8 }} color="text.secondary">
                          {theme.description}
                        </Typography>
                      </Box>
                      <Box>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.2 }}>
                          <StarBorderRoundedIcon color="primary" />
                          <Typography fontWeight={900}>取り組みやすくなるおすすめコース</Typography>
                          <Chip label="未受講でも挑戦できます" size="small" />
                        </Stack>
                        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 1 }}>
                          {theme.recommendedCourses.map((course) => (
                            <Paper key={course.id} elevation={0} sx={{ p: 1.4, borderRadius: 2, border: "1px solid #c7d8f7", fontWeight: 900 }}>
                              {course.title}
                            </Paper>
                          ))}
                        </Box>
                      </Box>
                      <Button
                        component={Link}
                        href={`/create/themes/${encodeURIComponent(theme.id)}/work`}
                        variant="contained"
                        size="large"
                        startIcon={<PlayArrowIcon />}
                        sx={{ minHeight: 58, borderRadius: 2, fontWeight: 900 }}
                      >
                        このテーマで制作記録を作る
                      </Button>
                    </Stack>
                  </Box>
                </Paper>

                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
                  <ChecklistCard title="作るときの条件" icon={<CheckCircleIcon color="primary" />} items={theme.requirements} />
                  <ChecklistCard title="挑戦したい人向け" icon={<TipsAndUpdatesIcon color="warning" />} items={theme.challenges} />
                </Box>

                <Box sx={{ display: "flex", justifyContent: { xs: "flex-start", md: "flex-end" } }}>
                  <MascotHint text="できそうなら挑戦項目も足して、自分の作品らしさを出してみよう。" />
                </Box>

                <ImagePreviewDialog
                  open={previewOpen}
                  title={`${theme.title}の完成イメージ`}
                  src={theme.defaultThumbnailUrl}
                  onClose={() => setPreviewOpen(false)}
                />
              </>
            )}
          </Stack>
        )}
      </Container>
    </Box>
  );
}
