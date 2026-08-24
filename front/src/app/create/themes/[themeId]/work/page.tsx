"use client";

import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import {
  Alert,
  Box,
  Button,
  Container,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import { onAuthStateChanged } from "firebase/auth";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { createMyWork, getCreateTheme, type CreateTheme, type CreateWorkPayload } from "@/api/create.api";
import { AppSnackbar } from "@/app/component/appSnackbar";
import { AppHeader } from "@/app/component/appHeader";
import { BlockingProcessOverlay } from "@/app/component/blockingProcessOverlay";
import { useSoundEffect } from "@/app/component/soundFeedback";
import { CreateBreadcrumbs } from "@/app/create/_components/createBreadcrumbs";
import { CreateThumbnail } from "@/app/create/_components/createThumbnail";
import { CreateWorkForm } from "@/app/create/_components/createWorkForm";
import { ImagePreviewDialog } from "@/app/create/_components/imagePreviewDialog";
import { MascotHint } from "@/app/create/_components/mascotHint";
import { auth } from "@/lib/firebase";

const ExamplePreview = ({ theme, onOpen }: { theme: CreateTheme; onOpen: () => void }) => (
  <Paper elevation={0} sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 2, border: "1px solid #dbe3ef" }}>
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.15fr 0.85fr" }, gap: 2.5, alignItems: "center" }}>
      <Box>
        <Typography variant="h6" fontWeight={900} sx={{ mb: 1 }}>
          作例プレビュー
        </Typography>
        <CreateThumbnail src={theme.defaultThumbnailUrl} alt={`${theme.title}の作例`} height={200} onClick={onOpen} />
      </Box>
      <Stack spacing={1.5}>
        <Typography variant="h5" fontWeight={900}>
          この画像のようなページ・アプリを目標に制作します
        </Typography>
        <Typography color="text.secondary" sx={{ lineHeight: 1.8 }}>
          {theme.description} 作例は完成イメージです。デザインや機能は自由に調整しながら、条件チェックを満たすことを目標にしてください。
        </Typography>
        <Button type="button" variant="outlined" startIcon={<OpenInFullIcon />} onClick={onOpen} sx={{ alignSelf: "flex-start", fontWeight: 900 }}>
          拡大表示
        </Button>
      </Stack>
    </Box>
  </Paper>
);

export default function CreateThemeWorkPage() {
  const params = useParams<{ themeId: string }>();
  const router = useRouter();
  const { play } = useSoundEffect();
  const [token, setToken] = useState<string | null>(null);
  const [theme, setTheme] = useState<CreateTheme | null>(null);
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
        const data = await getCreateTheme(idToken, params.themeId);
        if (!mounted) return;
        setToken(idToken);
        setTheme(data);
        setErrorMessage(null);
      } catch (error) {
        console.error(error);
        if (!mounted) return;
        setErrorMessage("テーマ情報を取得できませんでした。");
      } finally {
        if (mounted) setIsLoading(false);
      }
    });
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [params.themeId]);

  const handleSubmit = async (payload: CreateWorkPayload) => {
    if (!token) return;
    try {
      setIsSaving(true);
      setErrorMessage(null);
      const result = await createMyWork(token, params.themeId, payload);
      setSuccessOpen(true);
      play("saveSuccess");
      router.push(`/my-works/${encodeURIComponent(result.workId)}`);
    } catch (error) {
      console.error(error);
      setErrorMessage("制作記録を保存できませんでした。保存上限は10件です。");
      setIsSaving(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f3f7fc" }}>
      <AppHeader />
      <Container maxWidth={false} sx={{ maxWidth: 1200, py: 4 }}>
        <Stack spacing={3}>
          <CreateBreadcrumbs
            items={[
              { label: "作る", href: "/create" },
              ...(theme ? [{ label: theme.title, href: `/create/themes/${encodeURIComponent(theme.id)}` }] : []),
              { label: "制作記録を作る" },
            ]}
          />
          <Box>
            <Typography variant="h3" fontWeight={900}>
              制作記録を作る
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              完成後でも編集できます。作った内容と学びをMy Worksに残しましょう。
            </Typography>
          </Box>
          {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
          {isLoading || !theme ? (
            <Skeleton variant="rounded" height={720} sx={{ borderRadius: 2 }} />
          ) : (
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1fr) 280px" }, gap: 3, alignItems: "start" }}>
              <Stack spacing={2}>
                <ExamplePreview theme={theme} onOpen={() => setPreviewOpen(true)} />
                <CreateWorkForm theme={theme} isSaving={isSaving} submitLabel="制作記録を保存" onSubmit={handleSubmit} />
              </Stack>
              <Stack spacing={2}>
                <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: "1px solid #dbe3ef" }}>
                  <Typography fontWeight={900} sx={{ mb: 1 }}>
                    保存ステータス
                  </Typography>
                  <Typography color="text.secondary" sx={{ lineHeight: 1.8 }}>
                    下書きはいつでも編集できます。完成後に公開したい場合は、My Worksから掲示板へ作品共有として投稿できます。
                  </Typography>
                </Paper>
                <MascotHint text="コツコツ記録して、自分だけのポートフォリオを作っていこう。" />
              </Stack>
              <ImagePreviewDialog
                open={previewOpen}
                title={`${theme.title}の完成イメージ`}
                src={theme.defaultThumbnailUrl}
                onClose={() => setPreviewOpen(false)}
              />
            </Box>
          )}
        </Stack>
      </Container>
      <BlockingProcessOverlay
        open={isSaving}
        title="制作記録を作成しています"
        description="完了後に作品詳細へ移動します。この処理中は画面を閉じないでください。"
      />
      <AppSnackbar open={successOpen} message="制作記録を保存しました" onClose={() => setSuccessOpen(false)} />
    </Box>
  );
}
