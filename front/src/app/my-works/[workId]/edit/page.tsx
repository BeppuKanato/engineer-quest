"use client";

import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import { Alert, Box, Button, Container, Paper, Skeleton, Stack, Typography } from "@mui/material";
import { onAuthStateChanged } from "firebase/auth";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { getMyWork, updateMyWork, type CreateWork, type CreateWorkPayload } from "@/api/create.api";
import { AppSnackbar } from "@/app/component/appSnackbar";
import { AppHeader } from "@/app/component/appHeader";
import { useSoundEffect } from "@/app/component/soundFeedback";
import { CreateBreadcrumbs } from "@/app/create/_components/createBreadcrumbs";
import { CreateThumbnail } from "@/app/create/_components/createThumbnail";
import { CreateWorkForm } from "@/app/create/_components/createWorkForm";
import { ImagePreviewDialog } from "@/app/create/_components/imagePreviewDialog";
import { auth } from "@/lib/firebase";

export default function MyWorkEditPage() {
  const params = useParams<{ workId: string }>();
  const router = useRouter();
  const { play } = useSoundEffect();
  const [token, setToken] = useState<string | null>(null);
  const [work, setWork] = useState<CreateWork | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successOpen, setSuccessOpen] = useState(false);
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
        const idToken = await user.getIdToken();
        const data = await getMyWork(idToken, params.workId);
        if (!mounted) return;
        setToken(idToken);
        setWork(data);
        setErrorMessage(null);
      } catch (error) {
        console.error(error);
        if (!mounted) return;
        setErrorMessage("制作記録を取得できませんでした。");
      } finally {
        if (mounted) setIsLoading(false);
      }
    });
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [params.workId]);

  const handleSubmit = async (payload: CreateWorkPayload) => {
    if (!token) return;
    try {
      setIsSaving(true);
      setErrorMessage(null);
      await updateMyWork(token, params.workId, payload);
      setSuccessOpen(true);
      play("saveSuccess");
      window.setTimeout(() => {
        router.push(`/my-works/${encodeURIComponent(params.workId)}`);
      }, 700);
    } catch (error) {
      console.error(error);
      setErrorMessage("制作記録を更新できませんでした。");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f3f7fc" }}>
      <AppHeader />
      <Container maxWidth={false} sx={{ maxWidth: 1200, py: 4 }}>
        <Stack spacing={3}>
          <CreateBreadcrumbs items={[{ label: "作る", href: "/create" }, { label: "My Works", href: "/my-works" }, { label: "編集" }]} />
          <Box>
            <Typography variant="h3" fontWeight={900}>
              制作記録を編集
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              作った内容やチェック状態を更新できます。
            </Typography>
          </Box>
          {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
          {isLoading || !work ? (
            <Skeleton variant="rounded" height={720} sx={{ borderRadius: 2 }} />
          ) : (
            <Stack spacing={2}>
              <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: "1px solid #dbe3ef" }}>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "320px 1fr" }, gap: 2, alignItems: "center" }}>
                  <CreateThumbnail src={work.theme.defaultThumbnailUrl} alt={`${work.themeTitle}の作例`} height={180} onClick={() => setPreviewOpen(true)} />
                  <Stack spacing={1}>
                    <Typography variant="h5" fontWeight={900}>
                      {work.themeTitle}の作例を見ながら編集できます
                    </Typography>
                    <Typography color="text.secondary" sx={{ lineHeight: 1.8 }}>
                      作品画像がない場合、My Worksではこのテーマ画像をサムネイルとして表示します。
                    </Typography>
                    <Button type="button" variant="outlined" startIcon={<OpenInFullIcon />} onClick={() => setPreviewOpen(true)} sx={{ alignSelf: "flex-start", fontWeight: 900 }}>
                      拡大表示
                    </Button>
                  </Stack>
                </Box>
              </Paper>
              <CreateWorkForm
                theme={work.theme}
                initialWork={work}
                isSaving={isSaving}
                submitLabel="変更を保存"
                onSubmit={handleSubmit}
              />
              <ImagePreviewDialog
                open={previewOpen}
                title={`${work.themeTitle}の完成イメージ`}
                src={work.theme.defaultThumbnailUrl}
                onClose={() => setPreviewOpen(false)}
              />
            </Stack>
          )}
        </Stack>
      </Container>
      <AppSnackbar open={successOpen} message="制作記録を更新しました" onClose={() => setSuccessOpen(false)} />
    </Box>
  );
}
